import ExpoModulesCLI
import SwiftBasicFormat
import SwiftDiagnostics
import SwiftParser
import SwiftParserDiagnostics
import SwiftSyntax
import SwiftSyntaxMacroExpansion
import SwiftSyntaxMacros

/// Expands the macros of the plugin in one source file in process, with the same swift-syntax
/// machinery as `assertMacroExpansion`. The macros only read the syntax tree, so the generated code
/// is what the compiler gets, except for the names from `makeUniqueName`. The compiler also skips the
/// extension conformances that a type already has; the macros check the inheritance clause for that
/// too, so the result differs only when a conformance is inherited from somewhere else.
///
/// Without `symbols`, it returns one expansion of the whole file. Otherwise it returns one expansion
/// for each symbol declared in the file, and only the diagnostics inside those declarations:
///
/// - A type (`MyModule`, `MyModule.Options`): the expanded type and the extensions that its macros
///   add.
/// - A member (`MyModule.greet`, `MyModule.init`): the expanded type that declares it, with only the
///   declarations of that name (all overloads). The member macros of the type then generate only the
///   code for that member. A macro that reads other members (for example to find a name collision)
///   can generate a little differently than for the whole type.
///
/// A symbol that the file doesn't declare is left out of the expansions.
public func expandMacros(source: String, file: String, symbols: [String]) -> ExpandedFile {
  let tree = Parser.parse(source: source)
  let converter = SourceLocationConverter(fileName: file, tree: tree)
  let (expanded, context) = expand(tree, file: file)

  var diagnostics = ParseDiagnosticsGenerator.diagnostics(for: tree).map { diagnostic in
    expansionDiagnostic(diagnostic) { position, _ in converter.location(for: position) }
  }
  let originalDeclarations = OriginalDeclarations(tree)
  diagnostics += context.diagnostics.map { diagnostic in
    expansionDiagnostic(diagnostic) { position, node in
      let location = context.location(for: position, anchoredAt: node, fileName: file)
      if let original = originalDeclarations.position(of: position, in: node, shiftedOffset: location.offset) {
        return converter.location(for: original)
      }
      return location
    }
  }
  diagnostics.sort { ($0.line, $0.column) < ($1.line, $1.column) }

  guard !symbols.isEmpty else {
    return ExpandedFile(
      file: file,
      expansions: [Expansion(symbol: nil, source: expanded.description)],
      diagnostics: diagnostics
    )
  }

  let declarations = SymbolIndex(tree).declarations
  var expansions: [Expansion] = []
  var lineRanges: [ClosedRange<Int>] = []
  for symbol in symbols {
    let types = declarations.filter { $0.path == symbol && $0.kind == .type }
    let members = declarations.filter { $0.path == symbol && $0.kind == .member }

    if !types.isEmpty {
      let source = render(typePath: symbol, in: expanded, original: tree) { index in
        index.filter { $0.path == symbol && $0.kind == .type }.map(\.node)
      }
      expansions.append(Expansion(symbol: symbol, source: source))
      lineRanges += types.map { lineRange(of: $0.node, converter: converter) }
    } else if !members.isEmpty {
      let pruned = MemberPruner(
        parents: Set(members.compactMap(\.parent?.id)),
        kept: Set(members.map(\.node.id))
      )
      .rewrite(tree)
      guard let prunedTree = pruned.as(SourceFileSyntax.self) else {
        continue
      }
      let parentPath = String(symbol[..<(symbol.lastIndex(of: ".") ?? symbol.startIndex)])
      let (prunedExpansion, _) = expand(prunedTree, file: file)
      // Only the types or extensions that declare the member: another extension of the same type
      // isn't pruned.
      let source = render(typePath: parentPath, in: prunedExpansion, original: prunedTree) { index in
        let parents = Set(index.filter { $0.path == symbol && $0.kind == .member }.compactMap(\.parent?.id))
        return index.filter { parents.contains($0.node.id) }.map(\.node)
      }
      expansions.append(Expansion(symbol: symbol, source: source))
      lineRanges += members.map { lineRange(of: $0.node, converter: converter) }
    }
  }

  return ExpandedFile(
    file: file,
    expansions: expansions,
    diagnostics: diagnostics.filter { diagnostic in
      lineRanges.contains { $0.contains(diagnostic.line) }
    }
  )
}

