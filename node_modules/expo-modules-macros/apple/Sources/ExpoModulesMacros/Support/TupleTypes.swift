import SwiftSyntax

/// Recognition of boundary types that hold a tuple, and the conversions the macros emit for them. A
/// tuple can't conform to a protocol, so neither it nor an array, optional or dictionary of tuples can
/// convert through the usual `T.decode` / `T.encode` path. Such a type converts through the
/// `JavaScriptValue` tuple and container methods instead, which take one closure per element, so the
/// conversion follows the structure of the type: a tuple, optional, array or `String`-keyed dictionary
/// that holds a tuple converts through the matching method, and every other type in it through its own
/// `decode` / `encode`.
///
/// An unlabeled tuple maps to a JavaScript array with one value per element, and a labeled tuple to an
/// object with one property per label. Recognized are tuples of two or more elements where either every
/// element is labeled or none is. `TypeConformanceAssertion` asserts the types that convert through
/// their own `decode` / `encode` (see `conformingTypes`) in place of the whole type.
internal enum TupleConversion {
  /// A type that holds no tuple, which converts through its own `decode` / `encode`.
  case conforming(type: String)
  /// A tuple: the conversion of each element, with one label per element for a labeled tuple.
  case tuple(elements: [TupleConversion], labels: [String]?)
  /// An optional of a type that holds a tuple.
  indirect case optional(wrapped: TupleConversion)
  /// An array of a type that holds a tuple.
  indirect case array(element: TupleConversion)
  /// A `String`-keyed dictionary whose values hold a tuple.
  indirect case dictionary(value: TupleConversion)

  /// The decode expression, as it appears after `try`, for a value read from `valueExpression` (a
  /// `JavaScriptUnownedValue`). A tuple whose elements all conform passes the element types; any other
  /// tuple and every container pass closures, which take the value and the runtime as parameters that
  /// shadow the outer ones, so a closure captures nothing.
  func decodeExpression(of valueExpression: String) -> String {
    switch self {
    case .conforming(let type):
      return "\(expressionType(type)).decode(\(valueExpression), in: runtime)"
    case .tuple(let elements, let labels):
      if let types = conformingElementTypes(elements) {
        let metatypes = types.map { "\(expressionType($0)).self" }.joined(separator: ", ")
        let arguments = [valueExpression] + labelsArgument(labels) + ["as: \(metatypes)", "in: runtime"]
        return "JavaScriptValue.decodeTuple(\(arguments.joined(separator: ", ")))"
      }
      let closures = elements.map { elementClosure(returning: $0.decodeExpression(of: "value")) }
      let arguments = [valueExpression] + labelsArgument(labels) + ["in: runtime"] + closures
      return "JavaScriptValue.decodeTuple(\(arguments.joined(separator: ", ")))"
    case .optional(let wrapped):
      return containerDecode("decodeOptional", label: "wrapped", inner: wrapped, of: valueExpression)
    case .array(let element):
      return containerDecode("decodeArray", label: "element", inner: element, of: valueExpression)
    case .dictionary(let value):
      return containerDecode("decodeDictionary", label: "value", inner: value, of: valueExpression)
    }
  }

