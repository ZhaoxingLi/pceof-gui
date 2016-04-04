define([''], function () {

    'use strict';

	/*
	Controller for "Notifications" screen
	 */
    function NotificationsCtrl($scope, $log, $mdDialog, ErrorHandlerService, StatsService,
							   RegisteredEventsService) {

		// TODO: DEBUG ONLY - REMOVE
		$scope.log = $log;

		// Functions
		$scope.init = init;

		// * Global parameters
		$scope.addEditGlobalParameter = addEditGlobalParameter;
		$scope.warnDeleteGlobalParameter = warnDeleteGlobalParameter;
		$scope.deleteGlobalParameter = deleteGlobalParameter;

		// * Registrations
		$scope.addEditRegistration = addEditRegistration;
		$scope.warnDeleteRegistration = warnDeleteRegistration;
		$scope.deleteRegistration = deleteRegistration;

		// * Notifications

		// * Registered Events
		$scope.reloadRegisteredEvents = reloadRegisteredEvents;
		$scope.clearRegisteredEvents = clearRegisteredEvents;


		$scope.statsService = {};
		$scope.stats = {};
		$scope.statsLoaded = false;

		$scope.filter = {
			options: {

			},
			show : false
		};

		$scope.editConfig = {
			"globalParameter": {
				"add": false,
				"edit": false,
				"key": "",
				"values": {}
			}
		};

		/**
		 * Init the controller & elements on the screen
		 */
		function init(){
			$scope.showProgressBar();
			$scope.statsService = StatsService.createStats();
			$scope.statsService.getStats(
				function(data){
					$scope.stats = data;
					$scope.statsLoaded = true;
					$scope.reloadRegisteredEvents(
						function(data){
							$scope.registeredEvents = data;
							$scope.hideProgressBar();
						},
						function(err){
							$scope.registeredEvents = {};
							ErrorHandlerService.log(err, data);
							$scope.hideProgressBar();
						}
					);
					$log.log($scope.stats);
				},
				function(err){
					ErrorHandlerService.log(err, true);
					$scope.statsLoaded = false;
					$scope.hideProgressBar();
				}
			);
		}

		/// *** GLOBAL PARAMETERS *** ///

		/**
		 * Adds additional editable string to the global parameters table
		 */
		function addEditGlobalParameter(paramName){
			$mdDialog.show({
				clickOutsideToClose: true,
				controller: 'AddEditGlobalParameterDialogCtrl',
				preserveScope: true,
				templateUrl: 'app/modules/pce/views/notifications/add-edit-global-parameter.tpl.html',
				parent: angular.element(document.body),
				scope: $scope,
				locals: {
					paramName: paramName
				}
			});
		}

		/**
		 * Show warning when deleting a global parameter
		 * @param paramName
		 * @param $event Event passed after click
		 */
		function warnDeleteGlobalParameter(paramName, $event){
			var confirm = $mdDialog.confirm()
				.title('Delete the global parameter?')
				.textContent("If you hit Yes, the global parameter " + paramName + " will be deleted. Are you sure?")
				.ariaLabel('Delete global parameter')
				.targetEvent($event)
				.ok('Yes, delete it')
				.cancel('No, leave it');
			$mdDialog.show(confirm).then(function() {
				$scope.deleteGlobalParameter(paramName);
			}, function() {});
		}

		/**
		 * Delete a global parameter
		 * @param paramName
		 */
		function deleteGlobalParameter(paramName){
			//$scope.showProgressBar();

			console.log($scope.stats);

			var gp = $scope.stats['global-parameters'];
			// delete the parameter
			gp.deleteGlobalParameter(paramName,
				// request went thru
				function(data){
					gp.getGlobalParameters(
						function(data){

						},
						function(err){
							ErrorHandlerService.log(err, true);
						}
					);
				},
				// error
				function(err){
					//$scope.hideProgressBar();
					ErrorHandlerService.log(err, true);
				}
			);
		}

		/// *** REGISTRATIONS *** ///
		function addEditRegistration(registration){
			$mdDialog.show({
				clickOutsideToClose: true,
				controller: 'AddEditRegistrationDialogCtrl',
				templateUrl: 'app/modules/pce/views/notifications/add-edit-registration.tpl.html',
				parent: angular.element(document.body),
				locals: {
					registration: registration,
					pScope: $scope
				}
			});
		}

		function warnDeleteRegistration(regId, $event){
			var confirm = $mdDialog.confirm()
				.title('Delete the registration?')
				.textContent("If you hit Yes, the registration " + regId + " will be deleted. Are you sure?")
				.ariaLabel('Delete registration')
				.targetEvent($event)
				.ok('Yes, delete it')
				.cancel('No, leave it');
			$mdDialog.show(confirm).then(function() {
				$scope.deleteRegistration(regId);
			}, function() {});
		}

		function deleteRegistration(regId){

		}

		/// *** NOTIFICATIONS *** ///


		/// *** REGISTERED EVENTS *** ///


		function reloadRegisteredEvents(successCbk, errorCbk){

			successCbk = successCbk || function(data){
					$scope.registeredEvents = data;
				};
			errorCbk = errorCbk || function(err){
					$scope.registeredEvents = {};
					ErrorHandlerService.log(err, data);
				};

			RegisteredEventsService.getRegisteredEvents(successCbk, errorCbk);

		}

		function clearRegisteredEvents(){
			RegisteredEventsService.clearRegisteredEvents();
			$scope.registeredEvents = [];
		}

		$scope.init();


    }

    NotificationsCtrl.$inject=[ '$scope', '$log', '$mdDialog', 'ErrorHandlerService', 'StatsService', 'RegisteredEventsService' ];

    return NotificationsCtrl;
});
