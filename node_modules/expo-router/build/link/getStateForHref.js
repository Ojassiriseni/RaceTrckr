"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getStateForHref", {
    enumerable: true,
    get: function() {
        return getStateForHref;
    }
});
const _href = require("./href");
function getStateForHref(href, routeInfo, linking, options) {
    href = (0, _href.resolveHref)(href);
    href = (0, _href.resolveHrefStringWithSegments)(href, routeInfo, options);
    return linking?.getStateFromPath(href, linking.config, routeInfo.segments);
}

//# sourceMappingURL=getStateForHref.js.map
