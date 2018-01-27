// Moduls.
const fs = require('fs-extra');
const os = require('os');
const { exec } = require('child-process-promise');

// Verification.
async function verifyCard(card) {
	const cardDir = `/tmp/${card['card-number']}`;

	try {
		// Write certificates to disk.
		await fs.outputFile(`${cardDir}/bank.pem`, card['bank-certificate']);
		await fs.outputFile(`${cardDir}/card.pem`, card['card-certificate']);

		// Subject matching.
		const subjectRegex = /\/(O|OU|CN)=([^/]+)/g;
		let subjectField;

		// Call openssl to verify organization, organizational unit and common name.
		const bankSubject = await exec(`cat ${cardDir}/bank.pem | openssl x509 -subject -noout`);
		// Verify bank's subject fields.
		while((subjectField = subjectRegex.exec(bankSubject.stdout.trim())) !== null) {
			switch(subjectField[1]) {
				case 'O':
					if(subjectField[2] !== card['bank-name']) return false;
					break;
				case 'OU':
					if(subjectField[2] !== 'Key Management') return false;
					break;
				case 'CN':
					if(subjectField[2] !== 'Bank CA') return false;
					break;
			}
		}

		// Call openssl to verify organization, organizational unit and common name.
		const cardSubject = await exec(`cat ${cardDir}/card.pem | openssl x509 -subject -noout`);
		// Verify card's subject fields.
		while((subjectField = subjectRegex.exec(cardSubject.stdout.trim())) !== null) {
			switch(subjectField[1]) {
				case 'O':
					if(subjectField[2] !== card['bank-name']) return false;
					break;
				case 'OU':
					if(subjectField[2] !== 'Cards Management') return false;
					break;
				case 'CN':
					if(subjectField[2] !== card['card-number']) return false;
					break;
			}
		}

		// Extract public key from card certificate.
		// Using bash '>' because -out is not woring (?).
		const pk = await exec(`openssl x509 -pubkey -noout -in ${cardDir}/card.pem > ${cardDir}/card.pk`);

		// Decode signature from base64.
		await fs.outputFile(`${cardDir}/signature.bin.b64`, card.signature);
		if(os.platform() === 'darwin') {
			await exec(`base64 -D -i ${cardDir}/signature.bin.b64 -o ${cardDir}/signature.bin`)
		} else {
			await exec(`base64 -d ${cardDir}/signature.bin.b64 > ${cardDir}/signature.bin`);
		}

		// Move challenge to file - not working with 'echo ... | ' (?).
		await fs.outputFile(`${cardDir}/challenge.txt`, card.challenge);
		// Verify challenge signature.
		const signature = await exec(`openssl dgst -sha256 -verify ${cardDir}/card.pk -signature ${cardDir}/signature.bin ${cardDir}/challenge.txt`);

		// Call openssl to verify card and bank pkey.
		const trust = await exec(`cat ${cardDir}/card.pem | openssl verify -trusted CA.pem -untrusted ${cardDir}/bank.pem`);

		// Verify trusting.
		if(trust.stdout.trim() !== 'stdin: OK') return false;

		// If everything worked.
		return true;
	} catch(error) {
		return false;
	} finally {
		// Clear files.
		await fs.remove(cardDir);
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
	console.error('Error (should not happen).', error);
});
