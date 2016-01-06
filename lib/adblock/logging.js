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
// Set to true to get noisier console.log statements
VERBOSE_DEBUG = true;

var logging = function (enabled) {
    if (VERBOSE_DEBUG) {
        log = function () {
            if (VERBOSE_DEBUG || arguments[0] != '[DEBUG]') // comment out for verbosity
                console.log.apply(console, arguments);
        };
        logGroup = function () {
            console.group.apply(console, arguments);
        };
        logGroupEnd = function () {
            console.groupEnd();
        };
    }
    else {
        log = logGroup = logGroupEnd = function () {
        };
    }
}

//logging(true); // disabled by default

module.exports = logging;