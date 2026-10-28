"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getHeaderStatusBarHeight", {
    enumerable: true,
    get: function() {
        return getHeaderStatusBarHeight;
    }
});
// With the status bar in iPhone Duo's vertical bar, the top inset is 0, while UIKit still places
// navigation bars this far below the top edge. No native API reports this offset.
const VERTICAL_BAR_STATUS_BAR_HEIGHT = 24;
function getHeaderStatusBarHeight(insets, verticalBarEdge) {
    return insets.top === 0 && verticalBarEdge != null ? VERTICAL_BAR_STATUS_BAR_HEIGHT : insets.top;
}

//# sourceMappingURL=getHeaderStatusBarHeight.js.map
