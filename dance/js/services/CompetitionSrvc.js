'use strict';
//dd

/*===========================================================================================
===========================================================================================*/

servicesModule.factory('CompetitionSrvc', function(RESTSrvc) {    
    return {
        getById: function(competitionId, params){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/competition/' + competitionId + (params ? params : '')});
        },
        removeById: function(competitionId){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/competition/' + competitionId});
        },
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/competition/grid', data: obj});
        },
        getTypes: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/competition/type'});
        },
        getAllAvialableForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/competition/grid/couple', data: obj});
        }, 
        getDates: function(tournamentId){
	        return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/'+tournamentId+'/competition/date'});
        },
        getWDSFByFilter: function(countryId, date){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/competitionwdsf/country/'+countryId+'/date/' + date});
        },
        save: function(tournamentId, data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/tournament/'+tournamentId+'/competition', data: data});
        },
        saveAll: function(tournamentId, data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/tournament/'+tournamentId+'/competition/all', data: data});
        },
        deleteById: function(tournamentId, competitionId){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/' + tournamentId + '/competition/' + competitionId});
        }
    }
});