/// Expands every macro of the plugin in `tree`.
private func expand(
  _ tree: SourceFileSyntax,
  file: String
) -> (expanded: Syntax, context: BasicMacroExpansionContext) {
  let specs = Dictionary(
    uniqueKeysWithValues: ProvidedMacro.all.map {
      ($0.name, MacroSpec(type: $0.type, conformances: $0.conformances))
    }
  )
  let context = BasicMacroExpansionContext(
    sourceFiles: [tree: .init(moduleName: "ExpandedModule", fullFilePath: file)]
  )
  let expanded = tree.expand(
    macroSpecs: specs,
    contextGenerator: { node in
      BasicMacroExpansionContext(sharingWith: context, lexicalContext: node.allMacroLexicalContexts())
    },
    // The generated code follows the indentation of the file.
    indentationWidth: BasicFormat.inferIndentation(of: tree) ?? .spaces(2)
  )
  return (expanded, context)
}

/// The expanded declarations that `select` picks from the symbols of `expanded`, each without the
/// indentation of its nesting, followed by the extensions that the extension macros add for the type
/// at `typePath`.
private func render(
  typePath: String,
  in expanded: Syntax,
  original: SourceFileSyntax,
  select: ([SymbolDeclaration]) -> [Syntax]
) -> String {
  let declarations = select(SymbolIndex(expanded).declarations)
  // The macro system adds the extensions after the expanded statements of the file, with the type
  // name as the macro got it (qualified for a nested type). So they are the last statements, after
  // the extensions that already end the file.
  let statements = expanded.as(SourceFileSyntax.self)?.statements ?? []
  let addedCount =
    trailingExtensions(of: statements).count - trailingExtensions(of: original.statements).count
  let addedExtensions = trailingExtensions(of: statements).suffix(max(addedCount, 0)).filter {
    $0.extendedType.trimmedDescription == typePath
  }
  let nodes = declarations + addedExtensions.map(Syntax.init)
  return nodes.map(withoutNestingIndentation).joined(separator: "\n\n") + "\n"
}

/// The extensions at the end of `statements`, up to the last statement that isn't one.
private func trailingExtensions(of statements: CodeBlockItemListSyntax) -> [ExtensionDeclSyntax] {
  var extensions: [ExtensionDeclSyntax] = []
  for item in statements.reversed() {
    guard let extensionDecl = item.item.as(ExtensionDeclSyntax.self) else {
      break
    }
    extensions.insert(extensionDecl, at: 0)
  }
  return extensions
}

/// The source of `node` without its leading trivia, and with the indentation of its first line
/// removed from all the lines.
private func withoutNestingIndentation(_ node: Syntax) -> String {
  var indentation = ""
  for piece in node.leadingTrivia.pieces {
    switch piece {
    case .newlines, .carriageReturns, .carriageReturnLineFeeds:
      indentation = ""
    case .spaces(let count):
      indentation += String(repeating: " ", count: count)
    case .tabs(let count):
      indentation += String(repeating: "\t", count: count)
    default:
      break
    }
  }
  let lines = node.trimmedDescription.split(separator: "\n", omittingEmptySubsequences: false)
  return lines.enumerated().map { index, line in
    index > 0 && line.hasPrefix(indentation) ? String(line.dropFirst(indentation.count)) : String(line)
  }
  .joined(separator: "\n")
}

