'use strict';
//ddd

/*===========================================================================================
 
===========================================================================================*/

controllersModule.controller('ImportPersonsCtrl', function($scope, $location, $filter, UtilsSrvc, PersonSrvc){
	$scope.menu.selectMenu($scope.menu.pages.import.childrens.persons);
	$scope.page = {};
  	
  	$scope.page.loadStats = function(){
        PersonSrvc.getStats().then(
            function(data){
                $scope.page.personStats = data;
            },
            function(data, status, headers, config){
                //$scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
    
    $scope.page.loadStats();
});

