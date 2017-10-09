'use strict';
//ddkjh

/*===========================================================================================
Couple service, access to REST API
===========================================================================================*/

servicesModule.factory('CoupleSrvc', function(RESTSrvc) {    
    return {
        getUDSRByNumbers: function(man, woman){
	        if (!man || man == '') man = 0;
	        if (!woman || woman == '') woman = 0;
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/udsr/man/' + man + '/woman/' + woman});
        },
        getUDSRByNumbersForTournament: function(man, woman, tournamentId){
            if (!man || man == '') man = 0;
            if (!woman || woman == '') woman = 0;
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/udsr/man/' + man + '/woman/' + woman + '/tournament/' + tournamentId});
        },
        getWDSFByNumbers: function(man, woman){
	        if (!man || man == '') man = 0;
	        if (!woman || woman == '') woman = 0;
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/wdsf/man/' + man + '/woman/' + woman});
        },
        getWDSFOtherInfoForTournament: function(trnId, coupleId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/'+coupleId+'/wdsfinfo/tournament/' + trnId});
        },
        getById: function(id){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/' + id});
        },
        registrationExisting: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/couple/registration/existing', data: data});  
        },
        registrationNew: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/couple/registration/new', data: data});  
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
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/couple/grid', data: obj});
        },
        getCompetitionsCount: function(tournamentId, coupleId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/' + tournamentId + '/couple/' + coupleId + '/competitionscount'});  
        },
        getRegistrationConflict: function(trnId, manId, womanId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/conflictregistration/tournament/' + trnId + '/man/' + manId + '/woman/' + womanId});  
        }
    }
});
