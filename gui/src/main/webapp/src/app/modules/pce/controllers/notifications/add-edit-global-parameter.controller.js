define([''], function () {

	'use strict';

	function AddEditGlobalParameterDialogCtrl($mdDialog, $scope, ErrorHandlerService, paramName) {

		$scope.saveGlobalParameter = saveGlobalParameter;
		$scope.closeGlobalParameterDialog = closeGlobalParameterDialog;

		paramName = paramName || false;

		// modify existing
		if(paramName){

			$scope.editConfig.globalParameter = {
				add: false,
				edit: true,
				key: paramName,
				values: {
					name: paramName,
					value: $scope.stats['global-parameters'].data[paramName]
				}
			};
		}
		// add new
		else{
			$scope.editConfig.globalParameter = {
				add: true,
				edit: false,
				key: "",
				values: {}
			};
		}

		/**
		 * Requires: nothing
		 * Performs:
		 * 1. For "edit" mode:
		 * 1.1. It modifies the value of global parameter in ODL datastore if the GP exists
		 * 1.2. If the name was changed, it deletes the old param and create a new one with new value
		 * 2. For "add" mode: it sends a request to add a new param
		 * If any operation passes, the table refreshes and a user gets feedback (you successfully changed the parameter).
		 * If operation fails, invoke ErrorHandlerService.log to display an error to the user.
		 */
		function saveGlobalParameter(){

			var gpConfig = $scope.editConfig.globalParameter;
			var gpObj = $scope.stats['global-parameters'];
			var gpData = gpObj.data;

			gpObj.getGlobalParameters(
				getGlobalParametersSuccessCbk,
				getGlobalParametersErrorCbk
			);

			function getGlobalParametersSuccessCbk(data){
				// user is adding the parameter
				if(gpConfig.add){
					if(gpConfig.values.hasOwnProperty('name') && gpConfig.values.hasOwnProperty('value')){
						gpData[gpConfig.values.name] = gpConfig.values.value;
					}
				}
				// user is editting the parameter
				else if(gpConfig.edit){
					if(gpConfig.values.hasOwnProperty('name') && gpConfig.values.hasOwnProperty('value')){
						// parameter name changed
						if(gpConfig.values.name != gpConfig.key){
							// get rid of old prop
							delete gpData[gpConfig.key];
						}
						// parameter name didn't change
						gpData[gpConfig.values.name] = gpConfig.values.value;
					}
				}

				if(gpConfig.add || gpConfig.edit)
					gpObj.putGlobalParameters(
						putGlobalParametersSuccessCbk,
						putGlobalParametersErrorCbk
					);
			}

			function getGlobalParametersErrorCbk(err){
				// throw the error
				ErrorHandlerService.log(err, true);
			}

			function putGlobalParametersSuccessCbk(data){
				gpObj.getGlobalParameters(
					function(){
						$scope.closeGlobalParameterDialog();
					},
					function(err){
						ErrorHandlerService.log(err, true);
					}
				);
			}

			function putGlobalParametersErrorCbk(err){
				gpObj.getGlobalParameters(
					function(){},
					function(err){
						ErrorHandlerService.log(err, true);
					}
				);
				ErrorHandlerService.log(err, true);
			}

		}

		function closeGlobalParameterDialog() {
			$scope.editConfig.globalParameter = {
				add: false,
				edit: false,
				key: "",
				values: {}
			};
			$mdDialog.cancel();
		}


	}

	AddEditGlobalParameterDialogCtrl.$inject=['$mdDialog', '$scope', 'ErrorHandlerService', 'paramName'];

	return AddEditGlobalParameterDialogCtrl;
});
