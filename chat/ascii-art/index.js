// Modules.
const fs = require('fs-extra');
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

function formatMessage(message) {
    return message.split('\n').map(line => {
        line = line.slice(0, 59);
        return `.${line}${' '.repeat(59 - line.length)}`;
    }).join('\n');
}

function openSession() {
    return request.post({
        url: 'http://pac.fil.cool/uglix/bin/login',
        body: {
            user: 'failsafe',
            password: 'I_hope_you_never_logon_to_this'
        }
    });
}

async function sendMessage(message) {
    return request.post({
        url: 'http://pac.fil.cool/uglix/bin/chat-room',
        body: {
            text: message
        }
    });
}

async function senfFile(fileName) {
    await openSession();

    const art = await fs.readFile(fileName);
    const message = formatMessage(art.toString('utf8'));

    await chat(message);
}

if(!process.argv[2]) {
    throw new Error('Ascii art file require.');
}

senfFile(process.argv[2])
.then(() => console.log('Success.'))
.catch(error => console.error(error));
