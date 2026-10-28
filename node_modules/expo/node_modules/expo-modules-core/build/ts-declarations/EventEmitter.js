/**
 * Base type of the events map, whose keys represent supported event names
 * and values are the signatures of the listener for that specific event.
 */ /**
 * A class that provides a consistent API for emitting and listening to events.
 * It shares many concepts with other emitter APIs, such as Node's EventEmitter and `fbemitter`.
 * When the event is emitted, all of the functions attached to that specific event are called *synchronously*.
 * Any values returned by the called listeners are *ignored* and discarded.
 * Its implementation is written in C++ and common for all the platforms.
 */ export { };

//# sourceMappingURL=EventEmitter.js.map
