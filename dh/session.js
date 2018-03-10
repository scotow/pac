// Modules.
const crypto = require('crypto');
const fs = require('fs-extra');
// const tmp = require('tmp-promise');
const { exec } = require('child-process-promise');
const request = require('request-promise-native').defaults({
    baseUrl: 'http://pac.fil.cool/uglix/bin/',
    jar: true
});
const bigInt = require("big-integer");

// Environment variables.
require('dotenv').config();

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');
if(!process.argv[2]) throw new Error('Path to your private key require.');

function parseLargeNumberRequest(data) {
    const params = {};

    const paramRegex = /"(\w)": (\d+)/g;
    let match;
    while((match = paramRegex.exec(data)) !== null) {
        params[match[1]] = match[1].length === 1 ? bigInt(match[2]) : match[2];
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

async function sign(data) {
    if(!await fs.pathExists(process.argv[2])) {
        throw new Error('Invalid private key path.');
    }

    const openssl = await exec(`echo -n '${data}' | openssl dgst -sha256 -sign ${process.argv[2]} | base64`, { shell: '/bin/bash' });
    return openssl.stdout.trim();
}

async function fetchParameters() {
    return parseLargeNumberRequest(await request.get('/login/dh/parameters'));
}

async function login(A) {
    return parseLargeNumberRequest(
        await request({
            uri: '/login/dh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{"username": "${process.env.PAC_USERNAME}", "A": ${A.toString()}}`
        })
    );
}

function sendConfirmation(data) {
    return request({
        uri: '/gateway',
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        encoding: null,
        resolveWithFullResponse: true,
        body: data
    });
}

async function openSession() {
    const { g, p } = await fetchParameters();
    const x = bigInt.randBetween('340282366920938463463374607431768211456', '1e100');

    const A = g.modPow(x, p);
    const { k, B } = await login(A);

    const AB = B.modPow(x, p);

    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(AB.toString(16), 'hex'));
    const sessionKey = hash.digest('hex');

    const signature = await sign(`${A},${B},${k},UGLIX`);

    const crypted = await encrypt(JSON.stringify({
        method: 'POST',
        url: '/bin/login/dh/confirmation',
        args: { signature: signature }
    }), sessionKey);

    const confirmation = await sendConfirmation(crypted);
    const response = await decrypt(confirmation.body, sessionKey);

    if(response !== 'Authenticated Key-Exchange successful. Access to /bin/banks/gateway granted.') {
        throw new Error('Authentification failed.');
    }

    return {
        sessionKey: sessionKey,
        cookie: confirmation.headers['set-cookie'][0]
    };
}

openSession()
.then(session => console.log(session))
.catch(error => console.log(error));