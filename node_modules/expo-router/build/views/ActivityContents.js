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
function _reactnative() {
    const data = require("react-native");
    _reactnative = function() {
        return data;
    };
    return data;
}
const NativeActivityContents = _reactnative().NativeComponentRegistry.get('ExpoRouterActivityContents', ()=>({
        uiViewClassName: 'RCTView',
        validAttributes: {
            style: {
                // @ts-expect-error: React Native's index signature rejects its special nested style config.
                display: {
                    process: ()=>'contents'
                }
            }
        }
    }));
function ActivityContents({ mode, children }) {
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(_react().Activity, {
        mode: mode,
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(NativeActivityContents, {
            style: {
                display: 'contents'
            },
            children: children
        })
    });
}

//# sourceMappingURL=ActivityContents.js.map
