import ExpoModulesCLI
import SwiftCompilerPlugin
import SwiftSyntaxMacros

#if canImport(Darwin)
import Darwin
#elseif canImport(Glibc)
import Glibc
#elseif os(Windows)
import CRT
#endif

struct ExpoModulesMacrosPlugin: CompilerPlugin {
  let providingMacros: [Macro.Type] = ProvidedMacro.all.map(\.type)
}

/// The executable doubles as the scanner CLI. The compiler always launches a plugin executable
/// without arguments and speaks the plugin protocol over stdin, so any argument means a scanner
/// invocation (`ExpoModulesMacros scan-modules <path>...`); with none, this starts the plugin
/// server exactly as `@main` on the `CompilerPlugin` type would. The CLI gets `expandMacros`, so
/// `expand` runs the macros of this executable.
@main
enum EntryPoint {
  static func main() throws {
    let arguments = Array(CommandLine.arguments.dropFirst())
    if arguments.isEmpty {
      try ExpoModulesMacrosPlugin.main()
    } else {
      let expander = MacroExpander(
        attributeNames: Set(ProvidedMacro.all.map(\.name)),
        expand: expandMacros
      )
      exit(ScannerCLI.run(arguments: arguments, expander: expander))
    }
  }
}
