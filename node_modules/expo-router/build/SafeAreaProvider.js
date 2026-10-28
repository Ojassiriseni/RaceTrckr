'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SafeAreaProvider", {
    enumerable: true,
    get: function() {
        return SafeAreaProvider;
    }
});
function _jsxruntime() {
    const data = require("react/jsx-runtime");
    _jsxruntime = function() {
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
function _reactnativesafeareacontext() {
    const data = require("react-native-safe-area-context");
    _reactnativesafeareacontext = function() {
        return data;
    };
    return data;
}
const ZERO_INSETS = Object.freeze({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
});
const ZERO_FRAME = Object.freeze({
    x: 0,
    y: 0,
    width: 0,
    height: 0
});
function WebSafeAreaProvider({ children, initialMetrics: _initialMetrics, initialSafeAreaInsets: _initialSafeAreaInsets, style, ...props }) {
    // Measuring and updating these contexts can discard pending streamed content during hydration.
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(_reactnative().View, {
        ...props,
        style: [
            styles.container,
            style
        ],
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(_reactnativesafeareacontext().SafeAreaFrameContext.Provider, {
            value: ZERO_FRAME,
            children: /*#__PURE__*/ (0, _jsxruntime().jsx)(_reactnativesafeareacontext().SafeAreaInsetsContext.Provider, {
                value: ZERO_INSETS,
                children: children
            })
        })
    });
}
const SafeAreaProvider = process.env.EXPO_OS === 'web' ? WebSafeAreaProvider : _reactnativesafeareacontext().SafeAreaProvider;
const styles = _reactnative().StyleSheet.create({
    container: {
        flex: 1
    }
});

//# sourceMappingURL=SafeAreaProvider.js.map
