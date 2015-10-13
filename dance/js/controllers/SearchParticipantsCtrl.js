'use strict';
//--dddd
  
/*===========================================================================================
Search Participants 
===========================================================================================*/

controllersModule.controller('SearchParticipantsCtrl', function($scope, $routeParams, $location, $filter, LocationSrvc, UtilsSrvc, TournamentSrvc, CompetitionSrvc, ParticipantSrvc){
    $scope.menu.pages.selected = $scope.menu.pages.searchprt;
    $scope.menu.shortMenu = $scope.menu.admin==false;
    
    $scope.recorderHash = $routeParams.recorderHash || null;
    $scope.locationSrvc = LocationSrvc; 
    
    $scope.participantTable = {};
    if (!$scope.pageStore.searchParticipants){
        $scope.pageStore.searchParticipants = {grid:{}};
    }
    
    $scope.init = function(){  
                                                    
        //    
        // Participant table
        //  
        $scope.participantTable.columns = [ 
                          {name: 'Партнер / Партнерша', sqlName: 'Created', isSorted: true, isSortable: true, isDown: false, isSearched: true, isSearchable: true},
                          {name: 'СТСР', sqlName: '-', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: false},                          
                          {name: 'WDSF', sqlName: '-', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: false},                          
                          {name: 'Клуб / Город', sqlName: '-', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: true},
                          {name: 'Статус', sqlName: 'PaymentStatus', isSorted: false, isSortable: false, isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '110px'}},
                          {name: 'Группы', sqlName: '-', isSorted: false, isSortable: false, isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '150px'}},
                          {name: 'Группа в турнире', sqlName: '-', isSorted: false, isSortable: false, isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center'}}/*,
                          {name: 'Турнир', sqlName: '-', isSorted: false, isSortable: false, isDown: true, isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center'}}*/];
        
        $scope.participantTable.properties = [ 
                          {name:'fullName',
                                            calculate: function(item){
                                                        item.competition.name = item.competition.name.replace(/Латиноамериканская программа/, 'La').replace(/Европейская программа/, 'St');
                                                        item.competition.fullName = $filter('localize')('Группа') + ': ' + "№" + item.competition.idExternal + ". "+ item.competition.name + ', ' + $filter('convertCacheDate')(item.competition.startDate, $filter('localize')('d MMMM y')) + '.\n' + 
                                                                                    $filter('localize')('Турнир') + ': ' + item.competition.tournament.name + ', ' + item.competition.tournament.location.cityName  + ' »';
                                                       
                                                       
                                                        //item.competition.fullName = "№" + item.competition.idExternal + '. ' + item.competition.name + '\n' + $filter('convertCacheDate')(item.competition.startDate, $filter('localize')('d MMMM y')) + ' »';
                                                        //item.competition.tournament.fullName = item.competition.tournament.name + '\n' + item.competition.tournament.location.cityName + ' »';
                                                      
                                                        if (item.couple){
                                                            item.competitionsLink = $filter('localize')('Группы пары') + ' (' + item.couple.competitionsCount + ') »';
                                                            item.fullName = item.couple.man.lastName + ' ' + item.couple.man.firstName;
                                                            item.fullName += '\n' + item.couple.woman.lastName + ' ' + item.couple.woman.firstName;

                                                            item.clubAndCity = item.couple.otherInfo.club + '\n' + item.couple.otherInfo.city;
                                                            item.trainers = item.couple.otherInfo.mainTrainer + (item.couple.otherInfo.otherTrainers=='' ? '' : (', ' + item.couple.otherInfo.otherTrainers));
                                                            item.countryName = item.couple.otherInfo.country.name;
                                                        }
                                                        else if (item.athlete){
                                                            item.competitionsLink = $filter('localize')('Группы участника') + ' (' + item.athlete.competitionsCount + ') »';
                                                            item.fullName = item.athlete.lastName + ' ' + item.athlete.firstName + '\n';

                                                            item.clubAndCity = item.athlete.otherInfo.club + '\n' + item.athlete.otherInfo.city;
                                                            item.trainers = item.athlete.otherInfo.mainTrainer + (item.athlete.otherInfo.otherTrainers=='' ? '' : (', ' + item.athlete.otherInfo.otherTrainers));
                                                            item.countryName = item.athlete.otherInfo.country.name;
                                                        }
                                                    }},
                          {name:'udsr',
                                        calculate: function(item){
                                                    $scope.participantTable.columns[1].hidden = $scope.menu.admin == false;   
                                                    $scope.participantTable.columns[2].hidden = $scope.menu.admin == false;   
                                                    
                                                    if (item.couple){
                                                        if (item.couple.type == "UDSR"){
                                                            if (item.couple.idWDSF){
                                                                item.wdsf = item.couple.man.numberWDSF + '\n' + item.couple.woman.numberWDSF;
                                                            }
                                                            item.udsr = item.couple.man.number + '\n' + item.couple.woman.number;
                                                        }
                                                        else if (item.couple.type == "WDSF"){
                                                            if (item.couple.idUDSR){
                                                                item.udsr = item.couple.man.numberUDSR + '\n' + item.couple.woman.numberUDSR;
                                                            }
                                                            item.wdsf = item.couple.man.number + '\n' + item.couple.woman.number;
                                                        }
                                                    }
                                                    else if (item.athlete){
                                                        item.wdsf = '-/-';
                                                        item.udsr = '-/-';
                                                    }
                                                }}, 
                          {name:'wdsf'}, 
                          {name:'clubAndCity'}, 
                          {name:'ticketStatus.name', 
                                                getCssClass: function(item){
                                                    return $scope.participantTable.getCssClassForTicketStatus(item.ticketStatus.code);
                                                },
                                                cellStyle: {textAlign: 'center', verticalAlign: 'middle'}},                    
                          {name:'competitionsLink', cellStyle: {textAlign: 'center', verticalAlign: 'middle'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список групп'),
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },
                                                onClickCell: function(item){
                                                    console.log(item)
                                                    if (item.couple && item.couple.id){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + item.competition.tournament.id + '/couple/' + item.couple.id + '/competitions', $scope.recorderHash);
                                                    }    
                                                    else if (item.athlete && item.athlete.id){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + item.competition.tournament.id + '/athlete/' + item.athlete.id + '/competitions', $scope.recorderHash);
                                                    }
                                                    else if (item.couple && item.couple.key){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + item.competition.tournament.id + '/other/couple/' + item.couple.key + '/competitions', $scope.recorderHash);
                                                    }
                                                    else if (item.athlete && item.athlete.key){
                                                        LocationSrvc.goTo(':recorderHash/tournament/' + item.competition.tournament.id + '/other/athlete/' + item.athlete.key + '/competitions', $scope.recorderHash);
                                                    }
                                                }}, 
                          {name:'competition.fullName', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список участников группы'),
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },  
                                                onClickCell: function(item){
                                                    LocationSrvc.goTo(":recorderHash/competition/" + item.competition.id +"/participants", $scope.recorderHash); 
                                                }}/*,
                          {name:'competition.tournament.fullName', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список участников турнира'),
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },  
                                                onClickCell: function(item){
                                                    LocationSrvc.goTo(":recorderHash/tournament/" + item.competition.tournament.id +"/participants", $scope.recorderHash); 
                                                }}*/];
 
        $scope.participantTable.pageSize = 15;
        $scope.participantTable.pageCurr = 1;
        $scope.participantTable.itemsTotal = 0;
        $scope.participantTable.selectedItems = [];
        $scope.participantTable.multiSelectMode = false;
        $scope.participantTable.forciblyUpdate = 0;
        
        $scope.participantTable.columns[1].hidden = true;   
        $scope.participantTable.columns[2].hidden = true;
         
        if ($scope.pageStore.searchParticipants.searchText){
            $scope.participantTable.refresh();    
        }
    };


    //     
    $scope.participantTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        $scope.participantTable.itemsStatus = $filter('localize')('Идет загрузка данных...');

        ParticipantSrvc.getAllForGrid(pageCurr, pageSize, sqlName, isDown, "FullName->Value", $scope.pageStore.searchParticipants.searchText, {loadTournamentName: true}).then(
            function(data){
                data = data.children;
                $scope.participantTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.participantTable.itemsTotal = data.itemsTotal;
                $scope.participantTable.items = data.items;

                $scope.participantTable.itemsStatus = data.itemsTotal == 0 ? $filter('localize')('Нет данных.') : '';
            },
            function(response){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', response.data, 'error', true);
                $scope.participantTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке данных.');
            });
    };
    
    $scope.participantTable.refresh = function(){ 
        $scope.participantTable.forciblyUpdate++; 
    };
   

    $scope.participantTable.onSelectCell = function(item, property){ 
        if (!item) return;

        property.onClickCell(item);
    };
    
    $scope.participantTable.getCssClassForTicketStatus = function(code){
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
    
    $scope.init();
});

