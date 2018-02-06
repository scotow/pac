pm.sendRequest("http://pac.fil.cool/uglix/bin/login/CHAP", function (err, response) {
    const challenge = response.json().challenge;

    const postRequest = {
        url: 'https://scotow.com/pac/chap/',
        method: 'POST',
        header: 'Authorization: PtmFEp8igphGAtu4Fwi2jcSZQoJPblm8',
        body: {
            mode: 'formdata',
            formdata: [
                { key: 'username', value: pm.environment.get('name') },
                { key: 'password', value: pm.environment.get('password') },
                { key: 'challenge', value: challenge }
            ]
        }
    }

    pm.sendRequest(postRequest, function (err, res) {
        let token = res.text().trim().replace('\r', '').split('\n').join('');
        token = token.substr(0, 64) + '\\n' + token.substr(64);
        pm.globals.set('response', token);
    });
});
