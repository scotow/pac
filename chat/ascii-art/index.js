// Modules.
const fs = require('fs');
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

function formatMessage(message) {
    return message.split('\n').map(line => {
        return `.${line}${' '.repeat(60 - line.length - 1)}`;
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

async function chat(line) {
    return request.post({
        url: 'http://pac.fil.cool/uglix/bin/chat-room',
        body: {
            text: line
        }
    });
}

async function sendMessage(fileName) {
    await openSession();

    const art = fs.readFileSync(fileName);
    const message = formatMessage(art.toString('utf8'));

    await chat(message);
}

if(!process.argv[2]) {
    throw new Error('Ascii art file require.');
}

sendMessage(process.argv[2])
.then(() => console.log('Success.'))
.catch(error => console.error(error));
