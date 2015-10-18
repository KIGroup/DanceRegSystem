'use strict';
//dddxdddddвd

/*===========================================================================================
Access to REST API
===========================================================================================*/

servicesModule.factory('RESTSrvc', function($http, $q) {    
    return {
        getPromise: function(config){
            $http.defaults.headers.common['Accept-Language'] = AppSettings.lang;
            
            var deferred = $q.defer();
            //$('#divLoader').show();
            $http(config).
                success(function(data, status, headers, config){
                    deferred.resolve(data);
                }).
                error(function(data, status, headers, config){
                    if (data != undefined && data.summary != undefined){
                        data = data.summary;
                    }
                    
                    deferred.reject(data, status, headers, config);
                });

            return deferred.promise;
        }
    }
});
  
