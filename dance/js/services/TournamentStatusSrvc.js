'use strict';
//ddd

/*===========================================================================================
TournamentStatus service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentStatusSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentStatus'});
        }
    }
});
