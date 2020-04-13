const crypto = require('crypto');
const KEY = '';
const STANDARD = ''

exports.encrypt = function(str) {
    var mykey = crypto.createCipher(STANDARD, KEY);
    var final = mykey.update(str, 'utf8', 'hex')
    final += mykey.final('hex');
    return final;
}

exports.decrypt = function(str) {
    var mykey = crypto.createDecipher(STANDARD, KEY);
    var final = mykey.update(str, 'hex', 'utf8')
    final += mykey.final('utf8');

    return final;
}