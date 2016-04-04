define([], function () {
	'use strict';

	function RegistrationService(RegistrationModel, Restangular) {
		this.createRegistration = createRegistration;


		/**
		 * Implementation
		 */

		/**
		 * Creates Registration object, fills it with registrationData (if available), adds methods and returns the object.
		 * @param registrationData {Object} Data for one Registration object
		 * @returns {Object} Registration object with service methods
		 */
		function createRegistration (registrationData) {
			var obj = new RegistrationModel();

			if(registrationData) {
				obj.setData(registrationData);
			}

			obj.getRegistration = getRegistration;

			return obj;
		}

		/**
		 * Get registration object from configured datastore, convert it to Registration object and return
		 * @param registrationId {string} Registration id
		 * @returns {Object} Registration object
		 */
		function getRegistration(registrationId) {
			/*jshint validthis:true */
			var self = this;

			var restObj = Restangular.one('restconf').one('config').one('ofl3-statistics:ofl3-statistics')
				.one('stat-registration').one(registrationId);

			return restObj.get().then(function(data) {
				self.setData(data['stat-registration'][0]);
			});
		}
	}

	RegistrationService.$inject=['RegistrationModel', 'Restangular'];

	return RegistrationService;

});