/// The lines of `node` in the original file, from its attributes to its closing brace.
private func lineRange(of node: Syntax, converter: SourceLocationConverter) -> ClosedRange<Int> {
  let start = converter.location(for: node.positionAfterSkippingLeadingTrivia).line
  let end = converter.location(for: node.endPositionBeforeTrailingTrivia).line
  return start...end
}

private func expansionDiagnostic(
  _ diagnostic: Diagnostic,
  location: (AbsolutePosition, Syntax) -> SourceLocation
) -> ExpansionDiagnostic {
  let start = location(diagnostic.position, diagnostic.node)
  return ExpansionDiagnostic(
    severity: severity(diagnostic.diagMessage.severity),
    message: diagnostic.message,
    line: start.line,
    column: start.column,
    notes: diagnostic.notes.map { note in
      let noteStart = location(note.position, note.node)
      return ExpansionNote(message: note.message, line: noteStart.line, column: noteStart.column)
    },
    fixIts: diagnostic.fixIts.map(\.message.message)
  )
}

private func severity(_ severity: DiagnosticSeverity) -> ExpansionDiagnostic.Severity {
  switch severity {
  case .error: .error
  case .warning: .warning
  case .note: .note
  case .remark: .remark
  }
}

// MARK: - Diagnostic locations

/// Maps a position in a declaration that a macro got to the same position in the original file.
///
/// The macro system detaches the declaration that it passes to an attached macro and maps positions
/// in it back to the declaration it detached it from. But a peer macro gets the declaration with the
/// attributes that the member attribute macros of its type added, for example the `@JavaScriptActor`
/// that `@ExpoModule` adds to a `@JS` function, and that declaration isn't in the original file. So
/// every position after the added attributes is off by their length. A diagnostic in a parameter
/// type of a `@JS` function would be on the next line.
///
/// The text from the keyword of the declaration (`func`, `var`, `init`) to its end is the same in
/// both, so this finds the original declaration by that text and moves the position by the offset of
/// the keyword. A position before the keyword, in the attributes or the modifiers, isn't mapped.
private struct OriginalDeclarations {
  /// The positions of the keywords of the declarations in the original file, in source order, by the
  /// text from the keyword to the end of the declaration.
  private let keywordPositions: [String: [AbsolutePosition]]

  init(_ tree: SourceFileSyntax) {
    let collector = DeclarationCollector(viewMode: .sourceAccurate)
    collector.walk(tree)
    var keywordPositions: [String: [AbsolutePosition]] = [:]
    for declaration in collector.declarations {
      guard let keyword = keywordToken(of: declaration) else {
        continue
      }
      keywordPositions[textFromKeyword(keyword, of: declaration), default: []].append(
        keyword.positionAfterSkippingLeadingTrivia
      )
    }
    self.keywordPositions = keywordPositions
  }

  /// The position in the original file of `position` in `node`, or `nil` when `node` is in the
  /// original file, isn't in a detached declaration, or is before its keyword.
  ///
  /// `shiftedOffset` is the offset that the macro system maps `position` to. The added attributes
  /// only move it forward, so when declarations with the same text are in the file, the one it is
  /// in is the last one that starts at or before that offset.
  func position(of position: AbsolutePosition, in node: Syntax, shiftedOffset: Int) -> AbsolutePosition? {
    guard !node.root.is(SourceFileSyntax.self),
      let declaration = node.root.as(DeclSyntax.self),
      let keyword = keywordToken(of: declaration),
      position >= keyword.positionAfterSkippingLeadingTrivia,
      let candidates = keywordPositions[textFromKeyword(keyword, of: declaration)]
    else {
      return nil
    }
    let offset = position.utf8Offset - keyword.positionAfterSkippingLeadingTrivia.utf8Offset
    let shiftedKeyword = shiftedOffset - offset
    guard let originalKeyword = candidates.last(where: { $0.utf8Offset <= shiftedKeyword }) ?? candidates.first
    else {
      return nil
    }
    return AbsolutePosition(utf8Offset: originalKeyword.utf8Offset + offset)
  }
}

