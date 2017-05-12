const request = require('request');
const MessengerProfile = require('./messenger_profile.js');

module.exports = function(config){
	
	if(config && config.verify_token && config.page_token){
		
		const self = this;
		const API_URL = 'https://graph.facebook.com/v2.6';
		const events = {
			message: [],
			message_delivered: [],
			message_readed: [],
			postback: [],
			quick_reply: [],
			account_linking: [],
			referral: []
		};
		
		
		const token = config.page_token;
		
		function emitEvent(event, data, pageID){
			
			events[event].forEach(function(reaction){
				reaction(data, pageID);
			});
			
			return true;
		};
		
		self.on = function(event, reaction){
			
			if(typeof events[event] == 'object'){
				events[event].push(reaction);
				return true;
			}else{
				console.log('Event "'+event+'" doesn\'t exists.');
				return false;
			}
			
		};
		
		self.removeEventListener = function(event, reaction){
			
			events[event].splice(events[event].indexOf(reaction), 1);
			
			return true;
		};
		
		self.webhook = function(req, res){
			
			if(req.method == 'GET'){
				
				if(req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.verify_token){
					res.status(200).send(req.query['hub.challenge']);
				}else{
					res.status(403).send('Failed validation.');
				}
				
			}else if(req.method == 'POST'){
				
				var data = req.body;
				
				if(data.object == 'page'){
					
					data.entry.forEach(function(pageEntry) {
						var pageID = pageEntry.id;
						var timeOfEvent = pageEntry.time;
						
						pageEntry.messaging.forEach(function(messagingEvent){
							
							if(messagingEvent.message){
								
								if(messagingEvent.message.quick_reply){
									var quick_reply = new self.receivedQuickReply(messagingEvent);
									emitEvent('quick_reply', quick_reply, pageID);
								}
								
								var message = new self.receivedMessage(messagingEvent);
								emitEvent('message', message, pageID);
								
							}else if(messagingEvent.delivery){
								
								var event = new self.deliveredMessage(messagingEvent);
								emitEvent('message_delivered', event, pageID);
								
							}else if(messagingEvent.postback){
								
								var event = new self.postback(messagingEvent);
								emitEvent('postback', event, pageID);
								
							}else if(messagingEvent.read){
								
								var event = new self.readedMessage(messagingEvent);
								emitEvent('message_readed', event, pageID);
								
							}else if(messagingEvent.account_linking){
								
								var event = new self.account_linking(messagingEvent);
								emitEvent('account_linking', event, pageID);
								
							}else if(messagingEvent.referral){
								
								var event = new self.referral(messagingEvent);
								emitEvent('referral', event, pageID);
								
							}else{
								console.log('[Page#'+pageID+'] Webhook received unknown messagingEvent: ', messagingEvent);
							}
						});
					});
					
					res.sendStatus(200);
				}
				
			}else res.send('Wrong method.');
			
		};
		
		self.receivedMessage = function(event){
			
			const Message = this;
			
			Message.id = event.message.mid;
			Message.sender = event.sender.id;
			Message.recipient = event.recipient.id;
			Message.time = event.timestamp;
			Message.isEcho = (event.message.is_echo)?true:false;
			Message.isQuickReply = (event.message.quick_reply)?true:false;
			
			if(event.message.app_id)
				Message.appId = event.message.app_id;
			if(event.message.metadata)
				Message.metadata = event.message.metadata;
			if(event.message.text)
				Message.text = event.message.text;
			
			if(event.message.attachments)
				Message.attachments = event.message.attachments;
			
			return Message;
		};
		
		self.receivedQuickReply = function(event){
			
			const QuickReply = this;
			
			QuickReply.id = event.message.mid;
			QuickReply.sender = event.sender.id;
			QuickReply.recipient = event.recipient.id;
			QuickReply.time = event.timestamp;
			
			if(event.message.quick_reply.payload)
				QuickReply.payload = event.message.quick_reply.payload;
			
			return QuickReply;
		};
		
		self.deliveredMessage = function(event){
			
			const Event = this;
			
			Event.sender = event.sender.id;
			Event.recipient = event.recipient.id;
			Event.ids = event.delivery.mids;
			Event.watermark = event.delivery.watermark;
			Event.seq = event.delivery.seq;
			
			return Event;
		};
		
		self.readedMessage = function(event){
			
			const Event = this;
			
			Event.sender = event.sender.id;
			Event.recipient = event.recipient.id;
			Event.time = event.timestamp;
			Event.watermark = event.read.watermark;
			Event.seq = event.read.seq;
			
			return Event;
		};
		
		self.postback = function(event){
			
			const Event = this;
			
			Event.sender = event.sender.id;
			Event.recipient = event.recipient.id;
			Event.time = event.timestamp;
			Event.payload = event.postback.payload;
			
			return Event;
		}
		
		self.account_linking = function(event){
			
			const Event = this;
			
			Event.sender = event.sender.id;
			Event.recipient = event.recipient.id;
			Event.time = event.timestamp;
			
			if(event.account_linking.status) Event.status = event.account_linking.status;
			if(event.account_linking.authorization_code) Event.authorization_code = event.account_linking.authorization_code;
			
			return Event;
		};
		
		self.referral = function(event){
			
			const Event = this;
			
			Event.sender = event.sender.id;
			Event.recipient = event.recipient.id;
			Event.time = event.timestamp;
			
			if(event.referral.ref) Event.ref = event.referral.ref;
			if(event.referral.ad_id) Event.ad_id = event.referral.ad_id;
			if(event.referral.source) Event.source = event.referral.source;
			if(event.referral.type) Event.type = event.referral.type;
			
			return Event;
		};
		
		self.Message = function(recipients){
			
			const Message = this;
			var messageData = {};
			
			if(typeof recipients == 'string'){
				Message.recipients = [recipients];
			}else if(typeof recipients == 'object'){
				Message.recipients = recipients;
			}else{
				console.log('Wrong recipients!');
				return false;
			}
			
			Message.send = function(){
				
				Message.recipients.forEach(function(recipient){
					self.callAPI('/me/messages', 'post', {
						
						recipient: {
							id: recipient
						},
						message: messageData
						
					});
				});
				
				return true;
			};
			
			Message.setText = function(text){
				
				if(typeof text == 'string'){
					
					messageData.text = text;
					
					return true;
					
				}
				
				return false;
			};
			
			Message.setAttachment = function(data){
					
				messageData.attachment = data;
					
				return true;
			};
			
			Message.addQuickReply = function(data){
				
				if(!messageData.quick_replies)
					messageData.quick_replies = [];
				
				messageData.quick_replies.push(data);
				
				return true;
			};
			
			Message.setTemplate_Buttons = function(text, sharable, buttons){
				
				messageData = {
					attachment: {
						type: 'template',
						payload: {
							template_type: 'button',
							sharable: sharable,
							text: text,
							buttons: buttons
						}
					}
				};
				
				return true;
			}
			
			return Message;
		}
		
		self.callAPI = function(action, method, data, callback){
			
			var Data = {
				url: API_URL+action,
				qs: {
					access_token: token
				},
				method: method.toUpperCase()
			};
			
			if(typeof data == 'object')
				Data.json = data;
			
			request(Data, function(error, response, body){
				
				if(error){
					
					console.log('Error sending messages: ', error);
					
				}else if(response.body.error){
					
					console.log('Error: ', response.body.error);
					
				}else{
					
					if(callback)
						callback(response, body);
					
				}
				
			});
			
			return true;
		}

		self.getUserProfile = function(userid, callback){

			self.callAPI('/'+userid, 'get', false, function(response, body){
				callback(JSON.parse(body));
			});
			
			return true;
		};
		
		self.MessengerProfile = function(){
			return MessengerProfile(self);
		};
		
		return self;
		
	}else return 'Wrong config.';
	
};