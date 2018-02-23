// Modules.
const fs = require('fs-extra');
const tmp = require('tmp-promise');
const { exec } = require('child-process-promise');
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

// Environment variables.
require('dotenv').config();

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');
if(!process.argv[2]) throw new Error('Path to your private key require.');

async function sign(challenge) {
    if(!await fs.pathExists(process.argv[2])) {
        throw new Error('Invalid private key path.');
    }

    const openssl = await exec(`echo -n '${challenge}' | openssl dgst -sha256 -sign ${process.argv[2]} | base64`, { shell: '/bin/bash' });
    return openssl.stdout.trim();
}

async function getChallenge() {
    return (await request.get('http://pac.fil.cool/uglix/bin/login/passwordless')).challenge;
}

async function verify(signature) {
    return (await request.post({
        url: 'http://pac.fil.cool/uglix/bin/login/passwordless',
        resolveWithFullResponse: true,
        body: {
            user: process.env.PAC_USERNAME,
            response: signature
        }
    })).headers['set-cookie'][0];
}

async function openSession() {
    const challenge = await getChallenge();
    const signature = await sign(challenge);

    return await verify(signature);
}

openSession()
.then(cookie => console.log(cookie))
.catch(error => console.error(error));
