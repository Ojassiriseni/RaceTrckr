import SwiftSyntax
import SwiftSyntaxBuilder

/// The protocol of the 1.0 dynamic-type API (`getDynamicType()`). `@Event` asserts payload types
/// against it.
internal let jsConvertibleProtocolName = "AnyArgument"

/// The constraint a `@JS` boundary type must satisfy, by direction: an argument (and a settable
/// property's incoming value) is decoded, so it must be `JavaScriptDecodable`; a return value (and a
/// property's outgoing value) is encoded, so it must be `JavaScriptEncodable`. Asserting each
/// direction on its own keeps a decode-only or encode-only type from being over-constrained, and
/// surfaces a missing conformance as a clear "requires that '…' conform to …" diagnostic on the
/// member instead of an opaque error inside the generated closure.
internal let javaScriptDecodableProtocolName = "JavaScriptDecodable"
internal let javaScriptEncodableProtocolName = "JavaScriptEncodable"

/// The constraint a `@Record` property type and a `@Union` case payload type must satisfy. A record
/// decodes and encodes each property, and a union decodes by trying each payload's `decode` and
/// encodes through the matching payload's `encode`, so both convert in both directions.
internal let javaScriptCodableProtocolName = "JavaScriptDecodable & JavaScriptEncodable"

/// The protocol a type must conform to for `self.emit(event:…)` to resolve; core conforms
/// `BaseModule` and `SharedObject` to it. Asserted by `@Event` so attaching it to a type that can't
/// emit fails with a conformance diagnostic instead of an opaque "no member 'emit'" error.
internal let eventEmitterProtocolName = "EventEmitter"

/// Types we never assert because they're statically known to conform: the JS primitives. Asserting
/// them would only add noise to the expansion. `isKnownConforming` extends this to the containers built
/// from them.
private let knownConformingPrimitives: Set<String> = ["Bool", "Int", "Double", "String"]

/// One member's worth of conformance assertion: a name (the member it stands for) and the declared
/// types crossing the JS boundary for it. The name surfaces verbatim in the compiler's conformance
/// diagnostic ("local function '<name>' requires that '<Type>' conform to …"), so it identifies the
/// offending member in the error message on top of the location pointing at the user's declaration.
internal struct ConformanceAssertion {
  let name: String
  /// Declared types as written. Composed types (`[Int]`, `String?`, …) are kept verbatim — their
  /// conditional conformances transitively constrain the elements.
  let types: [String]
}

/// One type crossing the boundary for a member, as a parameter of the member's assertion helper: the
/// type as written, the protocol it must conform to for the direction it travels, and the argument label
/// it's passed under.
internal struct AssertedType {
  /// The argument label, or `nil` for an unlabeled parameter.
  let label: String?
  /// The type as written.
  let type: String
  /// `JavaScriptDecodable` for a type decoded from JavaScript, `JavaScriptEncodable` for one encoded to it.
  let constraint: String
}

/// A directional conformance-assertion peer for a `@JS` member: a never-called `private func` whose
/// body asserts that each argument type is `JavaScriptDecodable` and the return or getter type is
/// `JavaScriptEncodable`, matching how the generated binding converts each (decode on the way in,
/// encode on the way out). The body is a local helper named after the member, with one opaque metatype
/// parameter per asserted type, called once with every type's metatype (see
/// `memberConformanceAssertion`). Naming the helper after the member and its labels puts the member in
/// the compiler's diagnostic, and the per-parameter constraint reports the offending type against the
/// protocol for its direction.
///
/// Returns `nil` when every type is known to conform, so the caller emits no peer. `isStatic` mirrors a
/// `static`/`class` member so the peer sits in the right metatype context.
internal func directionalConformanceAssertion(name: String, types: [AssertedType], isStatic: Bool) -> DeclSyntax? {
  guard let assertion = memberConformanceAssertion(name: name, types: types) else {
    return nil
  }
  let staticKeyword = isStatic ? "static " : ""
  let peerName = derivedIdentifier(from: name, prefix: "_assertTypesConformance_")
  return """
    private \(raw: staticKeyword)func \(raw: peerName)() {
    \(raw: assertion.helper)
    \(raw: assertion.call)
    }
    """
}

