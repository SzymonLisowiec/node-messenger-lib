module.exports = function MessengerProfile(core){
	
	const self = this;
	
	self.get_started = function(state, payload, callback){
		
		if(typeof state == 'boolean'){
			if(state){
				core.callAPI('/me/messenger_profile', 'post', {
					get_started: {
						payload: payload
					}
				}, callback);
			}else{
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'get_started'
					]
				}, callback);
			}
		}
		
		return true;
	};
	
	self.greeting_text = function(state){
		
		if(typeof state == 'boolean'){
			
			if(!state){
				
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'greeting'
					]
				}, callback);
				
				return true;
			}
			
			var Data = [];

			return {
				
				addLocale: function(locale, text){
					
					Data.push({
						locale: locale,
						text: text
					});
					
					return this;
				},

				save: function(callback){
					
					core.callAPI('/me/messenger_profile', 'post', {
						greeting: Data,
					}, callback);

					return true;
				}
				
			};
			
		}
		
		return false;
	}
	
	self.persistent_menu = function(state){
		
		if(typeof state == 'boolean'){
			
			if(!state){
				
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'persistent_menu'
					]
				}, callback);
				
				return true;
			}
			
			var Data = [];

			function menuItem(menu_item){

				var item = {
					type: menu_item.type,
					title: menu_item.title
				};

				if(item.type == 'web_url') item.url = menu_item.url;
				if(item.type == 'postback') item.payload = menu_item.payload;

				if(menu_item.webview_height_ratio) item.webview_height_ratio = menu_item.webview_height_ratio;
				if(menu_item.messenger_extensions) item.messenger_extensions = menu_item.messenger_extensions;
				if(menu_item.fallback_url) item.fallback_url = menu_item.fallback_url;
				if(menu_item.webview_share_button) item.webview_share_button = menu_item.webview_share_button;

				return item;
			}

			return {
				
				addLocale: function(locale, composer_input_disabled){
					
					var index = Data.length;
					Data[index] = {
						locale: locale,
						composer_input_disabled: (typeof composer_input_disabled == 'boolean')?composer_input_disabled:false,
						call_to_actions: []
					};
					
					return {
						
						addAction: function(menu_item){
							
							Data[index].call_to_actions.push(menuItem(menu_item));

							return this;
						},

						addSubMenu: function(title){
							
							var submenuindex = Data[index].call_to_actions.length;
							Data[index].call_to_actions.push({
								title: title,
								type: 'nested',
								call_to_actions: []
							});

							return {

								addAction: function(menu_item){

									Data[index].call_to_actions[submenuindex].call_to_actions.push(menuItem(menu_item));

									return this;
								}

							};

						}
						
					};
					
				},

				save: function(callback){
					
					core.callAPI('/me/messenger_profile', 'post', {
						persistent_menu: Data
					}, callback);

					return true;
				}
				
			};
			
		}
		
		return false;
	}
	
	self.domainsWhitelist = function(state, domains, callback){
		
		if(typeof state == 'boolean'){
			if(state){
				core.callAPI('/me/messenger_profile', 'post', {
					whitelisted_domains: domains
				}, callback);
			}else{
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'whitelisted_domains'
					]
				}, callback);
			}
		}
		
		return true;
	};
	
	self.account_linking = function(state, account_linking_url, callback){
		
		if(typeof state == 'boolean'){
			if(state){
				core.callAPI('/me/messenger_profile', 'post', {
					account_linking_url: account_linking_url
				}, callback);
			}else{
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'account_linking_url'
					]
				}, callback);
			}
		}
		
		return true;
	};
	
	self.target_audience = function(state, audience_type, whitelist, blacklist, callback){
		
		if(typeof state == 'boolean'){
			if(state){
				core.callAPI('/me/messenger_profile', 'post', {
					target_audience: {
						audience_type: audience_type,
						countries: {
							whitelist: whitelist,
							blacklist: blacklist
						}
					}
				}, callback);
			}else{
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'target_audience'
					]
				}, callback);
			}
		}
		
		return true;
	};
	
	self.home_url = function(state, url, webview_height_ratio, in_test, webview_share_button, callback){
		
		if(typeof state == 'boolean'){
			if(state){
				core.callAPI('/me/messenger_profile', 'post', {
					home_url: {
						url: url,
						webview_height_ratio: webview_height_ratio,
						in_test: in_test,
						webview_share_button: webview_share_button
					}
				}, callback);
			}else{
				core.callAPI('/me/messenger_profile', 'delete', {
					fields: [
						'home_url'
					]
				}, callback);
			}
		}
		
		return true;
	};
	
	return self;
}