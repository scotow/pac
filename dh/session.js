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
if(!process.argv[2]) throw new Error('Path to your private key require.');

function parseLargeNumberSignatureRequest(data) {
    const params = {};
    let match;

    const numberRegex = /"(\w)": (\d+)/g;
    while((match = numberRegex.exec(data)) !== null) {
        params[match[1]] = match[1].length === 1 ? bigInt(match[2]) : match[2];
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

async function sign(data) {
    if(!await fs.pathExists(process.argv[2])) {
        throw new Error('Invalid private key path.');
    }

    const openssl = await exec(`echo -n '${data}' | openssl dgst -sha256 -sign ${process.argv[2]} | base64`, { shell: '/bin/bash' });
    return openssl.stdout.trim();
}

async function verify(signature, data) {
    const file = await tmp.file();
    await fs.outputFile(file.path, signature);

    try {
        const openssl = await exec(`echo -n '${data}' | openssl dgst -sha256 -verify ${path.join(__dirname, 'bank-public-key.pem')} -signature ${file.path}`, { shell: '/bin/bash' });
        return openssl.stdout.trim() === 'Verified OK';
    } catch(error) {
        return false;
    }
}

async function fetchParameters() {
    return parseLargeNumberSignatureRequest(await request.get('/login/dh/parameters'));
}

async function login(A) {
    return parseLargeNumberSignatureRequest(
        await request({
            uri: '/login/dh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            jar: jar,
            body: `{"username": "${process.env.PAC_USERNAME}", "A": ${A.toString()}}`
        })
    );
}

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

    const { g, p } = await fetchParameters();
    const x = bigInt.randBetween('340282366920938463463374607431768211456', '1e100');

    const A = g.modPow(x, p);
    const { k, B, signature } = await login(A);

    if(!(await verify(Buffer.from(signature, 'base64'), `${A},${B},${k},${process.env.PAC_USERNAME}`))) {
        return await openSession();
    }

    const AB = B.modPow(x, p);

    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(AB.toString(16), 'hex'));
    const sessionKey = hash.digest('hex');

    const crypted = await encrypt(JSON.stringify({
        method: 'POST',
        url: '/bin/login/dh/confirmation',
        args: { signature: await sign(`${A},${B},${k},UGLIX`) }
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