"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createLinkedDependencyMatcher", {
    enumerable: true,
    get: function() {
        return createLinkedDependencyMatcher;
    }
});
function _fs() {
    const data = /*#__PURE__*/ _interop_require_default(require("fs"));
    _fs = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
];
function createLinkedDependencyMatcher(projectRoot) {
    const dependencyNames = new Set(readDependencyNames(projectRoot));
    const packageNameCache = new Map();
    return (relativePosixPath)=>{
        if (dependencyNames.size === 0 || relativePosixPath.split('/').includes('node_modules')) {
            return false;
        }
        const dir = _path().default.dirname(_path().default.resolve(projectRoot, relativePosixPath));
        const packageName = findPackageName(dir, packageNameCache);
        return packageName !== null && dependencyNames.has(packageName);
    };
}
function readDependencyNames(projectRoot) {
    let packageJson;
    try {
        packageJson = JSON.parse(_fs().default.readFileSync(_path().default.join(projectRoot, 'package.json'), 'utf8'));
    } catch  {
        return [];
    }
    return DEPENDENCY_FIELDS.flatMap((field)=>Object.keys(packageJson[field] ?? {}));
}
function findPackageName(dir, cache) {
    const cached = cache.get(dir);
    if (cached !== undefined) {
        return cached;
    }
    let packageName = null;
    try {
        // The sync read is fine: the result is cached per directory and few files reach this point.
        const { name } = JSON.parse(_fs().default.readFileSync(_path().default.join(dir, 'package.json'), 'utf8'));
        packageName = typeof name === 'string' ? name : null;
    } catch  {}
    const parentDir = _path().default.dirname(dir);
    if (packageName === null && parentDir !== dir) {
        packageName = findPackageName(parentDir, cache);
    }
    cache.set(dir, packageName);
    return packageName;
}

//# sourceMappingURL=LinkedDependencies.js.map
