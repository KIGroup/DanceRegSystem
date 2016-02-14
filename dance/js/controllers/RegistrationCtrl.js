'use strict';
// dfdfdfddddddddddddddвd
 
/*===========================================================================================
Registration           
===========================================================================================*/
  
controllersModule.controller('RegistrationCtrl', function($scope, $interval, $routeParams, $filter, LocationSrvc, UtilsSrvc, OtherSrvc, PersonSrvc, TournamentSrvc, CompetitionSrvc, RegistrationSrvc, ParticipantSrvc, CoupleSrvc){
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
        couple: {},
        athlete: null,
        genders: [
            {name: $filter('localize')('Мужской'), code: 'Male'}, 
            {name: $filter('localize')('Женский'), code: 'Female'}
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

    if($scope.pageStore.registrationData){
        if ($scope.pageStore.registrationData.type == "Other")
            $scope.tabOTHER.couple = $scope.pageStore.registrationData.couple;
    }
    
    
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
         
        $scope.competitionTable.items = [];
        $scope.competitionTable.selectedItems = [];
        $scope.competitionTable.itemsStatus = $filter('localize')('Идет загрузка групп...');

        var dataSending= {
            type: $scope.selectedTab, /* UDSR, WDSF, OTHER*/
            tournamentId: $scope.tournament.id,
            convertParams: {
                loadWDSF: true,
                loadPaymentsCount: true
            }
        };
            
            
        if ($scope.pageStore.registration.grid.tableShortView){
            $('#divTypeOfView').hide();
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
                }, 100, 50);
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
                    $scope.cmpAlert = UtilsSrvc.getAlert('Внимание!', data, 'error', true);
                    $scope.competitionTable.itemsStatus = $filter('localize')('Произошла ошибка при загрузке групп.');
                });
        }
    };

    $scope.competitionTable.setHiddenCoulumns = function(value){
        var columns = ["Discipline", "AgeGroup", "Class", "Type", "Limit"];
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
        TournamentSrvc.getById(id, "?loadFullName=1&loadStatus=1&loadUrls=1").then(
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
        $scope.tabOTHER.couple = {};
        $scope.tabOTHER.athlete = null;
        $scope.tabOTHER.formSingle.btnBackVisible = false;
        $scope.tabOTHER.formSingle.btnNextVisible = true;

        $scope.regCompetitionsCount = 0;
        
        $scope.resultTableVisible = false;

        $scope.competitionTable.avialableMode = false;
        $scope.competitionTable.selectable = false;
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
