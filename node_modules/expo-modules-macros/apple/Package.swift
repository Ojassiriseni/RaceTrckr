// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import CompilerPluginSupport
import Foundation
import PackageDescription

let package = Package(
  name: "ExpoModulesMacros",
  platforms: [.macOS(.v13)],
  dependencies: [
    .package(url: "https://github.com/swiftlang/swift-syntax.git", from: "604.0.0-latest")
  ],
  targets: [
    // The plugin executable doubles as the scanner CLI: the compiler launches it without arguments
    // and speaks the plugin protocol over stdin, while an invocation with arguments dispatches into
    // `ScannerCLI` (see the entry point in Plugin.swift). Sharing the binary keeps the package to a
    // single shipped executable; the scanner adds little on top of the SwiftSyntax the macros
    // already link.
    .macro(
      name: "ExpoModulesMacros",
      dependencies: [
        "ExpoModulesCLI",
        .product(name: "SwiftSyntaxMacros", package: "swift-syntax"),
        .product(name: "SwiftCompilerPlugin", package: "swift-syntax"),
        // For `expand`, which runs the macros in process.
        .product(name: "SwiftSyntaxMacroExpansion", package: "swift-syntax"),
        .product(name: "SwiftParser", package: "swift-syntax"),
        .product(name: "SwiftParserDiagnostics", package: "swift-syntax"),
        .product(name: "SwiftBasicFormat", package: "swift-syntax"),
      ]
    ),
    .target(
      name: "ExpoModulesCLI",
      dependencies: [
        .product(name: "SwiftSyntax", package: "swift-syntax"),
        .product(name: "SwiftParser", package: "swift-syntax"),
        .product(name: "SwiftIfConfig", package: "swift-syntax"),
      ]
    ),
  ]
)

// The Tests directory is excluded from the published npm package,
// so only declare the test target when building from the repository.
if FileManager.default.fileExists(atPath: Context.packageDirectory + "/Tests") {
  package.targets.append(
    .testTarget(
      name: "ExpoModulesMacrosTests",
      dependencies: [
        "ExpoModulesMacros",
        "ExpoModulesCLI",
        .product(name: "SwiftSyntaxMacrosGenericTestSupport", package: "swift-syntax"),
      ]
    )
  )
  package.targets.append(
    .testTarget(
      name: "ExpoModulesCLITests",
      dependencies: [
        "ExpoModulesCLI",
        .product(name: "SwiftParser", package: "swift-syntax"),
      ]
    )
  )
}
