define(['lodash'], function () {

    'use strict';

    function ConfigurationCtrl($scope, ConfigurationService, $mdDialog, ErrorHandlerService) {
        $scope.hideProgressBar();

        //params
        $scope.config = {
            nd: null,
            fs: null,
            kafka: null,
            xrv: null
        };

        $scope.section = {
            nd: 'loading',
            fs: 'loading',
            kafka: 'loading',
            xrv: 'loading'
        };

        // methods
        $scope.init = init;
        $scope.openEditDialog = openEditDialog;



        $scope.init();

        /**
         * Initialization
         */
		function init(){

            ConfigurationService.getNeighbourDiscovery(function(data){
                $scope.config.nd = data;
                $scope.section.nd = 'data';
            },function(err){
                $scope.section.nd = 'no-data';
                console.warn('WARNING :: no neighbour discovery configuration found - ', err);
            });
            ConfigurationService.getFlowStatistic(function(){},function(){});
            ConfigurationService.getKafka(function(){},function(){});
            ConfigurationService.getXrv(function(){},function(){});

		}

        function openEditDialog(type){
            $mdDialog.show({
                clickOutsideToClose: true,
                controller: 'ConfigurationModalCtrl',
                templateUrl: 'app/modules/pce/views/modals/dialog_config.tpl.html',
                parent: angular.element(document.body),
                locals: {
                    data:{
                        config: $scope.config[type] ? $scope.config[type] : {},
                        type: type
                    }
                }
            }).then(function(data) {
                $scope.config[type] = _.cloneDeep(data);
                $scope.section.nd = 'data';
            });
        }



    }

	ConfigurationCtrl.$inject=['$scope', 'ConfigurationService', '$mdDialog', 'ErrorHandlerService'];

    return ConfigurationCtrl;
});
