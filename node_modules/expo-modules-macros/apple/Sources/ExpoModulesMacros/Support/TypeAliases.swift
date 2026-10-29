import SwiftSyntax

/// The type aliases declared in the body of a class whose aliased type holds a tuple (see
/// `TupleConversion`), resolved to that type. A macro sees only the declaration it's attached to, so
/// `@ExpoModule` and `@SharedObject` collect the aliases from their class body, and resolve them in
/// the `@JS` members they bind before reading the members' types: an alias of a tuple can't convert
/// through `decode` / `encode` under its own name, because the tuple can't conform.
///
/// An alias declared anywhere else (at file level, in an extension or in another type) isn't visible
/// to the macros, so it converts under its own name and fails its conformance assertion. A generic
/// alias isn't resolved either.
internal struct TupleTypeAliases {
  /// The resolved type of each alias, by name.
  private let resolved: [String: TypeSyntax]

  init(in memberBlock: MemberBlockSyntax) {
    var declared: [String: TypeSyntax] = [:]
    for member in memberBlock.members {
      guard let alias = member.decl.as(TypeAliasDeclSyntax.self), alias.genericParameterClause == nil else {
        continue
      }
      declared[alias.name.text] = alias.initializer.value
    }
    // Aliases may refer to each other, so each one is resolved through the others. An alias that refers
    // back to itself is invalid Swift, and is left as written after `declared.count` rounds.
    var resolved = declared
    for _ in 0..<declared.count {
      let rewriter = AliasRewriter(aliases: resolved)
      resolved = resolved.mapValues { rewriter.rewrite($0).cast(TypeSyntax.self) }
    }
    self.resolved = resolved.filter { tupleConversion(of: $0.value) != nil }
  }

  /// True when the class body declares no alias that holds a tuple.
  var isEmpty: Bool {
    return resolved.isEmpty
  }

  /// `node` with each reference to an alias that holds a tuple replaced by the aliased type.
  func resolving<Node: SyntaxProtocol>(_ node: Node) -> Node {
    guard !resolved.isEmpty else {
      return node
    }
    return AliasRewriter(aliases: resolved).rewrite(node).cast(Node.self)
  }
}

/// Replaces each type reference to an alias by the aliased type: a bare name (`Pair`) or one qualified
/// with `Self` (`Self.Pair`). A name with generic arguments isn't an alias reference, since the
/// resolved aliases aren't generic.
private final class AliasRewriter: SyntaxRewriter {
  let aliases: [String: TypeSyntax]

  init(aliases: [String: TypeSyntax]) {
    self.aliases = aliases
    super.init(viewMode: .sourceAccurate)
  }

  override func visit(_ node: IdentifierTypeSyntax) -> TypeSyntax {
    guard node.genericArgumentClause == nil, let aliased = aliases[node.name.text] else {
      return TypeSyntax(node)
    }
    return aliased.with(\.leadingTrivia, node.leadingTrivia).with(\.trailingTrivia, node.trailingTrivia)
  }

  override func visit(_ node: MemberTypeSyntax) -> TypeSyntax {
    guard node.baseType.as(IdentifierTypeSyntax.self)?.name.text == "Self",
      node.genericArgumentClause == nil,
      let aliased = aliases[node.name.text]
    else {
      return super.visit(node)
    }
    return aliased.with(\.leadingTrivia, node.leadingTrivia).with(\.trailingTrivia, node.trailingTrivia)
  }
}
