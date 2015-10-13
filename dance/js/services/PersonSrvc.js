'use strict';
//dd

/*===========================================================================================
Person service, access to REST API
===========================================================================================*/

servicesModule.factory('PersonSrvc', function(RESTSrvc) {    
    return {
        getByUDSRNumber: function(number){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/person/udsr/' + number});
        },
        getByWDSFNumber: function(number){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/person/wdsf/' + number});
        },
        getStats: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/person/stats'});
        }
    }
});
