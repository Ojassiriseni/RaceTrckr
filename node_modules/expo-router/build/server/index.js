"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createServerLoader: null,
    createStaticLoader: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get createServerLoader () {
        return _exposerver().createServerLoader;
    },
    get createStaticLoader () {
        return _exposerver().createStaticLoader;
    }
});
function _exposerver() {
    const data = require("expo-server");
    _exposerver = function() {
        return data;
    };
    return data;
}

//# sourceMappingURL=index.js.map
