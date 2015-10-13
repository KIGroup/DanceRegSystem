'use strict';
//dd

/*===========================================================================================
Discipline service, access to REST API
===========================================================================================*/

servicesModule.factory('DisciplineSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/discipline'});
        }
    }
});
