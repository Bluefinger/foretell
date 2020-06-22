"use strict";

import { resolved, rejected } from "./adapter";
import type Foretell from "src/promise";

const dummy = { dummy: "dummy" };

export const reasons: [string, () => any][] = [
  ["`undefined`", (): undefined => undefined],
  ["`null`", (): null => null],
  ["`false`", (): false => false],
  ["`0`", (): 0 => 0],
  ["an error", (): Error => new Error()],
  [
    "an error without a stack",
    (): Error => {
      const error = new Error();
      delete error.stack;
      return error;
    },
  ],
  ["a date", (): Date => new Date()],
  ["an object", (): Record<string, unknown> => ({})],
  [
    "an always-pending thenable",
    (): { then: () => void } => ({ then: () => {} }),
  ],
  ["a fulfilled promise", (): Foretell<{ dummy: string }> => resolved(dummy)],
  ["a rejected promise", (): Foretell<{ dummy: string }> => rejected(dummy)],
];
