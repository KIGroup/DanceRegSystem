'use strict';
//df

directivesModule.directive('danceplatUdsrPay', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/danceplatUDSRPay.csp',
        
        scope: {
            trnId: '=',
            manNumberUdsr: '=',
            womanNumberUdsr: '=',
            competitions: '=',
            hideAll: '=',
            btnName: '='           
        },
        controller: function($scope){
            
	   	}
    }
});
