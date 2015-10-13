'use strict';
//dd

/*===========================================================================================
DancerClass service, access to REST API
===========================================================================================*/

servicesModule.factory('DancerClassSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/dancerClass'});
        }
    }
});
