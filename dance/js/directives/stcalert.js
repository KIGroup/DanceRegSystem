'use strict';
//sddddddd

directivesModule.directive('stcalert', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/stcalert.csp',
        
        scope: {
            data: '='
        },
        controller: function($scope, $timeout){           
           $scope.data = !$scope.data ? {visible: false} : $scope.data;
           
           $scope.close = function(){
	           $scope.data.visible = false;
               if ($scope.data.closeMethod) {
                    $scope.data.closeMethod();
               }
	       };
	        
	       $scope.$watch('data.visible', function(){
                if ($scope.data.visible && $scope.data.cssClass == 'alert alert-success'){
                    $timeout(function(){$scope.close()}, 2200);        
                }     
           });
	   	}
    }
});