/// The first token of `declaration` after its attributes and modifiers, such as `func` or `var`.
private func keywordToken(of declaration: DeclSyntax) -> TokenSyntax? {
  for child in declaration.children(viewMode: .sourceAccurate)
  where !child.is(AttributeListSyntax.self) && !child.is(DeclModifierListSyntax.self) {
    if let token = child.firstToken(viewMode: .sourceAccurate) {
      return token
    }
  }
  return nil
}

/// The source text of `declaration` from `keyword` to its end, without the trailing trivia.
private func textFromKeyword(_ keyword: TokenSyntax, of declaration: DeclSyntax) -> String {
  let text = Array(declaration.description.utf8)
  let start = keyword.positionAfterSkippingLeadingTrivia.utf8Offset - declaration.position.utf8Offset
  let end = declaration.endPositionBeforeTrailingTrivia.utf8Offset - declaration.position.utf8Offset
  return String(decoding: text[start..<end], as: UTF8.self)
}

/// Collects every declaration in a tree.
private final class DeclarationCollector: SyntaxAnyVisitor {
  private(set) var declarations: [DeclSyntax] = []

  override func visitAny(_ node: Syntax) -> SyntaxVisitorContinueKind {
    if let declaration = node.as(DeclSyntax.self) {
      declarations.append(declaration)
    }
    return .visitChildren
  }
}

// MARK: - Symbols

/// A declaration that `--symbol` can name.
private struct SymbolDeclaration {
  enum Kind {
    case type
    case `extension`
    case member
  }

  /// The names from the outermost type to the declaration, joined with dots: `MyModule.greet`. An
  /// extension has the path of the type it extends.
  let path: String
  let kind: Kind
  let node: Syntax

  /// For a member, the type or extension that declares it.
  let parent: Syntax?
}

/// Collects the types, extensions and members in a tree, also those inside `#if` blocks. Function
/// bodies are skipped, so a local type isn't a symbol.
private final class SymbolIndex: SyntaxVisitor {
  private(set) var declarations: [SymbolDeclaration] = []
  private var scopes: [(path: String, node: Syntax)] = []

  init(_ tree: some SyntaxProtocol) {
    super.init(viewMode: .sourceAccurate)
    walk(tree)
  }

  override func visit(_ node: ClassDeclSyntax) -> SyntaxVisitorContinueKind {
    enterType(node, name: node.name)
  }

  override func visitPost(_ node: ClassDeclSyntax) {
    scopes.removeLast()
  }

  override func visit(_ node: StructDeclSyntax) -> SyntaxVisitorContinueKind {
    enterType(node, name: node.name)
  }

  override func visitPost(_ node: StructDeclSyntax) {
    scopes.removeLast()
  }

  override func visit(_ node: EnumDeclSyntax) -> SyntaxVisitorContinueKind {
    enterType(node, name: node.name)
  }

  override func visitPost(_ node: EnumDeclSyntax) {
    scopes.removeLast()
  }

  override func visit(_ node: ActorDeclSyntax) -> SyntaxVisitorContinueKind {
    enterType(node, name: node.name)
  }

  override func visitPost(_ node: ActorDeclSyntax) {
    scopes.removeLast()
  }

  override func visit(_ node: ProtocolDeclSyntax) -> SyntaxVisitorContinueKind {
    enterType(node, name: node.name)
  }

  override func visitPost(_ node: ProtocolDeclSyntax) {
    scopes.removeLast()
  }

  override func visit(_ node: ExtensionDeclSyntax) -> SyntaxVisitorContinueKind {
    let path = qualified(node.extendedType.trimmedDescription)
    declarations.append(SymbolDeclaration(path: path, kind: .extension, node: Syntax(node), parent: nil))
    scopes.append((path, Syntax(node)))
    return .visitChildren
  }

  override func visitPost(_ node: ExtensionDeclSyntax) {
    scopes.removeLast()
  }

