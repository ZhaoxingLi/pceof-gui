define([], function () {
	'use strict';
	
	function StatsService(StatsModel, Restangular) {
		this.createStats = createStats;
		this.getStats = getStats;


		/**
		 * Implementation
		 */
		
		/**
		 * Creates Stats object, fills it with statsData (if available), adds methods and returns the object.
		 * @param statsData {Object} Data for one Stats object
		 * @returns {Object} Stats object with service methods
		 */
		function createStats (statsData) {
			var obj = new StatsModel();
			
			if(statsData) {
				obj.setData(statsData);
			}
			
			obj.getStats = getStats;

			return obj;
		}
		
		/**
		 * Get stats object from configured datastore, convert it to Stats object and return
		 * @returns {Object} Stats object
		 */
		function getStats(successCbk, errorCbk) {
			/*jshint validthis: true */
			var self = this;
			
			var restObj = Restangular.one('restconf').one('config').one('ofl3-statistics:ofl3-statistics');

			restObj.get().then(
				function(data) {
					self.setData(data['ofl3-statistics']);
					successCbk(self.data);
				},
				function(err){

					var defaultError = {
						"errCode": "REGSTATS_NOT_LOADED",
						"errTitle": "Registration data not loaded",
						"errMsg": "Couldn't load Registration information from controller. Server does not respond.",
						"errResolution": "Check if controller is down, otherwise check your connection.",
						"errObj": err
					};

					var dataMissingError = {
						"errCode": "REGSTATS_DATA_MISSING",
						"errTitle": "Registration/notification data is missing",
						"errMsg": "Couldn't read registration configuration from controller. Data is missing.",
						"errResolution": "Check if it is configured in controller.",
						"errObj": err
					};

					try{console.log(err);
						// if data is missing
						if(err.data.errors.error[0]['error-tag'] == 'data-missing'){
							errorCbk(dataMissingError);
						}
						else{
							errorCbk(defaultError);
						}
					}
					catch(e){
						errorCbk(defaultError);
					}
				}
			);

		}
	}
	
	StatsService.$inject=['StatsModel', 'Restangular'];
	
	return StatsService;
	
});
