const ElementTypes = require('./adblock/filtering/element-types')
const MyFilters = require('./adblock/filtering/my-filters')
const storage_get = require('./adblock/storage').get
const storage_set = require('./adblock/storage').set

_myfilters = new MyFilters();


function finished(success) {
    console.log("finished : " + success);

    console.log(getDebugInfo())
    //console.log(
    //    "https://display.ad.daum.net/imp",
    //    _myfilters.blocking.matches("https://display.ad.daum.net/imp", ElementTypes.subdocument, "display.ad.daum.net", true, true))
}


// Run a function on the background page.
// Inputs (positional):
//   first, a string - the name of the function to call
//   then, any arguments to pass to the function (optional)
//   then, a callback:function(return_value:any) (optional)
BGcall = function () {
    var args = [];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);
    var fn = args.shift();
    var has_callback = (typeof args[args.length - 1] == "function");
    var callback = (has_callback ? args.pop() : function () {
    });
    chrome.extension.sendRequest({command: "call", fn: fn, args: args}, callback);
};


get_subscriptions_minus_text = function () {
    var result = {};
    for (var id in _myfilters._subscriptions) {
        result[id] = {};
        for (var attr in _myfilters._subscriptions[id]) {
            if ((attr === "text") || (attr === "rules")) continue;
            result[id][attr] = _myfilters._subscriptions[id][attr];
        }
    }
    return result;
}

//BGcall DISPATCH
chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        if (request.command != "call")
            return; // not for us

        var fn = eval(request.fn);
        request.args.push(sender);
        var result = fn.apply(this, request.args);
        sendResponse(result);
    }
);

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if (request.command != "filters_updated")
        return;

    BGcall('get_subscriptions_minus_text', function (subs) {
        var sub = subs['url:' + 'localhost'];
        if (!sub || sub.last_update) {
            // It was a well known id, so assume it succeeded, or the
            // last_update property exists, so it succeeded
            finished(true);
        } else if (sub.last_update_failed_at)
            finished(false);
    })

    sendResponse({});
});


_myfilters.init();


// Get debug info for bug reporting and ad reporting
function getDebugInfo() {

    // Get subscribed filter lists
    var subscribed_filter_names = [];
    var get_subscriptions = get_subscriptions_minus_text();
    for (var id in get_subscriptions) {
        if (get_subscriptions[id].subscribed) {
            subscribed_filter_names.push(id);
            subscribed_filter_names.push("  last updated: " + new Date(get_subscriptions[id].last_update).toUTCString());
        }
    }

    // Get last known error
    var adblock_error = storage_get("error");

    // Get total pings
    var adblock_pings = storage_get("total_pings");

    // Get custom filters
    var adblock_custom_filters = storage_get("custom_filters");

    // Get settings
    var adblock_settings = [];
    //var settings = get_settings();
    //for (setting in settings)
    //    adblock_settings.push(setting + ": " + JSON.stringify(settings[setting]) + "\n");
    //// We need to hardcode malware-notification setting,
    //// because it isn't included in _settings object, but just in localStorage
    //adblock_settings.push("malware-notification: " + storage_get('malware-notification') + "\n");
    //adblock_settings = adblock_settings.join('');

    // Create debug info for a bug report or an ad report
    var info = [];
    info.push("==== Filter Lists ====");
    info.push(subscribed_filter_names.join('  \n'));
    info.push("");
    if (adblock_custom_filters) {
        info.push("==== Custom Filters ====");
        info.push(adblock_custom_filters);
        info.push("");
    }
    //if (get_exclude_filters_text()) {
    //    info.push("==== Exclude Filters ====");
    //    info.push(get_exclude_filters_text());
    //    info.push("");
    //}
    //info.push("==== Settings ====");
    //info.push(adblock_settings);
    //info.push("==== Other info: ====");
    //info.push("AdBlock version number: " + AdBlockVersion + AdBlockBuild());
    if (adblock_error)
        info.push("Last known error: " + adblock_error);
    //info.push("Total pings: " + adblock_pings);
    //info.push("UserAgent: " + navigator.userAgent.replace(/;/,""));

    return info.join('  \n');
}