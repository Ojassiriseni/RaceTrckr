import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros

/// Member macro applied to a `SharedObject` subclass, direct or not (a `SharedRef<T>` subclass too).
/// Scans the class body for declarations marked with `@JS` and binds them directly through overrides of
/// the `SharedObject` hooks core calls when it builds the JavaScript class. The class's JavaScript name
/// is emitted as a `_jsName` override.
///
///   @SharedObject
///   final class Cache: SharedObject {
///     @JS
///     init(name: String) { self.name = name }
///
///     @JS
///     func get(_ key: String) -> String? { ... }
///
///     @JS
///     var size: Int { 42 }
///   }
///
/// The companion `@ExpoModule(classes: [Cache.self])` registers the class with the module, which
/// exposes it in its JavaScript object.
public struct SharedObjectMacro: MemberMacro {
  public static func expansion(
    of node: AttributeSyntax,
    providingMembersOf declaration: some DeclGroupSyntax,
    conformingTo protocols: [TypeSyntax],
    in context: some MacroExpansionContext
  ) throws -> [DeclSyntax] {
    guard let classDecl = declaration.as(ClassDeclSyntax.self) else {
      throw MacroExpansionErrorMessage("@SharedObject can only be applied to a class")
    }

    // The superclass isn't checked here: the macro sees only this declaration, so it can't tell an
    // indirect subclass (`class Thumbnail: ImageRef`) from an unrelated class. The compiler reports a
    // class that isn't a `SharedObject` subclass on the `_jsName` override, which is always emitted.
    let typeName = classDecl.name.text
    let jsName = jsNameArgument(of: node) ?? withoutBackticks(typeName)

    // `@JS func`s/`var`s and the `@JS init` are bound directly into the shared object's JS object by
    // the synthesized `_decorateSharedObject(prototype:)` / `_decorateSharedObject(constructor:)` / `_constructSharedObject`.
    //
    // Members split by the `static`/`class` modifier onto two different JS objects: instance members
    // decorate the prototype (receiver recovered from JS `this`), static members decorate the
    // constructor (called on the metatype). A JS instance and static member may share a name without
    // colliding: they live on different objects.
    var instanceFunctions: [JSFunction] = []
    var instanceProperties: [JSProperty] = []
    var staticFunctions: [JSFunction] = []
    var staticProperties: [JSProperty] = []
    var constructor: JSConstructor?
    var assertions: [MemberConformanceAssertion] = []
    let aliases = TupleTypeAliases(in: classDecl.memberBlock)

    for member in classDecl.memberBlock.members {
      // The types of a `@JS` member are read with the class's tuple aliases resolved.
      let decl = aliases.resolving(member.decl)
      if memberHasJSAttribute(decl), let assertion = jsConformanceAssertionBody(for: decl) {
        assertions.append(assertion)
      }

      if let initDecl = decl.as(InitializerDeclSyntax.self),
        initDecl.attributes.firstAttribute(named: "JS") != nil
      {
        if constructor != nil {
          throw MacroExpansionErrorMessage(
            "@SharedObject classes can have at most one @JS initializer; JavaScript classes have a single constructor."
          )
        }
        constructor = JSConstructor(initDecl: initDecl)
        continue
      }

      if let funcDecl = decl.as(FunctionDeclSyntax.self),
        let attribute = funcDecl.attributes.firstAttribute(named: "JS")
      {
        let function = JSFunction(funcDecl: funcDecl, attribute: attribute)
        let bound = [function] + (function.asyncVariant.map { [$0] } ?? [])
        if isTypeLevel(funcDecl.modifiers) {
          staticFunctions.append(contentsOf: bound)
        } else {
          instanceFunctions.append(contentsOf: bound)
        }
        continue
      }

      if let varDecl = decl.as(VariableDeclSyntax.self),
        let attribute = varDecl.attributes.firstAttribute(named: "JS")
      {
        let collected = collectProperties(varDecl: varDecl, attribute: attribute)
        if isTypeLevel(varDecl.modifiers) {
          staticProperties.append(contentsOf: collected)
        } else {
          instanceProperties.append(contentsOf: collected)
        }
      }
    }

    diagnoseJSNameCollisions(functions: instanceFunctions, properties: instanceProperties, in: context)
    diagnoseJSNameCollisions(functions: staticFunctions, properties: staticProperties, in: context)

    // The resolved JS class name, read by core when it builds the class. An `override` of the
    // `SharedObject` class property, so core reads it through the concrete type's metatype.
    var emitted: [DeclSyntax] = [
      "public override class var _jsName: String { \"\(raw: jsName)\" }"
    ]

    // Direct JSI binding, split by which JS object each member decorates:
    // `_decorateSharedObject(prototype:)` binds instance `@JS func`/`var`s (unwrapping the per-call receiver from
    // `this`); `_decorateSharedObject(constructor:)` binds `static`/`class` ones (called on the metatype); and
    // `_constructSharedObject` builds an instance from the `@JS init` arguments. Each is emitted only
    // when it has something to bind.
    if !instanceFunctions.isEmpty || !instanceProperties.isEmpty {
      emitted.append(
        buildDecorateSharedObjectPhase(
          phase: .prototype,
          functions: instanceFunctions,
          properties: instanceProperties,
          typeName: typeName
        )
      )
    }
    if !staticFunctions.isEmpty || !staticProperties.isEmpty {
      emitted.append(
        buildDecorateSharedObjectPhase(
          phase: .constructor,
          functions: staticFunctions,
          properties: staticProperties,
          typeName: typeName
        )
      )
    }
    if let constructor {
      emitted.append(constructor.buildConstructor(typeName: typeName))
    }

    // The conformance assertions of the `@JS` members, which `@JS` leaves to this macro (see
    // `jsConformanceAssertionBody`).
    if let assertion = classConformanceAssertions(assertions) {
      emitted.append(assertion)
    }

    return emitted
  }
}

extension SharedObjectMacro: MemberAttributeMacro {
  public static func expansion(
    of node: AttributeSyntax,
    attachedTo declaration: some DeclGroupSyntax,
    providingAttributesFor member: some DeclSyntaxProtocol,
    in context: some MacroExpansionContext
  ) throws -> [AttributeSyntax] {
    // `@Event(sync: true)` members are stamped alongside `@JS` ones: a sync event dispatches
    // inline, so the isolation forces its call site onto the JS thread. Async events (the
    // default) stay unstamped — their `emit` schedules onto the JS thread itself.
    guard memberHasJSAttribute(member) || isSyncEventMember(member) else {
      return []
    }
    // `@JS(.concurrent)` opts the member out of the JS-thread stamp and onto the concurrent pool.
    if isConcurrentJSMember(member) {
      return ["@concurrent"]
    }
    guard shouldStampJavaScriptActor(on: member, enclosedBy: declaration) else {
      return []
    }
    return ["@JavaScriptActor"]
  }
}
