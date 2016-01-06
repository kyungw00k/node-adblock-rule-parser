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

// Chrome to Safari port
// Author: Michael Gundlach (gundlach@gmail.com)
// License: GPLv3 as part of code.getadblock.com
//          or MIT if GPLv3 conflicts with your code's license.
//
// Porting library to make Chrome extensions work in Safari.
// To use: Add as the first script loaded in your Options page,
// your background page, your Chrome manifest.json, and your
// Safari Info.plist (created by the Extensions Builder).
//
// Then you can use chrome.* APIs as usual, and check the SAFARI
// global boolean variable to see if you're in Safari or Chrome
// for doing browser-specific stuff.  The safari.* APIs will
// still be available in Safari, and the chrome.* APIs will be
// unchanged in Chrome.

// retrieve the interface
const EventTarget = require('event-target');

(function () {

    var isOnGlobalPage = false;

    function _EventTarget() {
    }

    _EventTarget.prototype.addEventListener = EventTarget.addEventListener;
    _EventTarget.prototype.removeEventListener = EventTarget.removeEventListener;
    _EventTarget.prototype.dispatchEvent = EventTarget.dispatchEvent;

    // Return the object on which you can add/remove event listeners.
    // If there isn't one, don't explode.
    var listeningContext = function _listeningContext() {

        if (!_listeningContext._instance) {
            _listeningContext._instance = new _EventTarget()
        }

        //console.log("No add/remove event listener possible at this location!");
        //console.trace();
        return _listeningContext._instance;
    };

    var listenFor = function (messageName, handler) {
        var listener = function (messageEvent) {
            //console.log("incoming : ", messageName, messageEvent)
            if (messageEvent.name == messageName) {
                //console.log("processing : ", messageName, messageEvent)
                handler(messageEvent);
            }
        };
        //console.log("add message listener : ", messageName)
        listeningContext().addEventListener("message", listener);
        return listener;
    };
    var removeListener = function (listener) {
        //console.log("remove message listener")
        listeningContext().removeEventListener("message", listener);
    };
    // Return the object on which you can dispatch messages -- globally, or on the
    // messageEvent if specified.  If there isn't one, don't explode.
    // Make this globally available (don't use 'var') as it is used outside port.js
    dispatchContext = function (messageEvent) {
        // Can we dispatch on the messageEvent target?
        var m = messageEvent;
        return {
            dispatchMessage: function (msg, data) {
                listeningContext().dispatchEvent({type:"message", name: msg, message: data});
            }
        };
    };

    // Replace the 'chrome' object with a Safari adapter.
    chrome = {
        extension: {
            sendRequest: (function () {
                // Where to call .dispatchMessage() when sendRequest is called.
                var dispatchTargets = [];
                if (!isOnGlobalPage) {
                    // In a non-global context, the dispatch target is just the local
                    // object that lets you call .dispatchMessage().
                    dispatchTargets.push(dispatchContext());
                }
                else {
                    // In the global context, we must call .dispatchMessage() wherever
                    // someone has called .onRequest().  There's no good way to get at
                    // them directly, though, so .onRequest calls *us*, so we get access
                    // to a messageEvent object that points to their page that we can
                    // call .dispatchMessage() upon.
                    listenFor("onRequest registration", function (messageEvent) {
                        var context = dispatchContext(messageEvent);
                        if (dispatchTargets.indexOf(context) == -1)
                            dispatchTargets.push(context);
                    });
                }

                // Dispatches a request to a list of recipients.  Calls the callback
                // only once, using the first response received from any recipient.
                function theFunction(data, callback) {
                    var callbackToken = "callback" + Math.random();

                    // Listen for a response.  When we get it, call the callback and stop
                    // listening.
                    var listener = listenFor("response", function (messageEvent) {
                        if (messageEvent.message.callbackToken != callbackToken)
                            return;
                        // Must wrap this call in a timeout to avoid crash, per Safari team
                        //setTimeout(function () {
                            removeListener(listener);
                        //}, 0);

                        if (callback) {
                            callback(messageEvent.message.data);
                        }
                    });

                    // Dispatch to each recipient.
                    dispatchTargets.forEach(function (target) {
                        var message = {
                            data: data,
                            frameInfo: chrome._tabInfo.gatherFrameInfo(),
                            callbackToken: callbackToken
                        };
                        target.dispatchMessage("request", message);
                    });
                }

                return theFunction;
            })(),

            onRequest: {
                addListener: function (handler) {
                    // If listening for requests from the global page, we must call the
                    // global page so it can get a messageEvent through which to send
                    // requests to us.
                    if (!isOnGlobalPage)
                        dispatchContext().dispatchMessage("onRequest registration", {});

                    listenFor("request", function (messageEvent) {
                        var request = messageEvent.message.data;

                        var sender = {}; // Empty in onRequest in non-global contexts.

                        var sendResponse = function (dataToSend) {
                            var responseMessage = {
                                callbackToken: messageEvent.message.callbackToken,
                                data: dataToSend
                            };
                            //console.log('dispatch response', messageEvent)
                            dispatchContext(messageEvent).dispatchMessage("response", responseMessage);
                        };
                        handler(request, sender, sendResponse);
                    });
                }
            },

            onRequestExternal: {
                addListener: function () {
                    // CHROME PORT LIBRARY: onRequestExternal not supported.
                }
            }
        },

        // Helper object to ensure that tabs sending requests to the global page
        // get some extra attributes for the global page to use:
        //   id: an ID assigned by us so we can refer to the tab by ID elsewhere.
        //   visible_url: the URL of the top-level frame in the tab, if any.
        //   invisible_url: the URL of the top-level frame in the invisible page
        //                  being preloaded by the tab, if any (new in Safari 6.1).
        //
        // We are forced to store the *_url properties because the Safari API
        // doesn't currently give us a messageEvent.target.page.url property.  See
        // Issue #29.
        _tabInfo: {
            // Returns an object that can be passed to chrome._tabInfo.notice().
            //
            // Called by a frame sending a request to the global page.
            gatherFrameInfo: function () {
                return {
                    visible: false/*!document.hidden*/,
                    top_level: false/*(window === window.top)*/,
                    url: 'localhost'/*document.location.href*/
                };
            },

            // Tab objects are destroyed when no one has a reference to them, so we
            // keep a list of them, lest our data get lost.
            _tabs: [],
            _lastAssignedTabId: 0,

            // Ensure |tab| has a .id property assigned, and possibly update its
            // |visible_url| or |invisible_url| property.
            //
            // info is an object passed from the requesting frame, containing
            //   visible: whether the frame is on a visible or preloading page
            //   url: url of the frame
            //   top_level: true if the frame is top level in its page
            //
            // Called by the global page.
            notice: function (tab, info) {
                // Clean up closed tabs, to avoid memory bloat.
                this._tabs = this._tabs.filter(function (t) {
                    return t.browserWindow != null;
                });

                if (tab.id == undefined) {
                    // New tab
                    tab.id = this._lastAssignedTabId + 1;
                    this._lastAssignedTabId = tab.id;
                    this._tabs.push(tab); // save so it isn't garbage collected, losing our data.
                }

                if (info.top_level) {
                    tab[info.visible ? 'visible_url' : 'invisible_url'] = getUnicodeUrl(info.url);
                }
            },

            // Return an {id, url} object for the given tab's top level frame if
            // visible is true, or the given tab's preloaded page's top level frame,
            // if visible is false.  Assumes this.notice() has been called for every
            // request from a frame to the global page.
            //
            // Called by the global page.
            info: function (tab, visible) {
                return {
                    id: tab.id,
                    url: (visible ? getUnicodeUrl(tab.visible_url) : getUnicodeUrl(tab.invisible_url))
                };
            }
        }
    };
})();
