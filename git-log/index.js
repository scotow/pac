// Modules.
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child-process-promise');
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

const USERNAME = 'mfowler';

async function sign(challenge) {
    const privateKeyPath = path.join(__dirname, 'private.pem');
    if(!await fs.pathExists(privateKeyPath)) {
        throw new Error('Invalid private key path.');
    }

    const openssl = await exec(`echo -n '${challenge}' | openssl dgst -sha256 -sign ${privateKeyPath} | base64`, { shell: '/bin/bash' });
    return openssl.stdout.trim();
}

async function getChallenge() {
    return (await request.get('http://pac.fil.cool/uglix/bin/login/passwordless')).challenge;
}

function verify(signature) {
    return request.post({
        url: 'http://pac.fil.cool/uglix/bin/login/passwordless',
        body: {
            user: USERNAME,
            response: signature
        }
    });
}

async function openSession() {
    const challenge = await getChallenge();
    const signature = await sign(challenge);

    await verify(signature);
}

async function getLog() {
    await openSession();

    return request.get(`http://pac.fil.cool/uglix/home/${USERNAME}/work.log`);
}

getLog()
.then(log => console.log(log))
.catch(error => console.error(error));