  /// The call, as it appears after `try`, that encodes the value `valueExpression` into the slot named
  /// `slot`, in the runtime named `runtime`. A tuple whose elements all conform needs no closures. The
  /// tuple method takes an unlabeled tuple, so a labeled one is coerced to its unlabeled type first.
  func encodeCall(of valueExpression: String, into slot: String, in runtime: String = "runtime") -> String {
    switch self {
    case .conforming(let type):
      return "\(expressionType(type)).encode(\(valueExpression), into: \(slot), in: \(runtime))"
    case .tuple(let elements, let labels):
      let value = labels == nil ? valueExpression : "\(valueExpression) as \(unlabeledType)"
      let closures =
        conformingElementTypes(elements) == nil
        ? elements.map { encoderClosure(encoding: $0.encodeCall(of: "value", into: "slot")) } : []
      let arguments = [value] + labelsArgument(labels) + ["into: \(slot)", "in: \(runtime)"] + closures
      return "JavaScriptValue.encodeTuple(\(arguments.joined(separator: ", ")))"
    case .optional(let wrapped):
      return containerEncode(
        "encodeOptional",
        label: "wrapped",
        inner: wrapped,
        of: valueExpression,
        into: slot,
        in: runtime
      )
    case .array(let element):
      return containerEncode(
        "encodeArray",
        label: "element",
        inner: element,
        of: valueExpression,
        into: slot,
        in: runtime
      )
    case .dictionary(let value):
      return containerEncode(
        "encodeDictionary",
        label: "value",
        inner: value,
        of: valueExpression,
        into: slot,
        in: runtime
      )
    }
  }

  /// The encode expression, as it appears after `try`, that creates a `JavaScriptValue` from the value
  /// `valueExpression`, for a place that has no slot to encode into, such as an async result. A type that
  /// holds a tuple is encoded into the slot of `JavaScriptValue.encoding(in:_:)`.
  func encodeExpression(of valueExpression: String) -> String {
    if case .conforming(let type) = self {
      return "\(expressionType(type)).encode(\(valueExpression), in: runtime)"
    }
    return "JavaScriptValue.encoding(in: runtime) { slot in try \(encodeCall(of: valueExpression, into: "slot")) }"
  }

  /// The JavaScript value kinds the decode accepts, as an expression of type `JavaScriptValueKinds`, for
  /// a `@Union` that picks a payload by kind. Mirrors the kinds of the matching `JavaScriptCodable`
  /// conformances: an array decodes a non-array value as a single element.
  var decodableKindsExpression: String {
    switch self {
    case .conforming(let type):
      return "\(expressionType(type)).decodableKinds"
    case .tuple:
      return "JavaScriptValueKinds.object"
    case .optional(let wrapped):
      return "\(wrapped.decodableKindsExpression).union([.null, .undefined])"
    case .array(let element):
      return "\(element.decodableKindsExpression).union(JavaScriptValueKinds.object)"
    case .dictionary:
      return "JavaScriptValueKinds.object"
    }
  }

  /// The types in the structure that convert through their own `decode` / `encode`, in order, as
  /// written.
  var conformingTypes: [String] {
    switch self {
    case .conforming(let type):
      return [type]
    case .tuple(let elements, _):
      return elements.flatMap(\.conformingTypes)
    case .optional(let inner), .array(let inner), .dictionary(let inner):
      return inner.conformingTypes
    }
  }

  /// The type spelled in expression position, with tuple labels kept for nested tuples.
  private var spelledType: String {
    switch self {
    case .conforming(let type):
      return expressionType(type)
    case .tuple(let elements, let labels):
      let spelled = elements.enumerated().map { index, element in
        labels.map { "\($0[index]): \(element.spelledType)" } ?? element.spelledType
      }
      return "(\(spelled.joined(separator: ", ")))"
    case .optional(let wrapped):
      return "\(wrapped.spelledType)?"
    case .array(let element):
      return "[\(element.spelledType)]"
    case .dictionary(let value):
      return "[String: \(value.spelledType)]"
    }
  }

  /// The type of a tuple with its own labels dropped. Labels of nested tuples are kept, since the
  /// nested conversion handles them.
  private var unlabeledType: String {
    guard case .tuple(let elements, _) = self else {
      return spelledType
    }
    return "(\(elements.map(\.spelledType).joined(separator: ", ")))"
  }

  private func containerDecode(
    _ method: String,
    label: String,
    inner: TupleConversion,
    of valueExpression: String
  ) -> String {
    return
      "JavaScriptValue.\(method)(\(valueExpression), in: runtime, \(label): \(elementClosure(returning: inner.decodeExpression(of: "value"))))"
  }

