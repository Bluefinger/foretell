import { STATE, IDENTITY, THROW_IDENTITY } from "./constants";
import { isFunction, isObject } from "./validate";
import { defer } from "./defer";
import { extractErrorMsg, logError } from "./utils";

const { isArray } = Array;

const arrayError = (value: any) =>
  new TypeError(`Can't convert ${value} to an array`);

class Foretell<T> implements PromiseLike<T> {
  private _state?: STATE;
  private _clients?: Foretell<any>[];
  private _value?: T;
  private _handled?: boolean;
  private _parent?: Foretell<any>;
  private _onFulfill?: Function;
  private _onReject?: Function;
  public constructor(
    func?: (resolve: (arg?: T) => void, reject: (reason: any) => void) => void
  ) {
    const hasFunc = isFunction(func);
    const me = this;
    me._handled = !hasFunc;
    if (hasFunc) {
      try {
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
  ): PromiseLike<TResult | TReject> {
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
  ): PromiseLike<T | TResult> {
    return this.then(null, onrejected);
  }
  public finally(onfinally?: (() => any) | undefined | null): PromiseLike<T> {
    return this.then(onfinally, onfinally);
  }
  protected $$Execute$$() {
    const then = this;
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parent = then._parent!;
      const nextValue =
        parent._state === STATE.FULFILLED ? then._onFulfill : then._onReject;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      then.$$Resolve$$(nextValue!.call(undefined, parent._value));
    } catch (error) {
      then.$$Settle$$(STATE.REJECTED, error);
    }
  }
  protected $$Settle$$(state: STATE.FULFILLED | STATE.REJECTED, value: any) {
    const me = this;
    if (!me._state) {
      me._state = state;
      me._value = value;
      const clients = me._clients;
      /* istanbul ignore else */
      if (clients) {
        for (let i = 0; i < clients.length; i += 1) defer(clients[i]);
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
  protected $$Resolve$$(value: any) {
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
            arg => {
              if (!calledOrThrown++) {
                me.$$Resolve$$(arg);
              }
            },
            reason => {
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
  public static resolve<U>(arg?: U): PromiseLike<U> {
    const resolved = new Foretell<U>();
    resolved.$$Settle$$(STATE.FULFILLED, arg);
    return resolved;
  }
  public static reject<U = never>(error?: U): PromiseLike<U> {
    const rejected = new Foretell<U>();
    rejected.$$Settle$$(STATE.REJECTED, error);
    return rejected;
  }
  public static all(promises: PromiseLike<any>[]): PromiseLike<any[]> {
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
      reject(arrayError(promises));
    }
    return all;
  }
  public static race(promises: PromiseLike<any>[]): PromiseLike<any> {
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
          reject(arrayError(promises));
        }
      }
    );
  }
}

export default Foretell;
