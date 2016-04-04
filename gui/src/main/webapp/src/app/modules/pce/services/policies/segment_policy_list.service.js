define([], function () {
    'use strict';

    function SegmentPolicyListService(SegmentPolicyListModel) {
        this.createSegmentPolicyList = createSegmentPolicyList;

        /**
         * Implementation
         */

        /**
         * Creates SegmentPolicyList object and adds methods and returns the object.
         * @returns {Object} SegmentPolicyList object with service methods
         */
        function createSegmentPolicyList () {
            var obj = new SegmentPolicyListModel();

            return obj;
        }
    }

    SegmentPolicyListService.$inject=['SegmentPolicyListModel'];

    return SegmentPolicyListService;

});
