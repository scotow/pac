// Modules.
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

// Setup.
const HIDDEN_TOKEN = '5cOt0w';

// Environment variables.
require('dotenv').config();

if(!process.env.PAC_USERNAME) throw new Error('Please set PAC_USERNAME environment variable.');
if(!process.env.PAC_PASSWORD) throw new Error('Please set PAC_PASSWORD environment variable.');

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

async function signatures() {
    const signatures = await request.get(`http://pac.fil.cool/uglix/bin/key-management/${process.env.PAC_USERNAME}/signatures`);

    // Transform object to array of siger:signature.
    return Object.keys(signatures).map(key => ({ signer: key, signature: signatures[key] }));
}

function isLegit(base64) {
    return !Buffer.from(base64, 'base64').toString().includes(HIDDEN_TOKEN);
}

async function deleteSignature(signer) {
    await request({
        url: 'http://pac.fil.cool/uglix/bin/key-management/delete-signature',
        method: 'POST',
        body: {
            signer: signer
        }
    });
}

// Main.
async function becomeInsignificant() {
    // Open PAP session.
    await openSession();

    // Fetch current signatures from server.
    const fakeSignatures = (await signatures()).filter(entry => !isLegit(entry.signature));

    if(!fakeSignatures.length) {
        console.log('All your signatures are legit. FeelsNormalMan.');
        return;
    }

    // Delete all fake signatures.
    await Promise.all(fakeSignatures.map(entry => deleteSignature(entry.signer)));
}

becomeInsignificant()
.then(() => console.log('Success.'))
.catch(error => console.error(error));
