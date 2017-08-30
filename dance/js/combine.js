// Combine date time is 12.08.2017 21:27:32


// ===============================================================================================================================
// File: 1. controllers/MainCtrl.js    
// ===============================================================================================================================
'use strict';
//c

/*===========================================================================================
Главный контроллер, работа с языком и меню
===========================================================================================*/

controllersModule.controller('MainCtrl', function($scope, $cookies, $filter, $window, OtherSrvc, UtilsSrvc, tmhDynamicLocale){

    if ($cookies.lang)
        tmhDynamicLocale.set($cookies.lang);
    else
        tmhDynamicLocale.set("ru");
    
    $scope.pageStore = {};
   
    $scope.getLocalString = function(word){
        return $filter('localize')(word);
    };
    
    $scope.menu = {devModeIsRelease: !false,
                   admin: ($cookies.admin === 'true'),
                   readOnlyMode: ($cookies.readOnlyMode === 'true'),
                   loginCaption: ($cookies.admin === 'true' ? 'Выход' : 'Вход')};
    
    $scope.menu.pages = {selected: {},
                         tournaments: {id: 'tournaments', url: '#/tournaments', name: $filter('localize')('Турниры')},
                         
                         entities : {id: 'entities', url: '#/entities/agecategories', name: $filter('localize')('Справочники'), 
                                        childrens: {ageCategories : {id: 'ageCategories', url: '#/entities/agecategories', name: $filter('localize')('Возрастные группы'), parentId: 'entities'},
                                                    dancerClasses : {id: 'dancerClasses', url: '#/entities/dancerclasses', name: $filter('localize')('Классы'), parentId: 'entities'}}},
                         
                         import : {id: 'import', url: '#/import/tournaments', name: $filter('localize')('Импорт'),
                                      childrens: {tournaments : {id: 'import-tournaments' , url: '#/import/tournaments' , parentId: 'import', name: $filter('localize')('Турниры')},
                                                  competitions: {id: 'import-competitions', url: '#/import/competitions', parentId: 'import', name: $filter('localize')('Группы')},
                                                  tickets     : {id: 'import-tickets'     , url: '#/import/tickets'     , parentId: 'import', name: $filter('localize')('Tickets')},
                                                  persons     : {id: 'import-persons'     , url: '#/import/persons'     , parentId: 'import', name: $filter('localize')('Участники ФТСАРР')}}},
                         searchprt: {id: 'searchprt', url: '#/search/participants', name: $filter('localize')('Поиск регистрации')},
                         feedback: {id: 'feedback', url: 'http://regdance.reformal.ru/', name: $filter('localize')('Задать вопрос')}
                        }; 
  
    $scope.menu.selectMenu = function(menuItem){
        $scope.menu.pages.selected = menuItem;
        $scope.menu.shortMenu = false;
    };

    $scope.menu.loadLanguages = function(){
        OtherSrvc.getLanguages().then(
                function(data, status, headers, config){
                    $scope.menu.languages = data.children;
                    var idx = UtilsSrvc.getIndexes($scope.menu.languages, 'code', AppSettings.lang ? AppSettings.lang : 'ru');
                    if (idx.length != 0) 
                        $scope.menu.lang = $scope.menu.languages[idx[0]];
                    
                },
                function(data, status, headers, config){
                    //$scope.page.alert = UtilsSrvc.getAlert('Внимание!', response.data, 'error', true);
                });
    };

    $scope.menu.switchLang = function(lang){
        if ($cookies.lang == lang.code)
            return;    
        
        var oldUrlParam = '';
        if ($window.location.href.indexOf('/lang/' + $cookies.lang) > 0){
            var oldUrlParam = '/lang/' + $cookies.lang;
        }
        
        $cookies['lang'] = lang.code;
        AppSettings.lang = lang.code;
        tmhDynamicLocale.set(lang.code);
        for(var i = 0; i < $scope.menu.languages.length; i++)
            if ($scope.menu.languages[i].code == lang.code){
                $scope.menu.lang = $scope.menu.languages[i];
                break
            }
        
        if (oldUrlParam != '')
            $window.location.replace($window.location.href.replace(oldUrlParam, '/lang/' + lang.code));
        else{
            $window.location.reload(); 
        }
    };

    // Вход - выход
    $scope.menu.login = function(){
        $scope.menu.admin = ($cookies.admin === 'true');
        
        OtherSrvc.checkAdmin($scope.menu.admin === true ? 0: 1).then(
            function(data){
                if (data.privileges=='read'){
                    $cookies['readOnlyMode'] = 'true';
                    $scope.menu.readOnlyMode = true;
                }
                else{
                    $cookies['readOnlyMode'] = 'false';
                    $scope.menu.readOnlyMode = false;
                }
                
                $scope.menu.admin = true;
                $scope.menu.loginCaption = 'Выход';
                $cookies['admin'] = 'true';
            },
            function(data){
                $scope.menu.admin = false;
                $cookies['admin'] = 'false';
                $cookies['readOnlyMode'] = 'false';
                $scope.menu.readOnlyMode = false;
                $scope.menu.loginCaption = 'Вход';
            });
    }

    $scope.menu.loadLanguages();
    //$scope.menu.admin = true;
    //$scope.menu.readOnlyMode = true;
});


// ===============================================================================================================================
// File: 2. controllers/TournamentCtrl.js
// ===============================================================================================================================
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

// ===============================================================================================================================
// File: 3. controllers/TournamentsCtrl.js
// ===============================================================================================================================
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


// ===============================================================================================================================
// File: 4. controllers/TournamentCompetitionsCtrl.js
// ===============================================================================================================================
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

                                                            if (item.isForAllDancerClasses){
                                                                item.dancerClassesString = $filter('localize')('Все классы');
                                                                return;
                                                            }

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


// ===============================================================================================================================
// File: 5. controllers/TournamentParticipantsCtrl.js
// ===============================================================================================================================
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


// ===============================================================================================================================
// File: 6. controllers/SearchParticipantsCtrl.js
// ===============================================================================================================================
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
                          {name: 'ФТСАРР', sqlName: '-', isSorted: false, isSortable: true, isDown: true, isSearched: false, isSearchable: false},                          
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


// ===============================================================================================================================
// File: 7. controllers/RegistrationCtrl.js
// ===============================================================================================================================
'use strict';
// dfdfdfddddddddddddddвd
 
/*===========================================================================================
Registration           
===========================================================================================*/
  
