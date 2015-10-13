'use strict';
//   
 
/*===========================================================================================
Import competitions from XML to the tournament
===========================================================================================*/

controllersModule.controller('ImportCompetitionsCtrl', function($scope, $window, $routeParams, $filter, UtilsSrvc, TournamentSrvc, DisciplineSrvc, AgeCategorySrvc, ImportSrvc, CompetitionSrvc){
	$scope.menu.selectMenu($scope.menu.pages.import.childrens.competitions);

    $scope.page = {filter:{}};
    $scope.page.tournament = {};
    $scope.page.competitionTable = {};

    if (!$scope.pageStore.importcompetitions) $scope.pageStore.importcompetitions = {grid:{}};

    $scope.page.init = function(){
        //
        // Competition table
        // 
        $scope.page.competitionTable.columns = [
                          {name: 'Id/IdExt'   , sqlName: 'IdInternal', isSorted: true, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Название'   , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Дата'       , sqlName: ''         , isSorted: false, isSortable: false , isDown: true ,  isSearched: false, isSearchable: false, filter: 'date'},
                          {name: 'Цена, р.'       , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false, captionStyle: {textAlign: 'right'}},
                          {name: 'Программа' , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Возр. гр.'  , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Класс'      , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Тип'        , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false},
                          {name: 'Макс.'      , sqlName: ''         , isSorted: false, isSortable: false,  isDown: true ,  isSearched: false, isSearchable: false}];
        
        $scope.page.competitionTable.properties = [ 
                          {name:'idAndIdExt', calculate: function(item){
                                                        item.idAndIdExt = item.idInternal + '/' + item.idExternal;
                                                    }},
                          {name:'name'}, 
                          {name:'startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y')},
                          {name:'price'}, 
                          {name:'discipline.name'},
                          {name:'ageCategory.name'},
                          {name:'dancerClassesString', calculate: function(item){ 
                                                            item.dancerClassesString = "";
                                                            for(var i=0; i < item.dancerClasses.length; i++){
                                                                if (!item.dancerClasses[i].selected)
                                                                    continue;
                                                                item.dancerClassesString += ', ' + item.dancerClasses[i].name;
                                                            }
                                                            
                                                            item.dancerClassesString = item.dancerClassesString.substring(2, item.dancerClassesString.length);
                                                       }},
                          {name:'type.name'},
                          {name:'limit'}];

        $scope.page.competitionTable.pageSize = 500;
        $scope.page.competitionTable.pageCurr = 1;
        $scope.page.competitionTable.itemsTotal = 0;
        $scope.page.competitionTable.selectedItems = [];
        $scope.page.competitionTable.multiSelectMode = false;
        $scope.page.competitionTable.isFirstLoad = true;
        $scope.page.competitionTable.forciblyUpdate = 0;
    };


    /// Load Tournament by ID
    $scope.page.loadTournament = function(id){
        TournamentSrvc.getById(id).then(
            function(data){
                $scope.page.tournament = data;
                $scope.page.competitionTable.isFirstLoad = true;
                $scope.page.loadLink(data.id);
                $scope.page.competitionTable.refresh();
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    // 
    $scope.page.competitionTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        ImportSrvc.getAllCompetitionsForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {isFirstLoad: $scope.page.competitionTable.isFirstLoad, tournamentId: $scope.page.tournament.id}).then(
            function(data){
                data = data.children;
                $scope.page.competitionTable.itemsErroredTotal = 0;
                $scope.page.competitionTable.itemsExistedTotal = 0;
                
                for(var i=0; i < data.items.length; i++){
                    if (data.items[i].info && data.items[i].info.isExisted){
                        data.items[i].rowClass = "existsItem";
                        $scope.page.competitionTable.itemsExistedTotal++;
                    }
                    else if (data.items[i].info && data.items[i].info.isErrored){
                        data.items[i].rowClass = "errorItem";
                        $scope.page.competitionTable.itemsErroredTotal++;
                    }
                }

                $scope.page.competitionTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.competitionTable.itemsTotal = data.itemsTotal;
                $scope.page.competitionTable.items = data.items;

                $scope.page.competitionTable.isFirstLoad = false;
            },
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
    
    $scope.page.competitionTable.refresh = function(){ 
        $scope.page.competitionTable.forciblyUpdate++; 
    };

    /// Open dialog for editing competition 
    $scope.page.competitionTable.edit = function(item){
        if (item.info.isExisted){
            UtilsSrvc.openMessageBox("Группа", "Данная группа уже существует!", null);
            return;
        }

        $('#InfoModal').modal('show');
        $scope.page.competitionTable.IsVisibleItemErrors = false;
        $scope.page.infoModalVisible = true;
        $scope.page.competitionTable.selected = item;
        $scope.form_competition.$setPristine();
    };

    /// Update competition data
    $scope.page.saveImportedCompetition = function(){
        $scope.page.competitionTable.selected.startDate = UtilsSrvc.getValidDate($scope.page.competitionTable.selected.startDate);
        
        if ($scope.page.competitionTable.selected.startDate == "")
            return;
            
        var doAfter = function(){ 
            $('#InfoModal').modal('hide');
            $scope.page.infoModalVisible = false;
            $scope.page.competitionTable.selected = {};
            $scope.page.competitionTable.refresh();
        };
 
        $scope.page.competitionTable.selected.id = "";
        CompetitionSrvc.save($scope.page.tournament.id, $scope.page.competitionTable.selected).then(
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Изменения сохранены.', 'success', true);
                doAfter();
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                doAfter();
            });
    };

    $scope.page.importAll = function(){
        var importItems = [];

        for(var i=0; i < $scope.page.competitionTable.items.length; i++){
            var item = $scope.page.competitionTable.items[i];
            if (!item.info.isErrored && !item.info.isExisted){
                item.id = "";
                importItems.push(item);
            }
         }  
            
        CompetitionSrvc.saveAll($scope.page.tournament.id, importItems).then(
            function(data){
                console.log(data);
                $scope.page.competitionTable.refresh();
            },
            function(data, status, headers, config){
                console.log(data);
                $scope.page.competitionTable.importInfo.errors++;
            }); 
    };


    $scope.page.loadLink = function(trnId){
        ImportSrvc.getCompetitionsLink(trnId).then(
            function(data){
                $scope.page.link = data.link == '' ? '--------------' : data.link;
            },
            function(data, status, headers, config){
                console.log(data);
            }); 
    };

    /// Load All Tournaments years for combobox
    $scope.page.loadYears = function(){
        TournamentSrvc.getAllYears().then(
            function(data){
                $scope.page.years = data.children;
            	if ($scope.page.years.length != 0){
            		$scope.page.filter.year = $scope.page.years[$scope.page.years.length-1];
            		$scope.page.loadTournamentsByYear($scope.page.filter.year);
            	}	
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    /// Load Tournaments by Year for combobox 
    $scope.page.loadTournamentsByYear = function(year){
        $scope.page.competitionTable.items = [];
        $scope.page.tournament = {};
        
        TournamentSrvc.getAllByYear(year).then(
            function(data){
                $scope.page.tournaments = data.children;
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.page.init();
    $scope.page.loadYears();

});

