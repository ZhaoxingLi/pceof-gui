define([], function () {
    'use strict';

    function ElementPolicyModel() {
        var self = null;
        /**
         * constructor for ElementPolicy model
         * @constructor
         */
        function ElementPolicy (){
            self = this;
            this.data = {};
        }

        ElementPolicy.prototype.setData = setData;

        /**
         * Implementations
         */

        /**
         * extends ElementPolicy prototype
         * @param elementPolicyData
         */
        function setData (elementPolicyData){
            self.data.id = elementPolicyData.id;
            self.data['element-type'] = elementPolicyData['element-type'];
            self.data['use-override'] = elementPolicyData['use-override'];
        }

        return ElementPolicy;
    }

    ElementPolicyModel.$inject=[];

    return ElementPolicyModel;

});
