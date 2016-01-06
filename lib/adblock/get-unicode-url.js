/*
 * This file is part of Adblock <http://code.getadblock.com/>
 *
 * Adblock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock.  If not, see <http://www.gnu.org/licenses/>.
 */

const punycode = require('punycode');
const parseUri = require('./parse-uri');

// Return |url| encoded in Unicode
var getUnicodeUrl = function (url) {
    // URLs encoded in Punycode contain xn-- prefix
    if (url && url.indexOf("xn--") > 0) {
        var parsed = parseUri(url);
        // IDN domains have just hostnames encoded in punycode
        parsed.href = parsed.href.replace(parsed.hostname, punycode.toUnicode(parsed.hostname));
        return parsed.href;
    }
    return url;
}

module.exports = getUnicodeUrl;