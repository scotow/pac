// Moduls.
const fs = require('fs-extra');
const tmp = require('tmp-promise');
const { exec } = require('child-process-promise');
const request = require('request-promise-native');

if(!process.env.USERNAME) throw new Error('Please set USERNAME environment variable.');
if(!process.env.PASSWORD) throw new Error('Please set PASSWORD environment variable.');

function split64(string) {
    return string.replace(/\s/g, '').match(/.{1,64}/g).join('\n');
}

async function encryptFile(file, passphrase = process.env.PASSWORD) {
    const openssl = await exec(`openssl enc -e -aes-128-cbc -md sha256 -base64 -pass pass:'${passphrase}' -in ${file}`);
    return openssl.stdout.trim();
}

async function encrypt(data, passphrase = process.env.PASSWORD) {
    const { path } = await tmp.file();
    await fs.outputFile(path, data);

    return encryptFile(path, passphrase);
}

async function decryptFile(file, passphrase = process.env.PASSWORD) {
    const openssl = await exec(`openssl enc -d -aes-128-cbc -md sha256 -base64 -pass pass:'${passphrase}' -in ${file}`);
    return openssl.stdout.trim();
}

async function decrypt(data, passphrase = process.env.PASSWORD) {
    const { path } = await tmp.file();
    await fs.outputFile(path, split64(data));

    return decryptFile(path, passphrase);
}

async function authentificator(sessionKey) {
    return await encrypt(JSON.stringify({
        username: process.env.USERNAME,
        timestamp: Date.now() / 1000 | 0
    }), sessionKey);
}

async function authenticationService() {
    return request({
        url: `http://pac.fil.cool/uglix/bin/kerberos/authentication-service/${process.env.USERNAME}`,
        method: 'GET',
        json: true
    });
}

async function ticketGrantingService(tgt, vm, authenticator) {
    return request({
        url: 'http://pac.fil.cool/uglix/bin/kerberos/ticket-granting-service',
        method: 'POST',
        json: true,
        body: {
            TGT: tgt,
            vm_name: vm,
            authenticator: authenticator
        }
    });
}

async function helloToVm(vm, ticket, authenticator) {
    return request({
        url: `http://pac.fil.cool/uglix/bin/uVM/${vm}/hello`,
        method: 'POST',
        json: true,
        resolveWithFullResponse: true,
        body: {
            ticket: ticket,
            authenticator: authenticator
        }
    });
}

async function openSession(vm) {
    const authentication = await authenticationService();

    const tgtSessionKeyCryptedFile = await tmp.file();
    await fs.outputFile(tgtSessionKeyCryptedFile.path, authentication['Client-TGS-session-key']);
    const tgtSessionKey = await decryptFile(tgtSessionKeyCryptedFile.path);

    // console.log(sessionKey);
    // console.log(await authentificator(sessionKey));
    const clientServer = await ticketGrantingService(authentication.TGT, vm, await authentificator(tgtSessionKey));
    // console.log(clientServer);

    const clientServerSessionKeyCryptedFile = await tmp.file();
    await fs.outputFile(clientServerSessionKeyCryptedFile.path, clientServer['Client-Server-session-key']);
    const clientServerSessionKey = await decryptFile(clientServerSessionKeyCryptedFile.path, tgtSessionKey);

    const response = await helloToVm(vm, clientServer['Client-Server-ticket'], await authentificator(clientServerSessionKey));
    return {
        sessionKey: clientServerSessionKey,
        cookie: response.headers['set-cookie'][0]
    };
}

async function get(vm, session, url) {

}

openSession('7900fc2a')
.then(session => console.log(session));

// encryptFile('index.js')
// encrypt('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed ligula lobortis, elementum dolor ac, pulvinar nisl. Cras id luctus arcu. Maecenas elementum malesuada turpis, eu efficitur dui hendrerit ultrices.')
// .then(data => decrypt(data))
// .then(data => console.log(data));

// console.log(split64('azezaezaeaeazazeazezaeazeaezopzkaepoakezaopepeazokpoeazekpaekpazekpapzkeoazpeoepazpaooaepoazkeopakze'))
