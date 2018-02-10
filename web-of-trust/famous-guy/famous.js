// Moduls.
const readline = require('readline');
const crypto = require('crypto');
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

// Setup.
const SIGNATURE_SIZE = 256;
const HIDDEN_TOKEN = '5cOt0w';
const HIDDEN_TOKEN_PADDING = 3;

// Environment variables.
require('dotenv').config();

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');
if(!process.env.PAC_PASSWORD) throw new Error('Please set PAC_PASSWORD environment variable.');

function potentialSigners() {
    return new Promise((resolve, reject) => {
        const signers = new Set();

        let cancel = false;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('Paste all signers present in the graph here:');

        rl.on('line', line => {
            line = line.trim();
            if(!line) return;

            line.split(' ')
            .filter(Boolean)
            .forEach(signers.add.bind(signers));
        });

        rl.on('close', () => {
            cancel || resolve(signers);
        });

        rl.on('SIGINT', () => {
            cancel = true;
            rl.close();
            reject(new Error('SIGINT signal received.'));
        })
    });
}

async function openSession() {
    await request({
        url: 'http://pac.fil.cool/uglix/bin/login',
        method: 'POST',
        body: {
            user: process.env.PAC_USERNAME,
            password: process.env.PAC_PASSWORD
        }
    });
}

async function currentSigners() {
    return new Set(
        Object.keys(
            await request.get(`http://pac.fil.cool/uglix/bin/key-management/${process.env.PAC_USERNAME}/signatures`)
        )
    );
}

function generateSignature(signer) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(SIGNATURE_SIZE, (error, buffer) => {
            if(error) {
                reject(error);
                return;
            }

            // Insert hidden token in the random [3 : n - 3] range.
            const tokenStart = HIDDEN_TOKEN_PADDING + Math.floor(Math.random() * (SIGNATURE_SIZE - HIDDEN_TOKEN.length - HIDDEN_TOKEN_PADDING * 2));
            for(let i = 0; i < HIDDEN_TOKEN.length; i++) {
                buffer[tokenStart + i] = HIDDEN_TOKEN.charCodeAt(i);
            }

            resolve({
                signer: signer,
                signature: buffer.toString('base64')
            });
        });
    });
}

async function uploadSignature(signature) {
    await request({
        url: 'http://pac.fil.cool/uglix/bin/key-management/upload-signature',
        method: 'POST',
        body: signature
    });
}

// Main.
async function becomeFamous() {
    // Open PAP session.
    await openSession();

    // Fetch current signers from server.
    const signers = await currentSigners();
    // Ask user to past the 'Trust graph' pdf and parse it.
    const allSigners = await potentialSigners();

    // Diff the two sets.
    const nonSigners = new Set([...allSigners].filter(x => !signers.has(x)));

    if(!nonSigners.size) {
        console.log('Everybody trust you already. FeelsFamousMan.');
        return;
    }

    // Generates fake signatures.
    const fakeSignatures = await Promise.all([...nonSigners].map(generateSignature));

    // Upload all signatures.
    await Promise.all(fakeSignatures.map(uploadSignature));
}

becomeFamous()
.then(() => console.log('Success.'))
.catch(error => console.error(error));
