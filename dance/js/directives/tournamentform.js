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
