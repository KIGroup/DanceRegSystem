'use strict';
//
/*===========================================================================================
Фильтр и общая настройка для заголовков
===========================================================================================*/


localizationModule.filter('localize', function(DanceDictionary) {
    return function(input) { 
    	//console.log('call localize'); 
        return DanceDictionary.getTranslate(input, AppSettings.lang);
    }
});


/*
servicesModule.config(['$httpProvider', function ($httpProvider) {
	$httpProvider.defaults.headers.common['Accept-Language'] = AppSettings.lang;
}]);

*/