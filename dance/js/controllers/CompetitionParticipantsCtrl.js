'use strict';
// d
  
/*===========================================================================================
Competition Participants 
===========================================================================================*/

controllersModule.controller('CompetitionParticipantsCtrl', function($scope, $location, $routeParams, $filter, LocationSrvc, UtilsSrvc, CompetitionSrvc, ParticipantSrvc){
    $scope.menu.pages.selected = {};

    $scope.recorderHash = $routeParams.recorderHash || null;
    $scope.locationSrvc = LocationSrvc;     
        
    $scope.page = {};
    $scope.page.participantTable = {};

    if (!$scope.pageStore.participants) $scope.pageStore.participants = {grid:{}};

    
    if ($scope.pageStore.registration && $scope.pageStore.registration.tournament){
        $scope.page.competition = { tournament : $scope.pageStore.registration.tournament};
    }


    $scope.page.init = function(){
        //    
        // Participant table
        //   
        $scope.page.participantTable.columns = [ 
                          {name: 'Партнер / Партнерша', sqlName: 'FullName->Value', isSorted: true, isSortable: true, isDown: true, isSearched: true, isSearchable: true},
                          {name: 'Клуб / Город', sqlName: 'City', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: true},
                          {name: 'Класс ST, LA', sqlName: '', isSorted: false, isSortable: false, isDown: true, isSearched: false, isSearchable: false},
                          {name: 'Страна', sqlName: 'Country->Name->Value', isSorted: false, isSortable: true , isDown: true, isSearched: false, isSearchable: true},
                          {name: 'Статус', sqlName: 'TicketStatus', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '110px'}},
                          {name: 'Группы', sqlName: 'PrtObjCompetitionsCount', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '130px'}}];
        
        $scope.page.participantTable.properties = [ 
                          {name:'fullName',
                                                calculate: function(item){
                                                        if (item.couple){
                                                            item.competitionsLink = item.couple.competitionsCount +' »';

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
                                                            item.competitionsLink = item.athlete.competitionsCount +' »';

                                                            item.fullName = item.athlete.lastName + ' ' + item.athlete.firstName + '\n';

                                                            item.clubAndCity = item.athlete.otherInfo.club + '\n' + item.athlete.otherInfo.city;
                                                            item.trainers = item.athlete.otherInfo.mainTrainer + (item.athlete.otherInfo.otherTrainers=='' ? '' : (', ' + item.athlete.otherInfo.otherTrainers));
                                                            item.countryName = item.athlete.otherInfo.country.name;
                                                            
                                                            
                                                            item.classFullName = '';
                                                            if (item.athlete.laClass){
                                                                item.classFullName += 'La: ' + item.athlete.laClass.name + '. ';
                                                            }
                                                            if (item.athlete.stClass){
                                                                item.classFullName += 'St: ' + item.athlete.stClass.name + '.\n';
                                                            }
                                                        }
                                                    }},
                          {name:'clubAndCity'},
                          {name:'classFullName'}, 
                          {name:'countryName', cellStyle: {verticalAlign: 'middle'}},
                          {name:'ticketStatus.name', cellStyle: {textAlign: 'center', verticalAlign: 'middle'},
                                                getCssClass: function(item){
                                                    return $scope.page.participantTable.getCssClassForTicketStatus(item.ticketStatus.code);
                                                }},                    
                          {name:'competitionsLink', cellStyle: {textAlign: 'center', verticalAlign: 'middle'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список групп'),
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },
                                                onClickCell: function(item){
                                                    if (item.couple && item.couple.id){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.competition.tournament.id + '/couple/' + item.couple.id + '/competitions', $scope.recorderHash);
                                                    }    
                                                    else if (item.athlete && item.athlete.id){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.competition.tournament.id + '/athlete/' + item.athlete.id + '/competitions', $scope.recorderHash);
                                                    }
                                                    else if (item.couple && item.couple.key){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.competition.tournament.id + '/other/couple/' + item.couple.key + '/competitions', $scope.recorderHash);
                                                    }
                                                    else if (item.athlete && item.athlete.key){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + $scope.page.competition.tournament.id + '/other/athlete/' + item.athlete.key + '/competitions', $scope.recorderHash);
                                                    } 
                                                }}];

        $scope.page.participantTable.pageSize = 50;
        $scope.page.participantTable.pageCurr = 1;
        $scope.page.participantTable.itemsTotal = 0;
        $scope.page.participantTable.selectedItems = [];
        $scope.page.participantTable.multiSelectMode = false;
        $scope.page.participantTable.forciblyUpdate = 0;
    };



    // 
    $scope.page.participantTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        $scope.page.participantTable.itemsStatus = $filter('localize')('Идет загрузка данных...');

        ParticipantSrvc.getAllForCompetition(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {competitionId: $scope.page.competition.id}).then(
            function(data){
                data = data.children;
                $scope.page.participantTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.participantTable.itemsTotal = data.itemsTotal;
                $scope.page.participantTable.items = data.items;

                $scope.page.participantTable.itemsStatus = data.itemsTotal == 0 ? $filter('localize')('Нет данных.') : '';
            },
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                $scope.page.participantTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке данных.');
            });
    };

    $scope.page.participantTable.getCssClassForTicketStatus = function(code){
        switch(code){
            case 'Canceled':
                return 'cancelCouplePayment';
            case 'Not paid':
                return '';
            case 'Paid': 
                return 'paidCouplePayment';
        }

        return '';
    };

    $scope.page.participantTable.refresh = function(){ 
        $scope.page.participantTable.forciblyUpdate++; 
    };
     
    $scope.page.participantTable.onSelectCell = function(item, property){ 
        if (!item) return;

        property.onClickCell(item);
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
    
    /// Load Competition by ID
    $scope.page.loadCompetition = function(competitionId){
        CompetitionSrvc.getById(competitionId, '?loadTournament=1&loadTournamentFullName=1').then(
            function(data){
                $scope.page.competition = data;
                $scope.page.participantTable.refresh();
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };   

    
    $scope.page.init();
    $scope.page.loadCompetition($routeParams.competitionId);
});

