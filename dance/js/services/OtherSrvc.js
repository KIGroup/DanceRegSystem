'use strict';
//dddddd

/*===========================================================================================
Other
===========================================================================================*/

servicesModule.factory('OtherSrvc', function(RESTSrvc) {    
    return {
        getLanguages: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/language'});
        },
        getCountries: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/country'});
        },
        checkAdmin: function(isLogin){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/checkAdmin/' + isLogin});
        },
        setUnknownKey: function(key){
	        console.log('unknownkey = '+key);
	        return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/unknownkey', data: {key: key}});
	    },
        getCurrencies: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/currency'});
        }		
    }
});
