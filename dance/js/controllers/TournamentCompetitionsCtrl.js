'use strict';
//ddc вdd dddd

/*===========================================================================================
Tournament Competitions
===========================================================================================*/

controllersModule.controller('TournamentCompetitionsCtrl', function($scope, $interval, $routeParams, $timeout, $location, $filter, UtilsSrvc, LocationSrvc, TournamentSrvc, CompetitionSrvc, TournamentRankSrvc, TournamentStatusSrvc){
    $scope.menu.pages.selected = {};

    $scope.page = {};
    $scope.page.competitionTable = {filterDate: ''};
    
    $scope.recorderHash = $routeParams.recorderHash || null;
    $scope.locationSrvc = LocationSrvc; 
    
    if (!$scope.pageStore.tournamentDetails) 
        $scope.pageStore.tournamentDetails = {gridCompetitions:{filterDate: '', hideNumbersColumn: true}};


    if ($scope.pageStore.registration && $scope.pageStore.registration.tournament && $scope.pageStore.registration.tournament.id == parseInt($routeParams.id)){
        $scope.page.tournament = $scope.pageStore.registration.tournament;
    }

    var intervalForTable = null;
 
    $scope.page.init = function(){
        // 
        // Competition table
        //
        $scope.page.competitionTable.columns = [
                          {id: "Number", name: '#', sqlName: '%EXACT(idExternal)', isSorted: true , isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: {width: '30px'}},
                          {id: "Date", name: 'Дата', sqlName: 'StartDate', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: {width: '130px'}},
                          /*{name: 'Время', sqlName: 'StartTime', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {width: '70px'}},*/
                          {id: "Name", name: 'Название', sqlName: 'Name->Value', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: "Discipline", name: 'Программа', sqlName: 'Discipline->Name->Value', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: "AgeGroup", name: 'Возр. группа' , sqlName: 'AgeCategory', isSorted: false, isSortable: true, isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: "Class", name: 'Класс', sqlName: '', isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: "Price", name: 'Цена', sqlName: 'Price', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'right', width: '80px'}},
                          {id: "PrtCount", name: 'Участники', sqlName: 'ParticipantsCount', isSorted: false, isSortable: true, isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center', width: '100px'}},
                          {id: "PayCount", name: 'Оплачено', sqlName: 'PaymentsCount', isSorted: false, isSortable: true, isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center', width: '100px'}},
                          {id: "Limit", name: 'Лимит', sqlName: 'Limit', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {width: '70px', textAlign: 'center'}},
                          {id: "FreeCount", name: 'Осталось мест', sqlName: '', isSorted: false, isSortable: false, isDown: true,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center'}, hidden: true}];
        
        var getCssClassFuncForClosedCompetitions = function(item){
            return item.isClosed == 1 ? 'competitionIsClosed' : '';
        };
        
        $scope.page.competitionTable.properties = [
                          {name:'idExternal', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y'), getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'fullName', 
                            calculate: function(item){
                                item.fullName = item.name + (item.isClosed == 1 ? (' (' + $filter('localize')('Регистрация закрыта') + ')') : '');
                            }},   
                          {name:'discipline.name', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'ageCategory.name', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'dancerClassesString', getCssClass: getCssClassFuncForClosedCompetitions,
                                                    calculate: function(item){
                                                            item.dancerClassesString = '';
                                                            for(var i=0; i < item.dancerClasses.length; i++){
                                                                item.dancerClassesString = item.dancerClassesString + ', ' + item.dancerClasses[i].name;
                                                            }

                                                            item.dancerClassesString = item.dancerClassesString.substring(2, item.dancerClassesString.length);
                                                    }},
                          {name:'price', cellStyle: {textAlign: 'right'}, getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'participantsCountString', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Открыть список участников группы'),  
                                                    calculate: function(item){
                                                        item.participantsCountString = item.participantsCount + ' »';
                                                    },
                                                    getCssClass: function(item){ 
                                                        return 'cellLink';
                                                    },
                                                    onClickCell: function(id){
                                                        LocationSrvc.goTo(":recorderHash/competition/" + id +"/participants", $scope.recorderHash); 
                                                    }},
                          {name:'paymentsCount', cellStyle: {textAlign: 'center'}, cellSelectable: true, cellTitle: $filter('localize')('Количество оплативших участников')}, 
                          {name:'limitString', cellStyle: {textAlign: 'center'}, cellTitle: $filter('localize')('Количество доступных мест'), getCssClass: getCssClassFuncForClosedCompetitions, 
                                                    calculate: function(item){
                                                        item.limitString = item.limit == 0 ? '---' : item.limit;
                                                    }},
                          {name:'freeSlotsCountString', cellStyle: {textAlign: 'center'}, cellTitle: $filter('localize')('Количество доступных мест'),
                                                    calculate: function(item){
                                                        item.freeSlotsCountString = item.freeSlotsCount >= 10000 ? '---' : item.freeSlotsCount;
                                                    },
                                                    getCssClass: function(item){ 
                                                        if (item.freeSlotsCount <= 5)
                                                            return 'competitionFreeSlotsCellWarning';
                                                        
                                                        if (item.isClosed == 1) {
                                                            console.log(item);
                                                            return 'competitionIsClosed';
                                                        }
                                                            
                                                        return '';
                                                    }}];  

        $scope.page.competitionTable.pageSize = 500;
        $scope.page.competitionTable.pageCurr = 1;
        $scope.page.competitionTable.itemsTotal = 0;
        $scope.page.competitionTable.selectedItems = [];
        $scope.page.competitionTable.multiSelectMode = false;
        $scope.page.competitionTable.forciblyUpdate = 0;
        $scope.page.competitionTable.refresh();

        $scope.pageStore.tournamentDetails.gridCompetitions.tableShortView = $scope.pageStore.tournamentDetails.gridCompetitions.tableShortView == null ? true : $scope.pageStore.tournamentDetails.gridCompetitions.tableShortView;
        
        if ($scope.pageStore.tournamentDetails.gridCompetitions.tableShortView){
            $scope.page.competitionTable.setHiddenCoulumns(true);
        }
        else{      
            $scope.page.competitionTable.setHiddenCoulumns(false);
        }    
    };


    // 
    $scope.page.competitionTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        $scope.page.competitionTable.itemsStatus = $filter('localize')('Идет загрузка данных...');
        
        var convertParams = {
            loadParticipantsCount: true,
            loadPaymentsCount: true,
            loadWDSF: true 
        };
        
        if ($scope.pageStore.tournamentDetails.gridCompetitions.tableShortView){
            $('#divTypeOfView').hide();  
        }
        else{
            $('#divTableCmpButtons,#divTableCmpStatus').css('width', '100%');
            convertParams.loadTournament = true;
            convertParams.loadDiscipline = true;
            convertParams.loadAgeCategory = true;
            convertParams.loadType = true;
            convertParams.loadDancerClasses = true;
            convertParams.tournamentParams = {};
        }
        
        CompetitionSrvc.getAllForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {
                                date: $scope.pageStore.tournamentDetails.gridCompetitions.filterDate, 
                                tournamentId: $routeParams.id,
                                convertParams: convertParams
                            }).then(
            function(data){
                data = data.children;
                $scope.page.competitionTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.competitionTable.itemsTotal = data.itemsTotal;
                $scope.page.competitionTable.items = data.items;

                if ($scope.page.competitionTable.selectedItems && $scope.page.competitionTable.items && $scope.page.competitionTable.selectedItems.length == 0 && $scope.page.competitionTable.items.length != 0){
                    var selected = $scope.page.competitionTable.items[0];
                    selected.rowClass = 'success';
                    $scope.page.competitionTable.selectedItems = [selected];
                }

                $scope.page.competitionTable.itemsStatus = data.itemsTotal == 0 ? $filter('localize')('Нет данных.') : '';
                
                if ($scope.pageStore.tournamentDetails.gridCompetitions.tableShortView){
                    $interval.cancel(intervalForTable);
                    intervalForTable = $interval(function() {
                        console.log('interval!');
                        var tableWidth = $('#tableCmp').css('width');
                        if (tableWidth != '0px'){
                            $('#divTableCmpButtons,#divTableCmpStatus').css('width', tableWidth);
                            $('#divTypeOfView').show();
                        }
                    }, 100, 50);
                }   
            },
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                $scope.page.competitionTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке данных.');
            });
    };

    $scope.page.competitionTable.setHiddenCoulumns = function(value){
        var columns = ["Discipline", "AgeGroup", "Class", "Price", "Limit"];
        for(var n=0; n < $scope.page.competitionTable.columns.length; n++){
            var curColumn = $scope.page.competitionTable.columns[n];
            if (columns.indexOf(curColumn.id) != -1)
                curColumn.hidden = value;     
        }
        
        if (value){
            $scope.pageStore.tournamentDetails.gridStyle = {width: 'initial'};
        }
        else{
            $scope.pageStore.tournamentDetails.gridStyle = {width: '100%'};
        }

        $scope.pageStore.tournamentDetails.gridCompetitions.tableShortView = value;
        $scope.page.competitionTable.refresh();
    };
    
    $scope.page.competitionTable.onSelect = function(item){
        if (!item)  return;
    };

    $scope.page.competitionTable.onSelectCell = function(item, property){ 
        if (!item) return;

        property.onClickCell(item.id);
    };
 
    $scope.page.competitionTable.refresh = function(){ 
        $scope.page.competitionTable.forciblyUpdate++; 
    };

    $scope.page.competitionTable.import = function(){
        $location.path("/tournament/" + $routeParams.id + "/importcompetitions"); 
    };

    $scope.page.competitionTable.add = function(){
        $location.path("/tournament/" + $routeParams.id + "/competition"); 
    };

    $scope.page.competitionTable.edit = function(item){
        $location.path("/tournament/" + $routeParams.id + "/competition/" + item.id); 
    };

    $scope.page.competitionTable.remove = function(item){
         alert('remove competition');
    };
    
    $scope.page.competitionTable.open = function(item){
        $location.path("/competition/" + item.id + "/participants"); 
    };

    /// 
    $scope.page.competitionTable.loadDates = function(tournamentId){
        CompetitionSrvc.getDates(tournamentId).then(
            function(data){
                $scope.pageStore.tournamentDetails.gridCompetitions.filterDate = '';
                $scope.page.competitionTable.dates = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    $scope.page.competitionTable.changeDateFilter = function(date){
        $scope.pageStore.tournamentDetails.gridCompetitions.filterDate = date;
        $scope.page.competitionTable.refresh();
    };  

    /// Load Tournament by ID
    $scope.page.loadTournament = function(id){
        TournamentSrvc.getById(id, "?loadFullName=1&loadParticipantsCount=1&loadParticipantsUniqueCount=1&loadPaymentsCount=1&loadUrls=1").then(
            function(data){
                $scope.page.tournament = data;
                $scope.page.tournament.isContainsLimit = data.isContainsLimit == 1;
                
                for(var n=0; n < $scope.page.competitionTable.columns.length; n++){
                    var curColumn = $scope.page.competitionTable.columns[n];
                    if (curColumn.id == "FreeCount"){
                        curColumn.hidden = !data.isContainsLimit;     
                    }
                }
                
                
                var idxColPrice = UtilsSrvc.getIndexes($scope.page.competitionTable.columns, 'id', 'Price');
                if (idxColPrice.length != 0){ 
                    var colName = $filter('localize')('Цена') + ', ' + UtilsSrvc.getCurrencySignByISOCode(data.currency.id);
                    $scope.page.competitionTable.columns[idxColPrice[0]].name = colName;
                }
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load participants count for tournament
    $scope.page.loadParticipantsCount = function(id){
        TournamentSrvc.getParticipantsCountById(id).then(
            function(data){
                $scope.page.participantsInfo = {total: data.participantsCount, unique: data.participantsUniqueCount};
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    $scope.page.init();
    $scope.page.loadTournament($routeParams.id);
    $scope.page.competitionTable.loadDates($routeParams.id);
    
    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        $interval.cancel(intervalForTable);
    });
});

