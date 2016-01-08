var modules = ['app/openflow_manager/openflow_manager.module',
               'app/openflow_manager/openflow_manager.services',
               'app/openflow_manager/openflow_manager.filters',
               'common/yangutils/yangutils.services',
//               'common/tagutils/tagutils.services',
               'app/openflow_manager/directives/next_topology.directive',
               'app/openflow_manager/directives/ofmanpagination.directive',
               'app/openflow_manager/directives/tablestats.directive'
];


define(modules, function(openflow_manager) {

    openflow_manager.register.controller('openflow_managerCtrl', ['$scope', '$rootScope', '$http', '$timeout', 'OpenFlowManagerUtils', 'FlowProcessor', 'StatisticsProcessor', 'DesignOFMfactory','$animate', 'FlowProperties', 'CommonFlowOpers', 'IpFactory', 'ngTableParams', '$filter', 'Auth', 'ENV',
        function ($scope, $rootScope, $http, $timeout, OpenFlowManagerUtils, FlowProcessor, StatisticsProcessor, DesignOFMfactory, $animate, FlowProperties, CommonFlowOpers, IpFactory, NgTableParams, $filter, Auth, ENV) {
            $rootScope['section_logo'] = 'logo_ofm';
            $scope.view_path =  'src/app/openflow_manager/views/';
            $scope.topologyData = { nodes: [], edges: []};
            $scope.topologyNode = null;
            $scope.flowData = null;
            $scope.devices = {};
            $scope.statisticsTimerSlider = 3;
            $scope.ofmSettings = {};
            $scope.tagConfigTopology = null;

			$scope.panel = {
				type: null, // node / policy
				open: false
			};

            $scope.view_path_flow_detail = $scope.view_path + 'flow_detail/';
            $scope.view_path_flow_subctrl = $scope.view_path_flow_detail + 'flowOperSubCtrls/';
            $scope.view_path_flow_detail_types = $scope.view_path_flow_detail + 'types/';

            $scope.view = {
                flowPopup : false,
                flowOperPopup : false,
                statisticsPopup : false,
                settingsPopup : false,
                tagsPopup : false,
                flowsFilter : false,
                showPreview: false,
                hostsPopup: false,
                basic: true,
                notificationsPopup: false
            };

            $scope.checkOperChangeTimeout = 3000;

            $scope.showHostDevice = false;
            $scope.linkExpanded = false;

            $scope.showTopStatsPopup = false;
            $scope.popStatObj = {
                device: null,
                type: null,
                subType: null
            };

            $scope.status = {
                type: 'noreq',
                msg: null
            };

			// settings for node panel
			$scope.nodePanel = {
				overview: true,
				nodeDetails: false,
				tpDetails: false
			};

			// settings for link panel
			$scope.linkPanel = {
				overview: true,
				linkContainerDetails: false,
				linkDetails: false
			};

			// settings for policy panel
            $scope.policyPanel = {
                overview: true,
                policyDetails: false,
                bundleDetails: false,
				pathDetails: false
            };

            $scope.isContainer = function(p) {
              return p instanceof FlowProperties.FlowContainerProp;
            };

            $scope.removeFlowProperty = function(prop, propList) {
                CommonFlowOpers.removeFlowProperty(prop, propList);
            };

            $scope.requestWorkingCallback = function() {
                $scope.status = {
                    isWorking: true,
                    type: 'warning',
                    msg: 'OF_LOADING_DATA'
                };
            };

            $scope.processingModulesSuccessCallback = function() {
                $scope.status = {
                    type: 'success',
                    msg: ''
                };
            };

            $scope.showPopUpStatistics = function(type, subType){
                $scope.popStatObj.type = type;
                $scope.popStatObj.subType = subType;

                $scope.$broadcast('OM_SET_SEL_DEV', $scope.popStatObj);
                // $scope.view.statisticsPopup = true;
                $scope.toggleExpanded('statisticsPopup', true);
            };

            $scope.hideTopStatsPopup = function(){
                $scope.showTopStatsPopup = false;
            };

            $scope.customFunctionality = {
                setStatisticsDevice : function(device, show){
                    //$scope.showTopStatsPopup = show;
                    $scope.popStatObj.device = device;
                    $scope.$apply();
                },
                setTagToDevice : function (device, selected) {
                    $scope.showTopStatsPopup = $scope.showTopStatsPopup ? false : $scope.showTopStatsPopup;
                    $scope.$broadcast('OM_SET_TAG_TO_DEVICE', device, selected);
                    $scope.$apply();
                },
                setTagToLink : function(link){
                    $scope.$broadcast('OM_SET_TAG_TO_LINK', link.sourceNode()._label, link.targetNode()._label);
                    $scope.$apply();
                }
            };

            $scope.flows = [];
            $scope.filters = [];
            $scope.selectedFlows = [];
            $scope.selectedOriginalFlows = [];
            $scope.selectedDevices = {};
            $scope.selectedDevicesList = [];
            $scope.filtersActive = false;
            $scope.summaryExpanded = true;
            $scope.deletingFlows = [];
            $scope.updatingFlows = [];

            $scope.loadStatusMsgs = [];
            $scope.loadStatusTopoMsgs = [];
            $scope.successSentFlows = [];
            $scope.hostTopologyData = [];

            $scope.highlightedNode = {};
			$scope.highlightedLink = {};

            $scope.addStatusMessage = function(msg) {
                if($scope.loadStatusMsgs.indexOf(msg) === -1) {
                    $scope.loadStatusMsgs.push(msg);
                }
            };

            $scope.dismissLoadStatus = function() {
                $scope.loadStatusMsgs = [];
            };

            $scope.flowIsConfigured = function(flow) {
                return flow  ? (flow.operational === 2 || flow.operational === 3) : false;
            };

            $scope.onlyInOperational = function(flow) {
                return flow && flow.operational === 2;
            };

            $scope.onlyOperationalSelected = function(flows) {
                return flows.filter(function(f) {
                    return $scope.onlyInOperational(f);
                });
            };

            $scope.addEditFlow = function(flow){
                $scope.selectedFlows = [flow];
            };

            $scope.setSelFlows = function(flows){
                $scope.selectedFlows = flows;
            };

            $scope.appendEditFlow = function(){
                var flow = FlowProcessor.createEmptyFlow();
                    copy = $scope.selectedFlows.slice();

                copy.push(flow);
                $scope.selectedFlows = copy;
                return flow;
            };

            $scope.appendEditFilter = function(){
                var flow = FlowProcessor.createEmptyFlow();
                    copy = $scope.filters.slice();

                flow.name = 'Filter '+($scope.filters.length + 1)+' name';
                flow.active = 1;

                copy.push(flow);
                $scope.filters = copy;
                return flow;
            };

            $scope.deleteSelFlows = function(flow){
                var index = $scope.selectedFlows.indexOf(flow);

                if ( index !== -1 ) {
                    $scope.selectedFlows.splice(index, 1);
                }

                if ( !$scope.selectedFlows.length ) {
                    $scope.appendEditFlow();
                }
            };

            $scope.deleteSelFilter = function(flow){
                var index = $scope.filters.indexOf(flow);

                if ( index !== -1 ) {
                    $scope.filters.splice(index, 1);
                }

                if ( !$scope.filters.length ) {
                    $scope.appendEditFilter();
                }
            };

            $scope.successSentFlows = [];

            $scope.setSuccessAlert = function(data){
                $scope.successSentFlows.push(data);
            };

            $scope.dismissSuccessFlowStatus = function(){
                $scope.successSentFlows = [];
            };

            $scope.getDeviceById = function(id) {
                return $scope.devices[id]; 
            };

            $scope.getDevicesList = function(devices) {
                return Object.keys(devices).map(function(key) {
                    return devices[key];
                });
            };

            $scope.getDeviceType = function(device) {
                return device ? device['flow-node-inventory:hardware'] : '';
            };

            $scope.getDeviceTypeById = function(deviceId) {
                var device = $scope.getDeviceById(deviceId);

                return device ? device['flow-node-inventory:hardware'] : '';
            };

            $scope.getDeviceNameById = function(deviceId) {
                var device = $scope.getDeviceById(deviceId);

                return device ? device['flow-node-inventory:description'] : '';
            };

            $scope.getDeviceFullName = function(device) {
                return device.id + ' [' + device['flow-node-inventory:description'] +'] [' + $scope.getDeviceType(device) +']';
            };

            $scope.getDeviceFullNameById = function(deviceId) {
                var device = $scope.getDeviceById(deviceId);

                return device ? $scope.getDeviceFullName(device) : deviceId;
            };

            $scope.propertiesExpanded = true;
            $scope.propertiesExpand = function() {
                $scope.propertiesExpanded = !$scope.propertiesExpanded;
            };

            $scope.actionsExpanded = true;
            $scope.actionsExpand = function() {
                $scope.actionsExpanded = !$scope.actionsExpanded;
            };

            $scope.matchExpanded = true;
            $scope.matchExpand = function() {
                $scope.matchExpanded = !$scope.matchExpanded;
            };

            var updatePopUpData = function(){
                if ( $scope.view.flowPopup ) {
                    $scope.loadFlows();
                }

                if ( $scope.view.statisticsPopup ) {
                    $scope.$broadcast('OM_RELOAD_STATS');
                }
            };

            $scope.toggleSelDevice = function(deviceId) {
                var device = $scope.devices[deviceId];

                if(!device) {
                    device = $scope.getInventoryNodeBytNetworkNodeId(deviceId);
                }

                if(device) {
                    var present = $scope.selectedDevices.hasOwnProperty(device.id);

                    if(present === false) {
                        $scope.selectedDevices[device.id] = device;
                    } else {
                        delete $scope.selectedDevices[device.id];
                    }
                    
                    var selList = $scope.getDevicesList($scope.selectedDevices);

                    $scope.selectedDevicesList = selList.length ? selList : $scope.getDevicesList($scope.devices);

                    $scope.selectedDevicesList.forEach(function(item){
                        item.checkedStats = item.id === deviceId ? true : item.checkedStats;
                    });

                    updatePopUpData();

                    return !present;
                } else {
                    console.warn('can\'t map id ',deviceId,'to any of inventory devices', $scope.devices);
                    return false;
                }
            };

            $scope.getInventoryNodeBytNetworkNodeId = function(nodeId) {
                // get datapath id for deviceId
                var device;

                var datapathId = $scope.topologyData.nodes.filter(function(n) {
                    return n['node-id'] === nodeId;
                })[0]['datapath-id'];

                // because datapath id is large number, it's rounded in JS
                // we need to split key in  $scope.device array, 
                if(datapathId) {
                    var keys = Object.keys($scope.devices);
                    keys.forEach(function(k) {
                        //console.log(k, datapathId, parseInt(k.split(':')[1]) === datapathId);
                        if(parseInt(k.split(':')[1]) === datapathId) {
                            device = $scope.devices[k];
                        }
                       
                    });
                    
                    return device;
                }
            };

            var getSelectedFilters = function() {
                $scope.filters = $scope.filters.slice();
            };

            var getSelectedFlows = function() {
                $scope.selectedFlows = [];
                $scope.selectedOriginalFlows = [];
                $scope.$broadcast('EV_GET_SEL_FLOW', function(flow) {
                    $scope.selectedFlows.push(flow);
                    $scope.selectedOriginalFlows.push(angular.copy(flow));
                });
            };

            $scope.checkDeletingArray = function() {
                if($scope.deletingFlows.length > 0) {
                    $timeout(function () {
                        $scope.loadFlows();
                    }, $scope.checkOperChangeTimeout);
                }
            };

            $scope.labelCbk = function(flow, defaultName) {
                var parseOperationalId = function(prop){
                    if(prop === 'id'){
                        return flow.operational === 2 ? 'CtrlGen ' + flow.data[prop].slice(flow.data[prop].indexOf('*')+1,flow.data[prop].length): flow.data[prop];
                    }else{
                        return flow.data[prop];
                    }
                };

                var getName = function(prop){
                    return flow.data ? flow.data[prop] !== undefined ? parseOperationalId(prop) : 'not set' : 'not set';
                };

                return flow.data ? flow.data['flow-name'] || '[id:'+ getName('id') +', table:'+ getName('table_id') +']' : defaultName || '-unnamed-';
            };

            $scope.dummyErrorCbk = function() {
                return false;
            };

            $scope.errorCbk = function(flow){
                return flow.error && flow.error.length;
            };

            $scope.modifySelectedFlows = function() {
                getSelectedFlows();
                $scope.toggleExpanded('flowOperPopup');
                $scope.successSentFlows = [];
            };

            $scope.modifySelectedFilters = function(){
                getSelectedFilters();
                $scope.toggleExpanded('flowsFilter');
            };

            $scope.deleteSelectedFlows = function() {
                getSelectedFlows();
                if($scope.selectedFlows.length) {
                    $scope.$broadcast('EV_DELETE_FLOWS', $scope.selectedFlows);
                }
            };

            $scope.clearEmptyFilters = function(){
                var getValue = function(filter){
                    for (var i in filter){
                        if(typeof filter[i] == 'object' && wasValueFound === false){
                            getValue(filter[i]);
                        }else if(filter[i] !== '' && wasValueFound ===false){
                            wasValueFound = true;
                        }
                    }
                };

                $scope.filters = $scope.filters.filter(function(fil){
                    wasValueFound = false;
                    getValue(fil.data);
                    return fil.device || wasValueFound;
                });
            };

            $scope.toggleExpanded = function(expand, show) {
				$scope.view[expand] = show ? true : !$scope.view[expand];

                for ( var property in $scope.view ) {
                    $scope.view[property] = expand !== property ? false : $scope.view[expand];
                }

                if ( $scope.view[expand] ) {
                    DesignOFMfactory.ableModal('.flowInfoWrapper');
					if(!$scope.sidebarOpen) {
						$scope.topo.width('21%');
						$scope.topo.fit();
					}
					$scope.sidebarOpen = true;
                } else {
                    DesignOFMfactory.disableModal('.flowInfoWrapper');
					// spread out topology container and topo into

					$scope.topo.width($(window).width());
					$scope.topo.fit();
					$scope.sidebarOpen = false;
                }

                $scope.$broadcast('EV_INIT'+expand.toUpperCase());
            };

            $scope.collapseAll = function(basic){
                for ( var prop in $scope.view ){
                    $scope.view[prop] = false;
                }

                if (basic) {
					$scope.unselectAllNodes();
                    $scope.view.basic = true;
                    DesignOFMfactory.resetBodyTag();
                }
				else{
					$scope.clearPathLayer();
				}

				$scope.sidebarOpen = false;
				$scope.topo.width($(window).width());
				$scope.topo.fit();
            };

            $scope.loadHostData = function(){
              $scope.$broadcast('INIT_HOST_DATA');
            };

			// the function loads and updates the topology and topology panel
            $scope.loadTopology = function(next){
                OpenFlowManagerUtils.getTopologyData(function(data){
                    //$scope.topologyData = topology;
					//$scope.flowData = (data['network'][0].node && data['network'][0].node.length) ? data['network'][0].node : null;
					$scope.flowData = [{"node-id":"POD10-R2","ofl3-topology:status":"configured","ofl3-topology:host-name":"POD10-R2","ofl3-topology:subnet":["100.10.0.0/16","2600:40ff:fff8:100:0:0:0:0/64"],"ofl3-topology:type":"ofl3-topology:host","ietf-network-topology:termination-point":[{"tp-id":"ns11","ofl3-topology:mac-address":"00:25:90:E1:74:FB","ofl3-topology:admin-cost":1,"ofl3-topology:ip-address":["10.10.2.2","2001::1022"]},{"tp-id":"Ecmp-[DC1-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1}]},{"node-id":"POD10-R1","ofl3-topology:status":"configured","ofl3-topology:host-name":"POD10-R1","ofl3-topology:subnet":["100.10.0.0/16","2600:40ff:fff8:100:0:0:0:0/64"],"ofl3-topology:type":"ofl3-topology:host","ietf-network-topology:termination-point":[{"tp-id":"ns10","ofl3-topology:mac-address":"00:25:90:E1:74:FA","ofl3-topology:admin-cost":1,"ofl3-topology:ip-address":["10.10.1.2","2001::1012"]},{"tp-id":"Ecmp-[DC1-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1}]},{"node-id":"DC2-FB1","ofl3-topology:status":"operational","ofl3-topology:type":"ofl3-topology:forwarding-box","ofl3-topology:datapath-id":18087379761196150000,"ofl3-topology:forwarding-box-name":"DC2-FB1","ofl3-topology:datapath-type":"hp","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/5","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":5,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/4","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":4,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/1","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":1,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/3","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":3,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/2","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":2,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC3-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/48","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":48,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/18","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":18,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/17","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":17,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/19","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":19,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC1-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/21","ofl3-topology:status":"configured","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":21,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/20","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":20,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[POD20-R1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1}]},{"node-id":"POD30-R1","ofl3-topology:status":"configured","ofl3-topology:host-name":"POD30-R1","ofl3-topology:subnet":["100.30.0.0/16","2600:40ff:fff8:300:0:0:0:0/64"],"ofl3-topology:type":"ofl3-topology:host","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC3-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"ns30","ofl3-topology:mac-address":"00:25:90:E1:74:F8","ofl3-topology:admin-cost":1,"ofl3-topology:ip-address":["10.30.1.2","2001::3012"]}]},{"node-id":"DC2-FB2","ofl3-topology:status":"operational","ofl3-topology:type":"ofl3-topology:forwarding-box","ofl3-topology:datapath-id":18087661236172833000,"ofl3-topology:forwarding-box-name":"DC2-FB2","ofl3-topology:datapath-type":"hp","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/5","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":5,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/4","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":4,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/1","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":1,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/3","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":3,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC3-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/2","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":2,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/48","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":48,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/18","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":18,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/17","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":17,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/19","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":19,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC1-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"Ecmp-[POD20-R2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/20","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":20,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000}]},{"node-id":"POD30-R2","ofl3-topology:status":"configured","ofl3-topology:host-name":"POD30-R2","ofl3-topology:subnet":["100.30.0.0/16","2600:40ff:fff8:300:0:0:0:0/64"],"ofl3-topology:type":"ofl3-topology:host","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC3-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"ns31","ofl3-topology:mac-address":"00:25:90:E1:74:F9","ofl3-topology:admin-cost":1,"ofl3-topology:ip-address":["2001::3022","10.30.2.2"]}]},{"node-id":"DC3-FB2","ofl3-topology:status":"operational","ofl3-topology:type":"ofl3-topology:forwarding-box","ofl3-topology:datapath-id":18088224186126242000,"ofl3-topology:forwarding-box-name":"DC3-FB2","ofl3-topology:datapath-type":"hp","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/5","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":5,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/4","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":4,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/1","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":1,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/3","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":3,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/2","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":2,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC3-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"Ecmp-[POD30-R2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/48","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":48,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/18","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":18,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/17","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":17,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/19","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":19,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/21","ofl3-topology:status":"configured","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":21,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC1-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/20","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":20,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000}]},{"node-id":"POD20-R2","ofl3-topology:status":"configured","ofl3-topology:host-name":"POD20-R2","ofl3-topology:subnet":["2600:40ff:fff8:200:0:0:0:0/64","100.20.0.0/16"],"ofl3-topology:type":"ofl3-topology:host","ietf-network-topology:termination-point":[{"tp-id":"ns21","ofl3-topology:mac-address":"FA:8C:60:34:33:F8","ofl3-topology:admin-cost":1,"ofl3-topology:ip-address":["10.20.2.2","2001::2022"]},{"tp-id":"Ecmp-[DC2-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1}]},{"node-id":"DC3-FB1","ofl3-topology:status":"operational","ofl3-topology:type":"ofl3-topology:forwarding-box","ofl3-topology:datapath-id":18087942711149584000,"ofl3-topology:forwarding-box-name":"DC3-FB1","ofl3-topology:datapath-type":"hp","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/5","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":5,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/4","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":4,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/1","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":1,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/3","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":3,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC3-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/2","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":2,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[POD30-R1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/48","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":48,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/18","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":18,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/17","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":17,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/19","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":19,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC1-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/20","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":20,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000}]},{"node-id":"POD20-R1","ofl3-topology:status":"configured","ofl3-topology:host-name":"POD20-R1","ofl3-topology:subnet":["2600:40ff:fff8:200:0:0:0:0/64","100.20.0.0/16"],"ofl3-topology:type":"ofl3-topology:host","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"ns20","ofl3-topology:mac-address":"00:25:90:E1:75:12","ofl3-topology:admin-cost":1,"ofl3-topology:ip-address":["2001::2012","10.20.1.2"]}]},{"node-id":"DC1-FB2","ofl3-topology:status":"operational","ofl3-topology:type":"ofl3-topology:forwarding-box","ofl3-topology:datapath-id":18087098286219444000,"ofl3-topology:forwarding-box-name":"DC1-FB2","ofl3-topology:datapath-type":"hp","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/5","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":5,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[POD10-R2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/4","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":4,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/1","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":1,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/3","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":3,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC3-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/2","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":2,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/48","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":48,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/18","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":18,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/17","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":17,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/19","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":19,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC1-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/21","ofl3-topology:status":"configured","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":21,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/20","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":20,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000}]},{"node-id":"DC1-FB1","ofl3-topology:status":"operational","ofl3-topology:type":"ofl3-topology:forwarding-box","ofl3-topology:datapath-id":18086816811242734000,"ofl3-topology:forwarding-box-name":"DC1-FB1","ofl3-topology:datapath-type":"hp","ietf-network-topology:termination-point":[{"tp-id":"Ecmp-[DC2-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/5","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":5,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/4","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":4,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[POD10-R1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/1","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":1,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/3","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":3,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/2","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":2,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC3-FB1]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/48","ofl3-topology:status":"operational","ofl3-topology:admin-cost":1,"ofl3-topology:port-id":48,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/18","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":18,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/17","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":17,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/19","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":19,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"te-1/1/21","ofl3-topology:status":"configured","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":21,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000},{"tp-id":"Ecmp-[DC1-FB2]","ofl3-topology:status":"discovered","ofl3-topology:admin-cost":1},{"tp-id":"te-1/1/20","ofl3-topology:status":"operational","ofl3-topology:admin-cost":10,"ofl3-topology:port-id":20,"ofl3-topology:vlan-id":1,"ofl3-topology:max-bandwidth":10000000}]}];
					// if couldn't load flows
                    if ( !data['network'][0]['node'].length ) {
                        $scope.loadStatusTopoMsgs.push('OF_FLOW_TOPO_FAIL');
                    }
					else {
						// data processing
						var receivedData = data;
						var prefix = 'ofl3-topology:';

						var topologyData = {
							nodes: [],
							links: [],
							// external id -> internal id
							nodesDict: new nx.data.Dictionary({}),
							linksDict: new nx.data.Dictionary({})
						};

						// sort nodes by node name alphabetically
						data['network'][0]['node'].sort(function(node1, node2){
							if(node1['node-id'] > node2['node-id'])
								return 1;
							else if(node1['node-id'] < node2['node-id'])
								return -1;
							else
								return 0;
						});

						// node array processing
						topologyData.nodes = data['network'][0]['node'].map(function(currentNode,index,nodes){
							var tempNode = {
								// internal node id (inside next)
								'id': index,
								// global node id
								'node-id': currentNode['node-id'],
								'label': currentNode['node-id'],
								// termination points
								'tp': currentNode['ietf-network-topology:termination-point'],
								'status': currentNode['ofl3-topology:status']
							};
							topologyData.nodesDict.setItem(currentNode['node-id'], index);

							// import ofl3-topology-ish data
							Object.getOwnPropertyNames(currentNode).forEach(function(val, idx, array){
								var cleanVal;
								if((cleanVal = val.split(prefix)).length == 2)
									tempNode[cleanVal[1]] = currentNode[val];
							});

							// fix for 'type' property (remove 'ofl3-topology' prefix)
							tempNode['type'] = tempNode['type'].split(prefix)[1];

							// different properties for different nodes
							switch (tempNode['type']) {
								case 'host':
									tempNode['iconType'] = 'host';
									tempNode['hostName'] = currentNode['ofl3-topology:host-name'];
									tempNode['subnet'] = currentNode['ofl3-topology:subnet'];
									break;
								case 'forwarding-box':
									tempNode['iconType'] = 'switch';
									tempNode['FBName'] = currentNode['ofl3-topology:forwarding-box-name'];
									break;
							}

							return tempNode;

						});


						function getKey(a, b){
							if(a < b)
								return a + '-' + b;
							else
								return b + '-' + a;
						}

						var linkContainerIndex;
						// processing links
						var operLinks = receivedData['network'][0]['ietf-network-topology:link'];
						for(var index = 0; index < receivedData['network'][0]['ietf-network-topology:link'].length; index++) {
							var srcId = topologyData.nodesDict.getItem(operLinks[index].source['source-node']);
							var tarId = topologyData.nodesDict.getItem(operLinks[index].destination['dest-node']);
							var currentLinkKey = getKey(srcId,tarId);
							var linkContainer = {};


							// get or create a new link container
							if(topologyData.linksDict.contains(currentLinkKey)){
								linkContainerIndex = topologyData.linksDict.getItem(getKey(srcId,tarId));
							}
							else{
								linkContainerIndex = topologyData.links.length;
								topologyData.linksDict.setItem(getKey(srcId,tarId), linkContainerIndex);
								topologyData.links.push({
									id: linkContainerIndex,
									source: Math.min(srcId, tarId),
									target: Math.max(srcId, tarId),
									ecmp: false,
									links: [],
									status: {
										operational: 0,
										configured: 0
									},
									linksIntegrity: true
								});
							}
							linkContainer = topologyData.links[linkContainerIndex];

							// distinct link infomation
							var linkInfo = {
								linkId: operLinks[index]['link-id'],
								srcTp: operLinks[index].source['source-tp'],
								tarTp: operLinks[index].destination['dest-tp'],
								status: operLinks[index]['ofl3-topology:status'],
								groups: operLinks[index]['ofl3-topology:link-group-id']
							};

							if(linkInfo.groups[0] == 'Ungrouped')
								linkInfo.groups = [];

							var biLink;
							var biLinkExists = false;
							for(var intIndex = 0; intIndex < linkContainer.links.length; intIndex++){
								var curBiLink = linkContainer.links[intIndex];
								// bi link exists, assign it to biLink and jump off loop
								if(curBiLink.tp1 == linkInfo.srcTp && curBiLink.tp2 == linkInfo.tarTp
								|| curBiLink.tp1 == linkInfo.tarTp && curBiLink.tp2 == linkInfo.srcTp) {
									biLink = curBiLink;
									biLinkExists = true;
									break;
								}
							}

							// if link didn't exist
							if(!biLinkExists){
								biLink = {
									links: [linkInfo],
									status: linkInfo.status,
									statusDiff: false,
									tp1: linkInfo.srcTp,
									tp2: linkInfo.tarTp
								};
								linkContainer.links.push(biLink);
								if(linkContainer.status.hasOwnProperty(biLink.status)) {
									linkContainer.status[biLink.status]++;
									if(biLink.status == 'operational')
										linkContainer.status['configured']++
								}
								// if status doesn't exist
								else{
									linkContainer.status[biLink.status] = 1;
								}
							}
							// otherwise
							else{
								// add new distinct link
								biLink.links.push(linkInfo);
								if(biLink.status != linkInfo.status){
									// choose worst status
									biLink.status = 'configured';
									// assume this direction not operational
									linkContainer.status.operational--;
									// links differ
									biLink.statusDiff = true;
									// integrity broken
									linkContainer.linksIntegrity = false;
								}
							}

							// set ECMP status if 2+ links
							if(linkContainer.links.length > 1){
								linkContainer.ecmp = true;
							}
						}

						// move topologyData to $scope
						$scope.topologyData = topologyData;
					}
					next();
                    $scope.$broadcast('OM_LOAD_TOPO_TAGS', data);
                }, function() {
                    $scope.addStatusMessage('Can\'t read data from topology. Data are empty or can\'t connect to the controller');
                    console.warn('cannot get topology info from controller');
                    Auth.logout();
                });
            };

			// Load policies
			$scope.loadPolicies = function(){
				OpenFlowManagerUtils.getPolicyData(
					// loaded successfully
					function(data){
						$scope.policyData = data['ofl3-policies'].policy;
						// policies processing
						$scope.policyData.forEach(function(policy, index, policies){
							// path bundles processing
							policy['path-bundle'].forEach(function(pathBundle, index, pathBundles){
								if(pathBundle.hasOwnProperty('path')) {
									// paths processing
									pathBundle['path'].forEach(function (path, index, paths) {
										// hops processing
										var hops = [];
										var hopsDict = new nx.data.Dictionary({});
										path['hop'].forEach(function (hop, index, hops) {
											// out node name
											hop['out-tp-name'] = hop['out-tp-id'].substring(6, hop['out-tp-id'].length - 1);
											// in node name
											hop['in-tp-name'] = hop['in-tp-id'].substring(6, hop['in-tp-id'].length - 1);
											// out node id (internal)
											hop['out-tp-node-id'] = $scope.topologyData.nodesDict.getItem(hop['out-tp-name']);
											// in node id (internal)
											hop['in-tp-node-id'] = $scope.topologyData.nodesDict.getItem(hop['in-tp-name']);
											// hop switch (forwarding-box) internal id
											hop['hop-fb-node-id'] = $scope.topologyData.nodesDict.getItem(hop['node-name']);
											// put hop object to dictionary to reorder them in future
											hopsDict.setItem(hop.order, hop);
										});
										// reorder hops
										path.hop = [];
										for (var i = 1; i <= hopsDict.count(); i++) {
											path.hop.push(hopsDict.getItem(i));
										}

										path.sourceNode = path.hop[0]['node-name'];
										path.destNode = path.hop[path.hop.length - 1]['node-name'];

									});

                                    pathBundle['path'].sort(function (a, b) {
                                        var aId = parseInt(a['path-name'].split('-')[0]);
                                        var bId = parseInt(b['path-name'].split('-')[0]);

										if (aId > bId)
											return 1;
										else if (aId < bId)
											return -1;
										else
											return 0;
									});

								}else {
									pathBundle['path'] = [];
								}

								// todo: remove when Andrew fixes this
								if(!pathBundle.hasOwnProperty('constraints')){
									pathBundle.constraints = {};
								}
								pathBundle.constraintsNumber = Object.keys(pathBundle.constraints).length;
							});
						});
					},
					// error callback
					function(data,status) {
						$scope.addStatusMessage('Can\'t read policy data. Policy data are empty or can\' connect to the controller');
						console.warn('cannot get policy info from controller');
						Auth.logout();
					});
			};

            $scope.loadFlows  = function() {
                $scope.flows = [];
                $scope.successSentFlows = [];
                
                var filterFunction = ($.isEmptyObject($scope.selectedDevices) === false ?
                    function(device_id) {
                        return $scope.selectedDevices.hasOwnProperty(device_id);
                    } : 
                    function(flow) {
                        return true;
                    }
                );

                var processOperationalFlows = function(flowsArray) {
                    $scope.processDeletedFlows(flowsArray);
                    //$scope.processUpdatedFlows(flowsArray);
                    $scope.checkDeletingArray();
                };

                OpenFlowManagerUtils.getFlowsNetwork(function(flows){
                        var configflows = flows.filter(function(flow) {
                            return filterFunction(flow.device);
                        });

                    OpenFlowManagerUtils.mapFlowsOperational(configflows, filterFunction, function(mappedFlows) {
                        processOperationalFlows(mappedFlows);
                        $scope.flows = mappedFlows;
                        $scope.$broadcast('EV_GET_FLOWS');
                        $scope.$broadcast('EV_GET_FILTERS');
                    }, function() {
                        console.warn('can\'t access operational nodes data');
                    });
                }, function() {
                    OpenFlowManagerUtils.getOperFlowsNetwork(filterFunction, function(flows) {
                        processOperationalFlows(flows);
                        $scope.flows = flows;
                        $scope.$broadcast('EV_GET_FLOWS');
                        $scope.$broadcast('EV_GET_FILTERS');
                    }, function(){
                        console.warn('can\'t load flows from controller');
                    });
                });
            };

            $scope.loadFilters = function(){
                $scope.$broadcast('EV_GET_FILTERS');
            };

            $scope.loadDevices  = function() {
                OpenFlowManagerUtils.getDevices(
                    function(devices){
                        devices.forEach(function(d) {
                            $scope.devices[d.id] = d;
                            d.checkedStats = true;
                        });
                        $scope.selectedDevicesList = devices;
                        $scope.$broadcast('EV_GET_DEVICES');
                    },
                    function() {
                        $scope.addStatusMessage('Can\' read inventory data. Inventory is empty or can\'t connect to the controller');
                        console.warn('cannot get devices info from controller');
                        Auth.logout();
                    }
                );

            };

			// load all data from the server
            $scope.loadAll = function() {
                DesignOFMfactory.setMainClass(function(){
					// topology loaded and processed first
                    $scope.loadTopology(function(){
						$scope.loadPolicies()
					});
                    $scope.loadDevices();

                });
            };

            // Input:
            //      - flows (array) - array of flows from controller
            // Returns:
            //      void
            // Description:
            //      Function sets 'deleting' property of flows matched to scope array '$scope.deletingFlows'.
            //      Also clears '$scope.deletingFlows' of deleted flows.
            $scope.processDeletedFlows = function(flows) {
                $scope.deletingFlows = $scope.deletingFlows.filter(function(df) {
                    return flows.some(function(f) {
                        return f.data.id === df;
                    });
                });

                flows.forEach(function(f) {
                    f.deleting = $scope.deletingFlows.indexOf(f.data.id) >= 0;
                });
            };

            // Input:
            //      - flows (array) - array of flows from controller
            // Returns:
            //      void
            // Description:
            //      Function sets 'updating' property of flows matched to scope array '$scope.updatingFlows'.
            $scope.processUpdatedFlows = function(flows) {
                var flowDataNormalize = function(flow) {
                        if(flow && flow.data && flow.data.match)
                        {
                            if(flow.data.match.hasOwnProperty('ipv4-destination'))
                            {
                                flow.data.match['ipv4-destination'] = IpFactory.getNerworkAddress(flow.data.match['ipv4-destination']);
                            }
                            if(flow.data.match.hasOwnProperty('ipv4-source'))
                            {
                                flow.data.match['ipv4-source'] = IpFactory.getNerworkAddress(flow.data.match['ipv4-source']);
                            }
                        }
                    },
                    // Input:
                    //      - flow1 (object) - flow
                    //      - flow2 (object) - flow
                    // Returns:
                    //      - (bool) 
                    // Description:
                    //      function compares two flow object parts (match, action) and returns true if are equal
                    compareFlowsData = function(flow1, flow2) {
                        flow1.data.match = flow1.data.match === undefined ? {} : flow1.data.match;
                        flow2.data.match = flow2.data.match === undefined ? {} : flow2.data.match;

                        flow1.data.instructions = flow1.data.instructions === undefined ? {} : flow1.data.instructions;
                        flow2.data.instructions = flow2.data.instructions === undefined ? {} : flow2.data.instructions;                        

                        return angular.equals(flow1.data.match,flow2.data.match) &&
                               angular.equals(flow1.data.instructions,flow2.data.instructions);
                    },
                    // Input:
                    //      - flow1 (object) - flow
                    //      - flow2 (object) - flow
                    // Returns:
                    //      - (bool) 
                    // Description:
                    //      function compares flow properties (table_id, priority and device) and returns true if are equal
                    compareFlowsMandatoryProperties = function(flow1, flow2) {
                        return  flow1.data.table_id === flow2.data.table_id &&
                                flow1.data.priority === flow2.data.priority &&
                                flow1.device        === flow2.device;
                    };

                $scope.updatingFlows = $scope
					.updatingFlows.filter(function(uf) {
                    flowDataNormalize(uf);

                    return flows.some(function(f) {
                        if(compareFlowsMandatoryProperties(f, uf))
                        {
                            if (!compareFlowsData(f, uf))
                            {
                                f.updating = true;
                                return true;
                            }
                            return false;
                        }
                        
                    });
                });
            };

			/*** NODE PANEL NAVIGATION ***/

			// get back to links
			$scope.backToNodesList = function(){
				$scope.fadeInAllLayers();
				$scope.nodePanel.overview = true;
				$scope.nodePanel.nodeDetails = false;
				$scope.nodePanel.tpDetails = false;
				$scope.currentNode = null;
			};

			// open node details
			$scope.openNodeDetails = function(node){
				$scope.fadeInAllLayers();
				$scope.nodePanel.overview = false;
				$scope.nodePanel.nodeDetails = true;
				$scope.nodePanel.tpDetails = false;

				$scope.currentNode = node;
				$scope.currentTP = null;
			};

			// open details of Termination Point
			$scope.openTPDetails = function(tp){
				$scope.nodePanel.overview = false;
				$scope.nodePanel.nodeDetails = false;
				$scope.nodePanel.tpDetails = true;

				$scope.currentTP = tp;
			};

			// apply update for topology and policy data
			$scope.applyDataUpdate = function(){
				$scope.topologyData.nodes.forEach(function(node, index, nodes){
					console.log(node);
				});
			};

			$scope.formatBandwidth = function(bw){
				if(bw == undefined)
					return 'N/A';
				bw = parseInt(bw);
				var newBW;
				// bits
				if(bw < 1000)
					newBW = bw + ' b/s';
				// kilobits
				else if(bw >= 1000 && bw < 1000000)
					newBW = (bw/1000).toFixed(1) + ' kb/s';
				// megabits
				else if(bw >= 1000000 && bw < 1000000000)
					newBW = (bw/1000000).toFixed(1) + ' Mb/s';
				// gigabits
				else if(bw >= 1000000000 && bw < 1000000000000)
					newBW = (bw/1000000000).toFixed(1) + ' Gb/s';
				// terabits
				else
					newBW = (bw/1000000000000).toFixed(1) + ' Tb/s';
				return newBW;
			};

			/*** LINK PANEL NAVIGATION ***/

			// get back to links
			$scope.backToLinkContainerList = function(){
				$scope.linkPanel.overview = true;
				$scope.linkPanel.linkContainerDetails = false;
				$scope.linkPanel.linkDetails = false;
				$scope.currentLinkContainer = null;
			};

			// open link container details
			$scope.openLinkContainerDetails = function(linkContainer){
				$scope.linkPanel.overview = false;
				$scope.linkPanel.linkContainerDetails = true;
				$scope.linkPanel.linkDetails = false;
				$scope.currentLinkContainer = linkContainer;
				$scope.currentLink = null;

				// highlight the link
				$scope.highlightLink(linkContainer.id);
			};

			// open link details
			$scope.openLinkDetails = function(link){console.log(link);
				$scope.linkPanel.overview = false;
				$scope.linkPanel.linkContainerDetails = false;
				$scope.linkPanel.linkDetails = true;
				$scope.currentLink = link;
			};

			/*** POLICY PANEL NAVIGATION ***/

			// get back to policies (initial state)
            $scope.backToPolicyList = function(){
				$scope.clearPathLayer();
                $scope.policyPanel.overview = true;
                $scope.policyPanel.policyDetails = false;
                $scope.policyPanel.bundleDetails = false;
				$scope.policyPanel.bundleDetails = false;
                $scope.currentPolicy = null;
            };

			// open policy
			$scope.openPolicyDetails = function(policy){
				$scope.clearPathLayer();
                $scope.policyPanel.policyDetails = true;
                $scope.policyPanel.overview = false;
                $scope.policyPanel.bundleDetails = false;

                $scope.currentPolicy = policy;
                $scope.currentPathBundle = null;
			};

			// open path bundle
			$scope.openPathBundleDetails = function(pathBundle){
				$scope.clearPathLayer();
                $scope.policyPanel.overview = false;
                $scope.policyPanel.policyDetails = false;
                $scope.policyPanel.bundleDetails = true;
				$scope.policyPanel.pathDetails = false;

                $scope.currentPathBundle = pathBundle;
				$scope.currentPath = null;
				$scope.currentHop = null;
			};

			// open path
			$scope.openPathDetails = function(path){
				$scope.policyPanel.bundleDetails = false;
				$scope.policyPanel.pathDetails = true;

                $scope.currentPath = path;
				$scope.currentHop = null;

				// highlight path on topology
				$scope.highlightPath($scope.getLinksByHops(path.hop),'#1baafd');
			};

			// open hop
			$scope.openHopDetails = function(hop){
				$scope.currentHop = hop;
			};

            $scope.getNodeByDataPath = function(inventoryNodeId) {
                var inventoryNodeIdParts = inventoryNodeId.split(':');

                return $scope.topologyData.nodes.filter(function(n) {
                    return n['datapath-id'] === parseInt(inventoryNodeIdParts[1]);
                })[0];
            };

            $scope.getTpByPortId = function(terminationPointArray, portId) {
                var inventoryPortIdParts = portId.split(':');

                return terminationPointArray.filter(function(t) {
                    return t['ofl3-topology:port-id'] === parseInt(inventoryPortIdParts[2]);
                })[0];
            };

            var getDataTagsDevices = function(){
                return $scope.tagsForTable;
            };

            var getDataTagsDevicesLength = function(){
                return getDataTagsDevices() ? getDataTagsDevices().length : 0;
            };

            var refreshTagsTable = function() {
                $scope.tableParamsTags.reload();
            };

            var initTableTagsDevices = function(){
                $scope.tableParamsTags = new NgTableParams({
                    page: 1,
                    count: 5,
                    sorting: {
                        name: 'asc'
                    }
                }, {
                    total: getDataTagsDevicesLength(),
                    counts: [2,5,10,15,20],

                    getData: function($defer, params) {
                        var data = getDataTagsDevices(),
                            orderedData = params.sorting() ? $filter('orderBy')(data, params.orderBy()) : data;

                        params.total(orderedData.length);
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }
                });
            };
            
            $scope.$on('OM_LOAD_TAGS', function(event, tags) {
                $scope.tagsForTable = tags;
                refreshTagsTable();
            });

			// update topology by timer
			$scope.refreshDataInterval = 5000;
            $scope.loadAll();
			//$scope.loadAllTimerHandler = setInterval(function(){
			//	$scope.loadAll();
			//	$scope.applyDataUpdate();
			//},$scope.refreshDataInterval);

            initTableTagsDevices();
            $scope.tagsForTable = [];
            
        }
    ]);


    openflow_manager.register.controller('hostsCtrl',['$scope', '$filter', 'ngTableParams', 'HostsHandlerService', function($scope, $filter, NgTableParams, HostsHandlerService){

      $scope.hosts = [];
      $scope.tableParamsHosts = null;


      $scope.timestampToTime = function(timestamp){
        var a = new Date(timestamp),
            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            year = a.getFullYear(),
            month = months[a.getMonth()],
            date = a.getDate(),
            hour = a.getHours(),
            min = a.getMinutes(),
            sec = a.getSeconds(),
            time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;

        return time;
      };

      var getData = function(){
        $scope.hosts = HostsHandlerService.getHostsData($scope.hostTopologyData);
        return $scope.hosts;
      };

      var initHostsTable = function(){
        $scope.tableParamsHosts = new NgTableParams({
          page: 1,
          count: 10,
          filter: {}
        }, {
          total: getData().length,
          counts: [10,15,20,25,30],
          getData: function($defer, params) {
            var alldata = getData(),
                orderedData = params.sorting() ? $filter('orderBy')(alldata, params.orderBy()) : alldata;

            // orderedData = getActiveFilter() ? applyFilter(orderedData) : orderedData;

            params.total(orderedData.length);
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          },
          $scope: { $data: {} }

        });



      };


      initHostsTable();

      $scope.$on('INIT_HOST_DATA', function(){
        $scope.tableParamsHosts.reload();
      });

    }]);

    openflow_manager.register.controller('statisticsCtrl', ['$scope', '$filter', '$timeout', 'ngTableParams', 'OpenFlowManagerUtils', 'StatisticsProcessor', function($scope, $filter, $timeout, NgTableParams, OpenFlowManagerUtils, StatisticsProcessor) {

            $scope.selectedDev = null;
            $scope.portStatistics = [];
            $scope.stats = null;
            $scope.tableType = 'TABLE';
            $scope.subStats = null;
            $scope.statisticsTimer = 300000;
            $scope.graphTableData = [];
            $scope.linkStatRegistrations = [];
            $scope.statisticsObj = [
                {
                    name: 'Link statistics',
                    funct: 'updateLinkStats',
                    type: 'LINK',
                    subStatistics: []
                },
                {
                    name: 'Table statistics',
                    funct: 'updateTableStats',
                    type: 'TABLE',
                    subStatistics: [
                        {
                            name: 'Flow stats',
                            funct: 'getFlowSstats'
                        },
                        {
                            name: 'Flow table stats',
                            funct: 'getFlowTstats'
                        },
                        {
                            name: 'Aggregate flow stats',
                            funct: 'getAggregateFstats'
                        }
                    ]
                },
                {
                    name: 'Ports statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'generalStatsByNodes',
                    serviceFunct: 'portStatsByNode',
                    container: 'opendaylight-port-statistics:flow-capable-node-connector-statistics',
                    type: 'PORT',
                    subStatistics: []
                },
                {
                    name: 'Queue statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'generalStatsByNodes',
                    serviceFunct: 'queueStatsByNode',
                    parentContainer: 'flow-node-inventory:queue',
                    container: 'opendaylight-queue-statistics:flow-capable-node-connector-queue-statistics',
                    type: 'QUEUE',
                    subStatistics: []
                },
                {
                    name: 'Group statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'getGMStats',
                    parentContainer: 'flow-node-inventory:group',
                    container: 'opendaylight-group-statistics:group-statistics',
                    type: 'GROUP',
                    subStatistics: []
                },
                {
                    name: 'Meter statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'getGMStats',
                    parentContainer: 'flow-node-inventory:meter',
                    container: 'opendaylight-meter-statistics:meter-statistics',
                    type: 'METER',
                    subStatistics: []
                },
                {
                    name: 'Meter features',
                    funct: 'updateGeneralStats',
                    subFunct: 'getMeterFeaturesStats',
                    container: 'opendaylight-meter-statistics:meter-features',
                    type: 'METERFEATURES',
                    subStatistics: []
                }
            ];

            $scope.linkStatObj = {
                "registration-id": null,
                "window": 6,    
                "response-type": 'individual',
                "response-units": 'link-utilization',
                "original-samples": true
            };

            $scope.linkStatResponseTypes = ['individual','aggregate'];
            $scope.linkStatResponseUnits = ['link-utilization','bits-per-second'];

            $scope.linkStatData = {};

            var graphTableDataAll = [],
                getSelectedDeviceNames = function(){
                    return $scope.selectedDevicesList.map(function(dev){
                        if (dev.checkedStats){
                            return dev.id;
                        }
                    });
                };

            var getFilteredDataByDevice = function(){
                var selDevices = getSelectedDeviceNames();
                return graphTableDataAll.filter(function(item){
                            return selDevices.indexOf(item.origDevName) !== -1;
                        });
            };

            $scope.changeTplType = function(){
                $scope.tableType = $scope.stats.type;


                // todo - get stats if there ar not substats
                //if($scope.stats)
            };

            $scope.getStatsData = function(notWarning){
                if ( !notWarning ) {
                    $scope.requestWorkingCallback();
                }

                OpenFlowManagerUtils.getAllStatistics(function(data) {
                    $scope.updateStatistics(data);
                    $scope.processingModulesSuccessCallback();
                },function() {});
                
            };

            $scope.gatherStatistics = function(notWarning) {
                $scope.getStatsData(notWarning);


                // OpenFlowManagerUtils.getPortStatistics(updatePortStats, function() {});
                $timeout(function () {
                    $scope.gatherStatistics(true);
                }, $scope.statisticsTimer);
            };

            $scope.changesDeviceNames = function(){
                graphTableDataAll.forEach(function(dev){
                  dev.origDevName = dev.device;
                  //console.log('dev', dev);
                  //dev.device = $scope.getDeviceFullNameById(dev.device);
                  dev.device = $scope.getNodeByDataPath(dev.device)['node-id'];

                  // if ( dev['stats-array'] && dev['stats-array'].length ) {
                  //     dev['stats-array'].forEach(function(table){
                  //           table.DeviceType.value = $scope.getDeviceType($scope.getDeviceById(table.Device.value));
                  //       });
                  //   }
                });
            };

            $scope.updateTableStats = function(data){
                var tableStatsData = StatisticsProcessor.tableStatsByNodes(data);
                
                if ( $scope.subStats ) {
                    $scope.graphTableData = StatisticsProcessor.updateDataValue(StatisticsProcessor[$scope.subStats.funct](tableStatsData));

                    graphTableDataAll = $scope.graphTableData;

                    $scope.changesDeviceNames();

                    $scope.graphTableData = getFilteredDataByDevice();
                }
            };

            $scope.updateGeneralStats = function(data){

                if ( $scope.stats.subFunct ){

                    $scope.graphTableData = StatisticsProcessor.updateDataValue(StatisticsProcessor[$scope.stats.subFunct](data, $scope.stats));

                    graphTableDataAll = $scope.graphTableData;

                    $scope.changesDeviceNames();

                    $scope.graphTableData = getFilteredDataByDevice();
                }
                
            };

            $scope.updateLinkStats = function() {
                var statsData = [];

                StatisticsProcessor.getLinkStatistics($scope.linkStatObj,
                    function(data) {
                        $scope.linkStatData = data;

                        if(data['original-samples'] && data['original-samples'].length) {
                            data['original-samples'].forEach(function(origSample){
                                var statObject = {'link-id': origSample['link-id'], 'stats-array': []};
                                origSample.samples.forEach(function(sample) {
                                    var sampleVal = {
                                        'link-id': origSample['link-id'],
                                        'order': sample['order'],
                                        'value': sample['value']
                                    }
                                    
                                    statObject['stats-array'].push(sampleVal);
                                })
                                statsData.push(statObject);                            
                            });
                        }

                        //$scope.graphTableData = StatisticsProcessor.updateDataValueForLinks(statsData);
                        $scope.graphTableData = statsData;
                        graphTableDataAll = $scope.graphTableData;
                    },
                    function() {
                        console.log('getting link statistics error');
                    }
                );


            };

            $scope.updateDataFunc = function(){
              if($scope.userIsLogged){
                $scope.getStatsData();
              }  
            };

            $scope.toggleCheckedDev = function(device){
                device.checkedStats = !device.checkedStats;
                $scope.graphTableData = getFilteredDataByDevice();

            };

            $scope.updateStatistics = function(data){
                if ( $scope.stats ) {
                  //data = $scope.selectedDevicesList.length ? $scope.selectedDevicesList : data;
                    $scope[$scope.stats.funct](data);
                }

            };

            $scope.getLinksParams = function() {
                StatisticsProcessor.getRegistrations(
                    function(data) {
                        $scope.linkStatRegistrations = data;
                    },
                    function() {
                        console.log('getting statistics registrations error');
                    }
                );
            };

            $scope.gatherStatistics();

            $scope.$on('OM_SET_SEL_DEV', function(name, obj) {
                // $scope.selectedDev = $scope.selectedDevicesList.filter(function(dev){
                //                         return dev.id === obj.device;
                //                      })[0];

                $scope.stats = $scope.statisticsObj[obj.type];
                $scope.subStats = obj.subType ? $scope.stats.subStatistics.filter(function(subS){
                                                    return subS.funct === obj.subType;
                                                })[0] : null;

                $scope.changeTplType();

                if ( obj.subType ){
                    $scope.getStatsData();
                }
            });

            $scope.$on('OM_RELOAD_STATS', function(){
                $scope.getStatsData();
            });

            $scope.getLinksParams();
        }
    ]);

    openflow_manager.register.controller('flowInfoCtrl', ['$scope', '$filter', 'ngTableParams', 'modalWinServices', 'OpenFlowManagerUtils', '$interval', 'modalWinServicesDelete', function($scope, $filter, NgTableParams, modalWinServices, OpenFlowManagerUtils, $interval, modalWinServicesDelete) {
            $scope.checkboxes = { 'checked': false, items: {} };

            $scope.flowOperationalStatus = {
                1: "config",
                2: "operational",
                3: "config+operational"
            };

            $scope.$watch('checkboxes.checked', function(value) {
                $scope.flows.forEach(function(flow) {
                    if(flow.hasOwnProperty('device') && flow.hasOwnProperty('data') && flow.data.hasOwnProperty('id') && flow.data.hasOwnProperty('table_id')){
                        $scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device] = value;
                    }
                });
            });

            $scope.$on('EV_GET_SEL_FLOW', function(ev, callback) {
                $scope.flows.forEach(function(flow) {
                    if((flow.hasOwnProperty('device') && flow.hasOwnProperty('data') && flow.data.hasOwnProperty('id') && flow.data.hasOwnProperty('table_id')) && 
                        $scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device]){
                        callback(flow);
                    }
                });
            });

            $scope.$watch('checkboxes.items', function(values) {
                if (!$scope.flows.length) {
                    return;
                }
                var checked = 0, unchecked = 0,
                    total = $scope.flows.length;
                angular.forEach($scope.flows, function(flow) {
                    checked   +=  ($scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device]) || 0;
                    unchecked += (!$scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device]) || 0;
                });
                if ((unchecked === 0) || (checked === 0)) {
                    $scope.checkboxes.checked = (checked === total);
                }
            }, true);

            var applyFilter = function(orderedData) {
                var filteredData = [],
                    getFilterResult = function(flow,filter) {
                        for (var i in filter){
                            if(typeof filter[i] == 'object'){
                                if(flow[i]){
                                    getFilterResult(flow[i],filter[i]);
                                }else{
                                    filterResult = false;
                                }
                            }else if(filterResult !== false){
                                filterResult = filter[i] == flow[i];
                            }
                        }
                    };

                return (getActiveFilter() && $scope.filters.length) ? orderedData.slice().filter(function(flow){
                    return $scope.filters.filter(function(fil){
                            return fil.active == 1;
                        }).some(function(filter){
                            filterResult = null;

                            if(filter.device){
                                if(filter.device == flow.device){
                                    filterResult = true;
                                    getFilterResult(flow.data,filter.data);
                                }else{
                                    filterResult = false;
                                }
                            }else{
                                getFilterResult(flow.data,filter.data);
                            }

                            return filterResult;
                        });
                }) : orderedData;
            };

            var getData = function() {
                return applyFilter($scope.flows);
            };

            var getDataLength = function() {
                return getData().length;
            };

            var getFilterData = function() {
                return $scope.filters;
            };

            var getFilterDataLength = function() {
                return getFilterData().length;
            };

            var getActiveFilter = function() {
                return $scope.filters.filter(function(filter){
                            return filter.active == 1;
                        }).length && $scope.filtersActive;
            };

            var getSummaryDevices = function() {
                return $scope.selectedDevicesList;
            };

            var getSummaryDevicesLength = function() {
                return getSummaryDevices().length;
            };



            var initTable = function() {

                $scope.tableParams = new NgTableParams({
                    page: 1,
                    count: 10,
                    filter: {}
                }, {
                    total: getDataLength(),
                    counts: null,
                    getData: function($defer, params) {
                      var allData = getData(),
                          filteredData = params.filter() ? $filter('NgTableSearchFlows')(allData, params.filter(), $scope.labelCbk, $scope.getDeviceTypeById, $scope.getDeviceNameById) : allData,
                          orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

                      params.total(orderedData.length);
                      $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    },
                    $scope: { $data: {} }

                });
            };

            var initSummaryTable = function() {
                $scope.summaryTableParams = new NgTableParams({
                    page: 1,
                    count: 10,
                    filter: {}
                }, {
                    total: getSummaryDevicesLength(),
                    counts: null,
                    getData: function($defer, params) {
                        var allData = getSummaryDevices(),
                            filteredData = params.filter() ? $filter('FlowSummaryFilter')(allData, params.filter(), $scope.getDeviceType) : allData,
                            orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

                        params.total(orderedData.length);
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    },
                    $scope: { $data: {} }
                });
            };

            var filterInitTable = function(){
                $scope.filterTableParams = new NgTableParams({
                    page: 1,
                    count: 5
                }, {
                    total: getFilterDataLength(),
                    counts: null,
                    getData: function($defer, params) {
                        params.total(getFilterDataLength());
                        $defer.resolve(getFilterData().slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }
                });
            };

            /*initSummaryTable();
            filterInitTable();
            initTable();

            $scope.$on('EV_GET_FLOWS', function() {
                $scope.tableParams.reload();
                $scope.summaryTableParams.reload();
            });

            $scope.$on('EV_GET_DEVICES', function() {
                $scope.tableParams.reload();
                $scope.summaryTableParams.reload();
            });

            $scope.$on('EV_GET_FILTERS', function() {
                $scope.clearEmptyFilters();
                $scope.filterTableParams.reload();
                $scope.tableParams.reload();
            });

            $scope.$on('EV_DELETE_FLOWS', function(event, flows) {
                $scope.deleteFlows(flows);
            });

            $scope.activateFilter = function (){
                $scope.filtersActive = !$scope.filtersActive;
                $scope.tableParams.reload();
            };*/

            $scope.deleteFlows = function(flows){
                var deleteFromTable = function(tableData, flows, flowToDelete) {
                        var index = flows.indexOf(flowToDelete);
                        flows.splice(index, 1);
                        $scope.tableParams.reload();
                        $scope.summaryTableParams.reload();
                    },
                    deleteFlowHandler = function(tableData, flows, flowToDelete) {
                        OpenFlowManagerUtils.deleteFlow(flowToDelete.device, flowToDelete.data.table_id, flowToDelete.data.id, function() { 
                            // commented for pce
                            /*if($scope.flowIsConfigured(flowToDelete)) {
                                setDeletingStatus(flowToDelete);
                            }
                            else {
                                deleteFromTable(tableData, flows, flowToDelete);
                            }
                            */
                            // added for pce
                            deleteFromTable(tableData, flows, flowToDelete);
                            $scope.selectedFlows = [];
                        }, function(data, status) { 
                            console.info('error',data, status);
                        });
                    },
                    deleteFlowOperationalHandler = function(tableData, flows, flowToDelete) {
                        OpenFlowManagerUtils.deleteFlowOperational(flowToDelete, flowToDelete.data.table_id, flowToDelete.data.id, function() { 
                            $scope.selectedFlows = [];
                            
                            setDeletingStatus(flowToDelete);
                        }, function(data, status) { 
                            console.info('error',data, status);
                        });
                    },
                    setDeletingStatus = function(flow) {
                        /* commented for pce
                        flow.deleting = true;
                        $scope.deletingFlows.push(flow.data.id);
                        $scope.checkDeletingArray();
                        */
                    };

                modalWinServicesDelete.open('Delete flows', flows, $scope.labelCbk, function(){
                    //if ($scope.tableParams) {
                        flows.forEach(function(flow) {
                            if($scope.onlyInOperational(flow)) {
                                deleteFlowOperationalHandler($scope.$data, $scope.flows, flow);
                            }
                            else {
                               deleteFlowHandler($scope.$data, $scope.flows, flow);
                            }
                        });
                    //}
                });
            };

            $scope.editFlowFunc = function(flow){
                $scope.addEditFlow(flow);
                $scope.toggleExpanded('flowOperPopup');
            };

            $scope.refreshTable = function() {
                $scope.tableParams.reload();
                $scope.filterTableParams.reload();
                $scope.summaryTableParams.reload();
            };

            $scope.deleteFilterFromTable = function(index) {
                $scope.filters.splice(index,1);
                $scope.refreshTable();
            };

            $scope.toActivateFilter = function(index) {
                $scope.filters[index].active = $scope.filters[index].active ? 0 : 1;
                $scope.refreshTable();
            };

            $scope.summaryDevicePendingFlows = function(deviceId) {
                return $scope.flows.filter(function(f) {
                    return f && f.device == deviceId && !$scope.flowIsConfigured(f);
                });
            };

            $scope.summaryDeviceConfiguredFlows = function(deviceId) {
                return $scope.flows.filter(function(f) {
                    return f && f.device == deviceId && $scope.flowIsConfigured(f);
                });
            };

            $scope.summaryExpand = function() {
                $scope.summaryExpanded = !$scope.summaryExpanded;
                $scope.summaryTableParams.reload();
            };

            $scope.showFlowsForDevice = function(device){
                device.showFlows = device.showFlows ? false : true;
            };

        }
    ]);

    openflow_manager.register.controller('flowPropsCtrl', ['$scope', '$filter', '$timeout', 'FlowProperties', 'OpenFlowManagerUtils', 'PropertiesBuilder', 'FlowObjChecker', 
        'odlDeviceTypeHandler', 'ofTypeHandler', 'pipelineHandler', 'CommonFlowOpers', 'designUtils',
        function($scope, $filter, $timeout, FlowProperties, OpenFlowManagerUtils, PropertiesBuilder, FlowObjChecker, odlDeviceTypeHandler, ofTypeHandler, pipelineHandler,
            CommonFlowOpers, designUtils) {
            $scope.ctrl = '';
            $scope.controller_initialized = false;
            var checker = new FlowObjChecker.Checker();

            $scope.flowProps = [];
            $scope.flowMatchProps = [];
            $scope.flowActionProps = [];

            $scope.selectedFlowProps = [];
            $scope.selectedMatchProps = [];
            $scope.selectedActionProps = [];
            $scope.selFlow = null;
            $scope.errors = [];
            $scope.succesFlows = [];
            $scope.previewValue = '';
            $scope.displayIndex = 1;
            $scope.ofTypesConst = ['','of10','of13'];
            $scope.successFlowsShow = false;

            $scope.getChecker = function() {
                return checker;
            };

            $scope.setSelFlow = function(data) {
                $scope.selFlow = data;
            };

            $scope.validateSubCtrls = function() {
                $scope.controller_initialized = true;
            };

            var invalidateSubCtrls = function() {
                $scope.controller_initialized = false;
            };

            var waitUntilSubCtrlAndBroadcast = function(eventName) {
                var args = Array.prototype.slice.call(arguments, 1);
                args.unshift(eventName);

                
            };

            $scope.loadFlowPropsXml = function(xmlName, cbk) {
              PropertiesBuilder.createProperties(xmlName, function(g, m, a) {
                    $scope.flowProps = g;
                    $scope.flowMatchProps = m;
                    $scope.flowActionProps = a;
                    $scope.propWithPermVal = FlowProperties.getPropWithPermVal($scope.flowProps.concat($scope.flowMatchProps),$scope.flowActionProps);

                    if(angular.isFunction(cbk)){
                        cbk();
                    }
                }, function() {
                    $scope.propWithPermVal = FlowProperties.getPropWithPermVal($scope.flowProps,$scope.flowActionProps);
                });
            };

            $scope.selectProperties = function() {
                var old_ctrl = $scope.ctrl;
                checker.executeChecks($scope, $scope.selFlow);

                if(old_ctrl !== $scope.ctrl) {
                    invalidateSubCtrls();
                }

                var waitUntilSubCtrlInitialize = function() {
                    if($scope.controller_initialized) {
                        if($scope.selFlow) {
                            $scope.$broadcast('OF_LOAD_AND_FILL_PROPS', $scope.selFlow);
                        }
                    } else {
                        $timeout(function() {
                            waitUntilSubCtrlInitialize();
                        }, 100);
                    }
                };

                waitUntilSubCtrlInitialize();
            };

            $scope.$on('REFRESH_FILL', function(){
                if($scope.selFlow) {
                    $scope.$broadcast('OF_LOAD_AND_FILL_PROPS', $scope.selFlow);
                }
            });

            $scope.setDeviceAndSelectProperties = function(device) {
                $scope.selDevice = device;

                if(device) {
                    $scope.selectProperties();
                } else {
                    $scope.clearAndEmptyProps();
                    $scope.ctrl = '';
                }
            };



            $scope.errorFlowsSum = function() {
                return $scope.selectedFlows.filter(function(sf){
                    return sf.error.length > 0;
                }).length;
            };

            $scope.dismissFlowStatus = function() {
               $scope.selFlow.error = [];
            };

            $scope.isStatic = function(flow, prop) {
                return flow && flow.mod === 1 && prop.isType('MOD_FIXED');
            };

            $scope.isMandatory = function(prop) {
                return CommonFlowOpers.isMandatory(prop);
            };

            $scope.reloadProps = function() {
                $scope.selFlow = null;
                $scope.clearProperties();
                $scope.emptyLoadedProperties();

                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);
                if($scope.selectedFlows.length === 0) {
                    $scope.appendEditFlow();
                }
            };

            $scope.$on('EV_INIT'+'flowOperPopup'.toUpperCase(), function(event) {
                $scope.reloadProps();
                $scope.displayIndex = 1;
                // $scope.duplicity = false;
            });

            $scope.clearProperties = function() {
                CommonFlowOpers.clearPropertiesGroup($scope.flowProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowMatchProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowActionProps);
            };

            $scope.emptyLoadedProperties = function() {
                $scope.selectedFlowProps = [];
                $scope.selectedMatchProps = [];
                $scope.selectedActionProps = [];
            };

            $scope.clearAndEmptyProps = function() {
                $scope.clearProperties();
                $scope.emptyLoadedProperties();
            };

            $scope.loadProps = function(xml){
                $scope.clearAndEmptyProps();
                $scope.loadFlowPropsXml(xml, function(){
                    CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);
                });
            };

            var checkFlowRequest = function(device, data, flowerrors) {
                var errors = [];

                if (device === null || device === undefined) {
                    errors.push('OF_DEVICE_NOT_SET');
                }

                CommonFlowOpers.clearPropertiesGroup($scope.flowProps);
                // clearPropertiesGroup($scope.flowMatchProps);

                var props = [];
                CommonFlowOpers.addProperties(data, $scope.flowProps, props);
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, props);

                var mandatory = props.filter(function(p) {
                    return $scope.isMandatory(p);
                });

                if(mandatory.length) {//displayLabel
                    var isError = [];

                    mandatory.forEach(function(p) {
                        if ( p.value === null || p.value === '' ){
                            isError.push($filter('translate')(p.displayLabel));
                        }
                    });

                    if(isError.length) {
                        var errorManString = isError.join(', '),
                            descString = $filter('translate')('OF_MANDATORY_UNFILLED');
                        errors.push(descString + ': ' + errorManString);
                    }
                }

                return errors;
            };

            $scope.fillProperties = function(flowObj) {
                var actionList = [],
                    flow = flowObj.data,
                    actionPresent = flow && flow.instructions && flow.instructions.instruction &&
                                    flow.instructions.instruction.length === 1 && flow.instructions.instruction[0]['apply-actions'] && 
                                    flow.instructions.instruction[0]['apply-actions'].action && flow.instructions.instruction[0]['apply-actions'].action.length > 0,
                    device = $scope.getDeviceById(flowObj.device),
                    hasError = false;

                if(actionPresent) {
                    actionList = flow.instructions.instruction[0]['apply-actions'].action;
                }

                CommonFlowOpers.addProperties(flow, $scope.flowProps, $scope.selectedFlowProps);
                CommonFlowOpers.addProperties(flow, $scope.flowMatchProps, $scope.selectedMatchProps);
                actionList.forEach(function(data) {
                    CommonFlowOpers.addProperties(data, $scope.flowActionProps, $scope.selectedActionProps);
                });
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);

                var error = $scope.checkProperties();
                if(error) {
                    flowObj.addErrorMsg(error);
                }

                $scope.setSelFlow(flowObj);
            };

            $scope.updatePreviewValue = function(){
                $scope.previewValue = JSON.stringify(FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps), null, 4);
            };

            $scope.hidePreview = function(){
                $scope.view.showPreview = false;
            };

            $scope.showPreview = function(){
                $scope.updatePreviewValue();
                $scope.view.showPreview = !$scope.view.showPreview;
                designUtils.setDraggablePopups();
            };

            $scope.checkProperties = function() {
                var isError  = $scope.selectedFlowProps.concat($scope.selectedActionProps).concat($scope.selectedMatchProps).some(function(prop){
                    return prop.check() !== null && prop.error !== null;
                });
                return isError ? 'OF_PROP_FAIL' : null;
            };

            $scope.checkSelFlowOccure =  function(){
                var checkFlow = function(){
                    return $scope.selectedFlows.indexOf($scope.selFlow) !== -1;
                };

                if(!checkFlow()) {
                    $scope.setSelFlow($scope.selectedFlows[0]);
                }

                $scope.clearAndEmptyProps();
                $scope.fillProperties($scope.selFlow);
            };

            $scope.checkDuplicity = function(label){
                if((label === 'table_id' || label === 'id' || label === 'device') && $scope.selFlow){
                    var req = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps),
                        device = $scope.selDevice ? $scope.selDevice.id: 0,
                        table = FlowProperties.getReqProp(req, 'table_id'),
                        id =  FlowProperties.getReqProp(req, 'id');

                    $scope.selFlow.duplicity = $scope.flows.some(function(flow){
                        return flow.device === device && flow.data.table_id.toString() === table && flow.data.id === id;
                    });
                }
            };

            $scope.createRequest = function(flowProps, flowMatchProps, actionsProps) {
                var req = FlowProperties.createFlowRequest(flowProps.concat(flowMatchProps), actionsProps),
                    valError = $scope.checkProperties();

                $scope.selFlow.data = req.flow[0];
                $scope.selFlow.error = checkFlowRequest($scope.selDevice, $scope.selFlow.data, $scope.selFlow.error);
                if(valError) {
                    $scope.selFlow.addErrorMsg(valError);
                }

                if($scope.selFlow.error.length === 0) {
                    $scope.selFlow.device = $scope.selDevice.id;
                    var device = $scope.selDevice.id,
                        tableId = FlowProperties.getReqProp(req, 'table_id'),
                        flowId =  FlowProperties.getReqProp(req, 'id'),
                        flowDataCopy = {};

                    angular.copy($scope.selFlow, flowDataCopy);

                    var setAlertCbk = function() {
                            $scope.setSuccessAlert(flowDataCopy);
                        },
                        delFlowCbk = function() {
                            $scope.deleteSelFlows($scope.selFlow);
                        };
                       
                        OpenFlowManagerUtils.sendFlow(device, tableId, flowId, req, function() { 
                            setAlertCbk();
                            delFlowCbk();
                            $scope.checkSelFlowOccure();
                        }, function(data, status) { 
                            $scope.selFlow.error = data ? data.errors.error.length ? data.errors.error.map(function(e) { return e['error-message']; }) : ['OF_UKNOWN_ERROR'] : ['OF_UKNOWN_ERROR'];
                            $scope.selFlow.error = $scope.selFlow.error.map(function(err){
                                return err.replace('\n','');
                            });
                        });
                    //}
                } 
            };

            $scope.createRequestForAll = function() {
                $scope.selFlow.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                $scope.selFlow.device = $scope.selDevice ? $scope.selDevice.id : null;
                $scope.selFlow.error = checkFlowRequest($scope.selFlow.device, $scope.selFlow.data, $scope.selFlow.error);

                var valError = $scope.checkProperties($scope.selFlow);
                if(valError) {
                    $scope.selFlow.addErrorMsg(valError);
                }

                $scope.selectedFlows.forEach(function(flowData) {
                    if(!$scope.onlyInOperational(flowData)) {
                        flowData.error = checkFlowRequest(flowData.device, flowData.data, flowData.error);
                        if(flowData.error.length === 0) {
                            var device = flowData.device,
                                table = flowData.data.table_id,
                                flow = flowData.data.id,
                                flowDataCopy = {};

                            angular.copy(flowData, flowDataCopy);
                            
                            var setAlertCbk = function() {
                                    $scope.setSuccessAlert(flowDataCopy);
                                },
                                delFlowCbk = function() {
                                    $scope.deleteSelFlows(flowData);
                                },
                                setUpdatingStatus = function(flow) {
                                    flow.updating = true;
                                    $scope.updatingFlows.push(flow);
                                };

                                OpenFlowManagerUtils.sendFlow(device, table, flow, {flow: [flowData.data]}, function(data) { 
                                    setAlertCbk();
                                    delFlowCbk();

                                    $scope.checkSelFlowOccure();

                                }, function(data, status) {
                                    flowData.error = data ? data.errors.error.length ? data.errors.error.map(function(e) { return e['error-message']; }) : ['OF_UKNOWN_ERROR'] : ['OF_UKNOWN_ERROR'];
                                    flowData.error = flowData.error.map(function(err){
                                        return err.replace('\n','');
                                    });
                                });
                            //}
                        } 
                    } 
                });
            };

            $scope.successFlowsToggle = function() {
                $scope.successFlowsShow = !$scope.successFlowsShow;
            };

            $scope.$watch('selFlow', function(newValue, oldValue) {
                if(oldValue) {
                    oldValue.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                    oldValue.device = $scope.selDevice ? $scope.selDevice.id : null;
                    var valError = $scope.checkProperties(oldValue);
                    if(valError) {
                        oldValue.addErrorMsg(valError);
                    }
                }

                if(newValue) {
                    $scope.clearAndEmptyProps();
                    $scope.setDeviceAndSelectProperties($scope.getDeviceById(newValue.device));
                }

                $scope.updatePreviewValue();
            });

            $scope.$watch('selDevice', function(newValue, oldValue) {
                $scope.$broadcast('OF_DEVICE_SEL', newValue);
            });

            pipelineHandler.registerCallback(checker);
            odlDeviceTypeHandler.registerCallback(checker);
            ofTypeHandler.registerCallback(checker);


            $scope.generateOptions = function(property, d) {
                if(property.displayOverride === "index") 
                {
                  return property.permValues.indexOf(d);
                }

                return d;
            };

            $scope.backFromFlows = function() {
                $scope.loadFlows();
                $scope.toggleExpanded('flowPopup');
            };
        }
    ]);

    openflow_manager.register.controller('odlDeviceVersionCtrl', ['$scope', 'OpenFlowManagerUtils', 'CommonFlowOpers', function($scope, OpenFlowManagerUtils, CommonFlowOpers){
        var getXmlConfigName = function() {
            return $scope.selDevice.version;
        };

      $scope.$on('OF_LOAD_AND_FILL_PROPS', function(event, flowObj) {
            $scope.loadFlowPropsXml(getXmlConfigName(), function() {
                $scope.clearAndEmptyProps();
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);

                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
                $scope.fillProperties(flowObj);
            });
        });

        $scope.validateSubCtrls();
    }]);

    openflow_manager.register.controller('ofTypeCtrl', ['$scope', 'OpenFlowManagerUtils', 'CommonFlowOpers', function($scope, CommonFlowOpers, OpenFlowManagerUtils){
        var xmlPath = 'of13';

      $scope.$on('OF_LOAD_AND_FILL_PROPS', function(event, flowObj) {
            $scope.clearAndEmptyProps();
            $scope.loadFlowPropsXml(xmlPath, function() {
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);
                
                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
                $scope.fillProperties(flowObj);
            });
        });

        $scope.validateSubCtrls();
    }]);

    openflow_manager.register.controller('pipelineCtrl', ['$scope', 'pipelineHandler', 'CommonFlowOpers', 'OpenFlowManagerUtils', 
        function($scope, pipelineHandler, CommonFlowOpers, OpenFlowManagerUtils){
        $scope.deviceConfig = null;
        $scope.pipelineInfo = null;
        $scope.tableValue = null;

        var getPipelineConfigXmlName = function() {
                $scope.deviceConfig = pipelineHandler.getDeviceConfig($scope.getDeviceType($scope.selDevice));
                $scope.pipelineInfo = $scope.deviceConfig.pipelines[pipelineHandler.getPipelineNumber($scope.selDevice) - 1];
                
                return pipelineHandler.getPipelineConfigFile($scope.deviceConfig.device_code, $scope.pipelineInfo.id, $scope.tableValue ? $scope.tableValue : $scope.pipelineInfo.tables[0]);
            },
            setTablePermValues = function(tableProp){
                $scope.pipelineInfo.tables.forEach(function(table){
                    tableProp.permValues.push(table);
                });

                tableProp.setValue( $scope.tableValue ? $scope.tableValue : tableProp.permValues[0]);

                tableProp.changeValCbk = function(){
                    var tableProp = getTableProp().length ? getTableProp()[0] : null;
                    $scope.tableValue = tableProp.value;
                    $scope.$emit('REFRESH_FILL');
                };
            },
            getTableProp = function(){
                return $scope.flowProps.filter(function(i){
                            return i.displayLabel === 'OF_TABLE';
                        });
            },
            checkAndSetTableValue = function(obj){
                var data = obj.data;

                if ( data && data['table_id'] ){
                    $scope.tableValue = data['table_id'];
                }
            };

        $scope.$on('OF_LOAD_AND_FILL_PROPS', function(event, flowObj) {
            $scope.clearAndEmptyProps();
            checkAndSetTableValue(flowObj);

            $scope.loadFlowPropsXml(getPipelineConfigXmlName(), function() {
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);

                var tableProp = getTableProp().length ? getTableProp()[0] : null;
                if ( tableProp && $scope.pipelineInfo.tables && $scope.pipelineInfo.tables.length ) {
                    setTablePermValues(tableProp);
                }

                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
                $scope.fillProperties(flowObj);
            });
        });

        $scope.validateSubCtrls();
    }]);

    openflow_manager.register.controller('devSelectorCtrl', ['$scope', function($scope){
        $scope.$on('OF_DEVICE_SEL', function(event, device) {
            $scope.selDevice = device;
        });
    }]);

    openflow_manager.register.controller('filterPropsCtrl', ['$scope', 'FlowProperties',  'OpenFlowManagerUtils', 'PropertiesBuilder', 'CommonFlowOpers',
        function($scope, FlowProperties, OpenFlowManagerUtils, PropertiesBuilder, CommonFlowOpers) {
            $scope.flowProps = [];
            $scope.flowMatchProps = [];
            $scope.flowActionProps = [];

            $scope.selectedFlowProps = [];
            $scope.selectedMatchProps = [];
            $scope.selectedActionProps = [];

            $scope.selFlow = null;
            $scope.displayIndex = 1;

            PropertiesBuilder.createProperties('of13', function(g, m, a) {
                $scope.flowProps = g;
                $scope.flowMatchProps = m;
                $scope.flowActionProps = a;
            }, function() {});

            $scope.setSelFlow = function(data) {
                $scope.selFlow = data;
            };

            $scope.deleteFilter = function() {
                $scope.filters.splice($scope.filters.indexOf($scope.selFlow),1);
            };

            $scope.filterLabelCbk = function(filter, defaultName) {
                return filter.name;
            };

            $scope.reloadFilterProps = function() {
                if($scope.filters.length === 0) {
                    $scope.appendEditFilter();
                }
            };

            $scope.$on('EV_INIT'+'flowsFilter'.toUpperCase(), function(event) {
                $scope.reloadFilterProps();
                $scope.displayIndex = 1;
                if($scope.filters[0]){
                    $scope.selDevice = $scope.getDeviceById($scope.filters[$scope.filters.length-1].device);
                }
            });

            $scope.checkSelFilterOccure =  function(){
                var checkFlow = function(){
                    return $scope.filters.indexOf($scope.selFlow) !== -1;
                };

                $scope.setSelFlow(!checkFlow() ? $scope.filters[0] : $scope.selFlow);
            };

            $scope.fillProperties = function(flowObj) {
                var actionList = [],
                    flow = flowObj.data,
                    actionPresent = flow && flow.instructions && flow.instructions.instruction &&
                                    flow.instructions.instruction.length === 1 && flow.instructions.instruction[0]['apply-actions'] && 
                                    flow.instructions.instruction[0]['apply-actions'].action && flow.instructions.instruction[0]['apply-actions'].action.length > 0,
                    hasError = false;

                if(actionPresent) {
                    actionList = flow.instructions.instruction[0]['apply-actions'].action;
                }

                CommonFlowOpers.addProperties(flow, $scope.flowProps, $scope.selectedFlowProps);
                CommonFlowOpers.addProperties(flow, $scope.flowMatchProps, $scope.selectedMatchProps);
                actionList.forEach(function(data) {
                    CommonFlowOpers.addProperties(data, $scope.flowActionProps, $scope.selectedActionProps);
                });

                $scope.selDevice = flowObj.device ? $scope.getDeviceById(flowObj.device) : null;
                $scope.setSelFlow(flowObj);
            };

            $scope.setDeviceAndSelectProperties = function(device){
                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', device.id);

                $scope.selDevice = device;
                $scope.propWithPermVal = FlowProperties.getPropWithPermVal($scope.flowProps.concat($scope.flowMatchProps),$scope.flowActionProps);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
            };


            $scope.clearProperties = function() {
                CommonFlowOpers.clearPropertiesGroup($scope.flowProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowMatchProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowActionProps);
            };

            $scope.emptyLoadedProperties = function() {
                $scope.selectedFlowProps = [];
                $scope.selectedMatchProps = [];
                $scope.selectedActionProps = [];
            };

            $scope.clearAndEmptyProps = function() {
                $scope.clearProperties();
                $scope.emptyLoadedProperties();
            };

            $scope.saveCurrentFilter = function(){
                $scope.selFlow.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                $scope.selFlow.device = $scope.selDevice ? $scope.selDevice.id : null;
            };

            $scope.saveAndExitCurrentFilter = function(){
                $scope.saveCurrentFilter();
                $scope.toggleExpanded('flowPopup');
                $scope.loadFilters();
            };

            $scope.$watch('selFlow', function(newValue, oldValue) {
                if(oldValue) {
                    oldValue.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                    oldValue.device = $scope.selDevice ? $scope.selDevice.id : null;
                }

                if(newValue) {
                    $scope.clearAndEmptyProps();
                    $scope.fillProperties(newValue);
                }
            });

            $scope.$watch('selDevice', function(newValue, oldValue) {
                $scope.$broadcast('OF_DEVICE_SEL', newValue);
            });
        }
    ]);

    openflow_manager.register.controller('propsListCtrl', ['$scope', '$filter', 'CommonFlowOpers', function($scope, $filter, CommonFlowOpers) {
        $scope.label = '';
        $scope.propsName = '';
        $scope.selPropsName = '';
        $scope.init = function(label, propsName, selPropsName) {
            $scope.label = label;
            $scope.propsName = propsName;
            $scope.selPropsName = selPropsName;
        };

        $scope.expanded = true;
        $scope.expand = function() {
            $scope.expanded = !$scope.expanded;
        };

        $scope.getProps = function() {
            return $scope[$scope.propsName] || [];
        };

        $scope.getSelectedProps = function() {
            return $scope[$scope.selPropsName] || [];
        };

        $scope.addPropToList = function(label, props, selectedProps) {
            CommonFlowOpers.addPropToList(label, props, selectedProps);
        };
    }]);

    openflow_manager.register.controller('propDetailCtrl', ['$scope', '$filter', function($scope, $filter) {
        $scope.selPropsName = '';
        $scope.prop = null;
        $scope.deletable = false;

        $scope.init = function(prop, selPropsName, deletable) {
            $scope.prop = prop;
            $scope.selPropsName = selPropsName;
            $scope.deletable = deletable;
        };

        $scope.getSelectedProps = function() {
            return $scope[$scope.selPropsName] || [];
        };

        $scope.getPropTooltipTranslate = function(label) {
          var localeResult = $filter('translate')(label);
          return localeResult !== 'TBS' ? localeResult : '';
        };
    }]);

    openflow_manager.register.controller('deviceSelCtrl', ['$scope', '$filter', function($scope, $filter) {
    }]);

    openflow_manager.register.filter('showHideGroupedProperties', function(){
        return function(properties, selectedFlowProps){

            if(properties.length) {
                properties.filter(function(prop){
                    prop.propEnabled = selectedFlowProps.map(function(selProp){
                        return selProp.compareGroup(prop.grouping, prop.displayLabel);
                    }).indexOf(false) < 0;
                });
            }

            return properties;
        };
    });

    openflow_manager.register.filter('unique', function() {
        return function(input, key) {
            var unique = {};
            var uniqueList = [];
            if(input) {
                for(var i = 0; i < input.length; i++){
                    if(typeof unique[input[i][key]] == "undefined"){
                        unique[input[i][key]] = "";
                        uniqueList.push(input[i]);
                    }
                }
            }
            return uniqueList;
        };
    });


	// notifications controller
    openflow_manager.register.controller('notificationsCtrl',['$scope', '$filter', 'ngTableParams', 'NotificationsService', function($scope, $filter, NgTableParams, NotificationsService){
        

        $scope.getData = function(){
            NotificationsService.getNotifications(function(data) {
                if(data.output && data.output['stats-notification']) {
                    $scope.notificationsList = data.output['stats-notification'];
                }
            },
            function(data, status) {
                console.log(data, status);
            });
        };

        $scope.clearData = function() {
            $scope.notificationsList = [];
        };

        $scope.clearData();

    }]);

});


