"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isRenderingComponent", {
    enumerable: true,
    get: function() {
        return isRenderingComponent;
    }
});
function _react() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react"));
    _react = function() {
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
// Private React internals, missing from the public types. May be absent in other React versions.
const internals = _react().__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
function isRenderingComponent() {
    // The owner is the component that React renders now. React reads it the same way for new elements:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react/src/jsx/ReactJSXElement.js#L50-L59
    // `A` starts as null:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react/src/ReactSharedInternalsClient.js#L62
    // On the client, only the render loop writes `A`. It saves the old value, sets `A`, and writes the old value back:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2515-L2523
    // The restore runs before commit, so `A` is null again in commit, effects, and event handlers:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2640-L2756
    // `getOwner` exists only in development builds:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-reconciler/src/ReactFiberAsyncDispatcher.js#L38-L42
    return internals?.A?.getOwner?.() != null;
}

//# sourceMappingURL=isRenderingComponent.js.map
