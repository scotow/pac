// Moduls.
const fs = require('fs-extra');
const { exec } = require('child-process-promise');

// Lib.
async function verifyCard(card) {
	try {
		// Write certificates to disk.
		await fs.outputFile(`/tmp/bank-${card['card-number']}.pem`, card['bank-certificate']);
		await fs.outputFile(`/tmp/card-${card['card-number']}.pem`, card['card-certificate']);

		// Execute openssl command.
		const child = await exec(`cat /tmp/card-${card['card-number']}.pem | openssl verify -trusted CA.pem -untrusted /tmp/bank-${card['card-number']}.pem`);

		if(card['card-number'] === '9479-0349-9450-2314') {
			console.log('stdout', child.stdout.trim());
			console.log('stderr', child.stderr.trim());
		}

		return child.stdout.trim() === 'stdin: OK';
	} catch(error) {
		return false;
	} finally {
		// Clear certificates.
		// await fs.remove(`/tmp/bank-${card['card-number']}.pem`);
		// await fs.remove(`/tmp/card-${card['card-number']}.pem`);
	}
}

async function verify() {
	try {
		// Identifier + cards.
		const info = require('./cards.json');

		// Cards only.
		const cards = info.cards;

		return {
			identifier: info.identifier,
			statuses: await Promise.all(cards.map(verifyCard))
		};
	} catch(error) {
		console.error('Error while verifying cards.', error);
	}
}

// Main.
verify()
.then(data => {
	console.log(JSON.stringify(data));
})
.catch(error => {
	console.error('Error');
});
