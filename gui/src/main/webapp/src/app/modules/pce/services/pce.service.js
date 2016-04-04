define([], function () {
    'use strict';

    // FORM OF ANY SERVICE
    function PceService(Restangular) {
        this.getValidationPatterns = getValidationPatterns;
        this.convertDecToHex = convertDecToHex;

        function getValidationPatterns(successCbk) {
            var config = Restangular.oneUrl('validationPatterns','/app/modules/pce/data/validation_patterns.json');
            return config.get().then(function (response) {
                if ( response ) {
                    successCbk(response);
                } else {
                    console.warn('INFO :: couldnt load validation patterns config file');
                }

            }, function () {
                console.warn('INFO :: couldnt load validation patterns config file');
            });
        }

        function convertDecToHex (decVal) {
            var hexStr = decVal.toString(16).toUpperCase();
            return ('0x'+hexStr);
        }
        
    }

    PceService.$inject=['Restangular'];

    return PceService;
});
