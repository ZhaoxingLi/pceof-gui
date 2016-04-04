define([], function () {
    'use strict';

    function PathBundleModel(ElementPolicyListService, PathListService, SegmentPolicyListService) {
        var self = null;
        /**
         * constructor for Path Bundle model
         * @constructor
         */
        function PathBundle (){
            self = this;

            this.data = {};
            this.expanded = false;
        }

        PathBundle.prototype.collapse = collapse;
        PathBundle.prototype.expand = expand;
        PathBundle.prototype.setData = setData;
        PathBundle.prototype.toggleExpanded = toggleExpanded;

        /**
         * Implementations
         */

        /**
         * Sets "expanded" property to false
         */
        function collapse() {
            this.expanded = false;
        }

        /**
         * Sets "expanded" property to true
         */
        function expand() {
            this.expanded = true;
        }

        /**
         * extends Policy prototype
         * @param pathBundleData
         */
        function setData (pathBundleData){
            self.data['bundle-id'] = pathBundleData['bundle-id'];
            self.data.role = pathBundleData.role;
            self.data.direction = pathBundleData.direction;
            self.data['active-bundle-id'] = pathBundleData['active-bundle-id'];
            self.data.status = pathBundleData.status;
            self.data.direction = pathBundleData.direction;
            self.data.constraints = pathBundleData.constraints;

            if(pathBundleData.path) {
                self.data.path = setPathListData(pathBundleData.path);
            }

            if(pathBundleData.constraints['segment-policy']) {
                self.data.constraints['segment-policy'] = setSegmentPolicyListData(pathBundleData.constraints['segment-policy']);
            }

            if(pathBundleData.constraints['element-policy']) {
                self.data.constraints['element-policy'] = setElementPolicyListData(pathBundleData.constraints['element-policy']);
            }

            function setPathListData(pathListData) {
                var pathList = PathListService.createPathList();

                pathList.setData(pathListData);

                return pathList;
            }

            function setSegmentPolicyListData(segmentPolicyListData) {
                var segmentPolicyList = SegmentPolicyListService.createSegmentPolicyList();

                segmentPolicyList.setData(segmentPolicyListData);

                return segmentPolicyList;
            }

            function setElementPolicyListData(elementPolicyListData) {
                var elementPolicyList = ElementPolicyListService.createElementPolicyList();

                elementPolicyList.setData(elementPolicyListData);

                return elementPolicyList;
            }
        }

        /**
         * Toggles "expanded" property
         */
        function toggleExpanded() {
            this.expanded = !this.expanded;
        }

        return PathBundle;
    }

    PathBundleModel.$inject=['ElementPolicyListService', 'PathListService', 'SegmentPolicyListService'];

    return PathBundleModel;

});
