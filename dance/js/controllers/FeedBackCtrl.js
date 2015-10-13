'use strict';
//ssd

/*===========================================================================================
===========================================================================================*/

controllersModule.controller('FeedBackCtrl', function($scope, FeedBackSrvc, UtilsSrvc){
    $scope.menu.pages.selected = $scope.menu.pages.feedback;
    
    $scope.page = {};
    $scope.page.fb = {};

    $scope.page.createFeedBack = function(){
        FeedBackSrvc.create($scope.page.fb).then(
            function(data){
                $scope.page.clearForm();                 
                $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Ваше сообщение принято.', 'info', true);
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.page.clearForm = function(){
        $scope.page.fb = {};        
        $scope.form_feedback.$setPristine();
    };


});

