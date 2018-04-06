// Modules.
const path = require('path');
const crypto = require('crypto');
const fs = require('fs-extra');
const tmp = require('tmp-promise');
const { exec } = require('child-process-promise');
const request = require('request-promise-native').defaults({
    baseUrl: 'http://pac.fil.cool/uglix/bin/'
});
const bigInt = require("big-integer");

// Environment variables.
require('dotenv').config();

// Cookie jar.
let jar;

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');
if(!process.env.PAC_PASSWORD) throw new Error('Please set PAC_PASSWORD environment variable.');
// if(!process.argv[2]) throw new Error('Path to your private key require.');

function parseLargeNumberSignatureRequest(data) {
    const params = {};
    let match;

    const numberRegex = /"(\w)": (\d+)/g;
    while((match = numberRegex.exec(data)) !== null) {
        params[match[1]] = match[1].length === 1 ? bigInt(match[2]) : match[2];
    }

    const hashRegex = /"hash": "([0-9a-f]+)"/;
    if((match = hashRegex.exec(data)) !== null) {
        params.hash = match[1];
    }

    const signatureRegex = /"signature": "([A-Za-z0-9+/=]+)"/;
    if((match = signatureRegex.exec(data)) !== null) {
        params.signature = match[1];
    }

    return params;
}

function split64(string) {
    return string.replace(/\s/g, '').match(/.{1,64}/g).join('\n');
}

async function encrypt(data, passphrase) {
    const openssl = await exec(`echo -n '${data}' | openssl enc -aes-128-cbc -md sha256 -pass pass:'${passphrase}' -base64`, { shell: '/bin/bash' });
    return Buffer.from(openssl.stdout.trim(), 'base64');
}

async function decrypt(data, passphrase) {
    const openssl = await exec(`echo -n '${split64(data.toString('base64'))}' | openssl enc -d -aes-128-cbc -md sha256 -base64 -pass pass:'${passphrase}'`, { shell: '/bin/bash' });
    return openssl.stdout.trim();
}

function safePrime() {
    // return request({
    //     uri: '/login/speke/parameter',
    //     method: 'GET',
    //     jar: jar
    // });
    return bigInt('21350987091819435478025418499437578466393959034235202123790772557759179652898709378960662441601254576034449286670336012348392006015221572911347409189389592084518309942361711869073040644448998778229088366253226776726025453470296162904521664885893092063881903765680391895725671377180898796168192843857945777759206176963993977215448277953399924158107386581719159526786650856321625767743783457755683448999261246166980000777900825320526302877800160258256514535733547791620349036977084837712119848447755745892127484460381193830707917544020109736494215414984722020489541482416237811728041361677102547350514947448855391967179');
}

function sendHello(A) {
    return request({
        uri: '/login/speke/hello',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        jar: jar,
        body: `{"username": "${process.env.PAC_USERNAME}", "A": ${A.toString()}}`
    });
}

// function sendConfirmation(hash) {
//     return request({
//         uri: '/login/speke/confirmation',
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         jar: jar,
//         body: `{"hash": "${hash}"}`
//     });
// }

function sendConfirmation(data) {
    return request({
        uri: '/gateway',
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        jar: jar,
        encoding: null,
        resolveWithFullResponse: true,
        body: data
    });
}

async function openSession() {
    jar = request.jar();

    const p = safePrime();

    let sha256 = crypto.createHash('sha256');
    sha256.update(process.env.PAC_PASSWORD);

    const passwordHash = bigInt(sha256.digest('hex'), 16);
    const g = passwordHash.modPow(2, p);

    const x = bigInt.randBetween(2, p.minus(2));

    const A = g.modPow(x, p);

    const { B, hash } = parseLargeNumberSignatureRequest(await sendHello(A));
    const AB = B.modPow(x, p);

    sha256 = crypto.createHash('sha256');
    sha256.update(Buffer.from(AB.toString(16), 'hex'));

    const K = bigInt(sha256.digest('hex'), 16);

    if (A.lesserOrEquals(1) || A.greaterOrEquals(p.minus(1))) {
        console.error('Invalid A.');
        return;
    }
    if (B.lesserOrEquals(1) || B.greaterOrEquals(p.minus(1))) {
        console.error('Invalid B.');
        return;
    }

    sha256 = crypto.createHash('sha256');
    sha256.update(`SPEKE,${A.toString()},${B.toString()},${g.toString()},${K.toString(16)}`);

    if (hash !== sha256.digest('hex')) {
        console.error('Wrong SPEKE,<A>,<B>,<g>,<K> hash.');
        return;
    }

    const T = `${process.env.PAC_USERNAME},${A.toString()},${B.toString()},${g.toString()},${K.toString(16)}`;
    sha256 = crypto.createHash('sha256');
    sha256.update(T);

    const crypted = await encrypt(JSON.stringify({
        method: 'POST',
        url: '/bin/login/speke/confirmation',
        args: { hash: sha256.digest('hex') }
    }), K.toString(16));

    const confirmation = await sendConfirmation(crypted);
    const response = await decrypt(confirmation.body, K.toString(16));

    if(response !== `PAKE successful. Session established for ${process.env.PAC_USERNAME}`) {
        throw new Error('Authentification failed.');
    }

    return {
        sessionKey: K.toString(16),
        cookie: confirmation.headers['set-cookie'][0]
    };
}

openSession()
.then(session => console.log(session))
.catch(error => console.log(error));