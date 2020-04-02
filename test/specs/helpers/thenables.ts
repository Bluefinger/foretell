"use strict";

import { resolved as resolve, rejected as reject, deferred } from "./adapter";

const other = { other: "other" }; // a value we don't want to be strict equal to

export interface Thenable {
  then: (
    fulfill: (arg?: any) => any | null | undefined,
    reject: (arg: any) => any | null | undefined
  ) => any;
}

export const fulfilled: [string, (arg?: any) => Thenable][] = [
  [
    "a synchronously-fulfilled custom thenable",
    (value) => ({
      then: (onFulfilled) => {
        onFulfilled!(value);
      },
    }),
  ],
  [
    "an asynchronously-fulfilled custom thenable",
    (value) => ({
      then: (onFulfilled) => {
        setTimeout(onFulfilled!, 0, value);
      },
    }),
  ],
  [
    "a synchronously-fulfilled one-time thenable",
    (value) => {
      let called = 0;
      return Object.create(null, {
        then: {
          get: () => {
            if (!called++) {
              return (onFulfilled: (arg?: any) => any) => onFulfilled(value);
            }
          },
        },
      });
    },
  ],
  [
    "a thenable that tries to fulfill twice",
    (value) => ({
      then: (onFulfilled) => {
        onFulfilled!(value);
        onFulfilled!(other);
      },
    }),
  ],
  [
    "a thenable that fulfills but then throws",
    (value) => ({
      then: (onFulfilled) => {
        onFulfilled!(value);
        throw other;
      },
    }),
  ],
  ["an already-fulfilled promise", resolve],
  [
    "an eventually-fulfilled promise",
    (value) => {
      const d = deferred();
      setTimeout(d.resolve, 5, value);
      return d.promise;
    },
  ],
];

export const rejected: [string, (arg?: any) => Thenable][] = [
  [
    "a synchronously-rejected custom thenable",
    (value) => ({
      then: (_, onRejected) => {
        onRejected!(value);
      },
    }),
  ],
  [
    "an asynchronously-rejected custom thenable",
    (value) => ({
      then: (_, onRejected) => {
        setTimeout(onRejected!, 0, value);
      },
    }),
  ],
  [
    "a synchronously-rejected one-time thenable",
    (value) => {
      let called = 0;
      return Object.create(null, {
        then: {
          get: () => {
            if (!called++) {
              return (_: unknown, onRejected: (arg?: any) => any) =>
                onRejected(value);
            }
          },
        },
      });
    },
  ],
  [
    "a thenable that immediately throws in `then`",
    (value) => ({
      then: () => {
        throw value;
      },
    }),
  ],
  [
    "an object with a throwing `then` accessor",
    (value) => {
      return Object.create(null, {
        then: {
          get: () => {
            throw value;
          },
        },
      });
    },
  ],
  ["an already-rejected promise", reject],
  [
    "an eventually-rejected promise",
    (value) => {
      const d = deferred();
      setTimeout(d.reject, 5, value);
      return d.promise;
    },
  ],
];
