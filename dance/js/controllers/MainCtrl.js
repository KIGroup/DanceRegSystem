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
    
    $scope.menu = {devModeIsRelease: false,
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
                                                  persons     : {id: 'import-persons'     , url: '#/import/persons'     , parentId: 'import', name: $filter('localize')('Участники СТСР')}}},
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

