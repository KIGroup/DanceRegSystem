'use strict';
//dedcd

/*===========================================================================================
Tournament: create or update data 
===========================================================================================*/

controllersModule.controller('TournamentCtrl', function($scope, $window, $routeParams, UtilsSrvc, TournamentSrvc, TournamentStatusSrvc, TournamentRankSrvc, TournamentClassSrvc){
    $scope.page = {};
    $scope.page.tournament = {class:{parent:{}}, rank: {}, status: {}};

    $scope.page.init = function(){
	    if ($routeParams.id){
            $scope.page.accordionCaption = "Редактирование данных турнира";   
            $scope.page.btnSubmitCaption = "Сохранить";
            $scope.page.loadTournament($routeParams.id);
        }
        else{
            $scope.page.accordionCaption = "Создание турнира";
            $scope.page.btnSubmitCaption = "Создать";
        }
    };

    /// Load Tournament by ID
    $scope.page.loadTournament = function(id){
        TournamentSrvc.getById(id).then(
            function(data){
                $scope.page.tournament = data;
                 $scope.page.loadTournamentClassChildrens(data.class.parent.id);
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load all Tournament Statuses for combobox
    $scope.page.loadTournamentStatuses = function(){
        TournamentStatusSrvc.getAll().then(
            function(data){
                $scope.page.statuses = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load all Tournament Classes for combobox
    $scope.page.loadTournamentClasses = function(){
        TournamentClassSrvc.getAll('null').then(
            function(data){
                $scope.page.classes = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load all childrens of selected Tournament Class in combobox
    $scope.page.loadTournamentClassChildrens = function(parentId){
        TournamentClassSrvc.getAll(parentId).then(
            function(data){
                $scope.page.classChildrens = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load all Tournament Ranks for combobox
    $scope.page.loadTournamentRanks = function(){
        TournamentRankSrvc.getAll().then(
            function(data){
                $scope.page.ranks = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Save Tournament or update data
    $scope.page.saveTournament = function(){
	    $scope.page.tournament.startDate = UtilsSrvc.getValidDate($scope.page.tournament.startDate);
	    $scope.page.tournament.endDate = UtilsSrvc.getValidDate($scope.page.tournament.endDate);
   		
   		if ($scope.page.tournament.endDate == "" || $scope.page.tournament.startDate == "")
   			return;
   
        TournamentSrvc.save($scope.page.tournament).then(
            function(data){
	            if ($scope.page.tournament.id){
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Изменения сохранены.', 'success', true);
                }
                else{
	                $scope.page.tournament = {class:{parent:{}}, rank: {}, status: {}};
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Турнир добавлен.', 'success', true);   
                }
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Cancel - go to previous page
    $scope.page.cancel = function(){
        $window.history.back();
    };

    
    $scope.page.init();
    $scope.page.loadTournamentStatuses();
    $scope.page.loadTournamentClasses();    
    $scope.page.loadTournamentRanks();    
});
