'use strict';
//

directivesModule.directive('danceplatOtherPay', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/danceplatOtherPay.csp',
        
        scope: {
            /* 
            trnId: '=',
            manNumberUdsr: '=',
            womanNumberUdsr: '=',
            competitionIdList: '=',
            hideAll: '=',
            btnName: '=' 
            */
            trnId: '=',

            maleAge: '=',
            femaleAge: '=',

            maleLastName: '=',
            femaleLastName: '=',
            
            maleFirstName: '=',
            femaleFirstName: '=',
            
            country: '=',
            city: '=',
            club: '=',
            trainer: '=',

            competitions: '=',
            hideAll: '=',
            btnName: '='              
        },
        controller: function($scope){
            
	   	}
    }
});
