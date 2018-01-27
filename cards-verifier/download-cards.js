// Moduls.
const request = require("request-promise-native");
const fs = require('fs-extra');

// Session.
const sessionCookie = '' || process.argv[2];

// Utils.
function cardNumbers() {
    // Request options.
    const options = {
        url: 'http://pac.fil.cool/uglix/bin/banks/forensics',
        method: 'GET',
        headers: { Cookie: sessionCookie },
        json: true
    };

    return request(options);
}

function cardInfo(cardId) {
    // Request options.
    const options = {
		url: `http://pac.fil.cool/uglix/bin/banks/card-data/${cardId}`,
		method: 'GET',
        headers: { Cookie: sessionCookie },
		json: true
	};

    return request(options);
}

// Main.
async function download() {
    try {
        // Fetch all cards ids.
        const info = await cardNumbers();
        // Fetch all cards info.
        const cards = await Promise.all(info['card-numbers'].map(cardInfo));

        // Write to disk.
        await fs.writeJSON('./cards.json', {
            identifier: info.identifier,
            cards: cards
        }, {
            spaces: '\t'
        });
    } catch(error) {
        console.error('Error while downloading cards info.', error);
    }
}

download();
