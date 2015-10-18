'use strict';
//--dddddd
  
/*===========================================================================================
Tournament Participants 
===========================================================================================*/

controllersModule.controller('TournamentParticipantsCtrl', function($scope, $routeParams, $cookies, $location, $filter, ReportSrvc, UtilsSrvc, LocationSrvc, TournamentSrvc, CompetitionSrvc, ParticipantSrvc){
    $scope.menu.pages.selected = {};
    
    $scope.page = {};
    $scope.page.participantTable = {};
    $scope.pageStore.participants = {grid:{}};
    
    $scope.recorderHash = $routeParams.recorderHash || null;
    $scope.locationSrvc = LocationSrvc; 
     

    if ($scope.pageStore.registration && $scope.pageStore.registration.tournament && $scope.pageStore.registration.tournament.id == parseInt($routeParams.tournamentId)){
        $scope.page.tournament = $scope.pageStore.registration.tournament;
    }

    $scope.page.init = function(){
        //    
        // Participant table
        //  
        $scope.page.participantTable.columns = [ 
                          {name: 'Партнер / Партнерша', sqlName: 'FullName->Value', isSorted: true, isSortable: true, isDown: true, isSearched: true, isSearchable: true},
                          {name: 'Клуб / Город', sqlName: 'City,Club', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: true},
                          {name: 'Класс ST, LA', sqlName: '', isSorted: false, isSortable: false, isDown: true, isSearched: false, isSearchable: false},
                          {name: 'Страна', sqlName: 'Country->Name->Value', isSorted: false, isSortable: true , isDown: true, isSearched: false, isSearchable: true},
                          {name: 'Группы', sqlName: 'PrtObjCompetitionsCount', isSorted: false, isSortable: true , isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '160px'}},
                          {name: 'Оплачены', sqlName: 'PrtObjPaymentsCount', isSorted: false, isSortable: true , isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '160px'}}];
        
        $scope.page.participantTable.properties = [ 
                          {name:'fullName', 
                                            calculate: function(item){
                                                        item.competition.fullName = item.competition.name + '\n' + $filter('convertCacheDate')(item.competition.startDate, $filter('localize')('d MMMM y')) + ' »';
                                                       

                                                        if (item.couple){
                                                            item.competitionsLink = item.couple.competitionsCount + ' »';
                                                            item.paymentsCount = item.couple.paymentsCount;
                                                            item.fullName = item.couple.man.lastName + ' ' + item.couple.man.firstName;
                                                            item.fullName += '\n' + item.couple.woman.lastName + ' ' + item.couple.woman.firstName;

                                                            item.clubAndCity = item.couple.otherInfo.club + '\n' + item.couple.otherInfo.city;
                                                            item.trainers = item.couple.otherInfo.mainTrainer + (item.couple.otherInfo.otherTrainers=='' ? '' : (', ' + item.couple.otherInfo.otherTrainers));
                                                            item.countryName = item.couple.otherInfo.country.name;
                                                            
                                                            item.classFullName = '';
                                                            if (item.couple.man.stClass){
                                                                item.classFullName += item.couple.man.stClass.name + ', ';
                                                            }
                                                            if (item.couple.man.laClass){
                                                                item.classFullName += item.couple.man.laClass.name + '\n';
                                                            }
                                                            if (item.couple.woman.stClass){
                                                                item.classFullName += item.couple.woman.stClass.name + ', ';
                                                            }
                                                            if (item.couple.woman.laClass){
                                                                item.classFullName += item.couple.woman.laClass.name;
                                                            }
                                                        }
                                                        else if (item.athlete){
                                                            item.competitionsLink = item.athlete.competitionsCount + ' »';
                                                            item.paymentsCount = item.athlete.paymentsCount;
                                                            item.fullName = item.athlete.lastName + ' ' + item.athlete.firstName + '\n';

                                                            item.clubAndCity = item.athlete.otherInfo.club + '\n' + item.athlete.otherInfo.city;
                                                            item.trainers = item.athlete.otherInfo.mainTrainer + (item.athlete.otherInfo.otherTrainers=='' ? '' : (', ' + item.athlete.otherInfo.otherTrainers));
                                                            item.countryName = item.athlete.otherInfo.country.name;
                                                            
                                                            item.classFullName = '';
                                                            
                                                            if (item.athlete.stClass){
                                                                item.classFullName += item.athlete.stClass.name + ', ';
                                                            }
                                                            if (item.athlete.laClass){
                                                                item.classFullName += item.athlete.laClass.name;
                                                            }
                                                        }
                                            }},
                          {name:'clubAndCity'}, 
                          {name:'classFullName'}, 
                          {name:'countryName', cellStyle: {verticalAlign: 'middle'}},
                          
                          {name:'competitionsLink', cellStyle: {textAlign: 'center', verticalAlign: 'middle'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список групп'),
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },
                                                onClickCell: function(item){
                                                    $scope.openPrtCompetitions(item);                   
                                                }},
                          {name:'paymentsCount', cellStyle: {textAlign: 'center', verticalAlign: 'middle'}, cellTitle: $filter('localize')('Количество оплаченных групп')}];
 
        $scope.page.participantTable.pageSize = 50;
        $scope.page.participantTable.pageCurr = 1;
        $scope.page.participantTable.itemsTotal = 0;
        $scope.page.participantTable.selectedItems = [];
        $scope.page.participantTable.multiSelectMode = false;
        $scope.page.participantTable.forciblyUpdate = 0;
    };

    $scope.openPrtCompetitions = function(item){
        if (item.couple && item.couple.id){
            LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.tournament.id + '/couple/' + item.couple.id + '/competitions', $scope.recorderHash);
        }    
        else if (item.athlete && item.athlete.id){
            LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.tournament.id + '/athlete/' + item.athlete.id + '/competitions', $scope.recorderHash);
        }
        else if (item.couple && item.couple.key){
            LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.tournament.id + '/other/couple/' + item.couple.key + '/competitions', $scope.recorderHash);
        }
        else if (item.athlete && item.athlete.key){
            LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.tournament.id + '/other/athlete/' + item.athlete.key + '/competitions', $scope.recorderHash);
        } 
    };

    // 
    $scope.page.participantTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        $scope.page.participantTable.itemsStatus = $filter('localize')('Идет загрузка данных...');

        ParticipantSrvc.getAllForTournament(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {tournamentId: $scope.page.tournament.id}).then(
            function(data){
                data = data.children;
                $scope.page.participantTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.participantTable.itemsTotal = data.itemsTotal;
                $scope.page.participantTable.items = data.items;

                $scope.page.participantTable.itemsStatus = data.itemsTotal == 0 ? $filter('localize')('Нет данных.') : '';
            },
            function(response){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', response.data, 'error', true);
                $scope.page.participantTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке данных.');
            });
    };


    $scope.page.participantTable.remove = function(item){
        function remove(){
            ParticipantSrvc.removeById(item.id).then(
                function(data){
                    $scope.page.participantTable.selectedItems = [];
                    $scope.page.participantTable.refresh();
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Участник удален.', 'success', true);
                },
                function(data, status, headers, config){
                    $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        };

        var msg = '';
        if (item.couple){
            msg = item.couple.man.lastName + ' - ' + item.couple.woman.lastName;
        }
        else{
            msg = item.athlete.lastName + item.athlete.firstName;   
        }

        UtilsSrvc.openMessageBox('Удалить пару / участника из группы?', msg, remove);    
    };


    $scope.page.participantTable.refresh = function(){ 
        $scope.page.participantTable.forciblyUpdate++; 
    };
   

    $scope.page.participantTable.onSelectCell = function(item, property){ 
        if (!item) return;

        property.onClickCell(item);
    };
    
    $scope.page.participantTable.getCssClassForTicketStatus = function(code){
        switch(code){
            case 'Canceled':
                return 'cancelCouplePayment';
            case 'Not paid':
                return 'noneCouplePayment';
            case 'Paid': 
                return '';
        }

        return '';
    };
    
    /// Load Tournament by ID
    $scope.page.loadTournament = function(id){
        TournamentSrvc.getById(id, "?loadFullName=1&loadParticipantsCount=1&loadParticipantsUniqueCount=1&loadUrls=1").then(
            function(data){
                $scope.page.tournament = data;
                $scope.page.participantTable.refresh();
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
    
    $scope.exportParticipants = function(){
        ReportSrvc.tournamentParticipants($scope.page.tournament.id);
    };
    
    $scope.exportPayers = function(){
        ReportSrvc.tournamentPayers($scope.page.tournament.id);
    };

    $scope.page.init();
    $scope.page.loadTournament($routeParams.tournamentId);
});

