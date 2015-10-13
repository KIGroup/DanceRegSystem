'use strict';
//dd

/*===========================================================================================
TournamentClass service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentClassSrvc', function(RESTSrvc) {    
    return {
        getAll: function(parentId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentClass/'+parentId});
        }
    }
});
