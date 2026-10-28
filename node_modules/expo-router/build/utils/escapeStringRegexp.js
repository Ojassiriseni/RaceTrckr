// TODO: Replace with the native `RegExp.escape` once it is supported across our runtime matrix
// (Hermes and older browsers do not implement it yet).
/**
 * Escapes the characters that have a special meaning in a regular expression, so `value` matches
 * literally. `-` becomes `\x2d` because `\-` is not a valid escape outside a character class in
 * Unicode-mode patterns.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "escapeStringRegexp", {
    enumerable: true,
    get: function() {
        return escapeStringRegexp;
    }
});
function escapeStringRegexp(value) {
    return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

//# sourceMappingURL=escapeStringRegexp.js.map
