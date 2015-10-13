'use strict';
//ddkjh

/*===========================================================================================

===========================================================================================*/

servicesModule.factory('FeedBackSrvc', function(RESTSrvc) {    
    return {
        create: function(fb){
	        return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/feedback', data: fb});
        }
    }
	}
 );
