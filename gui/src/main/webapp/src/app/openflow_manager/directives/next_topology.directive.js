var modules = [
	'app/openflow_manager/openflow_manager.module',
	'next-ui'
];

define(modules, function(openflow_manager) {

	openflow_manager.register.directive('nextTopology', function() {
		return {
			restrict: 'E',
			scope: {
				topologyData: '=',
				nodeClickCallback: '=',
				customFunctions: '=',
				showHostDevice: '=',
				topo: '=',
				highlightNode: '=',
				highlightLink: '=',
				getLinksByHops: '=',
				highlightPath: '=',
				clearPathLayer: '=',
				unselectAllNodes: '=',
				highlightLinkByPort: '=',
				fadeInAllLayers: '='
			},
			template: '<div id="graph-container" class="col-md-12"></div>',
			link: function($scope, iElm, iAttrs, controller) {
				var nodeClickCallback = $scope.nodeClickCallback || function() { console.warn('nextTopology directive:node click callback is not specified'); };
				var topoInitialized = false;
				$scope.topo = null;
				$scope.dumpData = null;

				// colors used for topology objects
				var topoColors = new nx.data.Dictionary({
					'operational': '#00cc44',
					'configured': '#464646',
					'operational-mixed': '#C4AF00',
					'down': '#FF0000',
					'default': '#8C8C8C'
				});

				// custom events for the topology
				nx.define('CustomEvents', nx.graphic.Topology.DefaultScene, {
					methods: {
						// when nodes is clicked
						clickNode: function(sender, node){
							if($scope.$parent.view.basic) {
								$scope.openNodePanel(node.id());
							}
						},
						clickLink: function(sender, link){
							if($scope.$parent.view.basic) {
								$scope.openLinkPanel(link.model().id());
							}
						}
					}

				});

				$scope.selectNode = function(node){
					if(!$scope.$parent.view.basic) {
						var selected = nodeClickCallback(node.get('label'));
						node.set('selected', selected);
						return selected;
					}
					return 0;
				};

				$scope.unselectAllNodes = function(){
					var nodesLayer = $scope.topo.getLayer('nodes');
					nodesLayer.eachNode(function(node){
						node.selected(false);
					});
				};

				// highlights a node
				$scope.highlightNode = function(targetId, noLinks) {
					var nodeLayer = $scope.topo.getLayer('nodes');
					var linksLayer = $scope.topo.getLayer('links');
					var linksLayerHighlightElements = linksLayer.highlightedElements();
					var nodeLayerHighlightElements = nodeLayer.highlightedElements();

					noLinks = noLinks || false;
					//Clears previous
					nodeLayerHighlightElements.clear();
					linksLayerHighlightElements.clear();

					//highlight nodes
					nodeLayerHighlightElements.add($scope.topo.getNode(targetId));
					if(!noLinks) {
						//highlight links
						linksLayerHighlightElements.addRange(nx.util.values($scope.topo.getNode(targetId).links()));
					}
					else{
						linksLayer.fadeOut(true);
					}
				};

				// highlights a link
				$scope.highlightLink = function(linkId) {
					var nodeLayer = $scope.topo.getLayer('nodes');
					var linksLayer = $scope.topo.getLayer('links');
					var linksLayerHighlightElements = linksLayer.highlightedElements();
					var nodeLayerHighlightElements = nodeLayer.highlightedElements();
					var link = $scope.topo.getLink(linkId);

					//Clears previous
					nodeLayerHighlightElements.clear();
					linksLayerHighlightElements.clear();

					//highlight link
					linksLayerHighlightElements.add(link);
					//highlight connected nodes
					nodeLayerHighlightElements.addRange(nx.util.values({source: $scope.topo.getNode(link.model().sourceID()), target: $scope.topo.getNode(link.model().targetID())}));
				};

				//
				$scope.getLinksByHops = function(hops){
					var linkSet, link, links = [];

					// processing hops
					for(var i = 0; i < hops.length-1; i++){
						linkSet = $scope.topo.getLinkSet(hops[i]['hop-fb-node-id'], hops[i]['out-tp-node-id']);
						link = linkSet.model().edges()[Object.getOwnPropertyNames(linkSet.model().edges())[0]];
						links.push($scope.topo.getLink(link.id()));
					}
					return links;
				};

				// completely clear all paths from path layer
				$scope.clearPathLayer = function(){
					var pathLayer = $scope.topo.getLayer("paths");
					pathLayer.clear();
					return pathLayer;
				};

				// draws a path over topology for the defined array of links
				$scope.highlightPath = function(links,color){
					// clear the path layer and get its instance
					var pathLayer = $scope.clearPathLayer();
					// define a path
					var path = new nx.graphic.Topology.Path({
						'pathWidth': 5,
						'links': links,
						'arrow': 'cap'
					});
					// add the path
					pathLayer.addPath(path);
				};

				// when hover the port in topology panel
				// this function highlights the corresponding link
				$scope.highlightLinkByPort = function(port,node) {
					var nodeLayer = $scope.topo.getLayer('nodes');
					var linksLayer = $scope.topo.getLayer('links');
					var linksLayerHighlightElements = linksLayer.highlightedElements();
					var nodeLayerHighlightElements = nodeLayer.highlightedElements();
					var links = nx.util.values($scope.topo.getNode(node.id).links());
					var found = false;
					//Clears previous
					nodeLayerHighlightElements.clear();
					linksLayerHighlightElements.clear();



					// choose link by port
					for(var i = 0; i < links.length; i++){
						// whether port is present
						var portPresent = false;
						var linksInfo = links[i].model()._data['links'];
						for(var j = 0; j < linksInfo.length; j++){
							if(linksInfo[j].srcTp == port['tp-id'] || linksInfo[j].tarTp == port['tp-id']){
								portPresent = true;
								break;
							}
						}

						// highlight the links
						if((links[i].model().sourceID() == node.id || links[i].model().targetID() == node.id)
							&& portPresent){
							$scope.highlightLink(links[i].id());
							found = true;
							break;
						}
					}

					if(!found)
						$scope.fadeOutAllLayers();
				};

				$scope.fadeInAllLayers = function(){
					//fade out all layers
					nx.each($scope.topo.layers(), function(layer) {
						layer.fadeIn(true);
					}, this);
				};

				$scope.fadeOutAllLayers = function(){
					//fade out all layers
					nx.each($scope.topo.layers(), function(layer) {
						layer.fadeOut(true);
					}, this);
				};

				// opener of a topology panel
				$scope.openNodePanel = function(nodeId) {
					// clear all paths
					$scope.clearPathLayer();
					if($scope.$parent.view.basic) {
						var panel = $('#side-panel');
						var panelCode = 'node';
						var previousPanelType = $scope.$parent.panel.type;
						$scope.$parent.panel.type = panelCode;

						//// mark all elements unselected
						//panel.find('.node-panel .selected').removeClass('selected');
						//panel.find('.node-panel .panel-item-more-info').addClass('ng-hide');

						$scope.fadeInAllLayers();

						if (panel.hasClass("visible") && previousPanelType == panelCode && nodeId == undefined) { //user attempts to close slide-out
							$scope.topo.getLayer('nodes').highlightedElements().clear(); //clears anything left highlighted
							$scope.topo.getLayer('links').highlightedElements().clear();

							panel.removeClass('visible').animate({'margin-right':'-400px'}); //shift slidepanel
							$('div').find('.in').removeClass('in');
							$scope.topo.adaptToContainer(); //fix topo size
						} else {
							panel.addClass('visible').animate({'margin-right': '0px'}); //shifts slidepanel
							$scope.topo.resize((window.innerWidth - 200), 0.975 * (window.innerHeight)); //resize topology
							$scope.topo.fit(); //fits to view
						}

						var nodeInst = $scope.topo.getNode(nodeId);
						if(nodeInst)
							$scope.$parent.openNodeDetails(nodeInst.model()._data);
					}
					$scope.$parent.$apply();
				};

				$scope.openLinkPanel = function(linkId){
					// clear all paths
					$scope.clearPathLayer();
					if($scope.$parent.view.basic) {
						var panel = $('#side-panel');
						var panelCode = 'link';
						var previousPanelType = $scope.$parent.panel.type;
						$scope.$parent.panel.type = panelCode;

						$scope.fadeInAllLayers();

						if (panel.hasClass("visible") && previousPanelType == panelCode && linkId == undefined) { //user attempts to close slide-out
							$scope.topo.getLayer('nodes').highlightedElements().clear(); //clears anything left highlighted
							$scope.topo.getLayer('links').highlightedElements().clear();

							panel.removeClass('visible').animate({'margin-right': '-400px'}); //shift slidepanel
							$('div').find('.in').removeClass('in');
							$scope.topo.adaptToContainer(); //fix topo size
						} else {
							panel.addClass('visible').animate({'margin-right': '0px'}); //shifts slidepanel
							$scope.topo.resize((window.innerWidth - 200), 0.975 * (window.innerHeight)); //resize topology
							$scope.topo.fit(); //fits to view
						}

						var linkInst = $scope.topo.getLink(linkId);
						if (linkInst) {
							$scope.$parent.openLinkContainerDetails(linkInst.model()._data);
						}

					}
					$scope.$parent.$apply();
				};

				$scope.openPolicyPanel = function(){
					// clear all paths
					$scope.clearPathLayer();
					var panel = $('#side-panel');
					var panelCode = 'policy';

					//fade in all layers
					nx.each($scope.topo.layers(), function(layer) {
						layer.fadeIn(true);
					}, this);

					if (panel.hasClass("visible") && $scope.$parent.panel.type == panelCode) { //user attempts to close slide-out
						$scope.topo.getLayer('nodes').highlightedElements().clear(); //clears anything left highlighted
						$scope.topo.getLayer('links').highlightedElements().clear();

						panel.removeClass('visible').animate({'margin-right':'-400px'}); //shift slidepanel
						$('div').find('.in').removeClass('in');
						$scope.topo.adaptToContainer(); //fix topo size
					} else {
						//nx.each($scope.topo.layers(), function(layer) { //fades out all layers
						//	layer.fadeOut(true);
						//}, this);
						panel.addClass('visible').animate({'margin-right':'0px'}); //shifts slidepanel
						$scope.topo.resize((window.innerWidth-200),0.975*(window.innerHeight)); //resize topology
						$scope.topo.fit(); //fits to view
					}
					$scope.$parent.panel.type = panelCode;
				};

				// reads data from localStorage
				$scope.readDumpDataFromLocalStorage = function(){
					try {
						$scope.dumpData = JSON.parse(localStorage.getItem("verizonTopologyData"));
					} catch(e) {
						console.info('Local Storage read parse error:', e);
					}

					$scope.readDumpData();
				};

				// saves the data to localStorage
				$scope.writeDumpDataToLocalStorage = function(){
					try {
						localStorage.setItem("verizonTopologyData", JSON.stringify($scope.dumpData));
					} catch(e) {
						console.info('Local Storage save error:', e);
					}
				};

				// dump the positions of nodes
				$scope.writeDumpdata = function(){
					//var stageScale = $scope.topo.stageScale();
					$scope.dumpData = {'nodes': []};
					var nodesLayer = $scope.topo.getLayer('nodes');
					nodesLayer.eachNode(function(node){
						$scope.dumpData.nodes.push({
							'x': node.x(),
							'y': node.y(),
							'nodeName': node.model()._data['node-id']
						});
					});
					$scope.writeDumpDataToLocalStorage();
				};

				// read dump data from $scope.dumpData
				$scope.readDumpData = function(){
					if($scope.dumpData && $scope.dumpData.nodes ){
						$scope.dumpData.nodes.forEach(function(node, index, nodes){
							nodeInst = $scope.topo.getNode($scope.topologyData.nodesDict.getItem(node.nodeName));
							if(nodeInst != undefined)
								nodeInst.position({'x': node.x, 'y': node.y});
						});
					}
				};


				var initTopology = function(nodes, links) {


					// updated link class
					nx.define('ExtendedLink', nx.graphic.Topology.Link, {
						view: function(view){
							view.content.push({
								name: 'badge',
								type: 'nx.graphic.Group',
								content: [
									{
										name: 'badgeBg',
										type: 'nx.graphic.Rect',
										props: {
											'class': 'link-set-circle',
											height: 1
										}
									},
									{
										name: 'badgeText',
										type: 'nx.graphic.Text',
										props: {
											'class': 'link-set-text',
											y: 1
										}
									}
									//{
									//	name: 'statusIcon',
									//	type: 'nx.graphic.Image',
									//	props: {
									//		width: 16,
									//		height: 16
									//	}
									//}
								]
							});
							return view;
						},
						properties: {
							stageScale: {
								set: function (a) {
									this.view("badge").setTransform(null, null, a);
									var b = (this._width || 1) * a;
									this.view("line").dom().setStyle("stroke-width", b), this.view("path").dom().setStyle("stroke-width", b), this._stageScale = a, this.update()
								}
							}
						},
						methods: {
							// inherit properties/parent's data
							init: function(args){
								this.inherited(args);
								this.topology().fit();
							},
							// inherit parent's model
							'setModel': function(model) {
								this.inherited(model);
								//if(model._data.linksIntegrity){
								//	this.view('statusIcon').set('src', 'assets/images/attention.png');
								//}
							},
							// when topology's updated
							update: function(){
								this.inherited();
								// ECMP badge settings
								var badge = this.view('badge');
								var badgeText = this.view('badgeText');
								var badgeBg = this.view('badgeBg');
								var statusIcon = this.view('statusIcon');
								var status = this.model()._data.status;
								if(this.model()._data.ecmp) {
									badgeText.sets({
										text: status.operational + '/' + status.configured,
										visible: true
									});
									var bound = badge.getBound();
									var boundMax = Math.max(bound.width - 6, 1);
									badgeBg.sets({width: boundMax, visible: true});
									badgeBg.setTransform(boundMax / -2);
									var centerPoint = this.centerPoint();
									badge.setTransform(centerPoint.x, centerPoint.y);
								}
								// record source & target 'node-id's
								this.model()._data.sourceName = this.model().source()._data['node-id'];
								this.model()._data.targetName = this.model().target()._data['node-id'];

								if($scope.$parent.view.basic){
									this.view("badge").visible(true);
									this.view("badgeBg").visible(true);
									this.view("badgeText").visible(true);
								}
								else{
									this.view("badge").visible(false);
									this.view("badgeBg").visible(false);
									this.view("badgeText").visible(false);
								}
							},
							// generate the color for a link
							getColor: function(){
								var status = this.model()._data.status;
								var color;
								// all links are operational
								if ((status.operational == status.configured) != 0)
									color =  topoColors.getItem('operational');
								// operational less than configured
								else if (status.operational < status.configured && status.operational)
									color = topoColors.getItem('operational-mixed');
								// if operational and something else presented
								else if (!status.operational && status.configured){
									// if the link is between forwarding boxes, it's considered down
									if(this.model().source()._data.type == 'forwarding-box'
									&& this.model().target()._data.type == 'forwarding-box')
										color = topoColors.getItem('down');
									// otherwise just configured connection
									else
										color = topoColors.getItem('configured');

								}
								// otherwise
								else
									color = topoColors.getItem('default');
								// make it available outside next
								this.model()._data.linkColor = color;
								return color;
							}
						}
					});

					nx.define('ExtendedNode', nx.graphic.Topology.Node, {
						methods: {
							// inherit properties/parent's data
							init: function(args){
								this.inherited(args);
								var stageScale = this.topology().stageScale();
								this.view('label').setStyle('font-size', 14 * stageScale);
							},
							// inherit parent's model
							'setModel': function(model) {
								this.inherited(model);
							}
						}
					});

					var topologyData = {nodes: nodes, links: links};

					// next topology class
					$scope.topo = new nx.graphic.Topology({
						adaptive: true,
						scalable: true,
						nodeConfig: {
							label: 'model.label',
							iconType: 'model.iconType',
							color: function (node, model) {
								if(topoColors.contains(node._data.status)){
									return topoColors.getItem(node._data.status);
								}
								else
									return '#000';
							}
						},
						linkConfig: {
							// connected to hosts links have different colors
							width: function(model, link){
								return (model._data.ecmp)?5:3;
							},
							color: function(model, link){
								return link.getColor();
							},
							linkType: 'curve'
						},
						dataProcessor: 'force',
						identityKey: 'id',
						showIcon: true,
						theme: 'blue',
						enableSmartNode: false,
						linkInstanceClass: 'ExtendedLink',
						nodeInstanceClass: 'ExtendedNode'
					});

					// fired when topology is generated
					$scope.topo.on('topologyGenerated', function(sender, event) {

						// use custom events for the topology
						sender.registerScene('ce', 'CustomEvents');
						sender.activateScene('ce');

						$scope.topo.tooltipManager().showNodeTooltip(false);

						$scope.topo.on('mouseup', function(sender, event) {
							var target = event.target,
								nodesLayerDom = $scope.topo.getLayer('nodes').dom().$dom,
								linksLayerDom = $scope.topo.getLayer('links').dom().$dom,
								nodeEvent = {
									event1 : function(node){
										$scope.customFunctions.setStatisticsDevice(node._label, $scope.selectNode(node));
									},
									event3 : function(node) {
										$scope.customFunctions.setTagToDevice(node._label, $scope.selectNode(node));
									}
								},
								linkEvent = {
									event3 : function(link){
										$scope.customFunctions.setTagToLink(link);
									}
								},
								getLinkNodeId = function(type){
									while (!target.classList.contains(type)) {
										target = target.parentElement;
									}
									return target.getAttribute('data-id');
								};

							// console.log('event.which', event.which, nodesLayerDom);
							if (nodesLayerDom.contains(target)) {
								var node = $scope.topo.getNode(getLinkNodeId('node'));

								if ( nodeEvent['event' + event.which] ) {
									nodeEvent['event' + event.which](node);
								}

								return;
							}


							if (linksLayerDom.contains(target)) {
								var link = $scope.topo.getLink(getLinkNodeId('link'));

								if ( linkEvent['event' + event.which] ) {
									linkEvent['event' + event.which](link);
								}

								return;
							}
						});
					});

					// fired when the app is ready and displayed
					$scope.topo.on('ready', function(sender, event) {
						$scope.topo.data(topologyData);
						$('#node-panel-opener').on('click', function(){$scope.openNodePanel();});
						$('#link-panel-opener').on('click', function(){$scope.openLinkPanel();});
						$('#policy-panel-opener').on('click', function(){$scope.openPolicyPanel();});

						$scope.readDumpDataFromLocalStorage();
						// dump the data
						window.setInterval(function(){$scope.writeDumpdata();}, 5000);


					});

					var app = new nx.ui.Application();
					app.container(document.getElementById('graph-container'));
					app.on('resize', function(){
						$scope.topo.adaptToContainer();
					});

					$scope.topo.attach(app);
					topoInitialized = true;
				};

				$scope.$watch('topologyData', function() {
					if($scope.topologyData.nodes.length && topoInitialized === false) {
						initTopology($scope.topologyData.nodes, $scope.topologyData.links);
					}
				});

				$scope.$watch('showHostDevice', function(){
					if($scope.topologyData.nodes.length) {
						//var data = transformTopologyData($scope.topologyData, $scope.showHostDevice);
						//$scope.topo.data(data);
					}
				});
			}
		};
	});
});