define([], function () {
	'use strict';

	function RegistrationListService(RegistrationListModel, Restangular) {
		this.createRegistrationList = createRegistrationList;

		/**
		 * Implementation
		 */

		/**
		 * Creates RegistrationList object and adds methods and returns the object.
		 * @returns {Object} RegistrationList object with service methods
		 */
		function createRegistrationList () {
			var obj = new RegistrationListModel();

			obj.getRegistrationList = getRegistrationList;

			return obj;
		}

		/**
		 * Get list of policy items from operational datastore and sets them to RegistrationList
		 */
		function getRegistrationList(dataStore) {
			/*jshint validthis:true */
			var self = this;

			var restObj = Restangular.one('restconf').one('config').one('ofl3-statistics:ofl3-statistics/');

			return restObj.get().then(function(data) {
				if(data['ofl3-statistics']['stat-registration']) {
					self.setData(data['ofl3-statistics']['stat-registration']);
				}
			});
		}
	}

	RegistrationListService.$inject=['RegistrationListModel', 'Restangular'];

	return RegistrationListService;

});
