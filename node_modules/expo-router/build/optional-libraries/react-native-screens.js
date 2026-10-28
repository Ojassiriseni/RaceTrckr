"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    Split: null,
    StackV5: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get Split () {
        return Split;
    },
    get StackV5 () {
        return StackV5;
    }
});
function _reactnativescreens() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react-native-screens"));
    _reactnativescreens = function() {
        return data;
    };
    return data;
}
function _experimental() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react-native-screens/experimental"));
    _experimental = function() {
        return data;
    };
    return data;
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// react-native-screens 5 exports `Stack` and `Split` from the main entry, 4.x only from
// `experimental`. Our types target 4.x, where the main entry doesn't declare them, hence the cast.
const screensV5 = _reactnativescreens();
const StackV5 = screensV5.Stack ?? _experimental().Stack;
const Split = screensV5.Split ?? _experimental().Split;

//# sourceMappingURL=react-native-screens.js.map
