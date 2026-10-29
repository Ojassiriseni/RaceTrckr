"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    packageDirectoryOf: null,
    swiftCheckCommand: null,
    swiftExpandCommand: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get packageDirectoryOf () {
        return packageDirectoryOf;
    },
    get swiftCheckCommand () {
        return swiftCheckCommand;
    },
    get swiftExpandCommand () {
        return swiftExpandCommand;
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
const _expand = require("../scanner/expand");
const _args = require("./args");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const OPTIONS_HELP = `  --symbol <name>   Only a type ('MyModule', 'MyModule.Options') or a member
                    ('MyModule.greet') and its diagnostics. Repeatable.
  --json            Print a JSON report instead of text. The exit code is then 0
                    also when there is an error.
  --scanner <path>  Path to the Expo Modules executable. Defaults to the one of
                    the expo-modules-macros version that expo-modules-core
                    depends on.
  -h, --help        Display this message.`;
const EXPAND_HELP = `Usage: expo-modules swift:expand [options] <path...>

Prints the code that the Expo Modules macros generate for Swift sources, as
"Expand Macro" does in Xcode, without a build. A path is a .swift file or a
directory, where only the files that use one of the macros are expanded. The
macro diagnostics go to stderr, and the exit code is 1 when there is an error.

Options:
${OPTIONS_HELP}`;
const CHECK_HELP = `Usage: expo-modules swift:check [options] [path...]

Checks Swift sources for the errors and warnings of the Expo Modules macros,
without a build. A path is a .swift file or a directory (default: the current
directory). Exits with code 1 when there is an error. Errors that need type
checking still need a build.

Options:
${OPTIONS_HELP}`;
async function swiftExpandCommand(argv) {
    await runSwiftExpand(argv, {
        command: 'swift:expand',
        help: EXPAND_HELP,
        diagnosticsOnly: false
    });
}
async function swiftCheckCommand(argv) {
    await runSwiftExpand(argv, {
        command: 'swift:check',
        help: CHECK_HELP,
        diagnosticsOnly: true
    });
}
async function runSwiftExpand(argv, { command, help, diagnosticsOnly }) {
    const args = (0, _args.parseArgs)({
        '--symbol': [
            String
        ],
        '--json': Boolean,
        '--scanner': String,
        '--help': Boolean,
        '-h': '--help'
    }, argv, `expo-modules ${command}`);
    if (args['--help']) {
        console.log(help);
        return;
    }
    const paths = args._.length > 0 ? args._ : diagnosticsOnly ? [
        '.'
    ] : [];
    const [firstPath] = paths;
    if (firstPath === undefined) {
        throw new Error(`\`expo-modules ${command}\` needs at least one .swift file or directory. ` + `Run \`expo-modules ${command} --help\` to see the usage.`);
    }
    const binaryPath = args['--scanner'] ? _path().default.resolve(args['--scanner']) : (0, _expand.resolveExpandBinary)(packageDirectoryOf(firstPath));
    process.exitCode = await (0, _expand.runExpand)(binaryPath, (0, _expand.buildExpandArgs)({
        paths,
        symbols: args['--symbol'],
        json: args['--json'],
        diagnosticsOnly
    }));
}
function packageDirectoryOf(sourcePath) {
    const resolved = _path().default.resolve(sourcePath);
    return _fs().default.existsSync(resolved) && _fs().default.statSync(resolved).isFile() ? _path().default.dirname(resolved) : resolved;
}

//# sourceMappingURL=swiftExpandCommands.js.map
