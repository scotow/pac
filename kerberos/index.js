// Moduls.
const fs = require('fs-extra');
const tmp = require('tmp-promise');
const { exec } = require('child-process-promise');
const request = require('request-promise-native');

// Environment variables.
require('dotenv').config();

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');
if(!process.env.PAC_PASSWORD) throw new Error('Please set PAC_PASSWORD environment variable.');
if(!process.env.PAC_VM) throw new Error('Please set PAC_VM environment variable.');

function split64(string) {
    return string.replace(/\s/g, '').match(/.{1,64}/g).join('\n');
}

async function encryptFile(file, passphrase = process.env.PAC_PASSWORD) {
    const openssl = await exec(`openssl enc -e -aes-128-cbc -md sha256 -base64 -pass pass:'${passphrase}' -in ${file}`);
    return openssl.stdout.trim();
}

async function encrypt(data, passphrase = process.env.PAC_PASSWORD) {
    const { path } = await tmp.file();
    await fs.outputFile(path, data);

    return encryptFile(path, passphrase);
}

async function decryptFile(file, passphrase = process.env.PAC_PASSWORD) {
    const openssl = await exec(`openssl enc -d -aes-128-cbc -md sha256 -base64 -pass pass:'${passphrase}' -in ${file}`);
    return openssl.stdout.trim();
}

async function decrypt(data, passphrase = process.env.PAC_PASSWORD) {
    const { path } = await tmp.file();
    await fs.outputFile(path, split64(data));

    return decryptFile(path, passphrase);
}

async function authentificator(sessionKey) {
    return await encrypt(JSON.stringify({
        username: process.env.PAC_USERNAME,
        timestamp: Date.now() / 1000 | 0
    }), sessionKey);
}

async function authenticationService() {
    return request({
        url: `http://pac.fil.cool/uglix/bin/kerberos/authentication-service/${process.env.PAC_USERNAME}`,
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

    const clientServer = await ticketGrantingService(authentication.TGT, vm, await authentificator(tgtSessionKey));

    const clientServerSessionKeyCryptedFile = await tmp.file();
    await fs.outputFile(clientServerSessionKeyCryptedFile.path, clientServer['Client-Server-session-key']);
    const clientServerSessionKey = await decryptFile(clientServerSessionKeyCryptedFile.path, tgtSessionKey);

    const response = await helloToVm(vm, clientServer['Client-Server-ticket'], await authentificator(clientServerSessionKey));
    return {
        sessionKey: clientServerSessionKey,
        cookie: response.headers['set-cookie'][0]
    };
}

openSession(process.env.PAC_VM)
.then(session => console.log(session))
.catch(error => console.log(error));