controllersModule.controller('RegistrationCtrl', function($scope, $interval, $routeParams, $filter, LocationSrvc, UtilsSrvc, OtherSrvc, PersonSrvc, TournamentSrvc, CompetitionSrvc, RegistrationSrvc, ParticipantSrvc, CoupleSrvc){
    $('#divTypeOfView').hide();
    $scope.menu.pages.selected = {};
    $scope.menu.shortMenu = true;
     
    $scope.recorderHash = $routeParams.recorderHash || null;
    $scope.locationSrvc = LocationSrvc; 

    var intervalForTable = null;
    
    $scope.pageStore.registration = $scope.pageStore.registration || {grid:{hideNumbersColumn: true}, gridStyle:{}};    
    
    if ($scope.pageStore.registration.tournament && $scope.pageStore.registration.tournament.id == parseInt($routeParams.tournamentId)){
        $scope.tournament = $scope.pageStore.registration.tournament;
    }

    $scope.tabUDSR = {
        searchForm: {}
    };

    $scope.tabWDSF = {
        searchForm: {},
        formCouple: {
            btnBackVisible: true,
            btnNextVisible: true
        },
        formSingle: {
            btnBackVisible: true,
            btnNextVisible: true
        }
    };
    
    $scope.tabOTHER = {
        couple: {man:{}, woman: {}, otherInfo: {country: {id: 176}}},
        athlete: null,
        genders: [
            {name: $filter('localize')('Мужской'), code: 'Male'}, 
            {name: $filter('localize')('Женский'), code: 'Female'}
        ],
        categories: [
            {name: 'Professional', code: 'Pro'}, 
            {name: 'Amateur', code: 'Am'}
        ],
        formCouple: {
            btnBackVisible: false,
            btnNextVisible: true
        },
        formSingle: {
            btnBackVisible: false,
            btnNextVisible: true
        }  
    };

    
    $scope.competitionTable = {};

    $scope.init = function(){
        //    
        // Competition table
        //
        $scope.competitionTable.columns = [
                          {id: 'Number', name: '#', sqlName: '%EXACT(idExternal)', isSorted: true , isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: {width: '30px'}},
                          {id: 'Date', name: 'Дата', sqlName: 'StartDate', isSorted: false, isSortable: false , isDown: true , isSearched: false , isSearchable: false, filter: 'date', captionStyle: {width: '130px'}},
                          /*{id: 'Time', name: 'Время', sqlName: 'StartTime', isSorted: false, isSortable: false , isDown: true , isSearched: false , isSearchable: false, captionStyle: {width: '70px'}},*/
                          {id: 'Name', name: 'Название', sqlName: 'Name->Value', isSorted: false, isSortable: false , isDown: true , isSearched: false , isSearchable: false},
                          {id: 'Discipline', name: 'Программа', sqlName: 'Discipline->Name->Value', isSorted: false, isSortable: false , isDown: true , isSearched: false , isSearchable: false},
                          {id: 'AgeGroup', name: 'Возрастная группа', sqlName: 'AgeCategory', isSorted: false, isSortable: false, isDown: true , isSearched: false , isSearchable: false},
                          {id: 'Class', name: 'Класс', sqlName: '', isSorted: false, isSortable: false, isDown: true , isSearched: false , isSearchable: false},
                          {id: 'Type', name: 'Тип', sqlName: 'Type->Name->Value', isSorted: false, isSortable: false , isDown: true , isSearched: false , isSearchable: false, captionStyle: {width: '50px'}},
                          {id: 'Limit', name: 'Лимит', sqlName: 'Limit', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {width: '70px', textAlign: 'center'}},
                          {id: 'FreeCount', name: 'Осталось мест', sqlName: '', isSorted: false, isSortable: false, isDown: true,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center'}, hidden: true},
                          {id: 'Price', name: 'Цена', sqlName: 'Price', isSorted: false, isSortable: false , isDown: true , isSearched: false , isSearchable: false, captionStyle: {textAlign: 'right', width: '90px'}}];
        
        var getCssClassFuncForClosedCompetitions = function(item){
            return item.isClosed == 1 ? 'competitionIsClosed' : '';
        };
        
        $scope.competitionTable.properties = [
                          {name:'idExternal', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y'), getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'fullName',
                                calculate: function(item){
                                    item.fullName = item.name + (item.isClosed == 1 ? (' (' + $filter('localize')('Регистрация закрыта') + ')') : '');
                                    if (item.wdsf){
                                        item.fullName += ' ' + ((item.wdsf.status != 'Registering' && item.wdsf.status!= 'PreRegistration') ? 'WDSF STATUS = ' + item.wdsf.status : '');
                                    } 
                                }},
                          {name:'discipline.name', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'ageCategory.fullName', getCssClass: getCssClassFuncForClosedCompetitions,
                                calculate: function(item){
                                    if (!item.ageCategory) 
                                        return '';
                                    item.ageCategory.fullName = item.ageCategory.name + ' (' + item.ageCategory.titleAge + ')';
                                }},
                          {name:'dancerClassesString', getCssClass: getCssClassFuncForClosedCompetitions,
                                calculate: function(item){
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
                          {name:'type.name', getCssClass: getCssClassFuncForClosedCompetitions},
                          {name:'limitString', cellStyle: {textAlign: 'center'}, cellTitle: $filter('localize')('Количество доступных мест'),
                                                    calculate: function(item){
                                                        item.limitString = item.limit == 0 ? '---' : item.limit;
                                                    }},
                          {name:'freeSlotsCountString', cellStyle: {textAlign: 'center'}, cellTitle: $filter('localize')('Количество доступных мест'),
                                                    calculate: function(item){
                                                        item.freeSlotsCountString = item.freeSlotsCount >= 10000 ? '---' : item.freeSlotsCount;
                                                        if (item.freeSlotsCount == 0)
                                                            item.isBlocked = true;
                                                    },
                                                    getCssClass: function(item){ 
                                                        if (item.freeSlotsCount <= 5)
                                                            return 'competitionFreeSlotsCellWarning';
                                                         
                                                        return '';
                                                    }},
                          {name:'price', cellStyle: {textAlign: 'right'}, getCssClass: getCssClassFuncForClosedCompetitions}];

        $scope.competitionTable.pageSize = 1000; 
        $scope.competitionTable.pageCurr = 1;
        $scope.competitionTable.itemsTotal = 0;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.selectedItems = [];
        $scope.competitionTable.multiSelectMode = true;
        $scope.competitionTable.forciblyUpdate = 0;
        $scope.competitionTable.otherFilter = {};

        $scope.pageStore.registration.grid.tableShortView = $scope.pageStore.registration.grid.tableShortView == null ? true : $scope.pageStore.registration.grid.tableShortView;
        
        if ($scope.pageStore.registration.grid.tableShortView){
            $scope.competitionTable.setHiddenCoulumns(true);
        }
        else{
            $scope.competitionTable.setHiddenCoulumns(false);
        }  
    };

    /// Load All Competitions in Tournament  
    $scope.competitionTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        if (!$scope.tournament)
            return;
        
        $scope.competitionTable.selectedItems = [];
        $scope.competitionTable.itemsStatus = $filter('localize')('Идет загрузка групп...');

        var dataSending= {
            type: $scope.selectedTab, /* UDSR, WDSF, OTHER*/
            tournamentId: $scope.tournament.id,
            convertParams: {
                loadWDSF: true,
                loadPaymentsCount: true,
                loadDancerClasses: true,
                loadAgeCategory: true
            },
            otherFilter: {
                dancerClass: $scope.competitionTable.otherFilter.dancerClass
            }
        };
            
            
        if ($scope.pageStore.registration.grid.tableShortView){
            //$('#divTypeOfView').hide();
        }
        else{
            $('#divTableCmpButtons,#divTableCmpStatus').css('width', '100%');
            dataSending.convertParams.loadTournament = true;
            dataSending.convertParams.loadDiscipline = true;
            dataSending.convertParams.loadAgeCategory = true;
            dataSending.convertParams.loadType = true;
            dataSending.convertParams.loadDancerClasses = true;
            dataSending.convertParams.tournamentParams = {};
        }
        
        var afterLoad = function(){
            if ($scope.pageStore.registration.grid.tableShortView){
                $interval.cancel(intervalForTable);
                intervalForTable = $interval(function() {
                    console.log('interval reg!');
                    var tableWidth = $('#tableCmp').css('width');
                    if (tableWidth != '0px'){
                        $('#divTableCmpButtons,#divTableCmpStatus').css('width', tableWidth);
                        $('#divTypeOfView').show();
                    }
                }, 1, 100);
            }   
        };
        
         
        if ($scope.competitionTable.avialableMode){
            dataSending.couple = $scope['tab' + $scope.selectedTab].couple || null;
            dataSending.athlete = $scope['tab' + $scope.selectedTab].athlete || null;
        
            CompetitionSrvc.getAllAvialableForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, dataSending).then(
                function(data){
                    data = data.children;
                    $scope.competitionTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                    $scope.competitionTable.itemsTotal = data.itemsTotal;
                    $scope.competitionTable.items = data.items; 
                    $scope.competitionTable.onSelect(null);

                    $scope.competitionTable.itemsStatus = data.items.length == 0 ? $filter('localize')('Нет доступных групп.') : '';
                    afterLoad();
                },
                function(data, status, headers, config){
                    $scope.competitionTable.items = [];
                    $scope.cmpAlert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                    $scope.competitionTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке групп.');
                });
        }
        else{
            CompetitionSrvc.getAllForGrid(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, dataSending).then(
                function(data){
                    data = data.children;
                    $scope.competitionTable.pageTotal = Math.ceil(data.itemsTotal / pageSize);
                    $scope.competitionTable.itemsTotal = data.itemsTotal;
                    $scope.competitionTable.items = data.items; 
                    $scope.competitionTable.caption = $filter('localize')('Все группы');

                    $scope.competitionTable.itemsStatus = data.items.length == 0 ? $filter('localize')('Нет доступных групп.') : '';
                    afterLoad();
                },
                function(data, status, headers, config){
                    $scope.competitionTable.items = [];
                    $scope.cmpAlert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                    $scope.competitionTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке групп.');
                });
        }
    };

    $scope.competitionTable.setHiddenCoulumns = function(value){
        var columns = ["Discipline", "Type", "Limit"];
        for(var n=0; n < $scope.competitionTable.columns.length; n++){
            var curColumn = $scope.competitionTable.columns[n];
            if (columns.indexOf(curColumn.id) != -1)
                curColumn.hidden = value;     
        }
        
        if (value){
            $scope.pageStore.registration.gridStyle = {width: 'auto', minWidth: '526px'};
        }
        else{
            $scope.pageStore.registration.gridStyle = {width: '100%'};
        }

        $scope.pageStore.registration.grid.tableShortView = value;
        $scope.competitionTable.refresh();
    };

    // Select competition
    $scope.competitionTable.onSelect = function(item){
        if (item != null && item.isBlocked){
            item.rowClass = null;
            $scope.competitionTable.selectedItems.pop();
            return;
        }
        
        $scope.competitionTable.caption = $filter('localize')('Доступные группы.') + ' ' + $filter('localize')('Выбрано %1 из %2.')
                                               .replace(/%1/g, $scope.competitionTable.selectedItems.length)
                                               .replace(/%2/g, $scope.competitionTable.items.length);                                    
    };

    /// Refresh competition table  
    $scope.competitionTable.refresh = function(){ 
        $scope.competitionTable.forciblyUpdate++; 
    };

    $scope.competitionTable.getSelectedIdArray = function(type){ 
        var idArray = [];
        for (var i=0; i < $scope.competitionTable.selectedItems.length; i++){
            if (type == 'UDSR' && !$scope.competitionTable.selectedItems[i].wdsf)
                idArray.push($scope.competitionTable.selectedItems[i].id);
            else if (type == 'WDSF' && $scope.competitionTable.selectedItems[i].wdsf)
                idArray.push($scope.competitionTable.selectedItems[i].id);
            else if (type == 'OTHER')
                idArray.push($scope.competitionTable.selectedItems[i].id);
        } 

        return idArray;
    };

    /// Load Tournament by ID   
    $scope.loadTournament = function(id){
        TournamentSrvc.getById(id, "?loadFullName=1&loadStatus=1&loadUrls=1&loadRank=1").then(
            function(data){
                $scope.tournament = data;
                 
                $scope.tournament.isContainsLimit = data.isContainsLimit == 1;
                
                for(var n=0; n < $scope.competitionTable.columns.length; n++){
                    var curColumn = $scope.competitionTable.columns[n];
                    if (curColumn.id == "FreeCount"){
                        curColumn.hidden = !data.isContainsLimit;     
                    }
                }
                
                if (data.status.code != 'Registration'){
                    $scope.tabUDSR.visible = false;
                    $scope.tabWDSF.visible = false;
                    $scope.tabOTHER.visible = false;
                    $scope.alert = UtilsSrvc.getAlert('Внимание!', 'Регистрация в турнир завершена.', 'error', true);
                    return;
                }  
 
                $scope.tabUDSR.visible = data.tabUDSRAllowed == 1;
                $scope.tabWDSF.visible = data.tabWDSFAllowed == 1;
                $scope.tabOTHER.visible = data.tabOtherAllowed == 1;
                
                if ($routeParams.typeCode){
                    if ($routeParams.typeCode == 'udsr'){
                        $scope.tabUDSR.select();
                    }
                    if ($routeParams.typeCode == 'wdsf'){
                        $scope.tabWDSF.select();
                    }
                    else if ($routeParams.typeCode == 'other'){
                        $scope.tabOTHER.select();
                    }
                }
                else{                
                    if (data.tabUDSRAllowed){   
                        $scope.tabUDSR.select();
                    }
                    else if (data.tabWDSFAllowed){
                        $scope.tabWDSF.select();
                    }
                    else if (data.tabOtherAllowed){
                        $scope.tabOTHER.select();
                    }
                }


                $scope.pageStore.registration.tournament = $scope.tournament;
                
                // Столбец цены меняем для валюты
                var idxColPrice = UtilsSrvc.getIndexes($scope.competitionTable.columns, 'id', 'Price');
                if (idxColPrice.length != 0){ 
                    var colName = $filter('localize')('Цена') + ', ' + UtilsSrvc.getCurrencySignByISOCode(data.currency.id);
                    $scope.competitionTable.columns[idxColPrice[0]].name = colName;
                }
                
                // Заход на страницу для дополнительной регистраци
                if($scope.pageStore.registrationData){
                    if ($scope.pageStore.registrationData.type == "Other"){
                        $scope.tabOTHER.couple = $scope.pageStore.registrationData.couple;
                        $scope.tabOTHER.formCouple.next();
                        $scope.pageStore.registrationData = null;
                    }
                }

                $scope.loadTournamentDancerClasses($scope.tournament.id);
            },
            function(data, status, headers, config){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.openParticipantCompetitions = function(type){
        switch(type){
            case 'UDSR':
            $scope.locationSrvc.goTo(':recorderHash/tournament/' + $scope.tournament.id + ($scope.tabUDSR.couple ? '/couple/' + $scope.tabUDSR.couple.id : '/athlete/' + $scope.tabUDSR.athlete.id) + '/competitions', $scope.recorderHash);
            break;

            case 'WDSF':
            $scope.locationSrvc.goTo(':recorderHash/tournament/' + $scope.tournament.id + ($scope.tabWDSF.couple ? '/couple/' + $scope.tabWDSF.couple.id : '/athlete/' + $scope.tabWDSF.athlete.id) + '/competitions', $scope.recorderHash);
            break;

            case 'OTHER':
            $scope.locationSrvc.goTo(':recorderHash/tournament/' + $scope.tournament.id + '/other' + ($scope.tabOTHER.couple ? '/couple/' + $scope.tabOTHER.couple.key : '/athlete/' + $scope.tabOTHER.athlete.key) + '/competitions', $scope.recorderHash);
            break;            
        }
    };


    $scope.loadCountParticipantCompetitions = function(type){
        var filter = '?tournamentId=' + $scope.tournament.id;
        switch(type){
            case 'UDSR':
                filter +=  $scope.tabUDSR.couple ? ('&coupleId=' + $scope.tabUDSR.couple.id) : '';
                filter +=  $scope.tabUDSR.athlete ? ('&athleteId=' + $scope.tabUDSR.athlete.id) : '';
                break;
            case 'WDSF':
                filter +=  $scope.tabWDSF.couple ? ('&coupleId=' + $scope.tabWDSF.couple.id) : '';
                filter +=  $scope.tabWDSF.athlete ? ('&athleteId=' + $scope.tabWDSF.athlete.id) : '';
                break;
            case 'OTHER':
                filter +=  $scope.tabOTHER.couple ? ('&coupleKey=' + $scope.tabOTHER.couple.key) : '';
                filter +=  $scope.tabOTHER.athlete ? ('&athleteKey=' + $scope.tabOTHER.athlete.key) : '';
                filter = filter.replace(/\+/g, '%2B');
                break;
        }

        $scope.regCompetitionsCount = 0;

        ParticipantSrvc.getCompetitionsCount(filter).then(
            function(data){
                $scope.regCompetitionsCount = data.count;
            },
            function(data, status, headers, config){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.loadTournamentDancerClasses = function(trnId){
        $scope.dancerClasses = [
            {id: 9, code: '', name: 'Bronze Open'},
            {id: 10, code: '', name: 'Silver Open'},
            {id: 11, code: '', name: 'Gold Open'}
        ];
    };

    // Clear current tab for new registration
    $scope.clearAllForms = function(){
        $scope.tabUDSR.disabled = false;
        $scope.tabWDSF.disabled = false;
        $scope.tabOTHER.disabled = false;
        
        $scope.tabWDSF.formCouple.disabled = false;
        $scope.tabWDSF.formSingle.disabled = false;
        
        $scope.tabOTHER.formCouple.disabled = false;
        $scope.tabOTHER.formSingle.disabled = false;
        
        $scope.tabUDSR.alert.visible = false;
        $scope.tabWDSF.alert.visible = false;
        $scope.tabOTHER.alert.visible = false;

        $scope.tabUDSR.searchForm.clear();
        $scope.tabWDSF.searchForm.clear();
        
        $scope.tabOTHER.formCouple.btnBackVisible = false;
        $scope.tabOTHER.formCouple.btnNextVisible = true;

        $scope.form_otherSingleData.$setPristine();
        $scope.form_otherCoupleData.$setPristine();
        $scope.tabOTHER.formCouple.btnRegistrationVisible = false;
        $scope.tabOTHER.formSingle.btnRegistrationVisible = false;
        $scope.tabOTHER.couple = {man:{}, woman: {}, otherInfo: {country: {id: 176}}}; // 176 - Russia
        $scope.tabOTHER.athlete = null;
        $scope.tabOTHER.formSingle.btnBackVisible = false;
        $scope.tabOTHER.formSingle.btnNextVisible = true;

        $scope.regCompetitionsCount = 0;
        
        $scope.resultTableVisible = false;

        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.otherFilter.dancerClass = null;
        $scope.competitionTable.refresh();  
    };



    // ===========================================================================================================================================
    // Tab UDSR                                                                                                                           Tab UDSR
    // ===========================================================================================================================================
    $scope.tabUDSR.select = function(){
        $scope.tabUDSR.active = true;
        $scope.selectedTab = 'UDSR';
        $scope.competitionTable.refresh();
    };

    $scope.tabUDSR.searchForm.search = function(manNumber, womanNumber){
        manNumber = manNumber || "";
        womanNumber = womanNumber || "";
        
        if (manNumber == '' && womanNumber == '')
            return;

        $scope.tabUDSR.searchForm.processing = true;

        var afterSuccess = function(){
            $scope.tabWDSF.disabled = true;
            $scope.tabOTHER.disabled = true;
            $scope.tabUDSR.searchForm.processing = false;
            $scope.competitionTable.avialableMode = true;
            $scope.competitionTable.selectable = true; 
            $scope.competitionTable.refresh();
            $scope.loadCountParticipantCompetitions('UDSR');  
            if ($scope.tabUDSR.couple.man.otherInfo.club.toLowerCase() != $scope.tabUDSR.couple.woman.otherInfo.club.toLowerCase()){
                $scope.tabUDSR.alert = UtilsSrvc.getAlert('Внимание!', "Регистраця в СТСР группы запрещена. Партнер и партнерша должны быть из одного клуба! " + $scope.tabUDSR.couple.man.number + " - " + $scope.tabUDSR.couple.man.otherInfo.club + "; " + $scope.tabUDSR.couple.woman.number + " - " + $scope.tabUDSR.couple.woman.otherInfo.club + ".", 'error', true);
            }
        };

        if (manNumber != '' && womanNumber != ''){
            CoupleSrvc.getUDSRByNumbers(manNumber, womanNumber).then(
                function(data){
                    $scope.tabUDSR.couple = data;
                    afterSuccess();
                },
                function(data, status, headers, config){
                    $scope.tabUDSR.searchForm.processing = false;
                    $scope.tabUDSR.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        }
        else{
            PersonSrvc.getByUDSRNumber(manNumber ? manNumber : womanNumber).then(
                function(data){
                    $scope.tabUDSR.athlete = data;
                    afterSuccess();
                },
                function(data, status, headers, config){
                    $scope.tabUDSR.searchForm.processing = false;
                    $scope.tabUDSR.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        }
    };

    $scope.tabUDSR.searchForm.clear = function(){
        $scope.form_udsrSearch.$setPristine();
        $scope.tabUDSR.searchForm.manNumber = '';
        $scope.tabUDSR.searchForm.womanNumber = '';
        $scope.tabUDSR.couple = null;
        $scope.tabUDSR.athlete = null; 
        $scope.tabUDSR.alert = {};
    };

    $scope.tabUDSR.back = function(){
        $scope.tabUDSR.searchForm.clear();
        $scope.tabWDSF.disabled = false;
        $scope.tabOTHER.disabled = false;
        $scope.tabUDSR.searchForm.processing = false;
        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.refresh();  
    };

    $scope.tabUDSR.registration = function(){
        if ($scope.tabUDSR.couple && $scope.tabUDSR.couple.idWDSF){
            var postUDSRData = {
                competitions: $scope.competitionTable.getSelectedIdArray('UDSR'),
                couple: $scope.tabUDSR.couple || null,
                athlete: null,
                recorderHash: $scope.recorderHash 
            };

            RegistrationSrvc.UDSR(postUDSRData).then(
                function(data){
                    $scope.regResponse = data;
                    $scope.resultTableVisible = true;
                    $scope.loadCountParticipantCompetitions('UDSR');
                    console.log('udsr > reg success', data);

                    var wdsfCompetitions = $scope.competitionTable.getSelectedIdArray('WDSF');
                    if (wdsfCompetitions.length == 0)
                        return;
                    
                    var postWDSFData = {
                        competitions: wdsfCompetitions,
                        couple: {
                            id: $scope.tabUDSR.couple.idWDSF,
                            man: {
                                id: $scope.tabUDSR.couple.man.idWDSF,
                                dob: $scope.tabUDSR.couple.man.dob,
                                number: $scope.tabUDSR.couple.man.numberWDSF
                            },
                            woman: {
                                id : $scope.tabUDSR.couple.woman.idWDSF,
                                dob: $scope.tabUDSR.couple.woman.dob,
                                number: $scope.tabUDSR.couple.woman.numberWDSF
                            },
                            otherInfo: $scope.tabUDSR.couple.otherInfo
                        },
                        athlete: null,
                        recorderHash: $scope.recorderHash 
                    }; 

                    RegistrationSrvc.WDSF(postWDSFData).then(
                        function(data){
                            $scope.regResponse.results = $scope.regResponse.results.concat(data.results);
                            console.log('udsr > wdsf reg success', data);
                        },
                        function(data){
                            $scope.tabUDSR.alert = UtilsSrvc.getAlert('Внимание!', data.message, 'error', true);
                            console.log('udsr > wdsf reg error', data);
                        }); 
                },
                function(data){
                    $scope.regResponse = data;
                    $scope.resultTableVisible = true;
                    $scope.tabUDSR.alert = UtilsSrvc.getAlert('Внимание!', data.message, 'error', true);
                    console.log('udsrwdsf reg error', data);
                });
        }
        else{
            var postData = {
                competitions: $scope.competitionTable.getSelectedIdArray('UDSR'),
                couple: $scope.tabUDSR.couple || null,
                athlete: $scope.tabUDSR.athlete || null,
                recorderHash: $scope.recorderHash 
            };

            RegistrationSrvc.UDSR(postData).then(
                function(data){
                    $scope.regResponse = data;
                    $scope.resultTableVisible = true;
                    $scope.loadCountParticipantCompetitions('UDSR');
                    console.log('udsr reg success', data);
                },
                function(data){
                    $scope.regResponse = data;
                    $scope.resultTableVisible = true;
                    $scope.tabUDSR.alert = UtilsSrvc.getAlert('Внимание!', data.message, 'error', true);
                    console.log('udsr reg error', data);
                });
        }

    };


    // ===========================================================================================================================================
    // Tab WDSF                                                                                                                           Tab WDSF
    // ===========================================================================================================================================
    $scope.tabWDSF.select = function(){
        $scope.tabWDSF.active = true;
        $scope.selectedTab = 'WDSF';
        $scope.competitionTable.refresh();
    };

    $scope.tabWDSF.searchForm.search = function(manNumber, womanNumber){
        if (manNumber == '' && womanNumber == '')
            return;

        $scope.tabWDSF.searchForm.processing = true;

        var afterSuccess = function(){
            $scope.tabUDSR.disabled = true;
            $scope.tabOTHER.disabled = true;
            $scope.tabWDSF.searchForm.processing = false;
            
            $scope.tabWDSF.formCouple.btnRegistrationVisible = true;
        
            $scope.competitionTable.selectable = true; 
            $scope.competitionTable.avialableMode = true;
            $scope.competitionTable.refresh();  
        
            $scope.loadCountParticipantCompetitions('WDSF');
        };

        if (manNumber != '' && womanNumber != ''){
            CoupleSrvc.getWDSFByNumbers(manNumber, womanNumber).then(
                function(data){
                    $scope.tabWDSF.couple = data;
                    afterSuccess();
                    
                    $scope.competitionTable.selectable = true;
                    if (data.otherInfo.status != 'Active'){
                        $scope.tabWDSF.formCouple.disabled = true;
                        $scope.competitionTable.selectable = false;
                        $scope.tabWDSF.alert = UtilsSrvc.getAlert('Внимание!', 'Статус пары не "Active"! Регистрация пары невозможна.', 'error', true);
                    }
                },
                function(data, status, headers, config){
                    $scope.tabWDSF.searchForm.processing = false;
                    $scope.tabWDSF.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        }
        else{
            PersonSrvc.getByWDSFNumber(manNumber ? manNumber : womanNumber).then(
                function(data){
                    $scope.tabWDSF.athlete = data;
                    afterSuccess();
                },
                function(data, status, headers, config){
                    $scope.tabWDSF.searchForm.processing = false;
                    $scope.tabWDSF.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        }
    };

    $scope.tabWDSF.searchForm.clear = function(){
        $scope.form_wdsfSearch.$setPristine();
        $scope.tabWDSF.searchForm.manNumber = '';
        $scope.tabWDSF.searchForm.womanNumber = '';
        $scope.tabWDSF.couple = null;
        $scope.tabWDSF.athlete = null;
        $scope.tabWDSF.alert = {};  
        $scope.regCompetitionsCount = 0;
        $scope.tabWDSF.formCouple.btnRegistrationVisible = false;
        $scope.tabWDSF.formSingle.btnRegistrationVisible = false;
        $scope.tabWDSF.formCouple.btnNextVisible = true;
        $scope.tabWDSF.formSingle.btnNextVisible = true;
        $scope.tabWDSF.formCouple.btnBackVisible = true;
        $scope.tabWDSF.formSingle.btnBackVisible = true;
    };

    $scope.tabWDSF.formCouple.back = function(){
        $scope.tabWDSF.searchForm.clear();
        $scope.tabUDSR.disabled = false;
        $scope.tabOTHER.disabled = false;
        $scope.tabWDSF.searchForm.processing = false;    
        
        $scope.tabWDSF.alert.visible = false;
        $scope.tabWDSF.formCouple.disabled = false;
        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.refresh();  
    };

    $scope.tabWDSF.formCouple.next = function(){
        $scope.tabWDSF.couple.man.dob = UtilsSrvc.getValidDate($scope.tabWDSF.couple.man.dob);
        $scope.tabWDSF.couple.woman.dob = UtilsSrvc.getValidDate($scope.tabWDSF.couple.woman.dob);
        
        /*
        if ($scope.tabWDSF.couple.man.dob == "" || $scope.tabWDSF.couple.woman.dob == ""){
            return;
        }
        */
        
        $scope.tabWDSF.formCouple.disabled = true;
        $scope.tabWDSF.formCouple.btnNextVisible = false;
        $scope.tabWDSF.formCouple.btnRegistrationVisible = true;
        
        $scope.competitionTable.selectable = true; 
        $scope.competitionTable.avialableMode = true;
        $scope.competitionTable.refresh();  
    };


    $scope.tabWDSF.formSingle.back = function(){
        if ($scope.tabWDSF.formSingle.btnRegistrationVisible){
            $scope.tabWDSF.formSingle.btnNextVisible = true;
            $scope.tabWDSF.formSingle.btnRegistrationVisible = false;
            $scope.regCompetitionsCount = 0;
        }
        else{
            $scope.tabWDSF.searchForm.clear();
            $scope.tabUDSR.disabled = false;
            $scope.tabOTHER.disabled = false;
            $scope.tabWDSF.searchForm.processing = false;    
        }

        $scope.tabWDSF.formSingle.disabled = false;
        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.refresh();  
    };
  
    $scope.tabWDSF.formSingle.next = function(){
        $scope.tabWDSF.athlete.dob = UtilsSrvc.getValidDate($scope.tabWDSF.athlete.dob);
        
        if ($scope.tabWDSF.athlete.dob == ""){
            return;
        }

        $scope.tabWDSF.formSingle.disabled = true;
        $scope.tabWDSF.formSingle.btnNextVisible = false;
        $scope.tabWDSF.formSingle.btnRegistrationVisible = true;
        
        $scope.loadCountParticipantCompetitions('WDSF');

        $scope.competitionTable.selectable = true; 
        $scope.competitionTable.avialableMode = true;
        $scope.competitionTable.refresh();  
    };


    $scope.tabWDSF.registration = function(){
        var postData = {
            competitions: $scope.competitionTable.getSelectedIdArray('WDSF'),
            couple: $scope.tabWDSF.couple || null,
            athlete: $scope.tabWDSF.athlete || null,
            recorderHash: $scope.recorderHash  
        };

        $scope.tabWDSF.regProcessing = true;
        RegistrationSrvc.WDSF(postData).then(
            function(data){
                $scope.regResponse = data;
                $scope.resultTableVisible = true;
                
                if (data && data.status == 1){
                    $scope.loadCountParticipantCompetitions('WDSF');
                }
                else{
                    $scope.tabWDSF.alert = UtilsSrvc.getAlert('Внимание!', data.message, 'error', true);
                }
                
                $scope.tabWDSF.regProcessing = false;
                console.log('reg success', data);
            },
            function(data){
                $scope.regResponse = data;
                $scope.resultTableVisible = true;
                $scope.tabWDSF.alert = UtilsSrvc.getAlert('Внимание!', data.message, 'error', true);
                console.log('reg error', data);
                $scope.tabWDSF.regProcessing = false;
            });  
    };


 
    // ===========================================================================================================================================
    // Tab OTHER                                                                                                                          Tab WDSF
    // ===========================================================================================================================================
    $scope.tabOTHER.select = function(){
        $scope.tabOTHER.active = true;
        $scope.selectedTab = 'OTHER';
        $scope.competitionTable.refresh();
    };

    $scope.tabOTHER.formCouple.back = function(){
        if ($scope.tabOTHER.formCouple.btnRegistrationVisible){
            $scope.tabOTHER.formCouple.btnNextVisible = true;
            $scope.tabOTHER.formCouple.btnBackVisible = false;
            $scope.tabOTHER.formCouple.btnRegistrationVisible = false;
            $scope.tabOTHER.formCouple.disabled = false;
        }
        else{
            $scope.tabUDSR.disabled = false;
            $scope.tabWDSF.disabled = false;
            $scope.regCompetitionsCount = 0;
        }

        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.refresh();  
    };

    $scope.tabOTHER.formCouple.next = function(){
        $scope.tabOTHER.couple.man.dob = UtilsSrvc.getValidDate($scope.tabOTHER.couple.man.dob);
        $scope.tabOTHER.couple.woman.dob = UtilsSrvc.getValidDate($scope.tabOTHER.couple.woman.dob);
        
        if ($scope.tabOTHER.couple.man.dob == "" || $scope.tabOTHER.couple.woman.dob == ""){
            return;
        }

        $scope.tabOTHER.couple.key = ParticipantSrvc.getOtherCoupleKey($scope.tabOTHER.couple).replace(/\//g, "SLASH");
        $scope.loadCountParticipantCompetitions('OTHER');
        
        $scope.tabOTHER.formCouple.disabled = true;
        $scope.tabOTHER.formCouple.btnNextVisible = false;
        $scope.tabOTHER.formCouple.btnBackVisible = true;
        $scope.tabOTHER.formCouple.btnRegistrationVisible = true;
        
        $scope.competitionTable.selectable = true; 
        $scope.competitionTable.avialableMode = true;
        $scope.competitionTable.refresh(); 

        $scope.tabUDSR.disabled = true;
        $scope.tabWDSF.disabled = true; 
    };

    $scope.tabOTHER.formSingle.back = function(){
        if ($scope.tabOTHER.formSingle.btnRegistrationVisible){
            $scope.tabOTHER.formSingle.btnNextVisible = true;
            $scope.tabOTHER.formSingle.btnRegistrationVisible = false;
            $scope.tabOTHER.formSingle.disabled = false;
            $scope.regCompetitionsCount = 0;
            $scope.tabOTHER.formSingle.btnBackVisible = false;
        }
        else{
            $scope.tabUDSR.disabled = false;
            $scope.tabOTHER.disabled = false;
        }

        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
        $scope.competitionTable.refresh();  
    };

    $scope.tabOTHER.formSingle.next = function(){
        $scope.tabOTHER.athlete.dob = UtilsSrvc.getValidDate($scope.tabOTHER.athlete.dob);
        
        if ($scope.tabOTHER.athlete.dob == ""){
            return;
        }

        $scope.tabOTHER.athlete.key = ParticipantSrvc.getOtherAthleteKey($scope.tabOTHER.athlete).replace(/\//g, "SLASH");
        $scope.loadCountParticipantCompetitions('OTHER');

        $scope.tabOTHER.formSingle.disabled = true;
        $scope.tabOTHER.formSingle.btnNextVisible = false;
        $scope.tabOTHER.formSingle.btnBackVisible = true;
        $scope.tabOTHER.formSingle.btnRegistrationVisible = true;
        
        $scope.competitionTable.selectable = true; 
        $scope.competitionTable.avialableMode = true;
        $scope.competitionTable.refresh();  
    };


    $scope.tabOTHER.registration = function(){
        var postData = {
            competitions: $scope.competitionTable.getSelectedIdArray('OTHER'),
            couple: $scope.tabOTHER.couple || null,
            athlete: $scope.tabOTHER.athlete || null,
            recorderHash: $scope.recorderHash  
        };

        RegistrationSrvc.OTHER(postData).then(
            function(data){
                $scope.regResponse = data;
                $scope.resultTableVisible = true;
                $scope.loadCountParticipantCompetitions('OTHER');
                console.log('reg success', data);
            },
            function(data){
                $scope.regResponse = data;
                $scope.resultTableVisible = true;
                $scope.tabOTHER.alert = UtilsSrvc.getAlert('Внимание!', data.message, 'error', true);
                console.log('reg error', data);
            });  
    };


    $scope.tabOTHER.onChangeCategory = function(partnerGender){
        var manCategory = $scope.tabOTHER.couple.man.category;
        var womanCategory = $scope.tabOTHER.couple.woman.category;

        if (partnerGender == "male"){
            if (manCategory == "Pro"){
                womanCategory = "Am";
            }
            else if (manCategory == "Am"){
                womanCategory = "Pro";
            }
        }
        else if (partnerGender == "female"){
            if (womanCategory == "Pro"){
                manCategory = "Am";
            }
            else if (womanCategory == "Am"){
                manCategory = "Pro";
            }
        }

        $scope.tabOTHER.couple.man.category = manCategory;
        $scope.tabOTHER.couple.woman.category = womanCategory;
    };

    // ===========================================================================================================================================
    // Confirm Dialog                                                                                                               Confirm Dialog
    // ===========================================================================================================================================
    $scope.confirmDialog = {};

    $scope.confirmDialog.open = function(type, applyMethod){
        $scope.confirmDialog.data = {};  
        $scope.confirmDialog.data.type = type;
        $scope.confirmDialog.data.couple = angular.copy($scope['tab' + type].couple) || null;
        $scope.confirmDialog.data.athlete = angular.copy($scope['tab' + type].athlete) || null; 
        $scope.confirmDialog.apply = applyMethod;

        $('#ConfirmDialog').modal('show');
        $scope.confirmDialog.visible = true;
    };

    $scope.confirmDialog.close = function(){
        $('#ConfirmDialog').modal('hide');
        $scope.confirmDialog.visible = false;  
    };



    /// Load WDSF Countries
    $scope.loadCountries = function(){
        OtherSrvc.getCountries().then(
            function(data){
                $scope.countries = data.children;
            },
            function(data, status, headers, config){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.getResultTableRow = function(res){
        var row = '';

        if (res.status == 1){
            row += $filter('localize')('Готово!') + ' ' + $filter('localize')('Регистрация выполнена.') + '\n' +
                   $filter('localize')('Группа') + ': ' + res.competition.name + '. ' + $filter('convertCacheDate')(res.competition.startDate, $filter('localize')('d MMMM y')) + '.';
            
            return row;
        }

        row += $filter('localize')('Ошибка!') + ' ' + $filter('localize')('Регистрация не выполнена.') + '\n' +
               $filter('localize')('Группа') + ': ' + res.competition.name + '. ' + $filter('convertCacheDate')(res.competition.startDate, $filter('localize')('d MMMM y')) + '.\n';
        
        if (res.competition.wdsf){
            // wdsf controller response
            var wcResponse = res.otherInfo;

            row += $filter('localize')('Сообщение') + ': ' + wcResponse.message + '\n';
            
            switch(wcResponse.code){
                // Conflict competitions for athlete
                case 2014:
                {
                    if (wcResponse.otherInfo && wcResponse.otherInfo.conflictCompetitions && wcResponse.otherInfo.conflictCompetitions.length != 0){
                        row += $filter('localize')('Обнаружены конфликтные группы для участника') + ' ' + (wcResponse.otherInfo.athlete ? wcResponse.otherInfo.athlete.surname + ' ' + wcResponse.otherInfo.athlete.name : '') + ':';
                       
                        for (var i = 0; i < res.otherInfo.otherInfo.conflictCompetitions.length; i++){
                            var conflictCmp = wcResponse.otherInfo.conflictCompetitions[i];
                            row += '\n • ' + conflictCmp.type + '. ' + 
                                             conflictCmp.discipline + '. ' + 
                                             conflictCmp.ageGroup + '. ' + 
                                             $filter('convertCacheDate')(conflictCmp.date, $filter('localize')('d MMMM y')) + '. ' + 
                                             $filter('localize')('Место проведения') + ' - ' + conflictCmp.country + ', ' +  conflictCmp.location + '.';
                        }
                    }
                    break;
                }
            }
        }    
        else {
            row += $filter('localize')('Сообщение') + ': ' + res.message + '\n';

            // Conflict competitions for UDSR athlete
            if (res.otherInfo.conflictCompetitions && res.otherInfo.conflictCompetitions.length != 0){
                row += $filter('localize')('Обнаружены конфликтные группы для участника') + ' ' + (res.otherInfo.athlete ? res.otherInfo.athlete.lastName + ' ' + res.otherInfo.athlete.firstName : '') + ':';
                
                for (var i = 0; i < res.otherInfo.conflictCompetitions.length; i++){
                    var conflictCmp = res.otherInfo.conflictCompetitions[i];
                    row += '\n • ' + conflictCmp.name + '. ' + 
                                     $filter('convertCacheDate')(conflictCmp.startDate, $filter('localize')('d MMMM y')) + '. ' + 
                                     $filter('localize')('Место проведения') + ' - ' + conflictCmp.tournament.location.country.name + ', ' + conflictCmp.tournament.location.cityName + '.';
                }
            }
        }

        return row;
    };

    $scope.init();  
    $scope.loadTournament($routeParams.tournamentId);
    $scope.loadCountries();


    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        $interval.cancel(intervalForTable);
    });
});  

// ===============================================================================================================================
// File: 8. controllers/PaymentCtrl.js
// ===============================================================================================================================
'use strict';
// cf
        
/*===========================================================================================
Payment
===========================================================================================*/

controllersModule.controller('PaymentCtrl', function($scope, $routeParams, $window, $location, $filter, LocationSrvc, UtilsSrvc, CoupleSrvc, TournamentSrvc, ParticipantSrvc, OtherSrvc){ 
    $scope.menu.pages.selected = {};
        
    $scope.competitionTable = {};
    $scope.competitionList = [];

    $scope.recorderHash = $routeParams.recorderHash || null;
    $scope.locationSrvc = LocationSrvc; 

    if (!$scope.pageStore.tournamentPayment) 
        $scope.pageStore.tournamentPayment = {gridCompetitions:{ hideNumbersColumn: true}};


    if ($scope.pageStore.registration && $scope.pageStore.registration.tournament && $scope.pageStore.registration.tournament.id == parseInt($routeParams.tournamentId)){
        $scope.tournament = $scope.pageStore.registration.tournament;
    }

    $scope.init = function(){
        //   
        // Competition table
        // 
        $scope.competitionTable.columns = [
                          {id: 'Number', name: '#'                 , sqlName: '%EXACT(Competition->idExternal)'      , isSorted: true , isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: {width: '25px'}},
                          {id: 'Date', name: 'Дата'              , sqlName: 'Competition->StartDate'               , isSorted: false , isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, filter: 'date', captionStyle: {width: '130px'}},
                          {id: 'Time', name: 'Время'             , sqlName: 'Competition->StartTime'               , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {width: '60px'}},
                          {id: 'Name', name: 'Название'          , sqlName: 'Competition->Name'                    , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: 'Discipline', name: 'Программа'         , sqlName: 'Competition->Discipline->Name->Value' , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: 'AgeGroup', name: 'Возрастная группа' , sqlName: 'Competition->AgeCategory'             , isSorted: false, isSortable: true,  isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: 'Class', name: 'Класс'             , sqlName: ''                                     , isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false},
                          {id: 'Type', name: 'Тип'               , sqlName: 'Competition->Type->Name->Value'       , isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {width: '70px'}},
                          {id: 'Price', name: 'Цена'              , sqlName: 'Competition->Price'                   , isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'right', width: '90px'}},
                          
                          {id: 'Status', name: 'Статус'            , sqlName: 'PaymentStatus'                        , isSorted: false, isSortable: false, isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center', width: '110px'}},
                          {id: 'Limit', name: 'Лимит', sqlName: 'Limit', isSorted: false, isSortable: true , isDown: true ,  isSearched: false ,  isSearchable: false, captionStyle: {width: '70px', textAlign: 'center'}},
                          {id: 'FreeCount', name: 'Осталось мест', sqlName: '', isSorted: false, isSortable: false, isDown: true,  isSearched: false ,  isSearchable: false, captionStyle: {textAlign: 'center'}}];
        
        $scope.competitionTable.properties = [
                          {name:'competition.idExternal'},
                          {name:'competition.startDate', filter: 'date', filterParam: $filter('localize')('d MMMM y')},
                          {name:'competition.startTime'},
                          {name:'competition.name'},
                          {name:'competition.discipline.name'},
                          {name:'competition.ageCategory.name'},
                          {name:'competition.dancerClassesString', 
                                                        calculate: function(item){
                                                            item.competition.dancerClassesString = '';
                                                            for(var i=0; i < item.competition.dancerClasses.length; i++){
                                                                item.competition.dancerClassesString = item.competition.dancerClassesString + ', ' + item.competition.dancerClasses[i].name;
                                                            }

                                                            item.competition.dancerClassesString = item.competition.dancerClassesString.substring(2, item.competition.dancerClassesString.length);
                                                        }},
                          {name:'competition.type.name'},
                          {name:'competition.price', cellStyle: {textAlign: 'right'}},
                          {name:'ticketStatus.name', cellStyle: {textAlign: 'center'}, 
                                                    getCssClass: function(item){
                                                        return $scope.getCssClassForTicketStatus(item.ticketStatus.code);
                                                    }},
                          {name:'competition.limitString', cellStyle: {textAlign: 'center'}, cellTitle: $filter('localize')('Количество доступных мест'),
                                                    calculate: function(item){
                                                        item.competition.limitString = item.competition.limit == 0 ? '---' : item.competition.limit;
                                                    }},
                          {name:'competition.freeSlotsCountString', cellStyle: {textAlign: 'center'}, cellTitle: $filter('localize')('Количество доступных мест'),
                                                    calculate: function(item){
                                                        item.competition.freeSlotsCountString = item.competition.freeSlotsCount >= 10000 ? '---' : item.competition.freeSlotsCount;
                                                        item.competition.isBlocked = false;
                                                        if (item.competition.freeSlotsCount == 0){
                                                            item.competition.isBlocked = true;
                                                        }
                                                    },
                                                    getCssClass: function(item){ 
                                                        if (item.competition.freeSlotsCount <= 5)
                                                            return 'competitionFreeSlotsCellWarning';
                                                         
                                                        return '';
                                                    }}] 

        $scope.competitionTable.pageSize = 300;
        $scope.competitionTable.pageCurr = 1;
        $scope.competitionTable.itemsTotal = 0;
        $scope.competitionTable.selectedItems = [];
        $scope.competitionTable.multiSelectMode = true;
        $scope.competitionTable.forciblyUpdate = 0;
      
        $scope.competitionTable.refresh();

        $scope.pageStore.tournamentPayment.gridCompetitions.tableShortView = $scope.pageStore.tournamentPayment.gridCompetitions.tableShortView == null ? true : $scope.pageStore.tournamentPayment.gridCompetitions.tableShortView;
        
        $scope.competitionTable.setHiddenCoulumns($scope.pageStore.tournamentPayment.gridCompetitions.tableShortView == true);
     };

    
    //  
    $scope.competitionTable.loadItems = function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText){
        var filter = '?shortView=' + ($scope.pageStore.tournamentPayment.gridCompetitions.tableShortView ? 1 : 0);
          
        filter += '&tournamentId=' + $routeParams.tournamentId;

        if ($routeParams.coupleId){
            filter += '&coupleId=' + $routeParams.coupleId;
        }
        else if ($routeParams.athleteId){
            filter += '&athleteId=' + $routeParams.athleteId;
        }
        else if ($routeParams.coupleKey){
            filter += '&coupleKey=' + $routeParams.coupleKey;
        }
        else if ($routeParams.athleteKey){
            filter += '&athleteKey=' + $routeParams.athleteKey;
        }
        
        ParticipantSrvc.getAllForDancer(filter).then(
            function(data){
                $scope.competitionTable.items = data.children;
                $scope.competitionTable.itemsTotal = data.children.length;
                if ($scope.competitionTable.items.length != 0){
                    $scope.couple = angular.copy($scope.competitionTable.items[0].couple);
                    $scope.athlete = angular.copy($scope.competitionTable.items[0].athlete);
                    $scope.type = $scope.couple ? $scope.couple.type : $scope.athlete.type;
                    
                    try{
                        if ($scope.type == "WDSF" && $scope.couple && $scope.couple.idUDSR && $scope.couple.man.isActive == 1) {
                            CoupleSrvc.getById($scope.couple.idUDSR).then(
                                function(data){
                                    console.log('UDSR Couple is loaded');
                                    $scope.couple = data;
                                    $scope.type = "UDSR";
                                    $scope.typeName = $filter('localize')('ФТСАРР') + ' ';
                                },
                                function(data, status, headers, config){
                                    console.log('UDSR Couple is not loaded ', data);
                                });
                        }
                    }
                    catch(ex){
                        console.log('Error', ex);
                    }
                    
                    switch($scope.type){
                        case 'WDSF':
                            $scope.typeName = 'WDSF' + ' ';
                            break;

                        case 'UDSR':
                            $scope.typeName = $filter('localize')('ФТСАРР') + ' ';
                            break;
                        
                        default:
                            $scope.typeName = '';   
                    };
                }
            }, 
            function(data){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
    

    $scope.competitionTable.setHiddenCoulumns = function(value){
        var indexes = [2,4,5,6,7];
        for(var n=0; n < indexes.length; n++){
            $scope.competitionTable.columns[indexes[n]].hidden = value;     
        }
        
        $scope.pageStore.tournamentPayment.gridCompetitions.tableShortView = value;
        $scope.competitionTable.refresh();
    };

    $scope.competitionTable.onSelect = function(item){
        if (item != null && item.competition.isBlocked){
            item.rowClass = null;
            $scope.competitionTable.selectedItems.pop();
        }
        
        
        $scope.competitionList = [];
        
        for(var i=0; i < $scope.competitionTable.selectedItems.length; i++){
            if ($scope.competitionTable.selectedItems[i].competition.isBlocked)
                continue;
            
            console.log($scope.competitionTable.selectedItems[i].competition);
            $scope.competitionList.push($scope.competitionTable.selectedItems[i].competition);
        }
    };
 
    $scope.competitionTable.refresh = function(){ 
        $scope.competitionTable.forciblyUpdate++; 
    };

    /// Load Tournament by ID
    $scope.loadTournament = function(id){
        TournamentSrvc.getById(id, '?loadFullName=1&loadStatus=1&loadUrls=1').then(
            function(data){
                $scope.tournament = data;
                
                $scope.tournament.isContainsLimit = data.isContainsLimit == 1;
                
                for(var n=0; n < $scope.competitionTable.columns.length; n++){
                    var curColumn = $scope.competitionTable.columns[n];
                    if (curColumn.id == "Limit" || curColumn.id == "FreeCount"){
                        curColumn.hidden = !data.isContainsLimit;     
                    }
                }
                
                var idxColPrice = UtilsSrvc.getIndexes($scope.competitionTable.columns, 'id', 'Price');
                if (idxColPrice.length != 0){ 
                    var colName = $filter('localize')('Цена') + ', ' + UtilsSrvc.getCurrencySignByISOCode(data.currency.id);
                    $scope.competitionTable.columns[idxColPrice[0]].name = colName;
                }
                
                if (data.status.code != 'Registration'){
                    
                    $scope.alert = UtilsSrvc.getAlert('Внимание!', 'Регистрация в турнир завершена. Все платежи запрещены.', 'error', true);
                    return;
                }  
            },
            function(data, status, headers, config){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
 

    $scope.openConfirmDlg = function(){
        $scope.confirmData = {};
        
        if ($scope.couple){
            $scope.confirmData.formId = "couple";
            $scope.confirmData.couple = angular.copy($scope.couple);
            $scope.confirmData.otherInfo = $scope.confirmData.couple.otherInfo;
        }
        else if ($scope.athlete){
            $scope.confirmData.formId = "athlete";
            $scope.confirmData.athlete = angular.copy($scope.athlete);
            $scope.confirmData.otherInfo = $scope.confirmData.athlete.otherInfo;
        }

        var ids = UtilsSrvc.getIndexes($scope.countries, 'id', $scope.confirmData.otherInfo.country.id);
        $scope.confirmData.otherInfo.country = $scope.countries[ids.length !=0 ? ids[0] : 0];
        
        if ($scope.type == 'UDSR'){
            $scope.confirmData.formId += "DancePlatUDSRPayment";
            $scope.goToPaymentSystem($scope.confirmData.formId);
            return;
        } 
        else{
            $scope.confirmData.formId += "DancePlatOTHERPayment";
        }

        $('#ConfirmModal').modal('show');
        $scope.confirmModalVisible = true;
    };


    $scope.submitConfirmDlg = function(){
        $scope.closeConfirmDlg();
        $scope.goToPaymentSystem($scope.confirmData.formId);  
    };

    $scope.closeConfirmDlg = function(){
        $('#ConfirmModal').modal('hide');
        $scope.confirmModalVisible = false;
    };


    $scope.goToPaymentSystem = function(formId){
		var url = '';
		if (formId.indexOf("UDSR") >= 0){
			url = $scope.tournament.paymentSystem.udsrUrl;
		}
		else{
			url = $scope.tournament.paymentSystem.wdsfUrl;
		}
		
        $window.document.forms[formId].action = url;
		$window.document.forms[formId].submit(); 
    };

    /// Load WDSF Countries
    $scope.loadCountries = function(){
        OtherSrvc.getCountries().then(
            function(data){
                $scope.countries = data.children;
            },
            function(data, status, headers, config){
                $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
    
    // Перекинуть данные на страницу регистрации 
    $scope.doRegAgain = function(){
        if (!$scope.recorderHash)
            return;
            
        $scope.pageStore.registrationData = {};
        $scope.pageStore.registrationData.type = $scope.type;
        $scope.pageStore.registrationData.couple = $scope.couple;
        $scope.pageStore.registrationData.athlete = $scope.athlete;

        $scope.locationSrvc.goTo(':recorderHash/tournament/' + $scope.tournament.id + '/registration/type/' + $scope.type.toLowerCase(), $scope.recorderHash);
    };
    
    $scope.getCssClassForTicketStatus = function(code){
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
    
    $scope.competitionTable.remove = function(item){
        function remove(){
            ParticipantSrvc.removeById(item.id).then(
                function(data){
                    $scope.competitionTable.selectedItems = [];
                    $scope.competitionTable.refresh();
                    $scope.alert = UtilsSrvc.getAlert('Готово!', 'Участник удален.', 'success', true);
                },
                function(data, status, headers, config){
                    $scope.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                });  
        };

        var msg = '';
        if (item.couple){
            msg = item.couple.man.lastName + ' - ' + item.couple.woman.lastName;
        }
        else{
            msg = item.athlete.lastName + item.athlete.firstName;   
        }

        UtilsSrvc.openMessageBox('Удалить пару / участника из группы?', msg + ', ' + item.competition.name, remove);    
    };

    $scope.init();
    $scope.loadCountries();
    $scope.loadTournament($routeParams.tournamentId);
});


// ===============================================================================================================================
// File: 9. controllers/CompetitionCtrl.js
// ===============================================================================================================================
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

// ===============================================================================================================================
// File: 10. controllers/CompetitionParticipantsCtrl.js
// ===============================================================================================================================
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


// ===============================================================================================================================
// File: 11. controllers/AgeCategoriesCtrl.js
// ===============================================================================================================================
'use strict';
//ddddddddssddd

/*===========================================================================================

===========================================================================================*/

controllersModule.controller('AgeCategoriesCtrl', function($scope, $window, $filter, UtilsSrvc, AgeCategorySrvc){
	$scope.page = {};
	//hello
});


// ===============================================================================================================================
// File: 12. controllers/ImportTournamentsCtrl.js
// ===============================================================================================================================
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


// ===============================================================================================================================
// File: 13. controllers/ImportCompetitionsCtrl.js
// ===============================================================================================================================
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
                    data.items[i].isInternational = data.items[i].isInternational == 1;
                    
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


// ===============================================================================================================================
// File: 14. controllers/ImportPersonsCtrl.js
// ===============================================================================================================================
'use strict';
//ddd

/*===========================================================================================
 
===========================================================================================*/

controllersModule.controller('ImportPersonsCtrl', function($scope, $location, $filter, UtilsSrvc, PersonSrvc){
	$scope.menu.selectMenu($scope.menu.pages.import.childrens.persons);
	$scope.page = {};
  	
  	$scope.page.loadStats = function(){
        PersonSrvc.getStats().then(
            function(data){
                $scope.page.personStats = data;
            },
            function(data, status, headers, config){
                //$scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };
    
    $scope.page.loadStats();
});


// ===============================================================================================================================
// File: 15. controllers/FeedBackCtrl.js
// ===============================================================================================================================
'use strict';
//ssd

/*===========================================================================================
===========================================================================================*/

controllersModule.controller('FeedBackCtrl', function($scope, FeedBackSrvc, UtilsSrvc){
    $scope.menu.pages.selected = $scope.menu.pages.feedback;
    
    $scope.page = {};
    $scope.page.fb = {};

    $scope.page.createFeedBack = function(){
        FeedBackSrvc.create($scope.page.fb).then(
            function(data){
                $scope.page.clearForm();                 
                $scope.page.alert = UtilsSrvc.getAlert('Готово!', 'Ваше сообщение принято.', 'info', true);
            },
            function(data, status, headers, config){
                $scope.page.alert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
            });
    };


    $scope.page.clearForm = function(){
        $scope.page.fb = {};        
        $scope.form_feedback.$setPristine();
    };


});


// ===============================================================================================================================
// File: 16. services/RESTSrvc.js
// ===============================================================================================================================
'use strict';
//dddxdddddвd

/*===========================================================================================
Access to REST API
===========================================================================================*/

servicesModule.factory('RESTSrvc', function($http, $q) {    
    return {
        getPromise: function(config){
            $http.defaults.headers.common['Accept-Language'] = AppSettings.lang;
            
            var deferred = $q.defer();
            //$('#divLoader').show();
            $http(config).
                success(function(data, status, headers, config){
                    deferred.resolve(data);
                }).
                error(function(data, status, headers, config){
                    if (data != undefined && data.summary != undefined){
                        data = data.summary;
                    }
                    
                    deferred.reject(data, status, headers, config);
                });

            return deferred.promise;
        }
    }
});
  

// ===============================================================================================================================
// File: 17. services/TournamentSrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
Tournament service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentSrvc', function(RESTSrvc) {    
    return {
        getById: function(id, params){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/' + id + (params ? params : '')});
        },
        getByIdAdmin: function(id, params){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/tournament/' + id + (params ? params : '')});
        },
        removeById: function(id){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/' + id});
        },
        getParticipantsCountById: function(id){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/' + id + '/participants/count'});
        }, 
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/grid', data: obj});
        },
        save: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/tournament', data: data});
        },
        deleteById: function(id){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/' + id});
        },
        getAllByYear: function(year){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/year/' + year});
        },
        getAllYears: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentyears'});
        },
        getRecordersHashes: function(trnId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/recorder/tournament/' + trnId});
        } 
        
    }
});

// ===============================================================================================================================
// File: 18. services/TournamentRankSrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
TournamentRank service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentRankSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentRank'});
        }
    }
});

// ===============================================================================================================================
// File: 19. services/TournamentStatusSrvc.js   
// ===============================================================================================================================
'use strict';
//ddd

/*===========================================================================================
TournamentStatus service, access to REST API
===========================================================================================*/

servicesModule.factory('TournamentStatusSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournamentStatus'});
        }
    }
});

// ===============================================================================================================================
// File: 20. services/CompetitionSrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
===========================================================================================*/

servicesModule.factory('CompetitionSrvc', function(RESTSrvc) {    
    return {
        getById: function(competitionId, params){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/competition/' + competitionId + (params ? params : '')});
        },
        removeById: function(competitionId){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/competition/' + competitionId});
        },
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/competition/grid', data: obj});
        },
        getTypes: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/competition/type'});
        },
        getAllAvialableForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/competition/grid/couple', data: obj});
        }, 
        getDates: function(tournamentId){
	        return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/'+tournamentId+'/competition/date'});
        },
        getWDSFByFilter: function(countryId, date){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/competitionwdsf/country/'+countryId+'/date/' + date});
        },
        save: function(tournamentId, data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/tournament/'+tournamentId+'/competition', data: data});
        },
        saveAll: function(tournamentId, data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/tournament/'+tournamentId+'/competition/all', data: data});
        },
        deleteById: function(tournamentId, competitionId){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/tournament/' + tournamentId + '/competition/' + competitionId});
        }
    }
});

// ===============================================================================================================================
// File: 21. services/CoupleSrvc.js
// ===============================================================================================================================
'use strict';
//ddkjh

/*===========================================================================================
Couple service, access to REST API
===========================================================================================*/

servicesModule.factory('CoupleSrvc', function(RESTSrvc) {    
    return {
        getUDSRByNumbers: function(man, woman){
	        if (!man || man == '') man = 0;
	        if (!woman || woman == '') woman = 0;
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/udsr/man/' + man + '/woman/' + woman});
        },
        getWDSFByNumbers: function(man, woman){
	        if (!man || man == '') man = 0;
	        if (!woman || woman == '') woman = 0;
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/wdsf/man/' + man + '/woman/' + woman});
        },
        getWDSFOtherInfoForTournament: function(trnId, coupleId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/'+coupleId+'/wdsfinfo/tournament/' + trnId});
        },
        getById: function(id){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/' + id});
        },
        registrationExisting: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/couple/registration/existing', data: data});  
        },
        registrationNew: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/couple/registration/new', data: data});  
        },
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/couple/grid', data: obj});
        },
        getCompetitionsCount: function(tournamentId, coupleId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/tournament/' + tournamentId + '/couple/' + coupleId + '/competitionscount'});  
        },
        getRegistrationConflict: function(trnId, manId, womanId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/couple/conflictregistration/tournament/' + trnId + '/man/' + manId + '/woman/' + womanId});  
        }
    }
});

// ===============================================================================================================================
// File: 22. services/PersonSrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
Person service, access to REST API
===========================================================================================*/

servicesModule.factory('PersonSrvc', function(RESTSrvc) {    
    return {
        getByUDSRNumber: function(number){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/person/udsr/' + number});
        },
        getByWDSFNumber: function(number){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/person/wdsf/' + number});
        },
        getStats: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/person/stats'});
        }
    }
});

// ===============================================================================================================================
// File: 23. services/DisciplineSrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
Discipline service, access to REST API
===========================================================================================*/

servicesModule.factory('DisciplineSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/discipline'});
        }
    }
});

// ===============================================================================================================================
// File: 24. services/DancerClassSrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
DancerClass service, access to REST API
===========================================================================================*/

servicesModule.factory('DancerClassSrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/dancerClass'});
        }
    }
});