  private func containerEncode(
    _ method: String,
    label: String,
    inner: TupleConversion,
    of valueExpression: String,
    into slot: String,
    in runtime: String
  ) -> String {
    let closure = encoderClosure(encoding: inner.encodeCall(of: "value", into: "slot"))
    return "JavaScriptValue.\(method)(\(valueExpression), into: \(slot), in: \(runtime), \(label): \(closure))"
  }

  /// The types of a tuple's elements when every element converts through its own `decode` /
  /// `encode`, so the tuple can use the overloads that take no closures; `nil` otherwise.
  private func conformingElementTypes(_ elements: [TupleConversion]) -> [String]? {
    var types: [String] = []
    for element in elements {
      guard case .conforming(let type) = element else {
        return nil
      }
      types.append(type)
    }
    return types
  }

  private func labelsArgument(_ labels: [String]?) -> [String] {
    guard let labels else {
      return []
    }
    return ["labels: [\(labels.map { "\"\($0)\"" }.joined(separator: ", "))]"]
  }
}

/// The conversion for a boundary type that holds a tuple, or `nil` when the type holds no tuple the
/// tuple methods convert (a single parenthesized type, a tuple that labels only some elements, or one
/// with a variadic element converts as it's written, and fails its conformance assertion).
internal func tupleConversion(of type: TypeSyntax) -> TupleConversion? {
  let conversion = structure(of: type)
  guard case .conforming = conversion else {
    return conversion
  }
  return nil
}

/// The conversion for a boundary type written as a string. See `tupleConversion(of:)`.
internal func tupleConversion(of type: String) -> TupleConversion? {
  return tupleConversion(of: TypeSyntax(stringLiteral: type))
}

/// The conversion of `type`, which is `.conforming` when the type holds no recognized tuple.
private func structure(of type: TypeSyntax) -> TupleConversion {
  let conforming = TupleConversion.conforming(type: type.trimmedDescription)
  if let tuple = type.as(TupleTypeSyntax.self) {
    // `(T)` is the same type as `T`.
    if tuple.elements.count == 1, let only = tuple.elements.first, only.firstName == nil {
      return structure(of: only.type)
    }
    guard tuple.elements.count >= 2,
      tuple.elements.allSatisfy({ $0.ellipsis == nil && $0.inoutKeyword == nil })
    else {
      return conforming
    }
    let labels = tuple.elements.compactMap { $0.firstName?.text }
    guard labels.isEmpty || labels.count == tuple.elements.count else {
      return conforming
    }
    return .tuple(elements: tuple.elements.map { structure(of: $0.type) }, labels: labels.isEmpty ? nil : labels)
  }
  let inner: TupleConversion
  let wrap: (TupleConversion) -> TupleConversion
  if let wrapped = optionalWrappedType(type) {
    (inner, wrap) = (structure(of: wrapped), TupleConversion.optional)
  } else if let element = arrayElementType(type) {
    (inner, wrap) = (structure(of: element), TupleConversion.array)
  } else if let value = stringKeyedDictionaryValueType(type) {
    (inner, wrap) = (structure(of: value), TupleConversion.dictionary)
  } else {
    return conforming
  }
  // A container that holds no tuple conforms as a whole.
  if case .conforming = inner {
    return conforming
  }
  return wrap(inner)
}

/// An element closure that returns `expression`, as it appears after `try`. It takes the value and
/// the runtime as parameters, which shadow the outer ones, so it captures nothing.
internal func elementClosure(returning expression: String) -> String {
  return "{ value, runtime in return try \(expression) }"
}

/// An element closure that encodes its value into its slot with `call`, as it appears after `try`. It takes
/// the value, the slot and the runtime as parameters, which shadow the outer ones, so it captures nothing.
internal func encoderClosure(encoding call: String) -> String {
  return "{ value, slot, runtime in try \(call) }"
}
