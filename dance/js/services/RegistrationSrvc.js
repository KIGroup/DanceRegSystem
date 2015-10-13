'use strict';
//d

/*===========================================================================================
===========================================================================================*/

servicesModule.factory('RegistrationSrvc', function(RESTSrvc) {    
    return {
        UDSR: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/registration/udsr', data: data});
        },
        WDSF: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/registration/wdsf', data: data});
        },
        OTHER: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/registration/other', data: data});
        }
    }
});
