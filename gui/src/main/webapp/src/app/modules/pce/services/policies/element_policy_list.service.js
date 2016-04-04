define([], function () {
    'use strict';

    function ElementPolicyListService(ElementPolicyListModel) {
        this.createElementPolicyList = createElementPolicyList;

        /**
         * Implementation
         */

        /**
         * Creates ElementPolicyList object and adds methods and returns the object.
         * @returns {Object} ElementPolicyList object with service methods
         */
        function createElementPolicyList () {
            var obj = new ElementPolicyListModel();

            return obj;
        }
    }

    ElementPolicyListService.$inject=['ElementPolicyListModel'];

    return ElementPolicyListService;

});