  override func visit(_ node: FunctionDeclSyntax) -> SyntaxVisitorContinueKind {
    addMember(node, names: [node.name.text])
  }

  override func visit(_ node: VariableDeclSyntax) -> SyntaxVisitorContinueKind {
    addMember(
      node,
      names: node.bindings.compactMap { $0.pattern.as(IdentifierPatternSyntax.self)?.identifier.text }
    )
  }

  override func visit(_ node: InitializerDeclSyntax) -> SyntaxVisitorContinueKind {
    addMember(node, names: ["init"])
  }

  override func visit(_ node: SubscriptDeclSyntax) -> SyntaxVisitorContinueKind {
    addMember(node, names: ["subscript"])
  }

  override func visit(_ node: EnumCaseDeclSyntax) -> SyntaxVisitorContinueKind {
    addMember(node, names: node.elements.map(\.name.text))
  }

  private func enterType(_ node: some DeclSyntaxProtocol, name: TokenSyntax) -> SyntaxVisitorContinueKind {
    let path = qualified(name.text)
    declarations.append(SymbolDeclaration(path: path, kind: .type, node: Syntax(node), parent: nil))
    scopes.append((path, Syntax(node)))
    return .visitChildren
  }

  /// Records a member of the innermost type. Doesn't visit the children: a declaration in a body or
  /// an accessor isn't a member.
  private func addMember(_ node: some DeclSyntaxProtocol, names: [String]) -> SyntaxVisitorContinueKind {
    if let scope = scopes.last {
      for name in names.map(withoutBackticks) {
        declarations.append(
          SymbolDeclaration(path: "\(scope.path).\(name)", kind: .member, node: Syntax(node), parent: scope.node)
        )
      }
    }
    return .skipChildren
  }

  /// `name` inside the innermost type, without backticks: `` `default` `` is `default`.
  private func qualified(_ name: String) -> String {
    let name = withoutBackticks(name)
    return scopes.last.map { "\($0.path).\(name)" } ?? name
  }
}

/// Removes from the member blocks of `parents` every member that isn't in `kept`, except the type
/// aliases. An `#if` block stays with the kept members inside it.
private final class MemberPruner: SyntaxRewriter {
  private let parents: Set<SyntaxIdentifier>
  private let kept: Set<SyntaxIdentifier>

  init(parents: Set<SyntaxIdentifier>, kept: Set<SyntaxIdentifier>) {
    self.parents = parents
    self.kept = kept
    super.init(viewMode: .sourceAccurate)
  }

  override func visit(_ node: MemberBlockSyntax) -> MemberBlockSyntax {
    guard let parent = node.parent, parents.contains(parent.id) else {
      return super.visit(node)
    }
    return node.with(\.members, prune(node.members))
  }

  private func prune(_ members: MemberBlockItemListSyntax) -> MemberBlockItemListSyntax {
    MemberBlockItemListSyntax(
      members.compactMap { item -> MemberBlockItemSyntax? in
        // The macros resolve the type aliases of the type in the types of its members.
        if kept.contains(item.decl.id) || item.decl.is(TypeAliasDeclSyntax.self) {
          return item
        }
        guard let ifConfig = item.decl.as(IfConfigDeclSyntax.self) else {
          return nil
        }
        let clauses = ifConfig.clauses.map { clause -> IfConfigClauseSyntax in
          guard case .decls(let decls) = clause.elements else {
            return clause
          }
          return clause.with(\.elements, .decls(prune(decls)))
        }
        let keepsMember = clauses.contains { clause in
          guard case .decls(let decls) = clause.elements else {
            return false
          }
          // A clause with only type aliases left keeps no member.
          return decls.contains { !$0.decl.is(TypeAliasDeclSyntax.self) }
        }
        return keepsMember
          ? item.with(\.decl, DeclSyntax(ifConfig.with(\.clauses, IfConfigClauseListSyntax(clauses)))) : nil
      }
    )
  }
}
