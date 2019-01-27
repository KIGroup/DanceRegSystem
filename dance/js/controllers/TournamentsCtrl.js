'use strict';
//-ddddc

/*===========================================================================================

===========================================================================================*/

controllersModule.controller('TournamentsCtrl', function($scope, $location, $filter, UtilsSrvc, TournamentSrvc, CompetitionSrvc, TournamentRankSrvc, TournamentStatusSrvc, ReportSrvc){
    $scope.menu.selectMenu($scope.menu.pages.tournaments);

    $scope.page = {};
    $scope.page.tournamentTable = {participantsInfo:{}};
    $scope.page.competitionTable = {filterDate: ''};

    if (!$scope.pageStore.tournaments){ 
        $scope.pageStore.tournaments = {
            gridTournaments:{}, 
            gridCompetitions:{filterDate: '', hideNumbersColumn : true}
        };
    }
    
    $scope.page.init = function(){
        //
        // Tournament table
        //
        $scope.page.tournamentTable.columns = [
                          {name: 'Название'         , sqlName: 'Name->Value'         , isSorted: false, isSortable: true,  isDown: true ,  isSearched: true,  isSearchable: true},
                          {name: 'Дата начала'      , sqlName: 'StartDate'           , isSorted: true , isSortable: true,  isDown: false,  isSearched: false, isSearchable: false, filter: 'date'},
                          {name: 'Дата окончания'   , sqlName: 'EndDate'             , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: false, filter: 'date'},
                          {name: 'Ранг'             , sqlName: 'TRank->Name->Value'  , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Статус'           , sqlName: 'TStatus->Name->Value', isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Группы'           , sqlName: 'CompetitionsCount'   , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '100px'}},
                          {name: 'Участники'        , sqlName: 'ParticipantsCount'   , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '100px'}},
                          {name: 'Регистрация'      , sqlName: ''                    , isSorted: false, isSortable: false, isDown: true ,  isSearched: false, isSearchable: false, captionStyle: {textAlign: 'center', width: '150px'}}];
        
        $scope.page.tournamentTable.properties = [
                          {name:'nameShorted', calculate: function(item){
                                                    var maxLen = 25;
                                                    if (item.name.length > maxLen){
                                                        item.nameShorted = item.name.substring(0,25) + '...';
                                                    }
                                                    else{
                                                        item.nameShorted = item.name;
                                                    }
                                               }}, 
                          {name:'startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y')},
                          {name:'endDate'  , filter: 'date', filterParam: $filter('localize')('d MMMM y')},
                          {name:'rank.shortName'},
                          {name:'status.name'},
                          {name:'competitionsCountString', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список групп'),
                                                calculate: function(item){
                                                    item.competitionsCountString = item.competitionsCount + ' »';
                                                }, 
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },  
                                                onClickCell: function(item){
                                                    $location.path("/tournament/" + item.id +"/competitions"); 
                                                }},
                          {name:'participantsCountString', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список участников'),
                                                calculate: function(item){
                                                    item.participantsCountString = item.participantsCount + ' »';
                                                },
                                                getCssClass: function(item){ 
                                                    return 'cellLink';
                                                },
                                                onClickCell: function(item){
                                                    $location.path("/tournament/" + item.id +"/participants"); 
                                                }},
                          {name:'registration', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Оформить регистрацию'),
                                                getCssClass: function(item){ 
                                                    if (item.status.code=='Registration')
                                                        return 'cellLink';

                                                    return 'cellLinkDisabled';
                                                }, 
                                                calculate: function(item){
                                                    item.registration = $filter('localize')('Оформить »');
                                                },
                                                onClickCell: function(item){
                                                    if (item.status.code != 'Registration')
                                                        return;
                                                    
                                                    TournamentSrvc.getRecordersHashes(item.id).then(
                                                        function(data){
                                                            $scope.confirmDialog = {
                                                                tournament: item,
                                                                recorders: data.recorders,
                                                                defaultType: item.defaultActiveTabCode,
                                                                getLink: function(rec){
                                                                    var url = '#/recorder/' + rec.hash + '/tournament/' + this.tournament.id + '/registration';
                                                                    if (this.defaultType)
                                                                        url += '/type/' + this.defaultType;
                                                                    if (this.defaultLang)
                                                                        url += '/lang/' + this.defaultLang; 
                                                                    
                                                                    return url;
                                                                }
                                                            }

                                                            $('#ConfirmDialog').modal('show');
                                                            $scope.confirmDialog.visible = true;
                                                        },
                                                        function(data){
                                                            alert('Ошибка');
                                                            console.log(data);
                                                        });
                                                }}]; 

        $scope.page.tournamentTable.pageSize = UtilsSrvc.getPropertyValue($scope.pageStore, 'tournaments.gridTournaments.pageSize', 10);
        $scope.page.tournamentTable.pageCurr = UtilsSrvc.getPropertyValue($scope.pageStore, 'tournaments.gridTournaments.pageCurr', 1);
        $scope.page.tournamentTable.itemsTotal = 0;
        $scope.page.tournamentTable.selectedItems = [];
        $scope.page.tournamentTable.multiSelectMode = false;
        $scope.page.tournamentTable.forciblyUpdate = 0;
        $scope.page.tournamentTable.refresh();
        
        $scope.$watch('menu.admin', function(){
            $scope.page.tournamentTable.columns[7].hidden = !$scope.menu.admin;   
        });
        
        // 
        // Competition table
        //
        $scope.page.competitionTable.columns = [
                          {name: '#', sqlName: '%EXACT(idExternal)', isSorted: true , isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: {width: '30px'}},
                          {name: 'Дата'             , sqlName: 'StartDate'               , isSorted: true , isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: { width: '130px'}},
                          {name: 'Название'         , sqlName: 'Name->Value'             , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false},
                          {name: 'Программа'        , sqlName: 'Discipline->Name->Value' , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false},
                          {name: 'Возрастная группа', sqlName: 'AgeCategory'             , isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false},
                          {name: 'Класс'            , sqlName: ''                        , isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false},
                          {name: 'Цена, р.'             , sqlName: 'Price'                   , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'right', width: '100px'}},
                          {name: 'Участники'        , sqlName: 'ParticipantsCount'       , isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center', width: '100px'}}];
        
        var getCssClassFuncForClosedCompetitions = function(item){
            return item.isClosed == 1 ? 'competitionIsClosed' : '';
        };
         
        $scope.page.competitionTable.properties = [
                          {name:'idExternal', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y')},
                          {name:'fullName', 
                            calculate: function(item){
                                item.fullName = item.name + (item.isClosed == 1 ? (' (' + $filter('localize')('Регистрация закрыта') + ')') : '');
                            }},   
                          {name:'discipline.name'},
                          {name:'ageCategory.name'},
                          {name:'dancerClassesString', calculate: function(item){
                                                            item.dancerClassesString = '';

                                                            if (item.isForAllDancerClasses){
                                                                item.dancerClassesString = $filter('localize')('Все классы');
                                                                return;
                                                            }

                                                            for(var i=0; i < item.dancerClasses.length; i++){
                                                                item.dancerClassesString = item.dancerClassesString + ', ' + item.dancerClasses[i].name;
                                                            }

                                                            item.dancerClassesString = item.dancerClassesString.substring(2, item.dancerClassesString.length);
                                                        }},
                          {name:'price', cellStyle: {textAlign: 'right'}},
                          {name:'participantsCountString', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список участников'), 
                                                    calculate: function(item){
                                                        item.participantsCountString = item.participantsCount + ' »';
                                                    },
                                                    getCssClass: function(item){ 
                                                        return 'cellLink';
                                                    },
                                                    onClickCell: function(id){
                                                        $location.path("/competition/" + id +"/participants"); 
                                                    }}]; 

        $scope.page.competitionTable.pageSize = UtilsSrvc.getPropertyValue($scope.pageStore, 'tournaments.gridCompetition.pageSize', 250);
        $scope.page.competitionTable.pageCurr = UtilsSrvc.getPropertyValue($scope.pageStore, 'tournaments.gridCompetition.pageCurr', 1);
        $scope.page.competitionTable.itemsTotal = 0;
        $scope.page.competitionTable.selectedItems = [];
        $scope.page.competitionTable.multiSelectMode = false;
        $scope.page.competitionTable.forciblyUpdate = 0;
    
        $scope.pageStore.tournaments.gridCompetitions.tableShortView = $scope.pageStore.tournaments.gridCompetitions.tableShortView == null ? true : $scope.pageStore.tournaments.gridCompetitions.tableShortView;
        
        if ($scope.pageStore.tournaments.gridCompetitions.tableShortView){
            $scope.page.competitionTable.setHiddenCoulumns(true);
        }
        else{
            $scope.page.competitionTable.setHiddenCoulumns(false);
        }        
        
    };

    // 
    $scope.page.tournamentTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        TournamentSrvc.getAllForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {rankId: $scope.pageStore.tournaments.gridTournaments.filterRankId, statusId: $scope.pageStore.tournaments.gridTournaments.filterStatusId}).then(
            function(data){
                data = data.children;
                $scope.page.tournamentTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.tournamentTable.itemsTotal = data.itemsTotal;
                $scope.page.tournamentTable.items = data.items;

                if ($scope.page.tournamentTable.selectedItems && $scope.page.tournamentTable.items && $scope.page.tournamentTable.selectedItems.length == 0 && $scope.page.tournamentTable.items.length != 0){
                    var selected = $scope.page.tournamentTable.items[0];

                    if ($scope.pageStore.tournaments.gridTournaments.selectedId){
                        for(var i=0; i < data.items.length; i++){
                            if ($scope.pageStore.tournaments.gridTournaments.selectedId == data.items[i].id){
                                var selected = data.items[i];
                                break;                                
                            }
                        }   
                    } 

                    selected.rowClass = 'success';
                    $scope.page.tournamentTable.selectedItems = [selected]; 
                    $scope.page.tournamentTable.onSelect(selected);
                    console.log('tournament found');
                }
                else{
                    console.log('tournament not found');
                    
                }
            },
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    $scope.page.tournamentTable.refresh = function(){ 
        $scope.page.tournamentTable.forciblyUpdate++; 
    };

    $scope.page.tournamentTable.add = function(){
        $location.path("/tournament"); 
    };

    $scope.page.tournamentTable.edit = function(item){
        $location.path("/tournament/" +  item.id); 
    };

    $scope.page.tournamentTable.remove = function(item){
        function remove(){
            TournamentSrvc.removeById(item.id).then(
                function(data){
                    $scope.page.tournamentTable.selectedItems = [];
                    $scope.page.tournamentTable.refresh();
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Турнамент удален.', 'success', true);
                },
                function(data, status, headers, config){
                    $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        };

        UtilsSrvc.openMessageBox('Удалить турнир?', item.name, remove);    
    };
    
 
    $scope.page.tournamentTable.onSelect = function(item){
        if (!item){
            $scope.pageStore.tournaments.gridTournaments.selectedId = null;            
            return;
        }

        $scope.page.competitionTable.refresh();
        $scope.page.competitionTable.loadDates(item.id);
        //$scope.pageStore.tournaments.gridCompetitions = {filterDate: ''};
        $scope.pageStore.tournaments.gridTournaments.selectedId = item.id;        
    };

    $scope.page.tournamentTable.onSelectCell = function(item, property){
        if (!item) return;

        property.onClickCell(item);
    };

    $scope.page.tournamentTable.checkIn = function(item){
        $location.path("/registration/" + item.id); 
    };

    /// Load all Tournament Statuses for combobox
    $scope.page.loadTournamentStatuses = function(){
        TournamentStatusSrvc.getAll().then(
            function(data){
                $scope.page.tournamentTable.statuses = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load all Tournament Ranks for combobox
    $scope.page.loadTournamentRanks = function(){
        TournamentRankSrvc.getAll().then(
            function(data){
                $scope.page.tournamentTable.ranks = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
       

    // 
    $scope.page.competitionTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        if ($scope.page.tournamentTable.selectedItems.length == 0)
            return;
        
        var convertParams = {
            loadParticipantsCount: true
        };
        
        if (!$scope.pageStore.tournaments.gridCompetitions.tableShortView){
            convertParams.loadTournament = true;
            convertParams.loadDiscipline = true;
            convertParams.loadAgeCategory = true;
            convertParams.loadType = true;
            convertParams.loadDancerClasses = true;
            convertParams.tournamentParams = {};
        }
       
        CompetitionSrvc.getAllForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {date: $scope.pageStore.tournaments.gridCompetitions.filterDate, tournamentId: $scope.page.tournamentTable.selectedItems[0].id, convertParams: convertParams, showClosed: true}).then(
            function(data){
                data = data.children;
                $scope.page.competitionTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.competitionTable.itemsTotal = data.itemsTotal;
                $scope.page.competitionTable.items = data.items;

                if ($scope.page.competitionTable.selectedItems && $scope.page.competitionTable.items && $scope.page.competitionTable.selectedItems.length == 0 && $scope.page.competitionTable.items.length != 0){
                    var selected = $scope.page.competitionTable.items[0];

                    if ($scope.pageStore.tournaments.gridCompetitions.selectedId){
                        for(var i=0; i < data.items.length; i++){
                            if ($scope.pageStore.tournaments.gridCompetitions.selectedId == data.items[i].id){
                                var selected = data.items[i];
                                break;                                
                            }
                        }
                    }    

                    selected.rowClass = 'success';
                    $scope.page.competitionTable.selectedItems = [selected];
                    $scope.page.competitionTable.onSelect(selected);
                }
            },
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.page.competitionTable.setHiddenCoulumns = function(value){
        var indexes = [3,4,5];
        for(var n=0; n < indexes.length; n++){
            $scope.page.competitionTable.columns[indexes[n]].hidden = value;     
        }
        
        $scope.pageStore.tournaments.gridCompetitions.tableShortView = value;
        $scope.page.competitionTable.refresh();
    };


    $scope.page.competitionTable.onSelect = function(item){
        if (!item){
            $scope.pageStore.tournaments.gridCompetitions.selectedId = null;            
            return;
        }

        $scope.pageStore.tournaments.gridCompetitions.selectedId = item.id;        
    };
 
    $scope.page.competitionTable.onSelectCell = function(item, property){ 
        if (!item) return;

        property.onClickCell(item.id);
    };

    $scope.page.competitionTable.refresh = function(){ 
        $scope.page.competitionTable.forciblyUpdate++; 
    };

    $scope.page.competitionTable.import = function(){
        $location.path("/tournament/" + $scope.page.tournamentTable.selectedItems[0].id + "/importcompetitions"); 
    };

    $scope.page.competitionTable.add = function(){
        $location.path("/tournament/" + $scope.page.tournamentTable.selectedItems[0].id + "/competition"); 
    };

    $scope.page.competitionTable.edit = function(item){
        $location.path("/tournament/" + $scope.page.tournamentTable.selectedItems[0].id + "/competition/" + item.id); 
    };

    $scope.page.competitionTable.remove = function(item){
        function remove(){
            CompetitionSrvc.removeById(item.id).then(
                function(data){
                    $scope.page.competitionTable.selectedItems = [];
                    $scope.page.competitionTable.refresh();
                    $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Группа удалена.', 'success', true);
                },
                function(data, status, headers, config){
                    $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        };

        UtilsSrvc.openMessageBox('Удалить группу?', item.name, remove);  
    };
    
    $scope.page.competitionTable.open = function(item){
        $location.path("/competition/" + item.id + "/participants"); 
    };

    /// 
    $scope.page.competitionTable.loadDates = function(tournamentId){
        CompetitionSrvc.getDates(tournamentId).then(
            function(data){
                $scope.pageStore.tournaments.gridCompetitions.filterDate = '';
                $scope.page.competitionTable.dates = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    $scope.page.competitionTable.changeDateFilter = function(date){
        $scope.pageStore.tournaments.gridCompetitions.filterDate = date;
        $scope.page.competitionTable.refresh();
    };  

    $scope.page.competitionTable.export = function(){
        ReportSrvc.tournamentCompetitions($scope.page.tournamentTable.selectedItems[0].id);
    };  


    $scope.page.init();
    $scope.page.loadTournamentStatuses();
    $scope.page.loadTournamentRanks();
});