// ===============================================================================================================================
// File: 25. services/AgeCategorySrvc.js
// ===============================================================================================================================
'use strict';
//dd

/*===========================================================================================
AgeCategory service, access to REST API
===========================================================================================*/

servicesModule.factory('AgeCategorySrvc', function(RESTSrvc) {    
    return {
        getAll: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/ageCategory'});
        },
        getById: function(id){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/ageCategory/' + id});
        },
        save: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/ageCategory', data: data});
        },
        changeActiveStatus: function(objId, value){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/ageCategory/' + objId + '/isActive/' + value});
        },
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/ageCategory/grid', data: obj});
        }
    }
});

// ===============================================================================================================================
// File: 26. services/ParticipantSrvc.js
// ===============================================================================================================================
'use strict';
//d
 
/*===========================================================================================
Participant service, access to REST API
===========================================================================================*/

servicesModule.factory('ParticipantSrvc', function(RESTSrvc, UtilsSrvc) {    
    return {
        getAllForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/participant/grid', data: obj});
        },
        getAllForCompetition: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/competition/participant/grid', data: obj});
        },
        getAllForTournament: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/tournament/participant/grid', data: obj});
        },
        getAllForDancer: function(filter){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/dancer/participant' + filter});
        },
        getCompetitionsCount: function(filter){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/count/participant/competition' + filter});
        },
        removeById: function(id){
            return RESTSrvc.getPromise({method: 'DELETE', url: AppSettings.admin + '/participant/' + id});
        },
        getOtherCoupleKey: function(couple){
	    	return UtilsSrvc.base64Encode(couple.man.lastName + ',' + couple.man.firstName + ',' + couple.man.dob + ';' + couple.woman.lastName + ',' + couple.woman.firstName + ',' + couple.woman.dob);
	    },
	    getOtherAthleteKey: function(athlete){
	    	return UtilsSrvc.base64Encode(athlete.lastName + ',' + athlete.firstName + ',' + athlete.dob);
	    }
    }
});

