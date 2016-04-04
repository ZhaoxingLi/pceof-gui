define([], function () {
    'use strict';

    function SegmentListService($filter, SegmentListModel) {
        this.createSegmentList = createSegmentList;
        this.sortSegmentsByProperty = sortSegmentsByProperty;

        /**
         * Implementation
         */

        /**
         * Creates SegmentList object and adds methods and returns the object.
         * @returns {Object} SegmentList object with service methods
         */
        function createSegmentList () {
            var obj = new SegmentListModel();

            return obj;
        }

        /**
         * Sorts segmentList array by 'property' parameter
         * @param segmentList
         * @returns {Array} Array of sorted segment objects
         */
        function sortSegmentsByProperty(segmentList, property) {
            return $filter('orderBy')(segmentList, property);
        }
    }

    SegmentListService.$inject=['$filter', 'SegmentListModel'];

    return SegmentListService;

});
