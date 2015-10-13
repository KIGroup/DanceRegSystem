'use strict';
//d
 
/*===========================================================================================
Participant service, access to REST API
===========================================================================================*/

servicesModule.factory('ParticipantSrvc', function(RESTSrvc, UtilsSrvc) {    
    return {
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/participant/grid', data: obj});
        },
        getAllForCompetition: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/competition/participant/grid', data: obj});
        },
        getAllForTournament: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/participant/grid', data: obj});
        },
        getAllForDancer: function(filter){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/dancer/participant' + filter});
        },
        getCompetitionsCount: function(filter){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/count/participant/competition' + filter});
        },
        removeById: function(id){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/participant/' + id});
        },
        getOtherCoupleKey: function(couple){
	    	return UtilsSrvc.base64Encode(couple.man.lastName + ',' + couple.man.firstName + ',' + couple.man.dob + ';' + couple.woman.lastName + ',' + couple.woman.firstName + ',' + couple.woman.dob);
	    },
	    getOtherAthleteKey: function(athlete){
	    	return UtilsSrvc.base64Encode(athlete.lastName + ',' + athlete.firstName + ',' + athlete.dob);
	    }
    }
});