// ===============================================================================================================================
// File: 27. services/OtherSrvc.js
// ===============================================================================================================================
'use strict';
//dddddd

/*===========================================================================================
Other
===========================================================================================*/

servicesModule.factory('OtherSrvc', function(RESTSrvc) {    
    return {
        getLanguages: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/language'});
        },
        getCountries: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/country'});
        },
        checkAdmin: function(isLogin){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/checkAdmin/' + isLogin});
        },
        setUnknownKey: function(key){
            console.log('unknownkey = '+key);
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/unknownkey', data: {key: key}});
        },
        getCurrencies: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/currency'});
        },
        getCompetitionRegions: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.user + '/competition/region'});
        },
		getPaymentSystems: function(){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/paymentsystem'});
        },		
    }
});

// ===============================================================================================================================
// File: 28. services/ImportSrvc.js
// ===============================================================================================================================
'use strict';
//ddd

/*===========================================================================================
===========================================================================================*/

servicesModule.factory('ImportSrvc', function(RESTSrvc) {    
    return {
        getAllTournamentsForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/import/tournament/grid', data: obj});
        },
        getAllCompetitionsForGrid: function(pageCurr, pageSize, sqlName, isDown, searchSqlName, searchText, other){
            var first = pageSize * (pageCurr - 1) + 1;
            var obj = {sqlName: sqlName, 
                       isDown: isDown, 
                       first: first, 
                       last: first + pageSize - 1,
                       searchSqlName: searchSqlName, 
                       searchText: searchText,
                       other: other};
            
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.admin + '/import/competition/grid', data: obj});
        },
        getCompetitionsLink: function(trnId){
            return RESTSrvc.getPromise({method: 'GET', url: AppSettings.admin + '/tournament/' + trnId + '/competition/importlink'});
        }
    }
});

// ===============================================================================================================================
// File: 29. services/FeedBackSrvc.js
// ===============================================================================================================================
'use strict';
//ddkjh

/*===========================================================================================

===========================================================================================*/

servicesModule.factory('FeedBackSrvc', function(RESTSrvc) {    
    return {
        create: function(fb){
	        return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/feedback', data: fb});
        }
    }
	}
 );

// ===============================================================================================================================
// File: 30. services/LocationSrvc.js
// ===============================================================================================================================
'use strict';
//dddxdddddвd 

/*===========================================================================================

===========================================================================================*/

servicesModule.factory('LocationSrvc', function($location) {	
	return {
		goTo: function(url, recorderHash){
			//console.log(url, recorderHash);
            
            if (recorderHash && url.indexOf(":recorderHash") >= 0){
                url = url.replace(/:recorderHash/, '/recorder/' + recorderHash);
            }
            else{
	            url = url.replace(/:recorderHash/, '');
            }
			
			//console.log(url, recorderHash);
            $location.path(url);
    	}
    }
});
  

// ===============================================================================================================================
// File: 31. services/RegistrationSrvc.js
// ===============================================================================================================================
'use strict';
//d

/*===========================================================================================
===========================================================================================*/

servicesModule.factory('RegistrationSrvc', function(RESTSrvc) {    
    return {
        UDSR: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/registration/udsr', data: data});
        },
        WDSF: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/registration/wdsf', data: data});
        },
        OTHER: function(data){
            return RESTSrvc.getPromise({method: 'POST', url: AppSettings.user + '/registration/other', data: data});
        }
    }
});

// ===============================================================================================================================
// File: 32. services/ReportSrvc.js
// ===============================================================================================================================
'use strict';
//ddвddddвd

/*===========================================================================================
Отчеты
===========================================================================================*/

servicesModule.factory('ReportSrvc', function($cookies, $window) {
	
	return {
		tournamentParticipants: function(trnId){
    		var lang = $cookies.lang ? $cookies.lang.substring(0,2) : 'ru';
            $window.open(AppSettings.admin + '/report/' + lang + '/tournament/' + trnId  + '/participant','_blank');
    	},
    	tournamentPayers: function(trnId){
    		var lang = $cookies.lang ? $cookies.lang.substring(0,2) : 'ru';
            $window.open(AppSettings.admin + '/report/' + lang + '/tournament/' + trnId  + '/payer','_blank');
    	},
        tournamentCompetitions: function(trnId){
            var lang = $cookies.lang ? $cookies.lang.substring(0,2) : 'ru';
            $window.open(AppSettings.user + '/report/' + lang + '/tournament/' + trnId  + '/competition','_blank');
        },
    }
});
  

// ===============================================================================================================================
// File: 33. services/UtilsSrvc.js
// ===============================================================================================================================
'use strict';
//ddвddddв

/*===========================================================================================
Utils
===========================================================================================*/

servicesModule.factory('UtilsSrvc', function($dialog, $filter) {
    
    return {
        openMessageBox: function(title, msg, func){
            var btns = [{result: true, label: 'Ок', cssClass: 'btn-primary btn-small'}, 
                        {result: false, label: $filter('localize')('Отмена'), cssClass: 'btn-small'}];
            
            $dialog.messageBox($filter('localize')(title), $filter('localize')(msg), btns).open().then(function(result){
                if (result && func)
                    func(); 
             });
        },
        openCustomMessageBox: function(title, msg, btns){
            $dialog.messageBox($filter('localize')(title), $filter('localize')(msg), btns).open().then(function(result){
                for (var i=0; i < btns.length; i++){
                    if (result == btns[i].result && btns[i].func)
                        btns[i].func();
                }
             });
        },
        getAlert: function(title, msg, eventType, visible){     
            if (msg && eventType == 'error'){
                msg = msg.replace(/#5001/g, '');
            }

            return {title: $filter('localize')(title),
                    msg: $filter('localize')(msg),
                    cssClass: 'alert alert-' + eventType,
                    visible: visible};
        },
        getIndexes: function(array, objField, valueField){
            var indexes = [];
            
            if (!array) return indexes;
            
            for (var i = 0; i < array.length; i++) {
                if (array[i][objField] == valueField)
                    indexes.push(i);
            };
            return indexes;
        },
        getValidDate: function(value){
			var validDate = '';
			
			if (value instanceof Date){
				validDate = $filter('date')(value, 'y-MM-dd')
			}
			else if (isNaN(new Date(value)) == false && value.length <= 10){
				validDate = value;
			}
			
			console.log(value, validDate);
			return validDate;
        },
        getPropertyValue: function (item, propertyStr, defaultValue){
            var value;
            defaultValue = defaultValue ? defaultValue : '';

            try{
                var properties = propertyStr.split('.');
                
                switch(properties.length){
                    case 1:
                        value = item[properties[0]];
                        break;
                    case 2:
                        value = item[properties[0]][properties[1]];
                        break;
                    case 3:
                        value = item[properties[0]][properties[1]][properties[2]];
                        break;
                    case 4:
                        value = item[properties[0]][properties[1]][properties[2]][properties[3]];
                        break;
                    case 5:
                        value = item[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]];
                        break;
                }
            }
            catch(ex){
                //console.log('Cвойства не существует ' + propertyStr);
            }

            return value == undefined ? defaultValue : value;
        },
        base64Encode: function(s) {
            return btoa(unescape(encodeURIComponent(s)));
        },
        base64Decode: function(s) {
            return decodeURIComponent(escape(atob(s)));
        },
        getCurrencySignByISOCode: function(code){
            switch(code){
                case 'EUR': return '€';
                case 'USD': return '$';
                case 'GBR': return '£'; 
                case 'RUB': return $filter('localize')('руб.');
                default: return '???'; 
            }
        }
    }
});
  

// ===============================================================================================================================
// File: 34. directives/stcalert.js
// ===============================================================================================================================
'use strict';
//sddddddd

directivesModule.directive('stcalert', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/stcalert.csp',
        
        scope: {
            data: '='
        },
        controller: function($scope, $timeout){           
           $scope.data = !$scope.data ? {visible: false} : $scope.data;
           
           $scope.close = function(){
	           $scope.data.visible = false;
               if ($scope.data.closeMethod) {
                    $scope.data.closeMethod();
               }
	       };
	        
	       $scope.$watch('data.visible', function(){
                if ($scope.data.visible && $scope.data.cssClass == 'alert alert-success'){
                    $timeout(function(){$scope.close()}, 2200);        
                }     
           });
	   	}
    }
});

// ===============================================================================================================================
// File: 35. directives/stcgrid.js
// ===============================================================================================================================
'use strict';
//dd
   
directivesModule.directive('stcgrid', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/stcgrid.csp',
        
        scope: {
            grid: '=',

            tableClass: '@',
            caption: '=',

            columns: '=',
            items: '=',
            properties: '=',
            updateItems: '&',
            pageCurr: '=',
            pageSize: '=',
            pageTotal: '=',
            navigatorVisible: '=',
            searchHide: '=',
            searchTop: '=',
            
            selectable: '=',
            selectedItems: '=',
            multiSelectMode: '=',
            onSelect: '&',
            onSelectCell: '&',

            actionColumnVisible: '=',
            actionColumnIcon: '=',
            actionColumnTitle: '=',
            actionColumnMethod: '&',

            firstRowActionIcon: '=',
            firstRowActionTitle: '=',
            firstRowActionMethod: '&',

            secondRowActionIcon: '=',
            secondRowActionTitle: '=',
            secondRowActionMethod: '&',

            forciblyUpdate: '='
        },
        controller: function($scope, $filter, $cookieStore, UtilsSrvc){
            $scope.searchText = '';
            
            var idxSort = UtilsSrvc.getIndexes($scope.columns, 'isSorted', true);
            if (idxSort.length != 0) 
                $scope.sortedColumn = $scope.columns[idxSort[0]];

            // Отключить кнопки навигации, если достигли последней стриницы, первой и тп
            $scope.checkNavigatorButtons = function(){
                
                if ($scope.pageCurr == 1){
                    $scope.firstPageDisabled = true;
                    $scope.prevPageDisabled = true;
                }
                else{
                    $scope.firstPageDisabled = false;
                    $scope.prevPageDisabled = false;   
                }
                
                if ($scope.pageCurr == $scope.pageTotal){
                    $scope.lastPageDisabled = true;
                    $scope.nextPageDisabled = true;   
                }
                else{
                    $scope.lastPageDisabled = false;
                    $scope.nextPageDisabled = false;   
                }                
            };

            $scope.checkPageTotal = function(){
                
                if (parseInt($scope.pageCurr) > parseInt($scope.pageTotal) && parseInt($scope.pageTotal) != 0){
                    $scope.pageCurr = $scope.pageTotal;
                    $scope.updateSource();
                }

                $scope.checkNavigatorButtons();
            };

            $scope.$watch('pageCurr', $scope.checkNavigatorButtons);
            $scope.$watch('pageTotal', $scope.checkPageTotal);
            
            // Вкл/Выкл мультиселекта в таблице
            $scope.$watch('multiSelectMode', function(){
                if (!$scope.selectedItems || $scope.selectedItems.length == 0){
                    $scope.selectedItems = [];
                    return;
                }    

                for(var i=1; i < $scope.selectedItems.length; i++)
                    $scope.selectedItems[i].rowClass = '';

                $scope.selectedItems = [$scope.selectedItems[0]];
            });

            $scope.$watch('items', function(){
                if (!$scope.selectedItems || $scope.selectedItems.length == 0)
                    return;
                
                for(var i=0; i < $scope.items.length; i++){
                    var idx = UtilsSrvc.getIndexes($scope.selectedItems, 'id', $scope.items[i].id);
                    if (idx.length != 0){
                        $scope.items[i].rowClass = $scope.selectedItems[0].rowClass;
                        $scope.selectedItems[idx[0]] = $scope.items[i];
                    }
                }
            });

            $scope.getRowClass = function(rowClass){
                //if ($scope.selectable)
                    return rowClass;
               // return '';
            };


            // Установить текущую страницу
            $scope.setPage = function(incr){
                $scope.pageCurr += incr;
                $scope.updateSource();

                $scope.grid.pageCurr = $scope.pageCurr;
            };

            // Установить размер страницы
            $scope.setPageSize = function(value){
                $scope.pageSize = value;
                $scope.updateSource();

                $scope.grid.pageSize = $scope.pageSize;
            };

            // Выбор столбца для сортировки
            $scope.sort = function(column, isDown){ 
                if (!$scope.selectable || !column.isSortable)
                    return;

                if ($scope.sortedColumn){
                    $scope.sortedColumn.isSorted = false;
                }

                column.isSorted = true;
                column.isDown = !isDown;
                $scope.sortedColumn = column;

                $scope.updateSource();
            };

            // Выбор строки
            $scope.select = function(item, property){
                if (!$scope.selectable || property.cellSelectable)
                    return;
                 
                item.rowClass = 'success';
                var idx = UtilsSrvc.getIndexes($scope.selectedItems, 'id', item.id);
                
                if (idx.length != 0){
                    $scope.selectedItems.splice(idx[0], 1);
                    item.rowClass = '';
                    $scope.onSelect({item: null});
                }
                else if ($scope.multiSelectMode){
                    $scope.selectedItems.push(item);
                    $scope.onSelect({item: item});
                }
                else if ($scope.selectedItems.length > 0){
                    $scope.selectedItems[0].rowClass = '';
                    $scope.selectedItems = [item];
                    $scope.onSelect({item: item});
                }
                else{
                    $scope.selectedItems = [item];
                    $scope.onSelect({item: item});
                }
            };


            $scope.selectCell = function(item, property){
                if (!property.cellSelectable)
                    return;

                if (item && property && $scope.onSelectCell)
                    $scope.onSelectCell({item: item, property: property});   
            };


            // Клик по ячейки - действие для строки
            $scope.actionRow = function(item){
                if ($scope.firstActionMode){
                    $scope.secondRowActionMethod({item: item});
                }
                else{
                    $scope.firstRowActionMethod({item: item});   
                }
            };
            
            // Обновить данные - вызов внешнего метода
            $scope.updateSource = function(){
               //console.log('$scope.updateSource'); 
               if (!$scope.sortedColumn){
                    var idx = UtilsSrvc.getIndexes($scope.columns, 'isSorted', true);
                    
                    if (idx.length != 0){
                        $scope.sortedColumn = $scope.columns[idx[0]];
                    }
                }
                
				var sqlFieldNamesForSearch = '';
				if ($scope.searchText != ''){
					for(var i=0; i < $scope.columns.length; i++){
						if ($scope.columns[i].isSearchable)
							sqlFieldNamesForSearch += $scope.columns[i].sqlName + ',';
					}
					
					sqlFieldNamesForSearch = sqlFieldNamesForSearch.substring(0, sqlFieldNamesForSearch.length - 1);
				}
				
                $scope.updateItems({pageCurr: parseInt($scope.pageCurr), 
                                    pageSize: parseInt($scope.pageSize), 
                                    sqlName: $scope.sortedColumn.sqlName, 
                                    isDown: $scope.sortedColumn.isDown,
                                    searchSqlName: sqlFieldNamesForSearch,
                                    searchText: $scope.searchText}); 
            };

            // Получит значение для поля .prop1.pro1_1.porp1_1_1 и тд
            $scope.getPropertyValue = function(item, property){
                if (property.calculate)
                    property.calculate(item);

                var value = UtilsSrvc.getPropertyValue(item, property.name);
              
                if (property.filter)
                    value = $scope.getFilteredValue(value, property.filter, property.filterParam);

                return value;
            } 

            // Фильтрация даты
            $scope.getFilteredValue = function(value, filter, filterParam){
                if (filter == 'date'){
                    value = $filter('convertCacheDate')(value, filterParam);
                }
                else if (filter == 'time' && value && value.length >= 5){
                    value = value.substring(0, 5);
                }
                else if (filter == 'bool' && filterParam && filterParam.length == 2){
                    value = value == 1 ? filterParam[0]: filterParam[1];
                }

                return value;
            };

            
            // Поиск
            $scope.search = function(){
                $scope.updateSource();
            };

            $scope.getCountOfVisibleColumns = function(columns){
                var visibleCount = 0;
                for(var i=0; i < columns.length; i++)
                    if (!columns[i].hidden)
                        visibleCount++;
                
                if ($scope.grid && $scope.grid.hideNumbersColumn){
                    visibleCount--;
                }
                    
                return visibleCount;
            };
            
            // Принудительное обновление при смене значения извне
            $scope.$watch('forciblyUpdate', function(){
                if ($scope.forciblyUpdate > 0)
                    $scope.updateSource();
            });
        }
    }
});

