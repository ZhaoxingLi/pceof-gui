define([''], function () {

    'use strict';

    function TopologyCtrl($rootScope, $scope, NextTopologyService) {

        $scope.init = init;
        $scope.reloadTopo = reloadTopo;


        /**
         * Registering callback functions for topology directive
         * @returns {{clickNode: Function, clickLink: Function}}
         */
        $scope.cbkFunctions = {
            clickNode: function(node){
                console.log('click node event', node);
                //Example of highlighting
                //NextTopologyService.highlightNode($scope.nxTopology, 1);
                //NextTopologyService.highlightNode($scope.nxTopology, 1, true); without links around
                //NextTopologyService.highlightLink($scope.nxTopology, '1-7');
                //NextTopologyService.highlightPath($scope.nxTopology, [array of links obj]);

                //Fade out or in whole topology
                //NextTopologyService.fadeOutAllLayers();
                //NextTopologyService.fadeInAllLayers();
            },
            clickLink: function(link){
                console.log('click link event', link);
            }
        };

        /**
         * Method for reloading topology data in app
         */
        function reloadTopo(){
            $scope.showProgressBar();
            $scope.loadTopologyData(function(){
                $scope.hideProgressBar();
            });
        }

        /**
         * Initialization
         * - load topology data if its necessary
         */
        function init() {

            if ( !$scope.topologyLoaded ) {
                reloadTopo();
            }
        }

        $scope.init();

        // watching next topology obj and setting to root
        $scope.$watch('nxTopology', function() {
            $rootScope.nxTopology = $scope.nxTopology;
        });
    }

    TopologyCtrl.$inject=['$rootScope', '$scope', 'NextTopologyService'];

    return TopologyCtrl;
});
