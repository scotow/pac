// Modules.
const fs = require('fs-extra');
const tmp = require('tmp-promise');
const { exec } = require('child-process-promise');
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

// Utils.
function split64(string) {
    return string.replace(/\s/g, '').match(/.{1,64}/g).join('\n');
}

async function decryptFile(file, passphrase = 'PAC') {
    const openssl = await exec(`openssl enc -d -aes-128-cbc -md sha256 -base64 -pass pass:'${passphrase}' -in ${file}`);
    return openssl.stdout.trim();
}

async function decrypt(data, passphrase = 'PAC') {
    const { path } = await tmp.file();
    await fs.outputFile(path, split64(data));

    return decryptFile(path, passphrase);
}

async function generatePublicKey() {
    const openssl = await exec('openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 | openssl pkey -pubout');
    return openssl.stdout.trim();
}

function extractCredentials(text) {
    return {
        login: /login\s*:\s*(.+)/.exec(text)[1],
        password: /password\s*:\s*(.+)/.exec(text)[1]
    };
}

// Session.
function openSession(username, password) {
    return request.post({
        url: 'http://pac.fil.cool/uglix/bin/login',
        body: {
            user: username,
            password: password
        }
    });
}

function nasaBin() {
    return request.get('http://pac.fil.cool/uglix/home/guest/NASA.bin');
}

function uploadKey(key) {
    return request.post({
        url: 'http://pac.fil.cool/uglix/bin/key-management/upload-pk',
        body: {
            public_key: key,
            confirm: 'confirm=True'
        }
    });
}

async function createAccount() {
    await openSession('guest', 'guest');

    // Generate credentials.
    const credentials = extractCredentials(await decrypt(await nasaBin()));

    await openSession(credentials.login, credentials.password);

    const publicKey = await generatePublicKey();

    await uploadKey(publicKey);
    console.log(credentials);
}

createAccount()
.then(() => console.log('Success.'))
.catch(error => console.error(error.message));