// ===============================================================================================================================
// File: 36. directives/tournamentform.js
// ===============================================================================================================================
'use strict';
//ddddd

directivesModule.directive('tournamentform', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/tournamentform.csp',
        
        scope: {
            tournament: '='       
        },
        controller: function($scope, TournamentStatusSrvc, TournamentRankSrvc, OtherSrvc, UtilsSrvc){
            $scope.ranks = [];
            $scope.statuses = [];
			$scope.currencies = [];
            $scope.countries = [];

            // Load all Tournament Statuses for combobox
            $scope.loadTournamentStatuses = function(){
                TournamentStatusSrvc.getAll().then(
                    function(data){
                        $scope.statuses = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };
			
			// Load all currencies
            $scope.loadCurrencies = function(){
                OtherSrvc.getCurrencies().then(
                    function(data){
                        $scope.currencies = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };
			
			// Load all payment systems
            $scope.loadPaymentSystems = function(){
                OtherSrvc.getPaymentSystems().then(
                    function(data){
                        $scope.paymentSystems = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };

            // Load all Tournament Ranks for combobox
            $scope.loadTournamentRanks = function(){
                TournamentRankSrvc.getAll().then(
                    function(data){
                        $scope.ranks = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };

            // Load WDSF Countries
            $scope.loadCountries = function(){
                OtherSrvc.getCountries().then(
                    function(data){
                        $scope.countries = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };

            $scope.loadTournamentStatuses();
            $scope.loadTournamentRanks();
			$scope.loadCurrencies();
            $scope.loadCountries();
			$scope.loadPaymentSystems();
	   	}
    }
});

// ===============================================================================================================================
// File: 37. directives/competitionform.js
// ===============================================================================================================================
'use strict';
//     

directivesModule.directive('competitionform', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/competitionform.csp',
        
        scope: {
            competition: '=',
            tournament: '='       
        },
        controller: function($scope, DisciplineSrvc, AgeCategorySrvc, CompetitionSrvc, OtherSrvc, UtilsSrvc){
            $scope.competitionsWDSF = [];

     
            /// Load Disciplines
            $scope.loadDisciplines = function(){
                DisciplineSrvc.getAll().then(
                    function(data){
                        $scope.disciplines = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };

            /// Load Age Categories
            $scope.loadAgeCategories = function(){
                AgeCategorySrvc.getAll().then(
                    function(data){
                        $scope.ageCategories = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };
           
            /// Load types
            $scope.loadTypes = function(){
                CompetitionSrvc.getTypes().then(
                    function(data){
                        $scope.types = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };
              
            $scope.loadCompetitionsWDSFByFilter = function(){
                $scope.competition.startDate = UtilsSrvc.getValidDate($scope.competition.startDate);
                if ($scope.competition.startDate=="")
                    return;
               
                var trnId = $scope.competition.id ? $scope.competition.tournament.location.country.id : $scope.tournament.location.country.id;

                CompetitionSrvc.getWDSFByFilter(trnId, $scope.competition.startDate).then(
                    function(data){
                        $scope.competitionsWDSF = data.children;
                    },
                    function(data, status, headers, config){
                    });
            };

            $scope.$watch('competition.isWDSF', function(){
                if (!$scope.competition || !$scope.competition.isWDSF)
                    return;

                $scope.loadCompetitionsWDSFByFilter();
            });

            $scope.clickOnDate = function(){
                $scope.competitionsWDSF = [];
                $scope.competition.wdsf = {};
                $scope.competition.isWDSF = false;
            };

            $scope.loadDisciplines();
            $scope.loadAgeCategories();
            $scope.loadTypes();
        }
    }
});

// ===============================================================================================================================
// File: 38. directives/danceplatUDSRPay.js
// ===============================================================================================================================
'use strict';
//d

directivesModule.directive('danceplatUdsrPay', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/danceplatUDSRPay.csp',
        
        scope: {
			trnId: '=',
            manNumberUdsr: '=',
            womanNumberUdsr: '=',
            competitions: '=',
            hideAll: '=',
            btnName: '='           
        },
        controller: function($scope){
            
	   	}
    }
});

// ===============================================================================================================================
// File: 39. directives/danceplatOtherPay.js
// ===============================================================================================================================
'use strict';
//-

directivesModule.directive('danceplatOtherPay', function(){
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'components/danceplatOtherPay.csp',
        
        scope: {
            trnId: '=',

            maleAge: '=',
            femaleAge: '=',

            maleLastName: '=',
            femaleLastName: '=',
            
            maleFirstName: '=',
            femaleFirstName: '=',
            
            country: '=',
            city: '=',
            club: '=',
            trainer: '=',

            competitions: '=',
            hideAll: '=',
            btnName: '='              
        },
        controller: function($scope){
            
	   	}
    }
});

// ===============================================================================================================================
// File: 40. directives/dropdownMultiselect.js
// ===============================================================================================================================
'use strict';
//sdddddddd

directivesModule.directive('dropdownMultiselect', function(){
   return {
       restrict: 'E',
       scope:{         
            sourceItems: '='
       },
       template: "<div class='btn-group' data-ng-class='{open: open}'>"+
        "<button type='button' class='btn btn-small'>{{caption}}</button>"+
                "<button type='button' class='btn btn-small dropdown-toggle' data-ng-click='open=!open;openDropdown()'><span class='caret'></span></button>"+
                "<ul class='dropdown-menu' aria-labelledby='dropdownMenu' style='height: 200px; overflow-y: auto;'>" + 
                    "<li style='display: inline-flex;'><a data-ng-click='selectAll()'><i class='fa fa-check'></i> Выбрать все</a>"+
                        "<a data-ng-click='deselectAll();'><i class='fa fa-times'></i> Отмена</a>" +
                   "</li>" +
                    "<li class='divider'></li>" +
                    '<li data-ng-repeat="option in sourceItems"> <a data-ng-click="setSelectedItem()">{{option.name}}<span data-ng-class="isChecked(option)"></span></a></li>' +                                        
                "</ul>" +
            "</div>" ,
       controller: function($scope){
           $scope.caption = '---';
           
            $scope.selectAll = function () {
                 for(var i=0; i < $scope.sourceItems.length; i++)
                    $scope.sourceItems[i].selected = true;
                    
                $scope.updateCaption();
            };  
                      
            $scope.deselectAll = function() {
                for(var i=0; i < $scope.sourceItems.length; i++)
                    $scope.sourceItems[i].selected = false;
                    
                $scope.updateCaption();
            };
            
            $scope.setSelectedItem = function(){
                this.option.selected = !this.option.selected;
                $scope.updateCaption();
                return true;
            };

            $scope.updateCaption = function(){
                var first = null;
                var totalSelectedCount = 0;
                
                if (!$scope.sourceItems)
                    return 
                    
                for(var i=$scope.sourceItems.length-1; i >= 0; i--)
                    if ($scope.sourceItems[i].selected == true){
                        first = $scope.sourceItems[i];
                        totalSelectedCount++;
                    }
                
                if (!first){
                    $scope.caption = '---';    
                }
                else if (totalSelectedCount == 1){
                    $scope.caption = first.name;
                }
                else if (totalSelectedCount > 1){
                    $scope.caption = first.name + ', + (' + (totalSelectedCount - 1) + ')';
                }       
            };
            
            $scope.isChecked = function (option) {                 
                if (option.selected) {
                    return 'fa fa-check pull-right';
                }
                return false;
            };
            
            $scope.$watch('sourceItems', function(){
                $scope.updateCaption();
            }, true);
                    
       }
   } 
});

// ===============================================================================================================================
// File: 41. localization/dict.js
// ===============================================================================================================================
//--

localizationModule.constant('DanceDictionary', {
  toEnglish: {
        'Регистрация закрыта':'Registration is closed',
        'Зарегистрировать ещё группы':'Register another competitions',
        'Регистрация выполнена.': 'Registration is complete.',
        'Регистрация не выполнена.': 'Registration failed.',
        'Обнаружены конфликтные группы для участника' : 'Found conflicting competitions for participant',
        'Место проведения':'Location',
        
        'Размер страницы':'Page size',
        'Поиск в столбце': 'Search in column',
        'Все группы': 'All competitions',
        'Внимание!': 'Attention!',
        'Готово!': 'Done!',
        'Язык системы' : 'System language',
        'd MMMM y'     : 'MMMM d, y',
        'В списке не отображены группы, в которых данная пара уже зарегистрирована.' : 'The competitions with the already registered couple are not displayed in the list.',
        'Ваш email' : 'Your email',
        'Ваше имя' : 'Your name',
        'Веб-сайт организатора' : 'Organizer web-site',
        'Возрастная группа' : 'Age group',
        'Возрастные группы' : 'Age groups',
        'Время' : 'Time',
        'Все дни' : 'All days',
        'Всего групп' : 'Total competitions',
        'Всего участников / уникальных' : 'Total participants / unique',
        'Вход' : 'Login',
        'Выберите группы!' : 'Select competitions!',
        'Выберите турнир для отображения подробной информации.' : 'Select a tournament to show detailed information.',
        'Выбрано' : 'Selected',
        'Главный тренер' : 'Main trainer',
        'Город' : 'City',
        'Город, Страна' : 'City, Country',
        'групп из' : 'competitions from',
        'Группы' : 'Competitions',
        'Группы пары' : 'Couple competitions',
        'Группы участника' : 'Participant competitions',
        'Далее' : 'Next',
        'Дата' : 'Date',
        'Дата начала / окончания' : 'Start date / end date',
        'Дата начала' : 'Start date',
        'Дата окончания' : 'End date',
        'Дата рождения' : 'Date of birth',
        'Детально' : 'Details',
        'Программа' : 'Discipline',
        'Для просмотра списка всех групп турнира нажмите на ссылку (») в колонке "Группы" или выберите внизу вкладку "Группы(N)".' : 'To see the list of all tournament competitions, click the link (») in "Competitions" column, or select "Competitions (N)" tab at the bottom.',
        'Для просмотра списка всех участников турнира нажмите на ссылку (») в колонке "Участники".' : 'To see the list of all tournament participants, click the link (») in the "Participants" column.',
        'Для просмотра списка участников группы нажмите на ссылку (») в колонке "Участники".' : 'To see a list of group\'s participants, click the link (») in "Participants" column.',
        'Для регистрации в \"соло\" заполните только одно поле.' : 'To register for the \"solo\" fill in only one field.',
        'Для регистрации в турнире нажмите на ссылку (») в колонке "Регистрация".' : 'To register for the tournament, click the link (») in "Registration" column.',
        'Для регистрации в \"соло\" нажмите на переключатель.' : 'To register for the \"solo\" click the checkbox.',
        'Добавить' : 'Add',
        'Дополнительная информация' : 'Other information',
        'Другие тренеры' : 'Other trainers',
        'Женский' : 'Female',
        'Зарегистрировать' : 'Register',
        'Идет загрузка групп...' : 'Loading competitions ...',
        'Идет загрузка данных...' : 'Loading data ...',
        'из' : 'of',
        'Изменить' : 'Edit',
        'Импорт' : 'Import',
        'Имя' : 'Name',
        'Информация' : 'Information',
        'Класс' : 'Class',
        'Классы' : 'Classes',
        'Клуб / Город' : 'Club / City',
        'Клуб' : 'Club',
        'Конфликтные группы для ' : 'Conflicting competitions for ',
        'Конфликтные группы участника - это группы из других турниров, в которых зарегистрирован участник. Дата конфликтной группы совпадает с одной из дат групп выбранного турнира (заголовок сверху). Публикация списка конфликтных групп предназначена лишь для информирования участников.' : 'Conflicting participant competitions are the competitions of other tournaments where the participant is registered. Conflict competition date coincides with one of the competitions dates of the selected tournament (title above). Publication of a list of conflict competitions is intended only to inform the participants.',
        'Коротко' : 'Short',
        'Ла: ' : 'La:',
        'Мужской' : 'Male',
        'Нажмите на ссылку в колонке "Группы" для просмотра списка групп турнира, в которых зарегистрирована пара (участник).' : 'Click the link in "Competitions" column  to see a list of the tournament where the couple (participant) is registered.',
        'Назад' : 'Back',
        'Название' : 'Name',
        'Нашли ошибку в работе системы? Что-то не нравится? Пожалуйста, напишите нам Ваши замечания и предложения.' : 'Found a bug in the system? Don\'t like something? Please write us your comments and suggestions.',
        'Не оплачено' : 'Not paid',
        'Нет доступных групп.' : 'No available competitions.',
        'Номер WDSF' : 'Number WDSF',
        'Номер партнера' : 'Male number',
        'Номер партнерши' : 'Female number',
        'Номер ФТСАРР' : 'Number RFDARR',
        'Номера классификационных книжек WDSF' : 'Numbers of WDSF classification books',
        'Номера классификационных книжек ФТСАРР' : 'Numbers of RFDARR classification books',
        'Обратная связь' : 'Feedback',
        'Оплатить на danceplat.ru' : 'Pay on danceplat.ru',
        'Организатор' : 'Organizer',
        'Открыть для просмотра' : 'Open to view',
        'Открыть список групп' : 'Show a list of competitions',
        'Открыть список групп, в которых зарегистрирована пара' : 'Show a list of competitions that the couple is registered in',
        'Открыть список участников' : 'Show a list of participants',
        'Открыть список участников группы' : 'Show a list of competition participants',
        'Отмена' : 'Cancel',
        'Отображать дополнительные столбцы' : 'Display additional columns',
        'Отправить' : 'Send',
        'Оформить »' : 'Check in »',
        'Оформить регистрацию' : 'Click for "Check in"',
        'Очистить' : 'Clear',
        'Пара' : 'Couple',
        'Партнер / Партнерша' : 'Male / Female',
        'Партнер' : 'Male partner',
        'Партнерша' : 'Female partner',
        'Первая страница' : 'First page',
        'Перейти к списку групп пары / участника (' : 'Go to the competitions list of couples / participants (',
        'Подтверждение регистрационных данных' : 'Confirmation of registration data',
        'Поиск' : 'Search',
        'Пол' : 'Gender',
        'Поля отмеченные * обязательны для заполнения.' : 'Fields marked with an asterisk (*) are required.',
        'После завершения регистрации произойдет передача данных в danceplat.ru, по прошествии некоторого времени после завершения оплаты ваши данные отобразятся в регистрационных списках.' : 'After completing the registration, data will be sent to danceplat.ru, after some time when your payment is confirmed your data will be shown in the registration lists.',
        'После завершения регистрации произойдет переход на страницу с группами пары, там вы сможете выбрать необходимые группы и перейти к оплате.' : 'After registration you will be redirected to the page of couple competitions, there you can choose the required competitions and proceed to payment.',
        'Последняя страница' : 'Last page',
        'Предыдущая страница' : 'Previous page',
        'Ранг' : 'Rank',
        'Регистрация' : 'Registration',
        'Регистрация WDSF' : 'Registration for WDSF',
        'Регистрация других участников' : 'Registration for other participants',
        'Регистрация осуществляется по WDSF номерам. Поиск участников идет по базе данных "World DanceSport Federation".' : 'Registration is carried by WDSF numbers. Find participants is the database "World DanceSport Federation".',
        'Регистрация осуществляется по номерам классификационных книжек и на основании информации Базы данных спортсменов "ФТСАРР" на момент регистрации.' : 'Registration is carried by numbers and classification of books based on the information Databases athletes "RFDARR" at the time of registration.',
        'Регистрация ФТСАРР' : 'Registration for RFDARR',
        'Регистрация участников »' : 'Registration of participants »',
        'Регистрация участников на турнир' : 'Registration of participants at the tournament',
        'Регистрация участников по WDSF номерам' : 'Registration of participants at WDSF numbers',
        'Регистрация участников по ФТСАРР номерам' : 'Registration of participants at RFDARR numbers',
        'Режим' : 'Mode',
        'Система регистрации' : 'Registration system',
        'Скрывать дополнительные столбцы' : 'Hide additional columns',
        'Следующая страника' : 'Next page',
        'Соло' : 'Solo',
        'Сообщение' : 'Message',
        'Список всех групп турнира' : 'List of all competitions of the tournament',
        'Список всех уникальных участников турнира' : 'List of all unique participants of the tournament',
        'Список всех участников »' : 'List of all participants »',
        'Справочники' : 'Directories',
        'Ст: ' : 'St:',
        'Статус' : 'Status',
        'Страна' : 'Country',
        'Страница' : 'Page',
        'Тема сообщения' : 'Subject',
        'Тип' : 'Type',
        'Тренер #1. Фамилия, Имя' : 'Trainer #1. Full name',
        'Тренер #2. Фамилия, Имя' : 'Trainer #2. Full name',
        'Тренер(ы)' : 'Trainers',
        'Тренеры' : 'Trainers',
        'Турнир' : 'Tournament',
        'Турниры' : 'Tournaments',
        'Удалить' : 'Remove',
        'Участник' : 'Participant',
        'Участники' : 'Participants',
        'Участники ФТСАРР' : 'RFDARR Participants',
        'Фамилия' : 'Last name',
        'Фамилия, Имя' : 'Full name',
        'Фильтр: Ранг турнира' : 'Filter: Rank of tournament',
        'Фильтр: Статус турнира' : 'Filter: Status of tournament',
        'Форма обратной связи' : 'Feedback form',
        'Цена' : 'Price',
        'руб.' : 'rub.',
        'Щелчком мыши выберите группы, в которые необходимо зарегистрировать пару.' : 'Click to select the competitions to which you must register coulpe.',
        'Щелчком мыши выберите необходимые группы для передачи данных в платежную систему.' : 'Click to select the desired competitions for data transmission to the payment system.',
        'Язык' : 'Lang',
        
        ' - участие в группе не оплачено.' : ' - participation in the competition is not paid.',
        ' - участие в группе отменено.' : ' - participation in the group canceled.',
        'Cписок всех групп »' : 'List of all competitions »',
        'Выберите год и турнир. Ярким синим цветом выделены группы, которые уже есть базе данных. Сравнение идет по IdInternal. Красным выделены группы с ошибками, их можно исправить.' : 'Select the year and tournament. Competitions that already have a database are highlighted in bright blue. Comparison is on IdInternal. Competitions with errors are highlighted in red and can be corrected.',
        'Выход' : 'LogOut',
        'Год' : 'Year',
        'Группы, доступные для импорта' : 'Competitions, available for import',
        'Доступные для импорта турниры' : 'Tournaments, available for import',
        'Заголовок' : 'Title',
        'Загрузка групп в турнир' : 'Import competitions into tournament',
        'Макс.' : 'Limit',
        'Международный' : 'International',
        'Нажмите на ссылку (») в колонке "Группы" для просмотра списка групп турнира, в которых зарегистрирована пара (участник).' : 'Click the link (») in "Competitions" column  to see a list of the tournament where the couple (participant) is registered.',
        'Партнер / партнерша' : 'Male / Female',
        'Показать ошибки' : 'Show errors',
        'Лимит' : 'Limit',
        'Просмотр формы' : 'View form',
        'Редактирование группы' : 'Competition editing',
        'Редактирование турнира' : 'Tournament editing',
        'Серый цвет' : 'Grey color',
        'Сохранить' : 'Save',
        'Участники группы' : 'Competition participants',
        'Хеш' : 'Hash',
        'ЧЧ:ММ' : 'HH:MM',
        'Ярким цветом выделены турниры, которые уже есть базе данных. Сравнение идет по IdInternal. Для сохранения турнира заполните все дополнительные поля в диалоговом окне импорта.' : 'Tournaments that are already in the database are highlighted in bright color. Comparison is on IdInternal. To save the tournament fill in all additional fields in the import dialog box.',
        
        'Доступные группы для регистрации.' : 'Available competitions for registration',
        'Выбрано %1 из %2.' : 'Selected %1 from %2.',
        'Чтобы разблокировать вкладку нажмите ″Назад″' : 'To unlock the tab, click on "Back"',
        
        'Заполните / измените остальные поля.':'Fill or modify the other fields.',
        'Вернуться назад' : 'Go back',
        'Данные для передачи в платежную систему' : 'Data for transmission to the payment system',
        'На главную' : 'To home page',
        'Передать данные' : 'Transfer data',
        
        'Оставьте свои отзывы, предложения, замечания!':'Give us your feedback, suggestions, comments!',
        'Регистрация участников невозможна! Статус турнира - "': 'Registration of participants cannot be done! Tournament status - ',
        'Группы турнира': 'Competitions of the tournament',
        'Часть данных получена от WDSF.' : 'Part of data received from WDSF.',
        'Оплачено': 'Paid',
        'Черный цвет - участие в группе оплачено.' : 'Black color - participation in the competition has been paid.',
        'Уникальные участники турнира, всего ':'Unique participants in the tournament, total count ',
        'Регистрация прошла успешно, на данной странице отображены все группы пары/участника в турнире.': 'Registration was successfully completed. This page displays couple/participant competitions in the tournament.',
        'Загрузить' : 'Upload',
        'Обзор' : 'Browse',
        'Выберите файл' : 'Select file',
        'Статистика' : 'Statistics',
        'Спортсменов в БД' : 'Total count athletes in database',
        'Спортсменов ФТСАРР в БД' : 'Total count RFDARR athletes in database',
        'Спортсменов WDSF в БД' : 'Total count WDSF athletes in database',
        'Других спортсменов в БД' : 'Total count other athletes in database',
        'Последнее обновление спортсменов ФТСАРР было' : 'RFDARR athletes last updated',
        'Доступен ФТСАРР':'Available for RFDARR',
        'Доступен WDSF':'Available for WDSF',
        'Доступен другим':'Available for others',
        
        /* 11 oct*/
        'Поиск регистрации' : 'Search registration',
        'Группа в турнире' : 'Competition',
        'Все группы •' : 'All competitions •',
        'Все группы »' : 'All competitions »',
        'Регистрация »' : 'Registration »',
        'Все участники »' : 'All participants »',
        'Все участники •' : 'All participants •',
        'Сейчас Вы на этой странице' : 'You are currently on this page',
        'Регистрация •' : 'Registration •',
        'Результаты регистрации' : 'Registration results',
        'Перейти к списку групп пары / участника для оплаты (' : 'Go to the list of competitions (couple / participant) for payment (',
        'Информация о регистрации в группу' : 'Information on registration in competition',
        'После завершения регистрации перейдите на страницу с группами пары / участника, там вы сможете выбрать необходимые группы и передать данные в платежную систему.' : 'Once registration is complete, go to the page with competitions of couples / participant, where you can select the required competitions and transmit data to the billing system.',
        'Статус пары' : 'Couple status',
        'Возрастная группа пары' : 'Couple age group',
        'Участники группы •' : 'Participants of competition •',
        'Группы участника •' : 'Competitions of participant •',
        'Группы пары •' : 'Competitions of couple •',
        'участника' : 'participant',
        'пары' : 'couple',
        'ФТСАРР' : 'RFDARR',
        'Перейти' : 'Watch',
        'Фамилия спортсмена' : 'Last name',
        'Вы можете найти все группы, в которых зарегистрирован спортсмен. Поиск по всем турнирам.' : 'You can find all competitions in which the registered athlete. Search All tournaments.',
        'Группы, в которых зарегистрирован спортсмен' : 'Competitions in which the registered athlete',
        'Импортировать' : 'Import',
        'Импортировать доступные' : 'Import available items',
        'Ссылка на источник данных:' : 'Link to source of data',
        'Группа' : 'Competition',
        'Возр. гр.' : 'Age group',
        'Выберите дату для активации переключателя' : 'Select date for activate switcher',
        'Дисциплина' : 'Discipline',
        'Соответствующая группа WDSF' : 'Competition WDSF',
        
        ' - участие не оплачено.' : ' - participation is not paid.',
        ' - участие отменено.' : ' - participation is canceled.',
        'Оплачены' : 'Paid',
        'd MMMM' : 'd MMMM',
        'WDSF Controller' : 'WDSF Controller',
        'Возр. группа' : 'Age group',
        'Выберите организатора для доступа к регистрации:' : 'Select an organizer for access to registration:',
        'Группы »' : 'Competitions »',
        'Группы •' : 'Competitions •',
        'Код доступа не найден, переход на страницу для регистрации невозможен.' : 'The access code is not found, a transition to the page for registration is impossible.',
        'Количество оплативших участников' : 'Number of paid participants',
        'Количество оплаченных групп' : 'Number of paid competitions',
        'Нет данных.' : 'No data.',
        'Поиск регистрации участника по фамилии!' : 'Searching registration of athlete by surname',
        'Список всех участников турнира' : 'List of participants of the tournament',
        'Уникальные участники турнира' : 'Unique participants of the tournament',
        'Участники »' : 'Participants »',
        'Участники •' : 'Participants •',
        'Экспорт участников »' : 'Export participants',
        'Всего участников':'Number of participants',
        'уникальных':'unique',
        'Всего': 'Total count',
        
        'Задать вопрос' : 'Ask a question',
        'Инструкция к регистрации' : 'Instructions for registration',
        'Информация о турнире' : 'Tournament info',
        'Информация »' : 'Information »',
        'Перейдите по ссылке для получения подробной информации' : 'Click here for more information',
        'ВАЖНОЕ ОБЪЯВЛЕНИЕ' : 'Important announcement',
        'Зарегистрировать ещё участников »' : 'Register more participants »',
        'Введите номера классификационных книжек ФТСАРР' : 'Enter the number of RFDARR classification books',
        'Введите номера классификационных книжек WDSF' : 'Enter the number of WDSF classification books',
        'Регистрация осуществляется по MIN номерам WDSF. Поиск участников идет по базе данных "World DanceSport Federation".' : 'Registration is performed by MIN numbers WDSF. Search participants in the database of "World DanceSport Federation".',
        'Тренер. Фамилия, Имя' : 'Trainer. Full name',
        'Оплачено участников' : 'Paid participants',
        'Регистрация в турнир завершена. Все платежи запрещены.' : 'Registration in the tournament is completed. All payments are prohibited.',
        'Для всех номинаций кроме \"соло\", стоимость участия указана для пары участников.' : 'For all nominations except \"solo\", the price of participation is for couple of participants.',
        'Для всех номинаций стоимость участия указана для пары участников.' : 'For all competitions price is for couple of participants.',
        'Доступные группы.' : 'Available competitions.',
        'Доп. поля можно не заполнять.' : 'Other fields may be empty.',
        '-- Вкладка по умолчанию --' : '-- Default tab page --',
        'Другие' : 'Others',
        '-- Язык по умолчанию --' : '-- Default language --',
        'Количество доступных мест' : 'The number of tickets available for the participants',
        'Для некоторых групп могут быть введены ограничения. "Доступно мест" это "Лимит" минус "Количество проданных билетов".' : 'Some competition may be restrictions. "Available" this "Limit" minus "Number of tickets sold."',
        'Группы, в которых не осталось мест(0) закрыты для регистрации и продажи билетов.' : 'Competitions in which there is no available tickets (0) closed to registration and ticket sales.',
        'Осталось мест' : 'Available',
        'Перейти на сайт ФТСАРР' : 'Go to RFDARR site',
        'Регистрация осуществляется по номерам классификационных книжек и на основании информации' : 'Registration is carried by numbers and classification of books based on the information',
        'Базы данных спортсменов "ФТСАРР"' : 'Databases athletes "RFDARR"',
        'на момент регистрации.' : 'at the time of registration.',
        'Выберите номинации' : 'Select competitions',
        'Класс ST, LA' : 'ST, LA class',
        'Оплата отключена' : 'Payment is disabled',
        'Все классы' : 'All classes',

        'Настройки вкладки - Регистрация ФТСАРР' : 'Tab settings - Registration RFDARR',
        'Настройки вкладки - Регистрация WDSF' : 'Tab settings - Registration WDSF',
        'Настройки вкладки - Регистрация других' : 'Tab settings - Registration other participants',
        'Система оплаты и валюта' : 'Payment system and currency',
        'Служебные параметры' : 'Service parametrs',
        'Информация о турнире (название ссылки)' : 'Tournament info (name of link)',
        'Ссылка на информацию' : 'Tournament info - Link',
        'Доп. информация (название ссылки)' : 'Additional trn/ info (name of link)',
        'Ссылка на доп. информацию' : 'Addit. trn. info link',
        'Инструкция к регистрации, ссылка' : 'Instruction link',
        'Вкладка доступна для ФТСАРР' : 'Allowed for RFDARR',
        'Вкладка доступна для WDSF' : 'Allowed for WDSF',
        'Название вкладки' : 'Name of tab',
        'Вкладка доступна для других участников' : 'Allowed for other participants',
        'Система оплаты' : 'Payment system',
        'Валюта' : 'Currency',
        'Доступ к экспорту' : 'Access to export',
        'Сформировать ссылку' : 'Make link',
        'Список всех участников' : 'All participants list',
        'Только оплатившие участники' : 'Only paid participants',
        'Измените или оставьте значения по умолчанию' : 'Change or do nothing',
        'Экспорт' : 'Export',
        'Перейдите по ссылки' : 'Move to link',
        'Категория (Pro-Am)' : 'Category (Pro-Am)' 



 

  },
  toRussian: {
  },
  toDeutsch: {
        'Оплата отключена' : 'Die Zahlung ist deaktiviert',
        'Зарегистрировать ещё группы': 'Registrieren Mehr Gruppe',
        'Регистрация выполнена.': 'Die Registrierung ist abgeschlossen.',
        'Регистрация не выполнена.': 'Registrierung fehlgeschlagen.',
        'Обнаружены конфликтные группы для участника' : 'Gefunden Konfliktgruppen zu feiern',
        'Место проведения':'Austragungsort',
      
        ' - участие в группе не оплачено.' : ' - teilnahme an der gruppe ist nicht bezahlt.',
        ' - участие в группе отменено.'    : ' - teilnahme an der gruppe abgebrochen.',
        'Cписок всех групп »' : 'Liste aller gruppen »',
        'd MMMM y'            : 'd MMMM y',
        'В списке не отображены группы, в которых данная пара уже зарегистрирована.' : 'Die liste wird nicht angezeigt, gruppen, in denen dieses paar bereits registriert ist.',
        'Ваш email' : 'Ihre E-Mail',
        'Ваше имя' : 'Ihr Name',
        'Веб-сайт организатора' : 'Webseite veranstalter',
        'Вернуться назад' : 'Zurück',
        'Внимание!': 'Achtung!',
        'Возрастная группа' : 'Altersgruppe',
        'Возрастные группы' : 'Altersgruppen',
        'Время' : 'Zeit',
        'Все группы': 'Alle gruppen',
        'Все дни' : 'Alle tage',
        'Всего групп' : 'Insgesamt gruppen',
        'Всего участников / уникальных' : 'Anzahl der teilnehmer / unique',
        'Вход' : 'Eingang',
        'Выберите год и турнир. Ярким синим цветом выделены группы, которые уже есть базе данных. Сравнение идет по IdInternal. Красным выделены группы с ошибками, их можно исправить.' : 'Wählen Sie jahr und das turnier. Helles Blau hervorgehoben gruppen, die bereits über eine datenbank. Der vergleich ist auf IdInternal. In der roten gruppe mit fehlern hervorgehoben korrigiert werden.',
        'Выберите группы!' : 'Wählen sie die gruppe!',
        'Выберите турнир для отображения подробной информации.' : 'Wählen sie ein turnier, um detaillierte informationen anzuzeigen.',
        'Выберите файл' : 'Wählen sie die datei',
        'Выбрано %1 из %2.' : 'Registriert %1 / %2.',
        'Выбрано' : 'Registriert',
        'Выход' : 'Beenden',
        'Главный тренер' : 'Head coach',
        'Год' : 'Jahr',
        'Город' : 'Stadt',
        'Город, Страна' : 'Stadt, Land',
        'Готово!': 'Fertig!',
        'групп из' : 'gruppen von',
        'Группы' : 'Gruppen',
        'Группы пары' : 'Gruppen paare',
        'Группы турнира': 'Gruppen turnier',
        'Группы участника' : 'Benutzergruppen',
        'Группы, доступные для импорта' : 'Gruppen für den import verfügbar',
        'Далее' : 'Weiter',
        'Данные для передачи в платежную систему' : 'Daten zur Übertragung zu dem abrechnungssyste',
        'Дата' : 'Datum',
        'Дата начала / окончания' : 'Datum von start / ende',
        'Дата начала' : 'Startdatum',
        'Дата окончания' : 'Verfallsdatum',
        'Дата рождения' : 'Geburtsdatum',
        'Детально' : 'In details',
        'Для просмотра списка всех групп турнира нажмите на ссылку (») в колонке "Группы" или выберите внизу вкладку "Группы(N)".' : 'Um eine liste mit allen gruppen des turniers zu sehen, klicken sie auf den link (») in der spalte "Gruppen" reiter an der unterseite, oder wählen sie "Gruppe (N)".',
        'Для просмотра списка всех участников турнира нажмите на ссылку (») в колонке "Участники".' : 'Um eine liste aller spieler im turnier zu sehen, klicken Sie auf den link (») in der spalte "Mitglieder."',
        'Для просмотра списка участников группы нажмите на ссылку (») в колонке "Участники".' : 'Um eine liste der gruppen anzuzeigen, klicken sie auf den Link (») in der spalte "Mitglieder".',
        'Для регистрации в \"соло\" заполните только одно поле.' : 'Um sich für den \"solo\" registrieren füllen sie nur ein feld.',
        'Для регистрации в \"соло\" нажмите на переключатель.' : 'Um sich für den \"solo\" drücken sie den Schalter registrieren.',
        'Для регистрации в турнире нажмите на ссылку (») в колонке "Регистрация".' : 'Um sich für das turnier zu registrieren, klicken sie auf den link (») in der spalte "Datum".',
        'Добавить' : 'Hinzufügen',
        'Дополнительная информация' : 'Zusätzliche informationen',
        'Доступные группы для регистрации.' : 'Verfügbar für gruppenanmeldungen.',
        'Доступные для импорта турниры' : 'Verfügbar für import-turniere',
        'Другие тренеры' : 'Andere trainer',
        'Других спортсменов в БД' : 'Andere athleten in der datenbank',
        'Женский' : 'Weiblich',
        'Заголовок' : 'Kopfzeile',
        'Загрузить' : 'Herunterladen',
        'Загрузка групп в турнир' : 'Download-gruppen im turnier',
        'Заполните / измените остальные поля.':'Füllen / ändern sie die anderen felder.',
        'Зарегистрировать' : 'Buch',
        'Идет загрузка групп...' : 'Lädt gruppen...',
        'Идет загрузка данных...' : 'Daten werden geladen...',
        'из' : 'von',
        'Изменить' : 'ändern',
        'Импорт' : 'Importe',
        'Имя' : 'Name',
        'Информация' : 'Information',
        'Класс' : 'Klasse',
        'Классы' : 'Klassen',
        'Клуб / Город' : 'Verein / Stadt',
        'Клуб' : 'Verein',
        'Конфликтные группы для ' : 'Widersprüchliche gruppen',
        'Конфликтные группы участника - это группы из других турниров, в которых зарегистрирован участник. Дата конфликтной группы совпадает с одной из дат групп выбранного турнира(заголовок сверху). Публикация списка конфликтных групп предназначена лишь для информирования участников.' : 'Widersprüchliche Benutzergruppen - diese Gruppe von anderen Turnieren, in denen die Teilnehmer registriert ist. Datum Konflikt Gruppe fällt mit einer der Gruppen ausgewählte Termine des Turniers (Titel oben). Veröffentlichung der Liste der Konfliktgruppen soll nur um die Teilnehmer zu informieren.',
        'Коротко' : 'Kurz',
        'Ла: ' : 'La:',
        'Макс.' : 'Max.',
        'Международный' : 'International',
        'Мужской' : 'Männlich',
        'На главную' : 'Zuhause',
        'Нажмите на ссылку (») в колонке "Группы" для просмотра списка групп турнира, в которых зарегистрирована пара (участник).' : 'Klicken Sie auf den link (») in der spalte "Gruppen", um die liste des turniers, in dem das Paar registriert (Mitglied) anzuzeigen.',
        'Нажмите на ссылку в колонке "Группы" для просмотра списка групп турнира, в которых зарегистрирована пара (участник).' : 'Klicken Sie auf den link in der spalte "Gruppen", um die Liste des Turniers, in dem das Paar registriert (Mitglied) anzuzeigen.',
        'Назад' : 'Zurück',
        'Название' : 'Titel',
        'Нашли ошибку в работе системы? Что-то не нравится? Пожалуйста, напишите нам Ваши замечания и предложения.' : 'Sie einen Fehler gefunden im system? Etwas nicht gefällt? Mailen sie uns Ihre kommentare und vorschläge bitte.',
        'Не оплачено' : 'Nicht bezahlt',
        'Нет доступных групп.' : 'Keine gruppen zur verfügung.',
        'Номер WDSF' : 'Numero WDSF',
        'Номер партнера' : 'Numero männer',
        'Номер партнерши' : 'Numero frau',
        'Номер ФТСАРР' : 'Numero RFDARR',
        'Номера классификационных книжек WDSF' : 'Nicht einstufung der bücher WDSF',
        'Номера классификационных книжек ФТСАРР' : 'Nicht Einstufung Bücher RFDARR',
        'Обзор' : 'Überblick',
        'Обратная связь' : 'Feedback',
        'Оплатить на danceplat.ru' : 'Zahlen Sie danceplat.ru',
        'Оплачено': 'Bezahlt',
        'Организатор' : 'Veranstalter',
        'Оставьте свои отзывы, предложения, замечания!':'Geben sie uns ihr feedback, anregungen, kommentare!',
        'Открыть для просмотра' : 'Einen blick',
        'Открыть список групп' : 'Sehen sie sich eine liste der gruppen',
        'Открыть список групп, в которых зарегистрирована пара' : 'Sehen sie sich eine liste von gruppen, in denen das paar registriert',
        'Открыть список участников' : 'Sehen sie sich eine liste der teilnehmer',
        'Открыть список участников группы' : 'Sehen sie sich eine liste der gruppenmitglieder',
        'Отмена' : 'Stornierung',
        'Отображать дополнительные столбцы' : 'Zeigen sie zusätzliche spalten',
        'Отправить' : 'Senden',
        'Оформить »' : 'Inhalt »',
        'Оформить регистрацию' : 'Machen anmeldung',
        'Очистить' : 'Reinigen',
        'Пара' : 'Paar',
        'Партнер / Партнерша' : 'Männer / Frauen',
        'Партнер / партнерша' : 'Männer / Frauen',
        'Партнер' : 'Männer',
        'Партнерша' : 'Frauen',
        'Первая страница' : 'Startseite',
        'Передать данные' : 'Übertragen von daten',
        'Перейти к списку групп пары / участника (' : 'Zurück zur liste gruppen paare / teilnehmer (',
        'Подтверждение регистрационных данных' : 'Bestätigung der registrierungsdaten',
        'Поиск' : 'Suche',
        'Поиск в столбце': 'Suchen spalte',
        'Показать ошибки' : 'Fehler anzeigen',
        'Пол' : 'Geschlecht',
        'Поля отмеченные * обязательны для заполнения.' : 'Mit * gekennzeichnete felder sind pflichtfelder.',
        'После завершения регистрации произойдет передача данных в danceplat.ru, по прошествии некоторого времени после завершения оплаты ваши данные отобразятся в регистрационных списках.' : 'Nach abschluss der registrierung der datenübertragung auftreten danceplat.ru, für einige zeit nach dem abschluss ihrer zahlungsdaten in den meldelisten angezeigt.',
        'После завершения регистрации произойдет переход на страницу с группами пары, там вы сможете выбрать необходимые группы и перейти к оплате.' : 'Nach abschluss der registrierung der datenübertragung auftreten danceplat.ru, für einige zeit nach dem abschluss ihrer zahlungsdaten in den meldelisten angezeigt',
        'Последнее обновление спортсменов ФТСАРР было' : 'Letztes update war RFDARR athleten',
        'Последняя страница' : 'Letzte seite',
        'Лимит' : 'Limit',
        'Предыдущая страница' : 'Vorherige seite',
        'Программа' : 'Programm',
        'Просмотр формы' : 'Formularvorschau',
        'Размер страницы':'Seitengröße',
        'Ранг' : 'Rang',
        'Регистрация' : 'Registrierung',
        'Регистрация WDSF' : 'Registrierung WDSF',
        'Регистрация других участников' : 'Registrierung sie mit anderen mitgliedern',
        'Регистрация осуществляется по WDSF номерам. Поиск участников идет по базе данных "World DanceSport Federation".' : 'Registrierung wird von WDSF-Nummer. Mitgliederbörse ist auf datenbank "World Dancesport Federation".',
        'Регистрация осуществляется по номерам классификационных книжек и на основании информации Базы данных спортсменов "Союза танцевального спорта России" на момент регистрации.' : 'Die Anmeldung erfolgt durch Zahlen und Klassifizierung der Bücher auf der Grundlage der Informationen vorgenommen, Datenbanken Athleten Union Dancesport Russland bei der Registrierung.',
        'Регистрация прошла успешно, на данной странице отображены все группы пары/участника в турнире.': 'Die registrierung ist erfolgreich, zeigt dieser seite alle paare gruppen / teilnehmer im turnier.',
        'Регистрация ФТСАРР' : 'Registrierung RFDARR',
        'Регистрация участников »' : 'Registrierung der Teilnehmer »',
        'Регистрация участников на турнир' : 'Registrierung für das turnier',
        'Регистрация участников невозможна! Статус турнира - "': 'Registrierung der teilnehmer ist nicht möglich! Cupstatus - "',
        'Регистрация участников по WDSF номерам' : 'Registrierung der teilnehmer an WDSF-Nummern',
        'Регистрация участников по ФТСАРР номерам' : 'Registrierung der teilnehmer an RFDARR-Nummern',
        'Редактирование группы' : 'Bearbeiten einer gruppe',
        'Редактирование турнира' : 'Bearbeiten turnier',
        'Режим' : 'Modus',
        'Серый цвет' : 'Grau',
        'Система регистрации' : 'Aufnahmesystem',
        'Скрывать дополнительные столбцы' : 'Zusätzliche spalten ausblenden',
        'Соло' : 'Solo',
        'Сообщение' : 'Nachricht',
        'Сохранить' : 'Sparen',
        'Список всех групп турнира' : 'Liste aller gruppen des turniers',
        'Список всех уникальных участников турнира' : 'Liste aller einzigartige turnierteilnehmer',
        'Список всех участников »' : 'Liste aller teilnehmer »',
        'Спортсменов WDSF в БД' : 'WDSF-Athleten in DB',
        'Спортсменов в БД' : 'Athleten in DB',
        'Спортсменов ФТСАРР в БД' : 'RFDARR-Athleten in DB',
        'Справочники' : 'Verzeichnisse',
        'Ст: ' : 'St:',
        'Статистика' : 'Statistiken',
        'Статус' : 'Status',
        'Страна' : 'Land',
        'Страница' : 'Seite',
        'Тема сообщения' : 'Vorbehaltlich ',
        'Тип' : 'Typ ',
        'Тренер #1. Фамилия, Имя' : 'Coach Nr. 1. Nachname',
        'Тренер #2. Фамилия, Имя' : 'Coach Nr. 2. Nachname',
        'Тренер(ы)' : 'Trainer',
        'Тренеры' : 'Trainer ',
        'Турнир' : 'Turnier ',
        'Турниры' : 'Turniere ',
        'Удалить' : 'Entfernen',
        'Уникальные участники турнира, всего ':'Einzigartige teilnehmer im turnier, nur',
        'Участник' : 'Party',
        'Участники' : 'Die teilnehmer',
        'Участники группы' : 'Gruppenmitglieder',
        'Участники ФТСАРР' : 'Teilnehmer RFDARR',
        'Фамилия' : 'Nachname',
        'Фамилия, Имя' : 'Nachname, Vorname',
        'Фильтр: Ранг турнира' : 'Filter: Rang turnier',
        'Фильтр: Статус турнира' : 'Filter: Wettbewerbsstatus',
        'Форма обратной связи' : 'Feedback-formular',
        'Хеш' : 'Hasch',
        'Цена' : 'Preis',
        'руб.':'rub.',
        'Часть данных получена от WDSF.' : 'Ein teil der von der WDSF erhaltenen daten.',
        'Черный цвет - участие в группе оплачено.' : 'Schwarz - die teilnahme an der gruppe bezahlt.',
        'Чтобы разблокировать вкладку нажмите ″Назад″' : 'Um die registerkarte entsperren, klicken sie auf "Zurück"',
        'ЧЧ:ММ' : 'SS:MM',
        'Щелчком мыши выберите группы, в которые необходимо зарегистрировать пару.' : 'Klicken Sie auf die gruppen, zu denen müssen sie paar registrieren auswählen.',
        'Щелчком мыши выберите необходимые группы для передачи данных в платежную систему.' : 'Klicken sie auf die gewünschte gruppe für die datenübertragung an das zahlungssystem auszuwählen.',
        'Язык' : 'Sprache',
        'Язык системы' : 'System sprache',
        'Ярким цветом выделены турниры, которые уже есть базе данных. Сравнение идет по IdInternal. Для сохранения турнира заполните все дополнительные поля в диалоговом окне импорта.' : 'Helle farbe zuordnet turnieren, die bereits eine datenbank ist. Der vergleich ist auf IdInternal. Um das turnier zu füllen sie alle zusätzlichen felder in der importdialog zu speichern.',
        
        'Задать вопрос' : 'Frage stellen',
        'Инструкция к регистрации' : 'Hinweise für die registrierung',
        'Информация о турнире' : 'Turnier-info',
        'Информация »' : 'Information »',
        
        
        /* 11 oct*/
        'Поиск регистрации' : 'Search registration',
        'Группа в турнире' : 'Competition',
        'Все группы •' : 'All competitions •',
        'Все группы »' : 'All competitions »',
        'Регистрация »' : 'Registration »',
        'Все участники »' : 'All participants »',
        'Все участники •' : 'All participants •',
        'Сейчас Вы на этой странице' : 'You are currently on this page',
        'Регистрация •' : 'Registration •',
        'Результаты регистрации' : 'Registration results',
        'Перейти к списку групп пары / участника для оплаты (' : 'Go to the list of competitions (couple / participant) for payment (',
        'Информация о регистрации в группу' : 'Information on registration in competition',
        'После завершения регистрации перейдите на страницу с группами пары / участника, там вы сможете выбрать необходимые группы и передать данные в платежную систему.' : 'Once registration is complete, go to the page with competitions of couples / participant, where you can select the required competitions and transmit data to the billing system.',
        'Статус пары' : 'Couple status',
        'Возрастная группа пары' : 'Couple age group',
        'Участники группы •' : 'Participants of competition •',
        'Группы участника •' : 'Competitions of participant •',
        'Группы пары •' : 'Competitions of couple •',
        'участника' : 'participant',
        'пары' : 'couple',
        'ФТСАРР' : 'RFDARR',
        'Перейти' : 'Watch',
        'Фамилия спортсмена' : 'Last name',
        'Вы можете найти все группы, в которых зарегистрирован спортсмен. Поиск по всем турнирам.' : 'You can find all competitions in which the registered athlete. Search All tournaments.',
        'Группы, в которых зарегистрирован спортсмен' : 'Competitions in which the registered athlete',
        'Импортировать' : 'Import',
        'Импортировать доступные' : 'Import available items',
        'Ссылка на источник данных:' : 'Link to source of data',
        'Группа' : 'Competition',
        'Возр. гр.' : 'Age group',
        'Выберите дату для активации переключателя' : 'Select date for activate switcher',
        'Дисциплина' : 'Discipline',
        'Соответствующая группа WDSF' : 'Competition WDSF',
        
        ' - участие не оплачено.' : ' - participation is not paid.',
        ' - участие отменено.' : ' - participation is canceled.',
        'Оплачены' : 'Paid',
        'd MMMM' : 'd MMMM',
        'WDSF Controller' : 'WDSF Controller',
        'Возр. группа' : 'Age group',
        'Выберите организатора для доступа к регистрации:' : 'Select an organizer for access to registration:',
        'Группы »' : 'Competitions »',
        'Группы •' : 'Competitions •',
        'Код доступа не найден, переход на страницу для регистрации невозможен.' : 'The access code is not found, a transition to the page for registration is impossible.',
        'Количество оплативших участников' : 'Number of paid participants',
        'Количество оплаченных групп' : 'Number of paid competitions',
        'Нет данных.' : 'No data.',
        'Поиск регистрации участника по фамилии!' : 'Searching registration of athlete by surname',
        'Список всех участников турнира' : 'List of participants of the tournament',
        'Уникальные участники турнира' : 'Unique participants of the tournament',
        'Участники »' : 'Participants »',
        'Участники •' : 'Participants •',
        'Экспорт участников »' : 'Export participants',
        'Перейдите по ссылке для получения подробной информации' : 'Klicken Sie hier für weitere Informationen',
        'ВАЖНОЕ ОБЪЯВЛЕНИЕ' : 'Wichtige mitteilung',
        'Зарегистрировать ещё участников »' : 'Registrieren Sie sich mehr Teilnehmer »',
        'Введите номера классификационных книжек ФТСАРР' : 'Geben Sie die Nummer Einstufung Bücher RFDARR',
        'Введите номера классификационных книжек WDSF' : 'Geben Sie die Nummer Einstufung Bücher WDSF',
        'Регистрация осуществляется по MIN номерам WDSF. Поиск участников идет по базе данных "World DanceSport Federation".' : 'Die Anmeldung erfolgt durch MIN Zahlen WDSF getan. Suche Mitglieder ist die Datenbank "World Dance Sport Federation"',
        'Тренер. Фамилия, Имя' : 'Coach. Nachname Vorname',
        'Оплачено участников' : 'Paid participants',
        'Регистрация в турнир завершена. Все платежи запрещены.' : 'Registration in the tournament is completed. All payments are prohibited.',
        'Для всех номинаций кроме \"соло\", стоимость участия указана для пары участников.' : 'For all nominations except \"solo\", the price of participation is for couple of participants.',
        'Для всех номинаций стоимость участия указана для пары участников.' : 'For all competitions price is for couple of participants.',
        'Доступные группы.' : 'Available competitions.',
        'Доп. поля можно не заполнять.' : 'Other fields may be empty.',
    '-- Вкладка по умолчанию --' : '-- Default tab page --',
    'Другие' : 'Others',
    '-- Язык по умолчанию --' : '-- Default language --',
    'Количество доступных мест' : 'The number of tickets available for the participants',
    'Для некоторых групп могут быть введены ограничения. "Доступно мест" это "Лимит" минус "Количество проданных билетов".' : 'Some competition may be restrictions. "Available" this "Limit" minus "Number of tickets sold."',
    'Группы, в которых не осталось мест(0) закрыты для регистрации и продажи билетов.' : 'Competitions in which there is no available tickets (0) closed to registration and ticket sales.',
    'Осталось мест' : 'Available',
    
    'Перейти на сайт ФТСАРР' : 'Go to RFDARR site',
    'Регистрация осуществляется по номерам классификационных книжек и на основании информации' : 'Registration is carried by numbers and classification of books based on the information',
    'Базы данных спортсменов "Союза танцевального спорта России"' : 'Databases athletes "Union DanceSport of Russia"',
    'на момент регистрации.' : 'at the time of registration.',
    'Выберите номинации' : 'Select competitions',
    'Класс ST, LA' : 'ST, LA class',
    'Регистрация закрыта':'Registration is closed',

    'Настройки вкладки - Регистрация ФТСАРР' : 'Tab settings - Registration RFDARR',
    'Настройки вкладки - Регистрация WDSF' : 'Tab settings - Registration WDSF',
    'Настройки вкладки - Регистрация других' : 'Tab settings - Registration other participants',
    'Система оплаты и валюта' : 'Payment system and currency',
    'Служебные параметры' : 'Service parametrs',
    'Информация о турнире (название ссылки)' : 'Tournament info (name of link)',
    'Ссылка на информацию' : 'Tournament info - Link',
    'Доп. информация (название ссылки)' : 'Additional trn/ info (name of link)',
    'Ссылка на доп. информацию' : 'Addit. trn. info link',
    'Инструкция к регистрации, ссылка' : 'Instruction link',
    'Вкладка доступна для ФТСАРР' : 'Allowed for RFDARR',
    'Вкладка доступна для WDSF' : 'Allowed for WDSF',
    'Название вкладки' : 'Name of tab',
    'Вкладка доступна для других участников' : 'Allowed for other participants',
    'Система оплаты' : 'Payment system',
    'Валюта' : 'Currency',
    'Доступ к экспорту' : 'Access to export',
    'Сформировать ссылку' : 'Make link',
    'Список всех участников' : 'All participants list',
    'Только оплатившие участники' : 'Only paid participants',
    'Измените или оставьте значения по умолчанию' : 'Change or do nothing',
    'Экспорт' : 'Export',
    'Перейдите по ссылки' : 'Move to link',
    'Категория (Pro-Am)' : 'Category (Pro-Am)' 

  },
  toItalian: {
    'Оплата отключена' : 'Il pagamento è disattivato',
    'Зарегистрировать ещё группы': 'Registrati altro gruppo',
    'Регистрация выполнена.': 'La registrazione è completa.',
    'Регистрация не выполнена.': 'Registrazione fallita.',
    'Обнаружены конфликтные группы для участника' : 'Gruppi in conflitto trovati al partito',
    'Место проведения':'Sede',
    'Размер страницы' : 'Dimensioni pagina',
    'Поиск в столбце' : 'Cerca nella colonna',
    'Все группы' : 'Tutti i gruppi',
    'Внимание!' : 'Attenzione Prego!',
    'Готово!' : 'Fatto!',
    'Язык системы' : 'Lingua del sistema',
    'd MMMM y' : 'd MMMM y',
    'В списке не отображены группы, в которых данная пара уже зарегистрирована.' : 'L\'elenco non è visualizzato gruppi in cui questa coppia è già registrato.',
    'Ваш email' : 'La tua email',
    'Ваше имя' : 'Il tuo nome',
    'Веб-сайт организатора' : 'Il sito web dell\'organizzatore',
    'Возрастная группа' : 'Fascia d\'età',
    'Возрастные группы' : 'Classi di età',
    'Время' : 'PERIODO DI',
    'Все дни' : 'Tutti i giorni',
    'Всего групп' : 'Tutti i gruppi',
    'Всего участников / уникальных' : 'Numero di partecipanti / unica',
    'Вход' : 'Ingresso',
    'Выберите группы!' : 'Selezionare il gruppo!',
    'Выберите турнир для отображения подробной информации.' : 'Scegli il torneo per visualizzare le informazioni dettagliate.',
    'Выбрано' : 'Congiunto',
    'Главный тренер' : 'Capo allenatore',
    'Город' : 'Una Città',
    'Город, Страна' : 'Città, Paese',
    'групп из' : 'gruppi di',
    'Группы' : 'Gruppi',
    'Группы пары' : 'Gruppo coppia',
    'Группы участника' : 'Gruppi di utenti',
    'Далее' : 'Più Avanti',
    'Дата' : 'La Data',
    'Дата начала / окончания' : 'Data inizio / fine',
    'Дата начала' : 'Data di inizio',
    'Дата окончания' : 'Data di scadenza',
    'Дата рождения' : 'Data di nascita',
    'Детально' : 'Nel dettaglio',
    'Программа' : 'Programma',

    'Для просмотра списка всех групп турнира нажмите на ссылку (») в колонке "Группы" или выберите внизу вкладку "Группы(N)".' : 
    'Per visualizzare l\'elenco di tutti i gruppi del torneo cliccare sul link (») in "gruppi" scheda nella parte inferiore, oppure selezionare "Gruppi(N)".',

    'Для просмотра списка всех участников турнира нажмите на ссылку (») в колонке "Участники".' : 
    'Per visualizzare un elenco di tutti i partecipanti del torneo cliccare sul link (») nella sezione "Partecipanti".',

    'Для просмотра списка участников группы нажмите на ссылку (») в колонке "Участники".' : 
    'Per un elenco dei membri del gruppo, fare clic sul link (») nella sezione "Partecipanti".',

    'Для регистрации в "соло" заполните только одно поле.' : 
    'Per iscriversi al "solo" riempire un solo campo.',

    'Для регистрации в турнире нажмите на ссылку (») в колонке "Регистрация".' : 
    'Per iscriversi al torneo cliccare sul link (») nel "Registro".',

    'Для регистрации в "соло" нажмите на переключатель.' : 
    'Per registrarti per la stampa "solo" l\'interruttore.',

    'Добавить' : 'Aggiungere',
    'Дополнительная информация' : 'Maggiori informazioni',
    'Другие тренеры' : 'Altri allenatori',
    'Женский' : 'Femminile',
    'Зарегистрировать' : 'Libro',
    'Идет загрузка групп...' : 'Caricamento gruppi ...',
    'Идет загрузка данных...' : 'Caricamento dei dati ...',
    'из' : 'dal',
    'Изменить' : 'Cambiare',
    'Импорт' : 'Importazioni',
    'Имя' : 'Nome',
    'Информация' : 'Informazioni',
    'Класс' : 'La Classe',
    'Классы' : 'Classi',
    'Клуб / Город' : 'Club / Città',
    'Клуб' : 'Club',
    'Конфликтные группы для ' : 'Gruppi in conflitto a',

    'Конфликтные группы участника - это группы из других турниров, в которых зарегистрирован участник. Дата конфликтной группы совпадает с одной из дат групп выбранного турнира (заголовок сверху). Публикация списка конфликтных групп предназначена лишь для информирования участников.' : 
    'Gruppi di utenti in conflitto - un gruppo di altri tornei, in cui il partecipante è registrato. Data di gruppi in conflitto coincide con uno dei gruppi selezionati date del torneo (titolo di cui sopra). Pubblicare un elenco di gruppi in conflitto hanno il solo scopo di informare i partecipanti.',

    'Коротко' : 'Breve',
    'Ла: ' : 'La: ',
    'Мужской' : 'Uomo',
    'Нажмите на ссылку в колонке "Группы" для просмотра списка групп турнира, в которых зарегистрирована пара (участник).' : 
    'Clicca sul link nella sezione "Gruppi" per visualizzare l\'elenco del torneo, in cui la coppia è registrata (membro).',

    'Назад' : 'Fa',
    'Название' : 'Il Nome',
    'Нашли ошибку в работе системы? Что-то не нравится? Пожалуйста, напишите нам Ваши замечания и предложения.' : 'Trovato un bug nel sistema? Qualcosa non va? Vi preghiamo di inviarci i vostri commenti e suggerimenti.',
    'Не оплачено' : 'Non pagato',
    'Нет доступных групп.' : 'Non ci sono gruppi.',
    'Номер WDSF' : 'Numero WDSF',
    'Номер партнера' : 'Numero Partner',
    'Номер партнерши' : 'Partner Number',
    'Номер ФТСАРР' : 'Numero STSR',
    'Номера классификационных книжек WDSF' : 'Non classificazione dei libri WDSF',
    'Номера классификационных книжек ФТСАРР' : 'Non classificazione dei libri STSR',
    'Обратная связь' : 'Retroazione',
    'Оплатить на danceplat.ru' : 'Pagare per danceplat.ru',
    'Организатор' : 'Organizzatore',
    'Открыть для просмотра' : 'Aperto per la visualizzazione',
    'Открыть список групп' : 'Visualizzare un elenco di gruppi',
    'Открыть список групп, в которых зарегистрирована пара' : 'Visualizzare un elenco di gruppi in cui la coppia è registrato',
    'Открыть список участников' : 'Visualizzare un elenco di partecipanti',
    'Открыть список участников группы' : 'Guarda l\'elenco dei membri del gruppo',
    'Отмена' : 'Cancellazione',
    'Отображать дополнительные столбцы' : 'Visualizzare colonne aggiuntive',
    'Отправить' : 'Inviare',
    'Оформить »' : 'Contenuti »',
    'Оформить регистрацию' : 'Contenuti registrazione',
    'Очистить' : 'Pulito',
    'Пара' : 'La Coppia',
    'Партнер / Партнерша' : 'Male / Female',
    'Партнер' : 'Male',
    'Партнерша' : 'Female',
    'Первая страница' : 'Prima pagina',
    'Перейти к списку групп пары / участника (' : 'Torna alla lista dei gruppi coppie / attore (',
    'Подтверждение регистрационных данных' : 'La conferma dei dati di registrazione',
    'Поиск' : 'Ricerca',
    'Пол' : 'Paul',
    'Поля отмеченные * обязательны для заполнения.' : 'I campi contrassegnati con * sono obbligatori.',
    'После завершения регистрации произойдет передача данных в danceplat.ru, по прошествии некоторого времени после завершения оплаты ваши данные отобразятся в регистрационных списках.' : 'Dopo aver completato la registrazione trasferirà danceplat.ru dati, dopo qualche tempo dopo il pagamento dei vostri dati è visualizzata in elenchi di registrazione.',
    'После завершения регистрации произойдет переход на страницу с группами пары, там вы сможете выбрать необходимые группы и перейти к оплате.' : 'Dopo la registrazione è completa, si muove alla pagina con i gruppi coppia, non ci è possibile selezionare il gruppo desiderato e andare al pagamento.',
    'Последняя страница' : 'Ultima pagina',
    'Предыдущая страница' : 'Pagina precedente',
    'Ранг' : 'Rango',
    'Регистрация' : 'Check In',
    'Регистрация WDSF' : 'Registrati WDSF',
    'Регистрация других участников' : 'Registrazione di altri partecipanti',
    'Регистрация осуществляется по WDSF номерам. Поиск участников идет по базе данных "World DanceSport Federation".' : 'La registrazione è fatto da numeri WDSF. Cerca Utenti è il database "World DanceSport Federazione".',
    'Регистрация осуществляется по номерам классификационных книжек и на основании информации Базы данных спортсменов "Союза танцевального спорта России" на момент регистрации.' : 'La registrazione è effettuata dal numero di libri e di classificazione in base alle informazioni Banche dati degli atleti dell\' Unione DanceSport Russia "al momento della registrazione.',
    'Регистрация ФТСАРР' : 'Registrati STSR',
    'Регистрация участников »' : 'Registrazione dei partecipanti "',
    'Регистрация участников на турнир' : 'L\'iscrizione al torneo',
    'Регистрация участников по WDSF номерам' : 'Registrazione dei partecipanti ai numeri WDSF',
    'Регистрация участников по ФТСАРР номерам' : 'Registrazione dei partecipanti per i numeri STSR',
    'Режим' : 'Modo',
    'Система регистрации' : 'Sistema di registrazione',
    'Скрывать дополнительные столбцы' : 'Nascondi colonne aggiuntive',
    'Следующая страника' : 'Successivo stranika',
    'Соло' : 'Assolo',
    'Сообщение' : 'Il Messaggio',
    'Список всех групп турнира' : 'Vedi tutti i gruppi del torneo',
    'Список всех уникальных участников турнира' : 'Elenco di tutti i partecipanti al torneo unici',
    'Список всех участников »' : 'Elenco di tutti i partecipanti "',
    'Справочники' : 'Riferimento',
    'Ст: ' : 'St: ',
    'Статус' : 'Lo stato',
    'Страна' : 'Paese',
    'Страница' : 'La Pagina',
    'Тема сообщения' : 'Soggetto del messaggio',
    'Тип' : 'Tipo Di',
    'Тренер #1. Фамилия, Имя' : 'Coach # 1. Cognome Nome',
    'Тренер #2. Фамилия, Имя' : 'Coach # 2. Cognome Nome',
    'Тренер(ы)' : 'L\'allenatore (s)',
    'Тренеры' : 'Formatori',
    'Турнир' : 'Torneo',
    'Турниры' : 'Tornei',
    'Удалить' : 'Rimuovere',
    'Участник' : 'Partito',
    'Участники' : 'Partecipanti',
    'Участники ФТСАРР' : 'Partecipanti STSR',
    'Фамилия' : 'Cognome',
    'Фамилия, Имя' : 'Cognome Nome',
    'Фильтр: Ранг турнира' : 'Filtro: Classifica torneo',
    'Фильтр: Статус турнира' : 'Ordina per: Titolo Tournament',
    'Форма обратной связи' : 'Modulo di feedback',
    'Цена' : 'Price',
    'руб.':'rub.',
    'Щелчком мыши выберите группы, в которые необходимо зарегистрировать пару.' : 'Fare clic per selezionare il gruppo a cui si desidera registrare coppia.',
    'Щелчком мыши выберите необходимые группы для передачи данных в платежную систему.' : 'Fare clic per selezionare la banda desiderata per trasmettere i dati al sistema di pagamento.',
    'Язык' : 'La Lingua',
    ' - участие в группе не оплачено.' : ' - La partecipazione al gruppo non viene pagato.',
    ' - участие в группе отменено.' : ' - Partecipazione al gruppo annullata.',
    'Cписок всех групп »' : 'Elencare tutti i gruppi »',
    'Выберите год и турнир. Ярким синим цветом выделены группы, которые уже есть базе данных. Сравнение идет по IdInternal. Красным выделены группы с ошибками, их можно исправить.' : 'Selezionare l\'anno e il torneo. Luminosi gruppi isolati blu che già dispongono di un database. Il confronto è a IdInternal. Gruppo di colore rosso con errori possono essere corretti.',
    'Выход' : 'Produzione',
    'Год' : 'Anno',
    'Группы, доступные для импорта' : 'Gruppi disponibili per l\'importazione',
    'Доступные для импорта турниры' : 'Disponibile per i tornei importazioni',
    'Заголовок' : 'Titolo',
    'Загрузка групп в турнир' : 'Gruppi Caricamento nel torneo',
    'Макс.' : 'Max.',
    'Международный' : 'Internazionale',
    'Нажмите на ссылку (») в колонке "Группы" для просмотра списка групп турнира, в которых зарегистрирована пара (участник).' : 'Clicca sul link (») nella sezione" Gruppi "per visualizzare l\'elenco del torneo, in cui la coppia è registrata (membro).',
    'Партнер / партнерша' : 'Partner / Partner',
    'Показать ошибки' : 'Mostra errori',
    'Лимит' : 'Limite',
    'Просмотр формы' : 'View forma',
    'Редактирование группы' : 'Gruppo Modifica',
    'Редактирование турнира' : 'Editing torneo',
    'Серый цвет' : 'Colore grigio',
    'Сохранить' : 'Salva',
    'Участники группы' : 'I membri della band',
    'Хеш' : 'Hash',
    'ЧЧ:ММ' : 'HH: MM',
    'Ярким цветом выделены турниры, которые уже есть базе данных. Сравнение идет по IdInternal. Для сохранения турнира заполните все дополнительные поля в диалоговом окне импорта.' : 'Il colore luminoso evidenziato tornei, che già dispongono di un database. Il confronto è a IdInternal. Per salvare il torneo di riempimento in tutti i campi aggiuntivi nella finestra di dialogo Importa.',
    'Доступные группы для регистрации.' : 'Gruppi disponibili per la registrazione.',
    'Выбрано %1 из %2.' : '% Selezionato 1% 2.',
    'Чтобы разблокировать вкладку нажмите ″Назад″' : 'Per sbloccare la scheda, fare clic su "Back"',
    'Заполните / измените остальные поля.' : 'Riempire / modificare gli altri campi.',
    'Вернуться назад' : 'Ritorno',
    'Данные для передачи в платежную систему' : 'I dati per la trasmissione al sistema di fatturazione',
    'На главную' : 'Casa',
    'Передать данные' : 'Dati Transfer',
    'Оставьте свои отзывы, предложения, замечания!' : 'Inviateci i vostri commenti, suggerimenti, commenti!',
    'Регистрация участников невозможна! Статус турнира - "' : 'Registrazione dei partecipanti non è possibile! Stato del torneo - "',
    'Группы турнира' : 'Gruppi di torneo',
    'Часть данных получена от WDSF.' : 'Parte dei dati ottenuti dal WDSF.',
    'Оплачено' : 'Pagato',
    'Черный цвет - участие в группе оплачено.' : 'Nero - partecipazione al gruppo pagato.',
    'Уникальные участники турнира, всего ' : 'Partecipanti unici nel torneo, unico',
    'Регистрация прошла успешно, на данной странице отображены все группы пары/участника в турнире.' : 'Registrazione avuto successo in questa pagina vengono visualizzati tutti i gruppi coppie / partecipante al torneo.',
    'Загрузить' : 'Scarica',
    'Обзор' : 'Recensione',
    'Выберите файл' : 'Scegli Il File',
    'Статистика' : 'Statistica',
    'Спортсменов в БД' : 'Atleti nel database',
    'Спортсменов ФТСАРР в БД' : 'Atleti STSR nel database',
    'Спортсменов WDSF в БД' : 'Atleti WDSF nel database',
    'Других спортсменов в БД' : 'Altri atleti nel database',
    'Последнее обновление спортсменов ФТСАРР было' : 'Ultimo aggiornamento era atleti STSR',
    'Доступен ФТСАРР' : 'Disponibile STSR',
    'Доступен WDSF' : 'Disponibile WDSF',
    'Доступен другим' : 'Disponibile ad altri',
    'Поиск регистрации' : 'Ricerca registrazione',
    'Группа в турнире' : 'Gruppo nel torneo',
    'Все группы •' : '• Tutti i gruppi',
    'Все группы »' : 'Tutti i gruppi »',
    'Регистрация »' : 'Registrati »',
    'Все участники »' : 'Tutti i partecipanti "',
    'Все участники •' : '• Tutti i partecipanti',
    'Сейчас Вы на этой странице' : 'Attualmente sei su questa pagina',
    'Регистрация •' : '• Register',
    'Результаты регистрации' : 'Risultati di registrazione',
    'Перейти к списку групп пары / участника для оплаты (' : 'Torna alla lista dei gruppi coppie / partecipante a pagare (',
    'Информация о регистрации в группу' : 'Check-in di gruppo Informazioni',
    'После завершения регистрации перейдите на страницу с группами пары / участника, там вы сможете выбрать необходимые группы и передать данные в платежную систему.' : 'Una volta completata la registrazione, andare alla pagina con un paio di gruppi / partito, dove è possibile selezionare il gruppo desiderato e trasmettere i dati al sistema di fatturazione.',
    'Статус пары' : 'Stato della coppia',
    'Возрастная группа пары' : 'Gruppo coppia Age',
    'Участники группы •' : '• Membri del Gruppo',
    'Группы участника •' : '• gruppi di utenti',
    'Группы пары •' : '• Gruppi coppie',
    'участника' : 'Membro',
    'пары' : 'vapore',
    'ФТСАРР' : 'STSR',
    'Перейти' : 'Andare',
    'Фамилия спортсмена' : 'Atleta Cognome',
    'Вы можете найти все группы, в которых зарегистрирован спортсмен. Поиск по всем турнирам.' : 'Potete trovare tutti i gruppi in cui l\'atleta è stato registrato. Cerca in tutti i tornei.',
    'Группы, в которых зарегистрирован спортсмен' : 'Gruppi in cui l\'atleta è registrato',
    'Импортировать' : 'Importazione',
    'Импортировать доступные' : 'Import disponibile',
    'Ссылка на источник данных:' : 'Link alla fonte dei dati: ',
    'Группа' : 'Gruppo',
    'Возр. гр.' : 'Crescente. c.',
    'Выберите дату для активации переключателя' : 'Selezionare una data per attivare l\'interruttore',
    'Дисциплина' : 'Disciplina',
    'Соответствующая группа WDSF' : 'Il corrispondente WDSF gruppo',
    ' - участие не оплачено.' : ' - La partecipazione non è pagato.',
    ' - участие отменено.' : ' - Partecipazione annullato.',
    'Оплачены' : 'Pagato',
    'd MMMM' : 'd MMMM', 
    'WDSF Controller' : 'WDSF controller',
    'Возр. группа' : 'Crescente. gruppo',
    'Выберите организатора для доступа к регистрации:' : 'Selezionare organizzatore per l\'accesso alla registrazione: ',
    'Группы »' : 'Gruppi »',
    'Группы •' : 'Gruppi •',
    'Код доступа не найден, переход на страницу для регистрации невозможен.' : 'Il codice di accesso viene trovato, una transizione verso la pagina per la registrazione è impossibile.',
    'Количество оплативших участников' : 'Il numero di partecipanti pagati',
    'Количество оплаченных групп' : 'Numero di gruppi pagati',
    'Нет данных.' : 'Nessun dato.',
    'Поиск регистрации участника по фамилии!' : 'Ricerca per il nome della registrazione utente!',
    'Список всех участников турнира' : 'Elenco di tutti i partecipanti al torneo',
    'Уникальные участники турнира' : 'I partecipanti al torneo unici',
    'Участники »' : 'Partecipanti »',
    'Участники •' : 'Partecipanti •',
    'Экспорт участников »' : 'Partecipanti Export »',
    'Всего участников' : 'Numero di partecipanti',
    'уникальных' : 'unico',
    'Всего' : 'Solo',
    'Задать вопрос' : 'Fai una domanda',
    'Инструкция к регистрации' : 'Guida alla registrazione',
    'Информация о турнире' : 'Info Tournament',
    'Информация »' : 'Informazioni »',
    'Перейдите по ссылке для получения подробной информации' : 'Clicca qui per maggiori informazioni',
    'ВАЖНОЕ ОБЪЯВЛЕНИЕ' : 'ANNUNCIO IMPORTANTE',
    'Зарегистрировать ещё участников »' : 'Registrazione più membri »',

     
    'Введите номера классификационных книжек ФТСАРР' : 'Inserire il numero di libri di classificazione RFDARR',
    'Введите номера классификационных книжек WDSF' : 'Inserire il numero di libri di classificazione WDSF',
    
    'Регистрация осуществляется по MIN номерам WDSF. Поиск участников идет по базе данных "World DanceSport Federation".' : 
    'La registrazione è effettuata in base al numero VIN WDSF. Cerca Utenti è il database "World DanceSport Federazione".',
    
    'Тренер. Фамилия, Имя' : 'Coach',
    'Оплачено участников' : 'Partecipanti a pagamento',
    'Регистрация в турнир завершена. Все платежи запрещены.' : 'L\'iscrizione al torneo è completato. Tutti i pagamenti sono vietati.',
    'Для всех номинаций кроме \"соло\", стоимость участия указана для пары участников.' : 'Per tutte le candidature, eccetto \"solo\", il costo di partecipazione è per le coppie di partecipanti.',
    'Для всех номинаций стоимость участия указана для пары участников.' : 'Per tutta la tassa di candidature di partecipazione è per le coppie di partecipanti.',
    'Доступные группы.' : 'Gruppi disponibili.',
    'Доп. поля можно не заполнять.' : 'Extra. i campi sono facoltativi.',
    '-- Вкладка по умолчанию --' : '-- La scheda predefinita --',
    'Другие' : 'Gli altri',
    '-- Язык по умолчанию --' : '-- Lingua di Default --',
    'Количество доступных мест' : 'Il numero di posti disponibili',
    
    'Для некоторых групп могут быть введены ограничения. "Доступно мест" это "Лимит" минус "Количество проданных билетов".' : 
    'Alcuni gruppi potrebbero essere restrizioni. "Luogo accessibile" che "limite" meno "il numero di biglietti venduti."',
    
    'Группы, в которых не осталось мест(0) закрыты для регистрации и продажи билетов.' : 
    'Gruppi in cui non c\'è spazio (0) chiuso per registrazione e vendita dei biglietti.',
    
    'Осталось мест' : 'Luoghi sinistra',
    'Перейти на сайт ФТСАРР' : 'Go to RFDARR site',
    'Регистрация осуществляется по номерам классификационных книжек и на основании информации' : 'Registration is carried by numbers and classification of books based on the information',
    'Базы данных спортсменов "Союза танцевального спорта России"' : 'Databases athletes "Union DanceSport of Russia"',
    'на момент регистрации.' : 'at the time of registration.',
    'Выберите номинации' : 'Select competitions',
    'Класс ST, LA' : 'ST, LA class',
    'Регистрация закрыта':'Registration is closed',
    
    'Настройки вкладки - Регистрация ФТСАРР' : 'Tab settings - Registration RFDARR',
    'Настройки вкладки - Регистрация WDSF' : 'Tab settings - Registration WDSF',
    'Настройки вкладки - Регистрация других' : 'Tab settings - Registration other participants',
    'Система оплаты и валюта' : 'Payment system and currency',
    'Служебные параметры' : 'Service parametrs',
    'Информация о турнире (название ссылки)' : 'Tournament info (name of link)',
    'Ссылка на информацию' : 'Tournament info - Link',
    'Доп. информация (название ссылки)' : 'Additional trn/ info (name of link)',
    'Ссылка на доп. информацию' : 'Addit. trn. info link',
    'Инструкция к регистрации, ссылка' : 'Instruction link',
    'Вкладка доступна для ФТСАРР' : 'Allowed for RFDARR',
    'Вкладка доступна для WDSF' : 'Allowed for WDSF',
    'Название вкладки' : 'Name of tab',
    'Вкладка доступна для других участников' : 'Allowed for other participants',
    'Система оплаты' : 'Payment system',
    'Валюта' : 'Currency',
    'Доступ к экспорту' : 'Access to export',
    'Сформировать ссылку' : 'Make link',
    'Список всех участников' : 'All participants list',
    'Только оплатившие участники' : 'Only paid participants',
    'Измените или оставьте значения по умолчанию' : 'Change or do nothing',
    'Экспорт' : 'Export',
    'Перейдите по ссылки' : 'Move to link',
    'Категория (Pro-Am)' : 'Category (Pro-Am)' 
  },
  getTranslate: function(word, toLanguage){
    var def = function(key){
        //console.log("'" + key + "' : '',");
        
        return key;  
    };  
     
          
    switch(toLanguage){
        case 'en':
            return this.toEnglish[word] ? this.toEnglish[word] : def(word);
        case 'de':
            return this.toDeutsch[word] ? this.toDeutsch[word] : def(word);
        case 'it':
            return this.toItalian[word] ? this.toItalian[word] : def(word);
    }
    
    return word;
  }
});

// ===============================================================================================================================
// File: 42. localization/filter.js
// ===============================================================================================================================
'use strict';
//
/*===========================================================================================
Фильтр и общая настройка для заголовков
===========================================================================================*/


localizationModule.filter('localize', function(DanceDictionary) {
    return function(input) { 
    	//console.log('call localize'); 
        return DanceDictionary.getTranslate(input, AppSettings.lang);
    }
});


/*
servicesModule.config(['$httpProvider', function ($httpProvider) {
	$httpProvider.defaults.headers.common['Accept-Language'] = AppSettings.lang;
}]);

*/

// ===============================================================================================================================
// File: 43. filters/cacheDate.js
// ===============================================================================================================================
//d

filterModule.filter('convertCacheDate', function($filter) {
    return function(input, filterParams) {
        var result;

        try{
            var dateTime = input.split(' ');
            var date = dateTime[0].split('-');
            
            if (dateTime.length == 1){
            	result = $filter('date')(new Date(date[0], date[1]-1, date[2]), filterParams);
            }
            else{
                var time = dateTime[1].split(':');
                result = $filter('date')(new Date(date[0], date[1]-1, date[2], time[0], time[1], time[2]), filterParams);
            }
        }
        catch (ex){
            result = input;
        }

        return result;
    }
});
