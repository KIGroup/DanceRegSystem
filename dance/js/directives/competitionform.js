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
