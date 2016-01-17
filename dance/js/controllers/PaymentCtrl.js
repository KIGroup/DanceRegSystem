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
                                    $scope.typeName = $filter('localize')('СТСР') + ' ';
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
                            $scope.typeName = $filter('localize')('СТСР') + ' ';
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
    
    $scope.init();
    $scope.loadCountries();
    $scope.loadTournament($routeParams.tournamentId);
});

