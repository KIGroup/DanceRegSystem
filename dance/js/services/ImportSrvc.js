'use strict';
//ddd

/*===========================================================================================
===========================================================================================*/

servicesModule.factory('ImportSrvc', function(RESTSrvc) {    
    return {
        getAllTournamentsForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/import/tournament/grid', data: obj});
        },
        getAllCompetitionsForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/import/competition/grid', data: obj});
        },
        getCompetitionsLink: function(trnId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/tournament/' + trnId + '/competition/importlink'});
        }
    }
});
