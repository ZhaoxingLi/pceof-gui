define([''], function () {

    'use strict';

    function AddPolicyCtrl($filter, $mdDialog, $scope, policy, PathBundleService, PathBundleListService, PceService,
                           PolicyService, ErrorHandlerService) {

        $scope.pathBundle = PathBundleService.createPathBundle();
        $scope.policy = policy ? policy : PolicyService.createPolicy();
        $scope.validationPatterns = {};
        $scope.editedPathBundleIndex = null;

        $scope.addPathBundleToList = addPathBundleToList;
        $scope.closeDialog = closeDialog;
        $scope.deletePathBundleFromList = deletePathBundleFromList;
        $scope.fillPathBundleForm = fillPathBundleForm;
        $scope.saveData = saveData;

        getValidationPatterns();

        function addPathBundleToList() {
            var pathBundleCopy = {};
            angular.copy($scope.pathBundle, pathBundleCopy);

            if(!$scope.policy.data['path-bundle']) {
                $scope.policy.data['path-bundle'] = PathBundleListService.createPathBundleList();
            }

            if($scope.editedPathBundleIndex !== null) {
                $scope.policy.data['path-bundle'].data[$scope.editedPathBundleIndex] = pathBundleCopy;
            }
            else {
                $scope.policy.data['path-bundle'].data.push(pathBundleCopy);
            }

            $scope.editedPathBundleIndex = null;
            $scope.pathBundle = null;
        }

        function closeDialog() {
            $mdDialog.cancel();
        }

        function deletePathBundleFromList(index) {
            if($scope.policy.data['path-bundle'] && $scope.policy.data['path-bundle'].data) {
                $scope.policy.data['path-bundle'].data.splice(index, 1);
            }
        }

        function fillPathBundleForm(pathBundle, index) {
            $scope.pathBundle = pathBundle;
            $scope.editedPathBundleIndex = index;
        }

        function saveData() {
            //var policyObject = PolicyService.createPolicy($scope.policy);

            $scope.policy.putPolicy(function(data) {
                $scope.closeDialog();
                $scope.broadcastFromRoot('RELOAD_POLICIES');
            }, function(err) {
				ErrorHandlerService.log(err, true);
                //console.log('put policy error', data, status);
            } );
        }

        function getValidationPatterns(){
            PceService.getValidationPatterns(function(data) {
                $scope.validationPatterns = data;
            });
        }
    }

    AddPolicyCtrl.$inject=['$filter', '$mdDialog', '$scope', 'policy', 'PathBundleService', 'PathBundleListService',
        'PceService','PolicyService', 'ErrorHandlerService'];

    return AddPolicyCtrl;
});
