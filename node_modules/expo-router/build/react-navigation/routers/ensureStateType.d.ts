type ExistingStateType<State> = State extends {
    type?: infer Type extends string;
} ? NonNullable<Type> : never;
type StateWithType<State extends object, Type extends string> = State & {
    type: ExistingStateType<State> | Type;
};
export declare function ensureStateType<State extends object, Type extends string>(state: State & {
    type?: string;
}, type: Type): StateWithType<State, Type>;
export {};
