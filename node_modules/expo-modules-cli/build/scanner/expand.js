"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    buildExpandArgs: null,
    resolveExpandBinary: null,
    runExpand: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get buildExpandArgs () {
        return buildExpandArgs;
    },
    get resolveExpandBinary () {
        return resolveExpandBinary;
    },
    get runExpand () {
        return runExpand;
    }
});
function _child_process() {
    const data = require("child_process");
    _child_process = function() {
        return data;
    };
    return data;
}
function _fs() {
    const data = /*#__PURE__*/ _interop_require_default(require("fs"));
    _fs = function() {
        return data;
    };
    return data;
}
const _resolveMacros = require("./resolveMacros");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function buildExpandArgs({ paths, symbols = [], json, diagnosticsOnly }) {
    const args = [
        'expand'
    ];
    for (const symbol of symbols){
        args.push('--symbol', symbol);
    }
    if (json) {
        args.push('--json');
    }
    if (diagnosticsOnly) {
        args.push('--diagnostics-only');
    }
    return [
        ...args,
        ...paths
    ];
}
function resolveExpandBinary(packageDir) {
    const { macros, root, version } = (0, _resolveMacros.loadMacros)(packageDir);
    if (macros.SUPPORTED_EXPAND_SCHEMA_VERSION === undefined) {
        throw new Error(`expo-modules-macros ${version} at ${root} can't expand macros: \`expand\` needs ` + `expo-modules-macros 0.27.0 or later. Update "expo" in ${packageDir} to a version whose ` + `expo-modules-core depends on it, or pass the path to a newer executable with --scanner.`);
    }
    return macros.getScannerBinaryPath();
}
function runExpand(binaryPath, args) {
    if (!_fs().default.existsSync(binaryPath)) {
        return Promise.reject(new Error(`The Expo Modules executable was not found at ${binaryPath}. It ships with ` + `expo-modules-macros, a dependency of expo-modules-core, so reinstall your JavaScript ` + `dependencies, or pass the path to a locally built executable with --scanner.`));
    }
    return new Promise((resolve, reject)=>{
        // An executable without the CLI would start the compiler plugin server and wait on stdin.
        const child = (0, _child_process().spawn)(binaryPath, args, {
            stdio: [
                'ignore',
                'inherit',
                'inherit'
            ]
        });
        child.on('error', (error)=>{
            reject(new Error(`The Expo Modules executable at ${binaryPath} could not run: ${error.message}. Make sure ` + `the file is executable and built for this platform, or pass the path to another ` + `executable with --scanner.`, {
                cause: error
            }));
        });
        child.on('close', (code, signal)=>{
            resolve(code ?? (signal ? 1 : 0));
        });
    });
}

//# sourceMappingURL=expand.js.map
