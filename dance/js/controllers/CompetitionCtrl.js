'use strict';
//dedddвв

/*===========================================================================================
Competition: create or update data 
===========================================================================================*/

controllersModule.controller('CompetitionCtrl', function($scope, $window, $routeParams, UtilsSrvc, TournamentSrvc, CompetitionSrvc, AgeCategorySrvc, DancerClassSrvc, DisciplineSrvc, OtherSrvc){
    $scope.menu.shortMenu = false;

    $scope.page = {};
    $scope.page.tournament = {rank: {}, 
                              status: {}, 
                              organizer:{},
                              location: {country:{}}};


    $scope.page.init = function(){
        $scope.page.clear();
        $scope.page.loadTournament($routeParams.tournamentId);
        
        if ($routeParams.competitionId){
            $scope.page.accordionCaption = "Редактирование группы";   
            $scope.page.btnSubmitCaption = "Сохранить";
            $scope.page.loadCompetition($routeParams.competitionId);
        }
        else{
            $scope.page.accordionCaption = "Создание группы";
            $scope.page.btnSubmitCaption = "Создать";
            $scope.page.loadDancerClasses();
        }
    };


    /// Clear form fields
    $scope.page.clear = function(){
       var now = new Date();
       $scope.page.competition = {idInternal: "I" + now.getTime().toString().substring(5,20),
                                  idExternal: "E" + now.getTime().toString().substring(5,20),
                                  startTime: '12:00', 
                                  discipline:{}, 
                                  ageCategory: {}, 
                                  dancerClasses: []};
    };


    /// Load Tournament by ID
    $scope.page.loadTournament = function(id){
        var filter = '?' +
            'loadName=1&' +
            'loadLocation=1&' +
            'loadOrganizer=1&' +
            'loadRank=1&' +
            'loadStatus=1&' +
            'loadParticipantsCount=1&' +
            'loadParticipantsUniqueCount=1&' +
            'loadCompetitionsCount=1';
            
        TournamentSrvc.getById(id, filter).then(
            function(data){
                $scope.page.tournament = data;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load competition regions
    $scope.loadCompetitionRegions = function(){
        OtherSrvc.getCompetitionRegions().then(
            function(data){
                var regions = data.children;
                
                for(var i=0; i < $scope.page.competition.regions.length; i++){
                    for(var j=0; j < regions.length; j++){
                        if ($scope.page.competition.regions[i].id == regions[j].id){
                            regions[j].selected = true;
                            break;
                        }
                    }
                }

                $scope.page.competition.regions = regions;
            },
            function(data, status, headers, config){
            });
    };
            
    /// Load Competition by ID
    $scope.page.loadCompetition = function(competitionId){
        var filter = '?' +
            'loadDiscipline=1&' +
            'loadAgeCategory=1&' +
            'loadDancerClasses=1&' +
            'loadType=1&' +
            'loadWDSF=1&' +
            'loadTournament=1&' +
            'loadTournamentLocation=1';
            
        CompetitionSrvc.getById(competitionId, filter).then(
            function(data){
                $scope.page.competition = data;
                $scope.page.competition.isInternational = $scope.page.competition.isInternational == 1;
                $scope.page.competition.isClosed = $scope.page.competition.isClosed == 1;
                $scope.page.competition.isWDSF = $scope.page.competition.isWDSF == 1;
                $scope.page.competition.udsrMaxNumberChecked = $scope.page.competition.udsrMaxNumberChecked == 1;
                $scope.page.loadDancerClasses();
                $scope.loadCompetitionRegions();
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load Dancer classes
    $scope.page.loadDancerClasses = function(){
        DancerClassSrvc.getAll().then(
            function(data){
                var allClasses = data.children;

                // mark all the classes that are in the exists competition
                for(var i=0; i < $scope.page.competition.dancerClasses.length; i++){
                    for(var j=0; j < allClasses.length; j++){
                        if ($scope.page.competition.dancerClasses[i].id == allClasses[j].id){
                            allClasses[j].selected = 1;
                            break;
                        }
                    }
                }

                $scope.page.competition.dancerClasses = allClasses;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

 
    /// Save Competition or update data
    $scope.page.saveCompetition = function(){
        $scope.page.competition.startDate = UtilsSrvc.getValidDate($scope.page.competition.startDate);
        
        if ($scope.page.competition.startDate == "")
            return;
        
        if ($scope.page.competition.dancerClasses){
            var oneExistsSelected = false;
            for (var i=0; i < $scope.page.competition.dancerClasses.length; i++){
                if ($scope.page.competition.dancerClasses[i].selected == 1){
                    oneExistsSelected = true;
                    break;
                }
            }
            
            if (!oneExistsSelected){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', 'Выберите хотя бы один класс танцора.', 'info', true);
                return;
            }
        }
        
             
        CompetitionSrvc.save($scope.page.tournament.id, $scope.page.competition).then(
            function(data){
                if ($scope.page.competition.id){
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Изменения сохранены.', 'success', true);
                }
                else{
                    $scope.page.clear();
                    $scope.page.loadDancerClasses();
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Группа создана.', 'success', true);   
                }

                $scope.form_competition.$setPristine();
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
