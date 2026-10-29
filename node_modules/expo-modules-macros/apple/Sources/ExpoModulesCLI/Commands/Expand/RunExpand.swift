#if canImport(FoundationEssentials)
import FoundationEssentials
#else
import Foundation
#endif

/// The options of `expand`, parsed by `ScannerCLI`.
struct ExpandOptions: Equatable {
  var paths: [String] = []
  var symbols: [String] = []
  var json = false
  var diagnosticsOnly = false
}

extension Scanner {
  /// Runs `expand`: expands the macros in each file with `expander` and prints the result. A
  /// directory stands for the `.swift` files in it that use one of the macros.
  ///
  /// As text, the expanded source goes to stdout and the diagnostics go to stderr in the
  /// `<file>:<line>:<column>: <severity>: <message>` format of the compiler. The exit code is `1`
  /// when there is an error diagnostic. With `--json`, the report goes to stdout and the exit code
  /// is `0` also with error diagnostics, because the report holds them; `1` then means that encoding
  /// failed. An input that can't be expanded (a missing path, a file that isn't Swift, a symbol that
  /// no file declares) is a usage error, `2`.
  static func runExpand(options: ExpandOptions, expander: MacroExpander) -> Int32 {
    let result: ExpandResult
    switch expandFiles(options: options, expander: expander) {
    case .success(let expanded):
      result = expanded
    case .failure(let error):
      writeToStandardError("error: \(error.message)\n")
      return 2
    }

    if options.json {
      do {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(result)
        writeToStandardOutput(String(decoding: data, as: UTF8.self) + "\n")
        return 0
      } catch {
        writeToStandardError("error: failed to encode results: \(error)\n")
        return 1
      }
    }

    writeToStandardOutput(renderExpansions(result.files))
    writeToStandardError(renderDiagnostics(result.files))
    if options.diagnosticsOnly {
      writeToStandardError(renderSummary(result.files))
    }
    let hasErrors = result.files.contains { $0.diagnostics.contains { $0.severity == .error } }
    return hasErrors ? 1 : 0
  }
}

/// The absolute path of `path` with symbolic links resolved, to tell whether two paths name the same
/// file. A path that the directory walk returns can differ from the one passed for the same file, for
/// example `/private/var` and `/var` on macOS.
private func fileIdentity(_ path: String) -> String {
  URL(fileURLWithPath: path).standardizedFileURL.resolvingSymlinksInPath().path
}

/// An input that `expand` can't take.
struct ExpandInputError: Error, Equatable {
  let message: String
}

/// Reads the files of `options`, expands each with `expander`, and returns the report that `expand`
/// prints. Separate from `runExpand` so tests can drive it without stdout.
///
/// A file keeps its path as it was passed and is always expanded. A directory is walked like the
/// scans walk it (`swiftFiles(in:)`, which skips dependency, build, test and example directories),
/// and only the files that use one of the macros are expanded, with their absolute paths. A file that
/// a directory also contains is expanded once.
func expandFiles(options: ExpandOptions, expander: MacroExpander) -> Result<ExpandResult, ExpandInputError> {
  let prefilter = MacroPrefilter(attributeNames: expander.attributeNames)
  var sources: [(file: String, source: String)] = []
  var seen: Set<String> = []
  for path in options.paths {
    switch isDirectory(atPath: path) {
    case nil:
      return .failure(ExpandInputError(message: "no such file or directory '\(path)'"))
    case .some(true):
      for file in swiftFiles(in: [path]) where !seen.contains(fileIdentity(file)) {
        guard let source = try? String(contentsOfFile: file, encoding: .utf8) else {
          return .failure(ExpandInputError(message: "could not read '\(file)'"))
        }
        seen.insert(fileIdentity(file))
        if mightContainMacro(in: source, prefilter: prefilter) {
          sources.append((file, source))
        }
      }
    case .some(false):
      guard path.hasSuffix(".swift") else {
        return .failure(ExpandInputError(message: "expand takes .swift files and directories, but got '\(path)'"))
      }
      guard !seen.contains(fileIdentity(path)) else {
        continue
      }
      guard let source = try? String(contentsOfFile: path, encoding: .utf8) else {
        return .failure(ExpandInputError(message: "could not read '\(path)'"))
      }
      seen.insert(fileIdentity(path))
      sources.append((path, source))
    }
  }

  let files = sources.map { expander.expand($0.source, $0.file, options.symbols) }

  let found = Set(files.flatMap { $0.expansions.compactMap(\.symbol) })
  if let missing = options.symbols.first(where: { !found.contains($0) }) {
    return .failure(
      ExpandInputError(
        message: "no declaration of '\(missing)' in the given files; name a type ('Module'), a nested "
          + "type ('Module.Options') or a member ('Module.method')"
      )
    )
  }

  return .success(
    ExpandResult(
      schemaVersion: expandSchemaVersion,
      files: options.diagnosticsOnly
        ? files.map { ExpandedFile(file: $0.file, expansions: [], diagnostics: $0.diagnostics) }
        : files
    )
  )
}

/// The expanded sources as text. A single expansion is printed as it is; more than one each get a
/// `// <file>` or `// <file>: <symbol>` header and are separated by an empty line.
func renderExpansions(_ files: [ExpandedFile]) -> String {
  let expansions = files.flatMap { file in file.expansions.map { (file: file.file, expansion: $0) } }
  if expansions.count == 1, let only = expansions.first {
    return withTrailingNewline(only.expansion.source)
  }
  return expansions.map { file, expansion in
    let header = expansion.symbol.map { "// \(file): \($0)" } ?? "// \(file)"
    return "\(header)\n\n" + withTrailingNewline(expansion.source)
  }
  .joined(separator: "\n")
}

/// The diagnostics in the compiler's format, one line each, followed by their notes and Fix-Its.
func renderDiagnostics(_ files: [ExpandedFile]) -> String {
  var text = ""
  for file in files {
    for diagnostic in file.diagnostics {
      text +=
        "\(file.file):\(diagnostic.line):\(diagnostic.column): \(diagnostic.severity.rawValue): \(diagnostic.message)\n"
      for note in diagnostic.notes {
        text += "\(file.file):\(note.line):\(note.column): note: \(note.message)\n"
      }
      for fixIt in diagnostic.fixIts {
        text += "\(file.file):\(diagnostic.line):\(diagnostic.column): note: fix-it: \(fixIt)\n"
      }
    }
  }
  return text
}

/// The summary line of `--diagnostics-only`, for example `1 error and 2 warnings in 3 files`.
func renderSummary(_ files: [ExpandedFile]) -> String {
  let diagnostics = files.flatMap(\.diagnostics)
  let errors = diagnostics.filter { $0.severity == .error }.count
  let warnings = diagnostics.filter { $0.severity == .warning }.count
  let checked = count(files.count, "file")
  if errors == 0 && warnings == 0 {
    return "No macro errors or warnings in \(checked).\n"
  }
  let parts = [errors > 0 ? count(errors, "error") : nil, warnings > 0 ? count(warnings, "warning") : nil]
  return "\(parts.compactMap { $0 }.joined(separator: " and ")) in \(checked).\n"
}

private func count(_ n: Int, _ noun: String) -> String {
  "\(n) \(noun)\(n == 1 ? "" : "s")"
}

private func withTrailingNewline(_ text: String) -> String {
  text.hasSuffix("\n") ? text : text + "\n"
}
