define([], function () {
	'use strict';
	
	function ConfigurationService(Restangular) {

		var service = {
			getNeighbourDiscovery: getNeighbourDiscovery,
			getFlowStatistic: getFlowStatistic,
			getKafka: getKafka,
			getXrv: getXrv,
			putNeighbourDiscovery: putNeighbourDiscovery
		};

		return service;

		/**
		 * Get Neighbour Discovery Configuration Parameters
		 * @param successCbk
		 * @param errorCbk
		 */
		function getNeighbourDiscovery(successCbk, errorCbk){
			var restObj = Restangular.one('restconf').one('config').one('nd:cfg');

			restObj.get().then(function (data) {

				if ( data.cfg ){
					successCbk(data.cfg);
				} else {
					errorCbk();
				}
			}, function (err) {
				var errData = {
					"errCode": "NEIGHBOR_DISCOVERY_CONFIG_NOT_FOUND",
					"errTitle": "No neighbor discovery configuration found",
					"errMsg": "The application tried to find neighbor discovery configuration, but it seems to be complicated at this point.",
					"errResolution": "Check if controller is down, otherwise check your connection.",
					"errObj": err
				};
				errorCbk(errData);
			});
		}

		/**
		 * Put Neighbour Discovery Configuration Parameters
		 * @param data
		 * @param successCbk
		 * @param errorCbk
		 */
		function putNeighbourDiscovery(data, successCbk, errorCbk){
			var restObj = Restangular.one('restconf').one('config').one('nd:cfg');

			restObj.customPUT({cfg: data}).then(function (response) {
				successCbk();
			}, function (err) {
				var errData = {
					"errCode": "NEIGHBOR_DISCOVERY_NOT_PUT",
					"errTitle": "Couldn't save neighbor discovery configuration",
					"errMsg": "The application tried to save neighbor discovery configuration, but it seems to be complicated at this point.",
					"errResolution": "Check if controller is down, otherwise check your connection and input data.",
					"errObj": err
				};
				errorCbk(errData);
			});
		}

		/**
		 * Get Flow Statistic
		 * @param successCbk
		 * @param errorCbk
		 */
		function getFlowStatistic(successCbk, errorCbk){

		}

		/**
		 * Kafka Configuration on Controller
		 * @param successCbk
		 * @param errorCbk
		 */
		function getKafka(successCbk, errorCbk){

		}

		/**
		 * XRV Configuration Parameters
		 * @param successCbk
		 * @param errorCbk
		 */
		function getXrv(successCbk, errorCbk){

		}

	}

	ConfigurationService.$inject=['Restangular'];
	
	return ConfigurationService;
	
});
