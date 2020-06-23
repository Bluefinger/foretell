import {
  ARRAY_ERROR,
  STATE,
  IDENTITY,
  THROW_IDENTITY,
  QUEUE_SIZE,
} from "./constants";
import { isFunction, isObject } from "./validate";
import { scheduler } from "./scheduler";
import { extractErrorMsg, logError } from "./utils";

const { isArray } = Array;

let pointer = 0;
let queue: any[] = [];

// To minimise allocations to the queue, both array and non-array
// values are allowed to be added to the queue. This means that
// client arrays can be directly accessed and iterated on instead of
// each client promise being added individually. This results in less
// churn with the queue and thus more performance.
const executeTasks = (tasks: any | any[]): void => {
  // Accessing the protected method here is 'allowed' as this is
  // internal code only. Outside of this scope, this and the method
  // name will be mangled anyway for saving space and obfuscation.
  if (isArray(tasks)) {
    for (let i = 0; i < tasks.length; i += 1) tasks[i].$$Execute$$();
  } else {
    tasks.$$Execute$$();
  }
};

const flushQueue = () => {
  // Loops until the result of length vs pointer equals 0, a
  // falsey value. Then the while loop terminates.
  while (queue.length - pointer) {
    // executeTasks returns void, so acts as a quick setting of `undefined`
    // without needing to do it explicitly, shaving off a few bytes.
    queue[pointer] = executeTasks(queue[pointer]);
    // Pre-increment pointer value before comparison here, allows for
    // smaller build code while still advancing the loop.
    if (++pointer === QUEUE_SIZE) {
      // Slice new state of queue instead of splice to create one single new array
      // with the correct 'view' of queued tasks.
      // This is instead of creating a new array AND mutating the original as
      // with splice. Results in faster ops for shrinking the queue.
      // slice() also requires less arguments and is shorter, so more shaved bytes
      queue = queue.slice(QUEUE_SIZE);
      // Pointer reset to zero to point to start of new queue state.
      pointer = 0;
    }
  }
};

const schedule = scheduler(flushQueue);

const defer = (then: Foretell<any> | Foretell<any>[]) => {
  if (queue.push(then) - pointer === 1) schedule();
};

