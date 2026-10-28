"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "subscribePopToTopOnParentTabPress", {
    enumerable: true,
    get: function() {
        return subscribePopToTopOnParentTabPress;
    }
});
const _native = require("../react-navigation/native");
function subscribePopToTopOnParentTabPress(navigation, state) {
    // @ts-expect-error: there may not be a tab navigator in parent
    return navigation.addListener?.('tabPress', (event)=>{
        const isFocused = navigation.isFocused();
        requestAnimationFrame(()=>{
            if (state.index > 0 && isFocused && !event.defaultPrevented && event.data?.__internalTabsType !== 'native') {
                navigation.dispatch({
                    ..._native.StackActions.popToTop(),
                    target: state.key
                });
            }
        });
    });
}

//# sourceMappingURL=subscribePopToTopOnParentTabPress.js.map
