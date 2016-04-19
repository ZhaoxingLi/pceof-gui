define([], function () {
    'use strict';

    // FORM OF ANY SERVICE
    function PceService(Restangular) {
        this.convertDecToHex = convertDecToHex;

        function convertDecToHex (decVal) {

            function add(x, y, base) {
                var z = [];
                var n = Math.max(x.length, y.length);
                var carry = 0;
                var i = 0;
                while (i < n || carry) {
                    var xi = i < x.length ? x[i] : 0;
                    var yi = i < y.length ? y[i] : 0;
                    var zi = carry + xi + yi;
                    z.push(zi % base);
                    carry = Math.floor(zi / base);
                    i++;
                }
                return z;
            }

            function multiplyByNumber(num, x, base) {
                if (num < 0) return null;
                if (num == 0) return [];

                var result = [];
                var power = x;
                while (true) {
                    if (num & 1) {
                        result = add(result, power, base);
                    }
                    num = num >> 1;
                    if (num === 0) break;
                    power = add(power, power, base);
                }

                return result;
            }

            function parseToDigitsArray(str, base) {
                var digits = str.split('');
                var ary = [];
                for (var i = digits.length - 1; i >= 0; i--) {
                    var n = parseInt(digits[i], base);
                    if (isNaN(n)) return null;
                    ary.push(n);
                }
                return ary;
            }

            function convertBase(str, fromBase, toBase) {
                var digits;
                if (typeof str === "string") {
                    digits = parseToDigitsArray(str, fromBase);
                } else if (typeof str === "number") {
                    if (str > 9007199254740992) {
                        return str.toString(16)
                    } else {
                        str = str.toString();
                        digits = parseToDigitsArray(str, fromBase);
                    }
                } else {
                    return null;
                }
                if (digits === null) return null;

                var outArray = [];
                var power = [1];
                for (var i = 0; i < digits.length; i++) {
                    if (digits[i]) {
                        outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
                    }
                    power = multiplyByNumber(fromBase, power, toBase);
                }

                var out = '';
                for (var i = outArray.length - 1; i >= 0; i--) {
                    out += outArray[i].toString(toBase);
                }
                return out;
            }

            function decToHex(decStr) {
                var hex = convertBase(decStr, 10, 16);
                return hex ? ('0x' + hex.toUpperCase()) : null;
            }

            return decVal ? decToHex(decVal) : null;
        }
    }

    PceService.$inject=['Restangular'];

    return PceService;
});
