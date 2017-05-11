# node-messenger-lib
Simple and light library to support API of Facebook's Messenger platform.


## Example:
```javascript
'use strict';
const fs = require('fs');
const app = require('express')();
const https = require('https');
const bodyParser = require('body-parser');

const FB = require('messenger-lib')({
	verify_token: 'FACEBOOK_VERIFY_TOKEN',
	page_token: 'FACEBOOK_PAGE_TOKEN'
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/webhook', function(req, res){
	FB.webhook(req, res);
});

app.post('/webhook', function(req, res){
	FB.webhook(req, res);
});

https.createServer({
    key: fs.readFileSync('YOUR_SSL_KEY_FILE', 'utf8'),
	cert: fs.readFileSync('YOUR_SSL_CRT_FILE', 'utf8')
}, app).listen(2053);

FB.on('message', function(message){
	
	if(!message.isEcho){
		
		var msg = new Message(message.sender);
		
		msg.setText('Bot received your message: "'+message.text+'"');
		msg.send();
		
	}
	
});
```

More documentacion in progress...