class Foretell<T> implements PromiseLike<T> {
  private _state?: STATE;
  private _clients?: Foretell<any>[];
  private _value?: T;
  private _handled?: boolean;
  private _parent?: Foretell<any>;
  private _onFulfill?: (arg?: any) => any;
  private _onReject?: (arg?: any) => any;
  public constructor(
    func?: (resolve: (arg?: T) => void, reject: (reason: any) => void) => void
  ) {
    const hasFunc = isFunction(func);
    const me = this;
    me._handled = !hasFunc;
    if (hasFunc) {
      try {
        // hasFunc makes it clear we have a function present, but TS cannot
        // infer here that it is not null/undefined. So we have to assert
        // that it is indeed okay to call it.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        func!(
          (arg?: T) => me.$$Settle$$(STATE.FULFILLED, arg),
          (reason: any) => me.$$Settle$$(STATE.REJECTED, reason)
        );
      } catch (error) {
        me.$$Settle$$(STATE.REJECTED, error);
      }
    } else if (arguments.length) {
      throw new TypeError(`${func} is not a function`);
    }
  }
  public then<TResult = T, TReject = never>(
    onfulfilled?:
      | ((value: T) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TReject | PromiseLike<TReject>)
      | undefined
      | null
  ): Foretell<TResult | TReject> {
    const me = this;
    const then = new Foretell<TResult | TReject>();

    then._parent = me;
    then._onFulfill = isFunction(onfulfilled) ? onfulfilled : IDENTITY;
    then._onReject = isFunction(onrejected) ? onrejected : THROW_IDENTITY;

    me._handled = true;

    if (!me._state) {
      if (!me._clients) {
        me._clients = [then];
      } else {
        me._clients.push(then);
      }
    } else {
      defer(then);
    }

    return then;
  }
  public catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Foretell<T | TResult> {
    return this.then(null, onrejected);
  }
  public finally(onfinally?: (() => any) | undefined | null): Foretell<T> {
    return this.then(onfinally, onfinally);
  }
  protected $$Execute$$(): void {
    const then = this;
    try {
      // $$Execute$$ only is invoked for client promises.
      // So we know there'll be a parent here, so we manually
      // assert it is the case.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parent = then._parent!;
      const nextValue =
        parent._state === STATE.FULFILLED ? then._onFulfill : then._onReject;
      // Client promises have onFulfill and onReject functions, so we can
      // assert that there'll always be a function to call.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      then.$$Resolve$$(nextValue!(parent._value));
    } catch (error) {
      then.$$Settle$$(STATE.REJECTED, error);
    }
  }
  protected $$Settle$$(
    state: STATE.FULFILLED | STATE.REJECTED,
    value: unknown
  ): void {
    const me = this;
    if (!me._state) {
      me._state = state;
      me._value = value as T;
      const clients = me._clients;
      /* istanbul ignore else */
      if (clients) {
        // Simply defer the entire clients queue instead of
        // adding each client promise individually
        defer(clients);
      } else if (
        state === STATE.REJECTED &&
        !Foretell.suppressUncaughtExceptions &&
        !me._handled
      ) {
        /* istanbul ignore next */
        logError(`uncaught exception: ${extractErrorMsg(value)}`);
      }
    }
  }
  protected $$Resolve$$(value: unknown): void {
    const me = this;
    if (me === value) {
      me.$$Settle$$(
        STATE.REJECTED,
        new TypeError("promise and value should not be the same object")
      );
    }
    if (isObject(value) || isFunction(value)) {
      let calledOrThrown = 0;
      try {
        const then = (value as PromiseLike<any>).then;
        if (isFunction(then)) {
          then.call(
            value,
            (arg) => {
              if (!calledOrThrown++) {
                me.$$Resolve$$(arg);
              }
            },
            (reason) => {
              if (!calledOrThrown++) {
                me.$$Settle$$(STATE.REJECTED, reason);
              }
            }
          );
        } else {
          me.$$Settle$$(STATE.FULFILLED, value);
        }
      } catch (error) {
        if (!calledOrThrown) {
          me.$$Settle$$(STATE.REJECTED, error);
        }
      }
    } else {
      me.$$Settle$$(STATE.FULFILLED, value);
    }
  }
  /* istanbul ignore next */
  public static suppressUncaughtExceptions = false;
  public static resolve<U>(arg?: U): Foretell<U> {
    const resolved = new Foretell<U>();
    resolved.$$Settle$$(STATE.FULFILLED, arg);
    return resolved;
  }
  public static reject<U = never>(error?: U): Foretell<U> {
    const rejected = new Foretell<U>();
    rejected.$$Settle$$(STATE.REJECTED, error);
    return rejected;
  }
  public static all(promises: PromiseLike<any>[]): Foretell<any[]> {
    const all = new Foretell<any[]>();
    const reject = (e: any) => all.$$Settle$$(STATE.REJECTED, e);
    if (isArray(promises)) {
      const results: any[] = [];
      const pLen = promises.length;
      if (!pLen) {
        all.$$Settle$$(STATE.FULFILLED, results);
      } else {
        let rc = 0;
        results.length = pLen;
        for (let n = 0; n < pLen; n += 1) {
          const promise = promises[n];
          if (promise && isFunction(promise.then)) {
            promise.then((arg: any) => {
              results[n] = arg;
              if (++rc === pLen) all.$$Settle$$(STATE.FULFILLED, results);
            }, reject);
          } else {
            results[n] = promise;
            if (++rc === pLen) all.$$Settle$$(STATE.FULFILLED, results);
          }
        }
      }
    } else {
      reject(ARRAY_ERROR(promises));
    }
    return all;
  }
  public static race(promises: PromiseLike<any>[]): Foretell<any> {
    return new Foretell(
      (resolve: (arg?: any) => void, reject: (reason?: any) => void) => {
        if (isArray(promises)) {
          for (let n = 0; n < promises.length; n += 1) {
            const promise = promises[n];
            if (promise && isFunction(promise.then)) {
              promise.then(resolve, reject);
            } else {
              resolve(promise);
            }
          }
        } else {
          reject(ARRAY_ERROR(promises));
        }
      }
    );
  }
}

export default Foretell;
