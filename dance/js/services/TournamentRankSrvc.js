'use strict';
//dd

/*===========================================================================================
TournamentRank service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentRankSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentRank'});
        }
    }
});
