define([], function () {
	'use strict';

	function NotificationListService(NotificationListModel) {
		this.createNotificationList = createNotificationList;

		/**
		 * Implementation
		 */

		/**
		 * Creates NotificationList object and adds methods and returns the object.
		 * @returns {Object} NotificationList object with service methods
		 */
		function createNotificationList () {
			var obj = new NotificationListModel();

			//obj.getNotificationList = getNotificationList;

			return obj;
		}

	}

	NotificationListService.$inject=['NotificationListModel'];

	return NotificationListService;

});
