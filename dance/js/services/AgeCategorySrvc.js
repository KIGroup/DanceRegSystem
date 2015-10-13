'use strict';
//dd

/*===========================================================================================
AgeCategory service, access to REST API
===========================================================================================*/

servicesModule.factory('AgeCategorySrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/ageCategory'});
        },
        getById: function(id){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/ageCategory/' + id});
        },
        save: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/ageCategory', data: data});
        },
        changeActiveStatus: function(objId, value){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/ageCategory/' + objId + '/isActive/' + value});
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
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/ageCategory/grid', data: obj});
        }
    }
});
