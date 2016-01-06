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

const localStorage = new require('node-localstorage').LocalStorage(__dirname + '/../../assets');

// TODO: move back into background.js since Safari can't use this
// anywhere but in the background.  Do it after merging 6101 and 6238
// and 5912 to avoid merge conflicts.
// Inputs: key:string.
// Returns value if key exists, else undefined.
var storage_get = function (key) {
    var store = /*(window.NODEJS ? safari.extension.settings : localStorage) */ localStorage;
    if (store === undefined) {
        return undefined;
    }
    var json = store.getItem(key);
    if (json == null)
        return undefined;
    try {
        return JSON.parse(json);
    } catch (e) {
        log("Couldn't parse json for " + key);
        return undefined;
    }
}

// Inputs: key:string, value:object.
// If value === undefined, removes key from storage.
// Returns undefined.
var storage_set = function (key, value) {
    var store = /*(window.NODEJS ? safari.extension.settings : localStorage) */ localStorage;
    if (value === undefined) {
        store.removeItem(key);
        return;
    }
    try {
        store.setItem(key, JSON.stringify(value));
    } catch (ex) {
        // Safari throws this error for all writes in Private Browsing mode.
        // TODO: deal with the Safari case more gracefully.
        if (ex.name == "QUOTA_EXCEEDED_ERR" && !NODEJS) {
            alert(translate("storage_quota_exceeded"));
            openTab("options/index.html#ui-tabs-2");
        }
    }
}

module.exports = {
    get : storage_get,
    set : storage_set
}
