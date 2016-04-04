define([], function () {
    'use strict';

    function SegmentPolicyModel(SegmentListService) {
        var self = null;
        /**
         * constructor for SegmentPolicy model
         * @constructor
         */
        function SegmentPolicy (){
            self = this;
            this.data = {};
        }

        SegmentPolicy.prototype.setData = setData;

        /**
         * Implementations
         */

        /**
         * extends SegmentPolicy prototype
         * @param segmentPolicyData
         */
        function setData (segmentPolicyData){
            self.data['segment-name'] = segmentPolicyData['segment-name'];
            self.data['segment-type'] = segmentPolicyData['segment-type'];
            self.data['use-override'] = segmentPolicyData['use-override'];
            self.data.segment = setSegmentListData(segmentPolicyData.segment);

            function setSegmentListData(segmentListData) {
                var segmentList = SegmentListService.createSegmentList();

                segmentList.setData(segmentListData);

                return segmentList;
            }
        }

        return SegmentPolicy;
    }

    SegmentPolicyModel.$inject=['SegmentListService'];

    return SegmentPolicyModel;

});
