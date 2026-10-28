"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getSingularId", {
    enumerable: true,
    get: function() {
        return getSingularId;
    }
});
function getSingularId(name, options = {}) {
    return name.split('/').map((segment)=>{
        if (segment.startsWith('[...')) {
            return options.params?.[segment.slice(4, -1)]?.join('/') || segment;
        } else if (segment.startsWith('[') && segment.endsWith(']')) {
            return options.params?.[segment.slice(1, -1)] || segment;
        } else {
            return segment;
        }
    }).join('/');
}

//# sourceMappingURL=getSingularId.js.map
