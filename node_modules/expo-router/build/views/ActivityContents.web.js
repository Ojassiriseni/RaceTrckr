'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ActivityContents", {
    enumerable: true,
    get: function() {
        return ActivityContents;
    }
});
function _jsxruntime() {
    const data = require("react/jsx-runtime");
    _jsxruntime = function() {
        return data;
    };
    return data;
}
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
function observeActivity(element) {
    if (element === null) {
        return;
    }
    const activityChild = element.firstElementChild;
    if (!(activityChild instanceof HTMLElement)) {
        return;
    }
    const restoreDisplay = ()=>{
        if (activityChild.style.display === 'none') {
            activityChild.style.display = 'contents';
        }
    };
    const observer = new MutationObserver(restoreDisplay);
    observer.observe(activityChild, {
        attributes: true,
        attributeFilter: [
            'style'
        ]
    });
    restoreDisplay();
    return ()=>observer.disconnect();
}
function ActivityContents({ mode, children }) {
    return(// React detaches refs inside a hidden Activity, so observe it from an outer wrapper.
    /*#__PURE__*/ (0, _jsxruntime().jsx)("div", {
        ref: observeActivity,
        style: {
            display: 'contents'
        },
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(_react().Activity, {
            mode: mode,
            children: /*#__PURE__*/ (0, _jsxruntime().jsx)("div", {
                style: {
                    display: 'contents'
                },
                children: children
            })
        })
    }));
}

//# sourceMappingURL=ActivityContents.web.js.map
