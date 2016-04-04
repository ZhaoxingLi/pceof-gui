define([''], function () {

	'use strict';

	function AddEditRegistrationDialogCtrl($scope, $mdDialog, $mdConstant, NetworkService, ErrorHandlerService, registration, pScope) {

		// methods
		$scope.init = init;
		$scope.saveRegistration = saveRegistration;
		$scope.closeRegistrationDialog = closeRegistrationDialog;
		$scope.refreshLinkIds = refreshLinkIds;

		$scope.searchForLinks = searchForLinks;
		// run controller
		$scope.init();

		function init(){

			registration = registration || false;

			$scope.refreshLinkIds();

			// Separator for "chips"
			$scope.linksSeparators = [
				$mdConstant.KEY_CODE.ENTER,
				$mdConstant.KEY_CODE.COMMA
			];

			$scope.linksChipsConfig = {
				selectedItem: null,
				searchText: null
			};

			// modify existing
			if(registration){

				// registration data if in edit mode
				$scope.regData = registration.data;

				console.log($scope.regData);

				$scope.editConfig = {
					add: false,
					edit: true,
					key: $scope.regData['registration-id']
				};

				$scope.editBuffer = {
					id: $scope.regData['registration-id'],
					links: $scope.regData.links,
					notifications: $scope.regData.notification.data
				};

			}
			// add new
			else{
				$scope.editConfig = {
					add: true,
					edit: false,
					key: ""
				};
				$scope.editBuffer = {
					id: "",
					links: [],
					notifications: {}
				};
			}
		}

		function saveRegistration(){

			// todo: save registration

		}

		/**
		 * Refresh IDs of existing links
		 * @param successCbk
		 * @param errorCbk
		 */
		function refreshLinkIds(successCbk, errorCbk){

			successCbk = successCbk ||
				function(linkIds){
					return linkIds;
				};

			errorCbk = errorCbk ||
				function(err){
					ErrorHandlerService.log(err);
				};

			var linkIds;
			NetworkService.getNetwork(
				function(network){
					linkIds = network.data['ietf-network-topology:link'].map(function(link){
						return {
							id: link.data['link-id'],
							_lowerId: link.data['link-id'].toLowerCase()
						}
					});
					$scope.linkIds = linkIds;
					successCbk(linkIds);
				},
				errorCbk
			);
		}

		function closeRegistrationDialog() {
			$mdDialog.cancel();
		}

		function createFilterFor(query) {
			var lowercaseQuery = angular.lowercase(query);
			return function filterFn(link) {
				return (link._lowerId.indexOf(lowercaseQuery) != -1)
			};
		}

		function searchForLinks(query){
			var results = query ? $scope.linkIds.filter(createFilterFor(query)) : [];
			return results;
		}

	}

	AddEditRegistrationDialogCtrl.$inject=['$scope', '$mdDialog', '$mdConstant', 'NetworkService', 'ErrorHandlerService', 'registration', 'pScope'];

	return AddEditRegistrationDialogCtrl;
});
