import SwiftSyntax
import SwiftSyntaxMacros

/// A macro that the plugin provides, with the attribute name and the extension conformances of its
/// declaration in `expo-modules-core`.
struct ProvidedMacro {
  let name: String
  let type: Macro.Type
  var conformances: [TypeSyntax] = []

  /// Every macro of the plugin. The compiler gets the types from `providingMacros`, and `expand`
  /// matches the attributes by name and passes the same conformances as the compiler, so both read
  /// this list.
  static var all: [ProvidedMacro] {
    [
      ProvidedMacro(name: "OptimizedFunction", type: OptimizedFunctionAttachedMacro.self),
      ProvidedMacro(name: "JS", type: JSMacro.self),
      ProvidedMacro(name: "Event", type: EventMacro.self),
      ProvidedMacro(name: "ExpoModule", type: ExpoModuleMacro.self, conformances: ["AnyModule"]),
      ProvidedMacro(name: "SharedObject", type: SharedObjectMacro.self),
      ProvidedMacro(name: "Record", type: RecordMacro.self, conformances: ["Record"]),
      ProvidedMacro(
        name: "Union",
        type: UnionMacro.self,
        conformances: ["JavaScriptDecodable", "JavaScriptEncodable"]
      ),
      ProvidedMacro(name: "ViewProps", type: ViewPropsMacro.self, conformances: ["AnyViewProps"]),
      ProvidedMacro(name: "ExpoView", type: ExpoViewMacro.self),
    ]
  }
}
