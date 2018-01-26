// Moduls.
const request = require("request-promise-native");
const fs = require('fs-extra');

// Session.
const sessionCookie = 'sessionid=z1dghy890sr4ccpc6pvmuu35m1p703rq; expires=Fri, 26-Jan-2018 20:05:11 GMT; HttpOnly; Max-Age=3600; Path=/';

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

// function verifyCard(card) {
//     return (
//         fs.outputFile(`/tmp/bank-${card['card-number']}.pem`, card['bank-certificate'])
//         .then(fs.outputFile(`/tmp/card-${card['card-number']}.pem`, card['card-certificate']))
//         .then(() => {
//             return new Promise((resolve, reject) => {
//                 exec(`cat /tmp/CA2${data['card-number']} | openssl verify -trusted CA -untrusted /tmp/CA1${data['card-number']}`, (err, stdout, stderr) => {
//                   resolve(stdout.includes('stdin: 0K'));
//                   //resolve(!err);
//                 });
//             });
//         });
//     );
// }


// request(options)
// .then(data => {
// 	id = data.identifier;
// 	return Promise.all(data['card-numbers'].map(verify));
// })
// .then(data => console.log(JSON.stringify({ identifier: id, 'card-numbers': data }) ))
// .catch(err => {console.error(err)});
//
// function cardInfo(nbcard){
// 	const options = {
// 		url: 'http://pac.fil.cool/uglix/bin/banks/card-data/' + nbcard,
// 		method: 'GET',
// 		headers: { Cookie: 'sessionid=mnxqjvhv6jw6khzvswdlq5pop4wxorxk; expires=Fri, 26-Jan-2018 18:31:13 GMT; HttpOnly; Max-Age=3600; Path=/' },
// 		json: true
// 	};
//
// 	return new Promise(function(resolve, reject) {
// 		request(options)
// 		.then(data => {
// 			fs.writeFile("/tmp/CA1" + data['card-number'], data['bank-certificate'], function(err) {
// 				// console.log(err);
// 		    	if(err) {
// 	        		reject(err);
// 					return;
// 		    	}
//
// 				fs.writeFile("/tmp/CA2" + data['card-number'], data['card-certificate'], function(err) {
// 		    		if(err) {
// 		        		reject(err);
// 						return;
// 		    		}
//
// 					exec(`cat /tmp/CA2${data['card-number']} | openssl verify -trusted CA -untrusted /tmp/CA1${data['card-number']}`, (err, stdout, stderr) => {
// 					  // if (err) {
// 					  //   console.error(`exec error: ${err}`);
// 						// reject(err);
// 					  //   return;
// 					  // }
// 					  resolve(stdout.includes('stdin: 0K'));
// 					  //resolve(!err);
// 					});
// 				})
// 			})
//
// 		})
// 		.catch(err => { reject(err) });
// 	});
// }
