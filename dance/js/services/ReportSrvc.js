'use strict';
//ddвddddвd

/*===========================================================================================
Отчеты
===========================================================================================*/

servicesModule.factory('ReportSrvc', function($cookies, $window) {
	
	return {
		tournamentParticipants: function(trnId){
    		var lang = $cookies.lang ? $cookies.lang.substring(0,2) : 'ru';
            $window.open(AppSettings.admin + '/report/' + lang + '/tournament/' + trnId  + '/participant','_blank');
    	},
    	tournamentPayers: function(trnId){
    		var lang = $cookies.lang ? $cookies.lang.substring(0,2) : 'ru';
            $window.open(AppSettings.admin + '/report/' + lang + '/tournament/' + trnId  + '/payer','_blank');
    	}
    }
});
  
