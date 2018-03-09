// Modules.
const crypto = require('crypto');
// const fs = require('fs-extra');
// const tmp = require('tmp-promise');
// const { exec } = require('child-process-promise');
const request = require('request-promise-native').defaults({ jar: true });
const bigInt = require("big-integer");

// Environment variables.
require('dotenv').config();

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');

function parseLargeNumberRequest(data) {
    const params = {};

    const paramRegex = /"(\w)": (\d+)/g;
    let match;
    while((match = paramRegex.exec(data)) !== null) {
        params[match[1]] = bigInt(match[2]);
    }

    return params;
}

function bigIntToBuffer(number) {

}

async function fetchParameters() {
    return parseLargeNumberRequest(await request.get('http://pac.fil.cool/uglix/bin/login/dh/parameters'));
}

async function login(a) {
    return parseLargeNumberRequest(
        await request({
            url: 'http://pac.fil.cool/uglix/bin/login/dh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: process.env.PAC_USERNAME, A: a })
        })
    );
}

async function openSession() {
    const { g, p } = await fetchParameters();
    const x = 1;

    const A = g.mod(p);
    const { k, B } = await login(A.toJSNumber());

    const AB = B.mod(p);

    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(AB.toString('16')));
    const sessionKey = hash.digest('hex');
    
    console.log(sessionKey);

    // hash.update('some data to hash');
    // console.log(hash.digest('hex'));

    return null;
}

openSession()
.then(session => console.log(session))
.catch(error => console.log(error));