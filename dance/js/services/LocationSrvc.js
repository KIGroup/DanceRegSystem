'use strict';
//dddxdddddвd 

/*===========================================================================================

===========================================================================================*/

servicesModule.factory('LocationSrvc', function($location) {	
	return {
		goTo: function(url, recorderHash){
			//console.log(url, recorderHash);
            
            if (recorderHash && url.indexOf(":recorderHash") >= 0){
                url = url.replace(/:recorderHash/, '/recorder/' + recorderHash);
            }
            else{
	            url = url.replace(/:recorderHash/, '');
            }
			
			//console.log(url, recorderHash);
            $location.path(url);
    	}
    }
});
  
