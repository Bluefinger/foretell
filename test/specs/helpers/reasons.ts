"use strict";

import { resolved, rejected } from "./adapter";

const dummy = { dummy: "dummy" };

export const reasons: [string, () => any][] = [
  ["`undefined`", () => undefined],
  ["`null`", () => null],
  ["`false`", () => false],
  ["`0`", () => 0],
  ["an error", () => new Error()],
  [
    "an error without a stack",
    () => {
      const error = new Error();
      delete error.stack;
      return error;
    },
  ],
  ["a date", () => new Date()],
  ["an object", () => ({})],
  ["an always-pending thenable", () => ({ then: () => {} })],
  ["a fulfilled promise", () => resolved(dummy)],
  ["a rejected promise", () => rejected(dummy)],
];