/// The local helper of a member's conformance assertion and its call, or `nil` when every type is known
/// to conform. The helper is named after the member and takes the labels of the types, so the
/// diagnostic reads like the member's signature, such as `local function 'move(_:by:returning:)'
/// requires that 'Point' conform to 'JavaScriptEncodable'`. A type that holds a tuple contributes the
/// types in it (see `distinctAssertableTypes`), under its label. Every parameter suppresses `Copyable`,
/// so a non-copyable boundary type such as `JavaScriptValue` can fill it.
internal func memberConformanceAssertion(name: String, types: [AssertedType]) -> MemberConformanceAssertion? {
  var seen: Set<String> = []
  var parameters: [AssertedType] = []
  for asserted in types {
    for type in distinctAssertableTypes([asserted.type], constraint: asserted.constraint) {
      let key = "\(asserted.label ?? "_") \(type) \(asserted.constraint)"
      if seen.insert(key).inserted {
        parameters.append(AssertedType(label: asserted.label, type: type, constraint: asserted.constraint))
      }
    }
  }
  guard !parameters.isEmpty else {
    return nil
  }
  let declared = parameters.map { parameter in
    let metatype = "(some \(parameter.constraint) & ~Copyable).Type"
    return parameter.label.map { "\($0) _: \(metatype)" } ?? "_: \(metatype)"
  }
  let passed = parameters.map { parameter in
    return parameter.label.map { "\($0): \(parameter.type).self" } ?? "\(parameter.type).self"
  }
  let labels = parameters.map { "\($0.label ?? "_"):" }.joined()
  return MemberConformanceAssertion(
    signature: "\(name)(\(labels))",
    helper: "func \(name)(\(declared.joined(separator: ", "))) {}",
    call: "\(name)(\(passed.joined(separator: ", ")))"
  )
}

/// One conformance-assertion peer covering several members' assertions at once — used by `@Record`,
/// which folds every property into a single `_assertTypesConformance()` rather than emitting a peer
/// per property. Each assertion keeps its own named nested helper, so the per-member naming in the
/// diagnostic is preserved even though they share one peer.
///
/// Returns `nil` when no assertion has anything left to verify (all known to conform / empty), so the
/// caller emits nothing.
internal func typeConformanceAssertions(
  for assertions: [ConformanceAssertion],
  constraint: String
) -> DeclSyntax? {
  let bodies = assertions.compactMap { conformanceAssertionBody($0, constraint: constraint) }
  guard !bodies.isEmpty else {
    return nil
  }
  return """
    private func _assertTypesConformance() {
    \(raw: bodies.joined(separator: "\n"))
    }
    """
}

/// The type to assert against `constraint` for a boundary type as written, or `nil` when nothing needs
/// asserting: an exactly-free-form type (converted through the `JavaScriptValue` free-form methods) and
/// a type known to conform (see `isKnownConforming`) both return `nil`; everything else is unwrapped of
/// trailing optionals and asserted. Shared with `@Event`, where an *optional* free-form type
/// (`[String: Any]?`) is kept and asserted for a clean diagnostic. `@JS` leaves out every type that
/// mentions `Any` before it gets here.
internal func assertableBoundaryType(_ type: String, constraint: String) -> String? {
  guard !isFreeFormBoundaryType(type) else {
    return nil
  }
  guard !isKnownConforming(TypeSyntax(stringLiteral: type), setsConform: setsConform(to: constraint)) else {
    return nil
  }
  return unwrappedOptional(type)
}

/// True when `type` is known to conform without an assertion: a JS primitive, or an optional, array,
/// `String`-keyed dictionary or set of such a type, at any depth (`[[Int]]`, `[String: [Double]]?`,
/// `Set<String>`). Each of these containers conforms whenever its element does. A set counts only when
/// `setsConform` is true. Anything else, such as a dictionary with another key type, returns `false`.
private func isKnownConforming(_ type: TypeSyntax, setsConform: Bool) -> Bool {
  if let identifier = type.as(IdentifierTypeSyntax.self), identifier.genericArgumentClause == nil {
    return knownConformingPrimitives.contains(identifier.name.text)
  }
  if let element = optionalWrappedType(type) ?? arrayElementType(type) ?? stringKeyedDictionaryValueType(type) {
    return isKnownConforming(element, setsConform: setsConform)
  }
  if setsConform, let element = setElementType(type) {
    return isKnownConforming(element, setsConform: setsConform)
  }
  return false
}

/// True when `Set` conforms to `constraint`. Core conforms it to the JS codable protocols but not to
/// `AnyArgument`.
private func setsConform(to constraint: String) -> Bool {
  return !constraint.split(separator: "&").contains { protocolName in
    protocolName.filter { !$0.isWhitespace } == jsConvertibleProtocolName
  }
}

