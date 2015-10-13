'use strict';
//ddd

/*===========================================================================================
 
===========================================================================================*/

controllersModule.controller('ImportTournamentsCtrl', function($scope, $location, $filter, UtilsSrvc, ImportSrvc, TournamentSrvc){
	$scope.menu.selectMenu($scope.menu.pages.import.childrens.tournaments);
	
	$scope.page = {};
    $scope.page.tournamentTable = {};

 	if (!$scope.pageStore.tournaments) $scope.pageStore.importtournaments = {grid:{}};

    $scope.page.init = function(){
    	//
    	// Tournament table 
    	//
        $scope.page.tournamentTable.columns = [
                          {name: 'Internal ID', sqlName: 'IdInternal', isSorted: false, isSortable: true,  isDown: true ,  isSearched: false,  isSearchable: true},
                          {name: 'External ID', sqlName: 'IdExternal', isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: true},
                          {name: 'Хеш'        , sqlName: 'Hash'      , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: true},
                          {name: 'Дата'       , sqlName: 'TDate'     , isSorted: true , isSortable: true,  isDown: false,  isSearched: false, isSearchable: true, filter: 'date'},
                          {name: 'Название'   , sqlName: 'Name'      , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false, isSearchable: true}];
        
        $scope.page.tournamentTable.properties = [
        				  {name:'idInternal'}, 
                          {name:'idExternal'},
                          {name:'hashShort', calculate: function(item){ item.hashShort = item.hash.substring(0,5) + '...'; }},
                          {name:'startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y')},
                          {name:'name'}];

        $scope.page.tournamentTable.pageSize = 15;
        $scope.page.tournamentTable.pageCurr = 1;
        $scope.page.tournamentTable.itemsTotal = 0;
        $scope.page.tournamentTable.selectedItems = [];
        $scope.page.tournamentTable.multiSelectMode = false;
        $scope.page.tournamentTable.forciblyUpdate = 0;
        $scope.page.tournamentTable.refresh();
    };


    // 
    $scope.page.tournamentTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
	    ImportSrvc.getAllTournamentsForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, {isFirstLoad: $scope.page.tournamentTable.forciblyUpdate == 1}).then(
            function(data){
	            data = data.children;
                for(var i=0; i < data.items.length; i++){
                    if (data.items[i].info.isExisted){
                        data.items[i].rowClass = "existsItem";
                    }
                }

                $scope.page.tournamentTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                $scope.page.tournamentTable.itemsTotal = data.itemsTotal;
                $scope.page.tournamentTable.items = data.items;
            },
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };

    $scope.page.tournamentTable.refresh = function(){ 
        $scope.page.tournamentTable.forciblyUpdate++; 
    };

    /// Open dialog for editing competition 
    $scope.page.tournamentTable.edit = function(item){
        if (item.info.isExisted){
            UtilsSrvc.openMessageBox("Турнир", "Данный турнир уже существует!", null);
            return;
        }

        $('#InfoModal').modal('show');
        $scope.page.infoModalVisible = true;
        $scope.page.tournamentTable.selected = item;
        $scope.page.tournamentTable.selected.tabUDSRAllowed = "1";
        $scope.page.tournamentTable.selected.tabWDSFAllowed = "1";
        $scope.page.tournamentTable.selected.tabOtherAllowed = "1";
          
        $scope.form_tournament.$setPristine();
    };

    /// Update competition data
    $scope.page.saveImportedTournament = function(){
        var doAfter = function(){
            $('#InfoModal').modal('hide');
            $scope.page.infoModalVisible = false;
            $scope.page.tournamentTable.selected = {};
            $scope.page.tournamentTable.refresh();
        };
 
        $scope.page.tournamentTable.selected.id = "";
        TournamentSrvc.save($scope.page.tournamentTable.selected).then(
            function(data){
                $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Изменения сохранены.', 'success', true);
                doAfter();
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                doAfter();
            });
    };


    $scope.page.init();
});

