'use strict';
//ddddddddddd
 
var servicesModule     = angular.module('servicesModule', ['ngRoute','ngCookies', 'ui.bootstrap', 'tmh.dynamicLocale']);
var controllersModule  = angular.module('controllersModule', ['servicesModule']);
var directivesModule   = angular.module('directivesModule', []);
var localizationModule = angular.module('localizationModule', []);
var filterModule       = angular.module('filterModule', []);
var mainModule         = angular.module('mainModule', ['localizationModule',  'filterModule', 'servicesModule', 'controllersModule', 'directivesModule']);

mainModule.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/tournaments', {
		templateUrl: 'partials/tournaments.csp', 
		controller: 'TournamentsCtrl'});

	// <Registration> ------------------------------------------------------
	$routeProvider.when('/tournament/:tournamentId/registration', {
		templateUrl: 'partials/registration.csp', 
		controller: 'RegistrationCtrl'});


	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/registration', {
		templateUrl: 'partials/registration.csp', 
		controller: 'RegistrationCtrl'});
		
		
	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/registration/type/:typeCode/lang/:langCode', {
		templateUrl: 'partials/registration.csp', 
		controller: 'RegistrationCtrl'});
		
	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/registration/type/:typeCode', {
		templateUrl: 'partials/registration.csp', 
		controller: 'RegistrationCtrl'});
	
	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/registration/lang/:langCode', {
		templateUrl: 'partials/registration.csp', 
		controller: 'RegistrationCtrl'});
		
	// </Registration> -----------------------------------------------------

	$routeProvider.when('/tournament', {
		templateUrl: 'partials/tournament.csp', 
		controller: 'TournamentCtrl'});

	$routeProvider.when('/tournament/:id', {
		templateUrl: 'partials/tournament.csp', 
		controller: 'TournamentCtrl'});

	$routeProvider.when('/tournament/:tournamentId/participants', {
		templateUrl: 'partials/tournamentparticipants.csp', 
		controller: 'TournamentParticipantsCtrl'});

	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/participants', {
		templateUrl: 'partials/tournamentparticipants.csp', 
		controller: 'TournamentParticipantsCtrl'});

	$routeProvider.when('/tournament/:tournamentId/importcompetitions', {
		templateUrl: 'partials/importcompetitions.csp', 
		controller: 'ImportCompetitionsCtrl'});

	$routeProvider.when('/tournament/:id/competitions', {
		templateUrl: 'partials/tournamentcompetitions.csp', 
		controller: 'TournamentCompetitionsCtrl'});
		
	$routeProvider.when('/recorder/:recorderHash/tournament/:id/competitions', {
		templateUrl: 'partials/tournamentcompetitions.csp', 
		controller: 'TournamentCompetitionsCtrl'});


	$routeProvider.when('/tournament/:tournamentId/couple/:coupleId/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/couple/:coupleId/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
	
	
	$routeProvider.when('/tournament/:tournamentId/athlete/:athleteId/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/athlete/:athleteId/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
		
	
	$routeProvider.when('/tournament/:tournamentId/other/couple/:coupleKey/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});

	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/other/couple/:coupleKey/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
		

	$routeProvider.when('/tournament/:tournamentId/other/athlete/:athleteKey/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
	$routeProvider.when('/recorder/:recorderHash/tournament/:tournamentId/other/athlete/:athleteKey/competitions', {
		templateUrl: 'partials/payment.csp', 
		controller: 'PaymentCtrl'});
		
	
	
		

	$routeProvider.when('/tournament/:tournamentId/competition', {
		templateUrl: 'partials/competition.csp', 
		controller: 'CompetitionCtrl'});

	$routeProvider.when('/tournament/:tournamentId/competition/:competitionId', {
		templateUrl: 'partials/competition.csp', 
		controller: 'CompetitionCtrl'});


	$routeProvider.when('/competition/:competitionId/participants', {
		templateUrl: 'partials/competitionparticipants.csp', 
		controller: 'CompetitionParticipantsCtrl'});

	$routeProvider.when('/recorder/:recorderHash/competition/:competitionId/participants', {
		templateUrl: 'partials/competitionparticipants.csp', 
		controller: 'CompetitionParticipantsCtrl'});


	$routeProvider.when('/entities/agecategories', {
		templateUrl: 'partials/agecategories.csp', 
		controller: 'AgeCategoriesCtrl'});

	$routeProvider.when('/import/tournaments', {
		templateUrl: 'partials/importtournaments.csp', 
		controller: 'ImportTournamentsCtrl'});

	$routeProvider.when('/import/competitions', {
		templateUrl: 'partials/importcompetitions.csp', 
		controller: 'ImportCompetitionsCtrl'});
	
	$routeProvider.when('/import/persons', {
		templateUrl: 'partials/importpersons.csp', 
		controller: 'ImportPersonsCtrl'});

	$routeProvider.when('/feedback', {
		templateUrl: 'partials/feedback.csp', 
		controller: 'FeedBackCtrl'});
	
	
	$routeProvider.when('/search/participants', {
		templateUrl: 'partials/searchparticipants.csp', 
		controller: 'SearchParticipantsCtrl'});
	
	$routeProvider.when('/recorder/:recorderHash/search/participants', {
		templateUrl: 'partials/searchparticipants.csp', 
		controller: 'SearchParticipantsCtrl'});
	

   // $routeProvider.otherwise({redirectTo: '/tournaments'});
}]);
