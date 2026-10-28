"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createBaseStackProps", {
    enumerable: true,
    get: function() {
        return createBaseStackProps;
    }
});
const _makePopAction = require("../../react-navigation/native-stack/utils/makePopAction");
const _subscribePopToTopOnParentTabPress = require("../../standard-navigation/subscribePopToTopOnParentTabPress");
function createBaseStackProps({ dispatchSync, isPreloaded, isRemovalPrevented, navigation, state }) {
    return {
        isPreloaded,
        isRemovalPrevented,
        pop: (0, _makePopAction.makePopAction)(dispatchSync, state.key),
        subscribePopToTopOnParentTabPress: ()=>(0, _subscribePopToTopOnParentTabPress.subscribePopToTopOnParentTabPress)(navigation, state)
    };
}

//# sourceMappingURL=createBaseStackProps.js.map
