'use strict';
//dd d

/*===========================================================================================
Tournament: create or update data 
===========================================================================================*/

controllersModule.controller('TournamentCtrl', function($scope, $window, $routeParams, UtilsSrvc, OtherSrvc, TournamentSrvc, TournamentStatusSrvc, TournamentRankSrvc){
    
    $scope.page = {};
    $scope.menu.shortMenu = false;

    $scope.page.init = function(){
	    $scope.page.clear();

        if ($routeParams.id){
            $scope.page.accordionCaption = "Редактирование турнира";   
            $scope.page.btnSubmitCaption = "Сохранить";
            $scope.page.loadTournament($routeParams.id);
        }
        else{
            $scope.page.accordionCaption = "Создание турнира";
            $scope.page.btnSubmitCaption = "Создать";
        }
    };

    /// Clear tournament form
    $scope.page.clear = function(){
        var now = new Date();
        $scope.page.tournament = {idInternal: "I" + now.getTime().toString().substring(5,20),
                                  idExternal: "E" + now.getTime().toString().substring(5,20),
                                  hash: '-',
                                  rank: {}, 
                                  status: {}, 
                                  organizer:{},
                                  tabUDSRAllowed: '1',
        						  tabWDSFAllowed: '1',
        						  tabOtherAllowed: '1',
                                  location: {country:{}}};
    };
  
    /// Load Tournament by ID
    $scope.page.loadTournament = function(id){
        TournamentSrvc.getByIdAdmin(id, '?loadName=1&loadFullName=1&loadLocation=1&loadOrganizer=1&loadStatus=1&loadRank=1&loadUrls=1').then(
            function(data){
                $scope.page.tournament = data;
                $scope.page.tournament.tabUDSRAllowed = $scope.page.tournament.tabUDSRAllowed == 1 ? "1" : "0";
                $scope.page.tournament.tabWDSFAllowed = $scope.page.tournament.tabWDSFAllowed == 1 ? "1" : "0";
                $scope.page.tournament.tabOtherAllowed = $scope.page.tournament.tabOtherAllowed == 1 ? "1" : "0";
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Save Tournament or update data
    $scope.page.saveTournament = function(){
	    $scope.page.tournament.startDate = UtilsSrvc.getValidDate($scope.page.tournament.startDate);
	    $scope.page.tournament.endDate = UtilsSrvc.getValidDate($scope.page.tournament.endDate);
        $scope.page.tournament.ageCalcDate = UtilsSrvc.getValidDate($scope.page.tournament.ageCalcDate);
   		
   		if ($scope.page.tournament.endDate == "" || $scope.page.tournament.startDate == "")
   			return;
   
        TournamentSrvc.save($scope.page.tournament).then(
            function(data){
	            if ($scope.page.tournament.id){
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Изменения сохранены.', 'success', true);
                }
                else{
	                $scope.page.clear();
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Турнир создан.', 'success', true);   
                }

                $scope.form_tournament.$setPristine();
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
});
