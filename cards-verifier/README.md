### How to run:

- #### Install modules using `npm install`.

- #### Move your trusted certificate in the project directory as *CA.pem*.

- #### Downlaod your cards info using `node download-cards.js 'YOUR_OPEN_SESSION_COOKIE'`. 

Example:
`node download-cards.js 'sessionid=z8dw1but8rc370aei96cqpm1npkm0eq6; expires=Sat, 27-Jan-2018 02:05:17 GMT; HttpOnly; Max-Age=3600; Path=/'`

- #### Verify certificates using `node verify.js`.

- #### Send result to the client, close ticket, validate token, get 4 points, ⭐️ all my projects (:
