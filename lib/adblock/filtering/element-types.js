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
// The options that can be specified on filters.  The first several options
// specify the type of a URL request.

var ElementTypes = {
    NONE: 0,
    script: 1,
    image: 2,
    background: 4,
    stylesheet: 8,
    'object': 16,
    subdocument: 32,
    object_subrequest: 64,
    media: 128,
    other: 256,
    xmlhttprequest: 512,
    'document': 1024,
    elemhide: 2048,
    popup: 4096,
    // If you add something here, update .DEFAULTTYPES and .CHROMEONLY below.
};
// The types that are implied by a filter that doesn't explicitly specify types
ElementTypes.DEFAULTTYPES = 1023;
// Add here any types that Safari does not support.
ElementTypes.CHROMEONLY = (ElementTypes.object_subrequest | ElementTypes.other
| ElementTypes.xmlhttprequest);

// Convert a webRequest.onBeforeRequest type to an ElementType.
ElementTypes.fromOnBeforeRequestType = function(type) {
    switch (type) {
        case 'main_frame': return ElementTypes.document;
        case 'sub_frame': return ElementTypes.subdocument;
        // See chromium:93542: object subrequests are called 'object'.
        // See http://src.chromium.org/viewvc/chrome/trunk/src/webkit/glue/resource_type.h?view=markup
        // for what 'other' includes
        case 'other': return ElementTypes.other;
        default: return ElementTypes[type];
    }
}

module.exports = ElementTypes;