/// The assertion's body fragment: a nested helper named after the member, plus one call per distinct
/// type that needs an assertion. Nesting the helper keeps the constraint entirely local — no shared
/// symbol, nothing to collide, nothing left in the type's namespace — and naming it after the member
/// puts the member's name in the compiler's conformance diagnostic. Returns `nil` when every type was
/// known to conform or the list was empty.
private func conformanceAssertionBody(
  _ assertion: ConformanceAssertion,
  constraint: String
) -> String? {
  let distinct = distinctAssertableTypes(assertion.types, constraint: constraint)
  guard !distinct.isEmpty else {
    return nil
  }

  var lines = ["func \(assertion.name)(\(opaqueMetatypeParameter(constraint: constraint))) {}"]
  lines.append(contentsOf: distinct.map { "\(assertion.name)(\($0).self)" })
  return lines.joined(separator: "\n")
}

/// An unlabeled parameter that takes the metatype of any type satisfying `constraint`, for an
/// assertion helper.
internal func opaqueMetatypeParameter(constraint: String) -> String {
  // A named generic parameter would shadow a generic parameter of the same name on an enclosing
  // type, which is an error. An opaque parameter declares no name.
  return "_: (some \(constraint)).Type"
}

/// The distinct types to assert against `constraint` from a list, mapping each through
/// `assertableBoundaryType` (which drops what needs no assertion) and deduping in first-seen order. A
/// type that holds a tuple converts element by element (see `TupleConversion`), so the types in it that
/// convert through their own `decode` / `encode` are asserted in its place.
internal func distinctAssertableTypes(_ types: [String], constraint: String) -> [String] {
  var seen: Set<String> = []
  var distinct: [String] = []
  let assertable = types.flatMap { type in
    let elementTypes = tupleConversion(of: type)?.conformingTypes ?? [type]
    return elementTypes.compactMap { assertableBoundaryType($0, constraint: constraint) }
  }
  for type in assertable where seen.insert(type).inserted {
    distinct.append(type)
  }
  return distinct
}

/// Strips every trailing optional marker (`?`/`!`) so the assertion targets the core wrapped type.
/// `Optional<W>: AnyArgument` holds exactly when `W: AnyArgument` (and `T!` is just `T?`), so each
/// layer is conformance-equivalent to its wrapped type. Asserting the core gives a cleaner diagnostic
/// (the direct `requires that '<type>' conform`, not the conditional-conformance phrasing through
/// `Optional`) and sidesteps that `T!.self` is invalid in metatype position. Only *trailing* markers
/// are stripped, so `[Int?]` keeps its inner `?`; a longhand `Optional<W>` isn't peeled but is still
/// asserted whole, which remains correct.
private func unwrappedOptional(_ type: String) -> String {
  var result = Substring(type)
  while result.hasSuffix("?") || result.hasSuffix("!") {
    result = result.dropLast()
  }
  return String(result)
}

/// The conformance assertion of one member: a local helper function named after the member, which takes
/// the metatype of each asserted type, and its call.
internal struct MemberConformanceAssertion {
  /// The helper's full name with its argument labels, such as `load(_:)`.
  let signature: String
  /// The helper's declaration.
  let helper: String
  /// The call of the helper with each asserted type's metatype.
  let call: String
}

/// One assertion member covering the `@JS` members of an `@ExpoModule` or `@SharedObject` class, which
/// the class macro emits in place of the `@JS` peers: each member's helper and its call, in member order.
/// The helpers are local functions, so two helpers with the same name and labels (members that differ
/// only by argument types) would redeclare the same function: such a helper sits in its own `do` block.
/// Returns `nil` when no member has a type to assert.
internal func classConformanceAssertions(_ assertions: [MemberConformanceAssertion]) -> DeclSyntax? {
  guard !assertions.isEmpty else {
    return nil
  }
  var signatureCounts: [String: Int] = [:]
  for assertion in assertions {
    signatureCounts[assertion.signature, default: 0] += 1
  }
  let lines = assertions.flatMap { assertion in
    guard signatureCounts[assertion.signature, default: 0] > 1 else {
      return [assertion.helper, assertion.call]
    }
    return ["do {", "  \(assertion.helper)", "  \(assertion.call)", "}"]
  }
  return """
    private func _assertTypesConformance() {
    \(raw: lines.joined(separator: "\n"))
    }
    """
}
