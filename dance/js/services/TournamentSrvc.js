'use strict';
//dd

/*===========================================================================================
Tournament service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentSrvc', function(RESTSrvc) {    
    return {
        getById: function(id, params){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/' + id + (params ? params : '')});
        },
        getByIdAdmin: function(id, params){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/tournament/' + id + (params ? params : '')});
        },
        removeById: function(id){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/' + id});
        },
        getParticipantsCountById: function(id){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/' + id + '/participants/count'});
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
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/grid', data: obj});
        },
        save: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/tournament', data: data});
        },
        deleteById: function(id){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/' + id});
        },
        getAllByYear: function(year){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/year/' + year});
        },
        getAllYears: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentyears'});
        },
        getRecordersHashes: function(trnId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/recorder/tournament/' + trnId});
        } 
        
    }
});
