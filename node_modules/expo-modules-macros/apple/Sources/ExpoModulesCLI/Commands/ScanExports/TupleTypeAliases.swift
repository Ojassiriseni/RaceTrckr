import SwiftSyntax

/// The type aliases declared in the body of an `@ExpoModule` or `@SharedObject` class whose aliased type
/// holds a tuple, resolved to that type. Mirrors `TupleTypeAliases` in the macros, which resolve these
/// aliases in the `@JS` members the class binds, so that a member typed with such an alias reports the
/// tuple it converts as instead of an unresolvable ref.
///
/// Like the macros, it reads only the class body: an alias declared anywhere else stays a ref. A generic
/// alias isn't resolved, and neither is an alias in an `@Event` payload, which `@Event` converts on its
/// own.
struct TupleTypeAliases {
  /// The resolved type of each alias, by name.
  private let resolved: [String: TypeNode]

  /// Collects the aliases in `members`, the body of the type named `scope`. A tuple alias keeps its name
  /// qualified with `scope`, like the other declarations in the scan, so a consumer can name the type it
  /// stands for.
  init(in members: MemberBlockItemListSyntax, scope: String) {
    var declared: [String: TypeNode] = [:]
    for member in members {
      guard let alias = member.decl.as(TypeAliasDeclSyntax.self), alias.genericParameterClause == nil else {
        continue
      }
      let name = alias.name.text
      declared[name] = typeNode(from: alias.initializer.value).named("\(scope).\(name)")
    }
    // Aliases may refer to each other, so each one is resolved through the others. An alias that refers
    // back to itself is invalid Swift, and is left as written after `declared.count` rounds.
    var resolved = declared
    for _ in 0..<declared.count {
      resolved = resolved.mapValues { $0.replacingAliases(resolved) }
    }
    self.resolved = resolved.filter { $0.value.holdsTuple }
  }

  /// `node` with each ref to an alias that holds a tuple replaced by the aliased type.
  func resolving(_ node: TypeNode) -> TypeNode {
    guard !resolved.isEmpty else {
      return node
    }
    return node.replacingAliases(resolved)
  }

  func resolving(_ function: ExportedFunction) -> ExportedFunction {
    var resolvedFunction = function
    resolvedFunction.parameters = function.parameters.map(resolving)
    resolvedFunction.returns = function.returns.map(resolving)
    return resolvedFunction
  }

  func resolving(_ property: ExportedProperty) -> ExportedProperty {
    var resolvedProperty = property
    resolvedProperty.type = property.type.map(resolving)
    return resolvedProperty
  }

  func resolving(_ parameter: ExportedParameter) -> ExportedParameter {
    var resolvedParameter = parameter
    resolvedParameter.type = resolving(parameter.type)
    return resolvedParameter
  }
}

extension TypeNode {
  /// This node with each ref named in `aliases`, bare (`Span`) or qualified with `Self` (`Self.Span`),
  /// replaced by the aliased type.
  fileprivate func replacingAliases(_ aliases: [String: TypeNode]) -> TypeNode {
    switch self {
    case .primitive, .unknown, .sharedRef:
      return self
    case .ref(let name, _, _):
      let unqualified = name.hasPrefix("Self.") ? String(name.dropFirst("Self.".count)) : name
      return aliases[unqualified] ?? self
    case .optional(let wrapped):
      return .optional(wrapped: wrapped.replacingAliases(aliases))
    case .array(let element):
      return .array(element: element.replacingAliases(aliases))
    case .dictionary(let key, let value):
      return .dictionary(key: key.replacingAliases(aliases), value: value.replacingAliases(aliases))
    case .promise(let value):
      return .promise(value: value.replacingAliases(aliases))
    case .tuple(let elements, let name):
      return .tuple(elements: elements.map { $0.replacingAliases(aliases) }, name: name)
    case .object(let properties, let name):
      return .object(
        properties: properties.map { TypeNodeProperty(name: $0.name, type: $0.type.replacingAliases(aliases)) },
        name: name
      )
    case .function(let parameters, let returns, let isAsync, let isThrowing):
      return .function(
        parameters: parameters.map { $0.replacingAliases(aliases) },
        returns: returns?.replacingAliases(aliases),
        isAsync: isAsync,
        isThrowing: isThrowing
      )
    }
  }

  /// This node named `name` when it's a tuple or an object, which an alias names. Any other node, such as
  /// an array of tuples, is returned as it is: its elements carry the names of their own aliases.
  fileprivate func named(_ name: String) -> TypeNode {
    switch self {
    case .tuple(let elements, _):
      return .tuple(elements: elements, name: name)
    case .object(let properties, _):
      return .object(properties: properties, name: name)
    default:
      return self
    }
  }

  /// True for a type the macros convert through the tuple methods: a tuple (`.tuple`, or `.object` for a
  /// labeled one), or an optional, array or `String`-keyed dictionary that holds one.
  fileprivate var holdsTuple: Bool {
    switch self {
    case .tuple, .object:
      return true
    case .optional(let inner), .array(let inner):
      return inner.holdsTuple
    case .dictionary(.primitive("String", _), let value):
      return value.holdsTuple
    default:
      return false
    }
  }
}
