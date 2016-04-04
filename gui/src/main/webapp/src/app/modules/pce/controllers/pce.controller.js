define(['app/modules/pce/services/pce.service'], function () {

    'use strict';

    function PceCtrl($rootScope, $scope, $routeParams, NetworkService, NextTopologyService, PceService) {
        // scope properties
        $scope.page = 'topology';
        $scope.sidePanelPage = null;

        // scope topo params
        $scope.topologyData = { nodes: [], links: []};
        $scope.nxDict = {};
        $scope.topologyLoaded = false;

        // whole network data
        $scope.networkData = {
            'ietf-network-topology:link': [],
            'network-id': '',
            node: [],
            'ofl3-topology:links-in-group': []
        };
        $scope.networkObj = null; // network model

        $scope.terminationPointsData = null;

        // scope methods
        $scope.broadcastFromRoot = broadcastFromRoot;
        $scope.closeSidePanel = closeSidePanel;
        $scope.hideProgressBar = hideProgressBar;
        $scope.openSidePanel = openSidePanel;
        $scope.showProgressBar = showProgressBar;

        // progressbar
        $scope.showProgressLine = false;


        // local variables
        var existingPages = ['topology', 'flow-management', 'statistics', 'notifications', 'configuration', 'bgp-routes'];
        var existingSidePanels = ['side_panel_nodes', 'side_panel_links', 'side_panel_policy', 'side_panel_flow_detail'];

        // set current page
        if(existingPages.indexOf($routeParams.page)!==-1){
            $scope.page = $routeParams.page;
        }

        function broadcastFromRoot(eventName, val) {
            $scope.$broadcast(eventName, val);
        }

        /**
         * Closes side panel
         */
        function closeSidePanel() {
            $scope.sidePanelPage = null;
            NextTopologyService.fadeInAllLayers($scope.nxTopology);
            NextTopologyService.clearPathLayer($scope.nxTopology);
        }


        /**
         * Opens side panel and loads appropriate template file
         * @param page {string} page name
         */
        function openSidePanel(page, object) {
            $scope.sidePanelPage = page;
            $scope.sidePanelObject = object;

        }

        /**
         * Loading topology data
         * @param successCbk
         */
        $scope.loadTopologyData = function (successCbk) {
            //reset nx dictionaries
            setNewNxDict();
            //get data from controller and create network object with wraping
            NetworkService.getNetwork(function(networkObj){
                var rawTopoData = {
                        nodes: networkObj.data.node,
                        links: networkObj.data['ietf-network-topology:link'],
                        groups: networkObj.data['ofl3-topology:links-in-group']
                    },
                    topoData = {nodes: [], links:[]};

                if ( rawTopoData.nodes.length ) {
                    topoData.nodes = NetworkService.getNodesData(rawTopoData.nodes, $scope.nxDict);
                    topoData.links = NetworkService.getLinksData(rawTopoData.links, rawTopoData.groups, $scope.nxDict);
                    $scope.terminationPointsData = NetworkService.getTpData(rawTopoData.nodes);
                }

                $scope.topologyData = topoData;
                //console.debug('topoData', $scope.topologyData);
                $scope.networkData = networkObj.data;
                $scope.networkObj = networkObj;

                $scope.topologyLoaded = true;

                if ( successCbk ) {
                    successCbk($scope.topologyData, $scope.nxDict);
                }
                //console.info('INFO :: PceCtrl Loading network -> ', networkObj, rawTopoData, topoData);
            }, function(){
                //error cbk
            });
        };

        /**
         * Utils - show progress bar
          */
        function showProgressBar() {
            $scope.showProgressLine = true;
        }

        /**
         * Utils - hide progress bar
         */
        function hideProgressBar() {
            $scope.showProgressLine = false;
        }

        /**
         * Utils - reset nx links and nodes dictionaries
         */
        function setNewNxDict(){
            $scope.nxDict = {
                nodes: new nx.data.Dictionary({}),
                links: new nx.data.Dictionary({})
            };
        }

        /**
         * Convert decimal to hexadecimal
         * @param decVal
         */
        $scope.decToHex = function(decVal) {
            return PceService.convertDecToHex(decVal);
        };

    }
    

    PceCtrl.$inject=['$rootScope' ,'$scope', '$routeParams', 'NetworkService', 'NextTopologyService', 'PceService'];

    return PceCtrl;
});
