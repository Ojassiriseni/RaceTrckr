import { type DefaultRouterOptions, type NavigationAction, type NavigationState, type Router, RouterActionHandling, type RouterActionResult, type RouterConfigOptions, type RouterFactory } from './types';
export type RouterExtensionContext<State extends NavigationState, Action extends NavigationAction, Options extends DefaultRouterOptions> = {
    /**
     * The router being extended. Delegate to it or return `RouterActionHandling.Delegate` for
     * everything the extension does not handle. It is typed for the extended state and actions;
     * actions it does not recognize return `RouterActionHandling.Unhandled`. Use `isActionHandled`
     * to detect whether the router handled the action.
     */
    baseRouter: Router<State, Action> & {
        /**
         * `config` defaults to the config of the action being reduced.
         */
        getStateForAction(state: State, action: Action, config?: RouterConfigOptions): RouterActionResult<State> | RouterActionHandling.Unhandled;
    };
    /**
     * The options the navigator passed to the router factory.
     */
    options: Options;
    /**
     * Mints the next route key for the state being reduced or focused. `routeKeySeq` is tracked for
     * you and stamped onto the returned state.
     */
    nextKey(name: string): string;
};
export type RouterExtensionOptions<State extends NavigationState> = {
    /**
     * The router's `type`, also stamped onto the states it focuses or reduces. Defaults to the base
     * router's type.
     */
    type?: NonNullable<State['type']>;
};
/**
 * The router members an `extendRouter` extension returns. Its `getStateForAction` may also return
 * `RouterActionHandling.Delegate` to let the base router handle the action.
 */
export type RouterExtensionMembers<State extends NavigationState, Action extends NavigationAction> = Omit<Router<State, Action>, 'getStateForAction'> & {
    getStateForAction(state: State, action: Action, options: RouterConfigOptions): RouterActionResult<State> | RouterActionHandling | null;
};
/**
 * Returns the router members to merge over the base router. Members that are left out are
 * inherited from the base router, including `actionCreators`: return a merged object to add
 * action creators instead of replacing them. An inherited `normalizeState` runs on the extended
 * state type, so an extension that changes the state type returns its own unless the base's fits.
 */
export type RouterExtension<State extends NavigationState, Action extends NavigationAction, Options extends DefaultRouterOptions> = (context: RouterExtensionContext<State, Action, Options>) => Partial<RouterExtensionMembers<State, Action>>;
/**
 * The router that a factory from `extendRouter` or `extendRouterActions` creates. Its
 * `getStateForAction` returns `RouterActionHandling.Unhandled`, never `null`, for an action that
 * it does not handle.
 */
export type ExtendedRouter<State extends NavigationState, Action extends NavigationAction> = Omit<Router<State, Action>, 'getStateForAction'> & {
    getStateForAction(state: State, action: Action, options: RouterConfigOptions): RouterActionResult<State> | RouterActionHandling.Unhandled;
};
/**
 * Creates a router factory that merges the members returned by `extension` over the router
 * created by `base`.
 *
 * Annotate the extension's context or return type to change the state, action, or options types.
 *
 * @example
 * ```ts
 * const Router = extendRouter(StackRouter, ({ baseRouter }) => ({
 *   getStateForRouteFocus: (state, key) => { ... },
 * }));
 * ```
 */
export declare function extendRouter<BaseState extends NavigationState, BaseAction extends NavigationAction, BaseOptions extends DefaultRouterOptions, State extends NavigationState = BaseState, Action extends NavigationAction = BaseAction, Options extends BaseOptions = BaseOptions>(base: RouterFactory<BaseState, BaseAction, BaseOptions>, extension: RouterExtension<State, Action, Options>, { type: extendedType }?: RouterExtensionOptions<State>): (options: Options) => ExtendedRouter<State, Action>;
export type RouterActionContext<State extends NavigationState, Action extends NavigationAction, Options extends DefaultRouterOptions> = RouterConfigOptions & Pick<RouterExtensionContext<State, Action, Options>, 'baseRouter' | 'options' | 'nextKey'>;
/**
 * Reduces one action. Return a result to handle the action, `RouterActionHandling.Delegate` to
 * let the base router handle it, or `RouterActionHandling.Unhandled` to leave it unhandled.
 */
export type RouterActionReducer<State extends NavigationState, Action extends NavigationAction, Options extends DefaultRouterOptions> = (state: State, action: Action, context: RouterActionContext<State, Action, Options>) => RouterActionResult<State> | RouterActionHandling | null | undefined;
/**
 * Creates a router factory whose `getStateForAction` runs `reducer` before the base router.
 * Every other router member, including `shouldActionChangeFocus`, is inherited; use
 * `extendRouter` to change those.
 *
 * Annotate the reducer's `action` or `context` parameter to add action types or widen the
 * router options.
 *
 * @example
 * ```ts
 * const Router = extendRouterActions(StackRouter, (state, action: StackAction | ClearAction, { nextKey }) => {
 *   if (action.type !== 'CLEAR') {
 *     return RouterActionHandling.Delegate;
 *   }
 *   const route = { key: nextKey('index'), name: 'index' };
 *   return { state: { ...state, index: 0, routes: [route] }, affectedRouteKey: route.key };
 * });
 * ```
 */
export declare function extendRouterActions<State extends NavigationState, BaseAction extends NavigationAction, BaseOptions extends DefaultRouterOptions, Action extends NavigationAction = BaseAction, Options extends BaseOptions = BaseOptions>(base: RouterFactory<State, BaseAction, BaseOptions>, reducer: RouterActionReducer<State, Action, Options>): (options: Options) => ExtendedRouter<State, Action>;
