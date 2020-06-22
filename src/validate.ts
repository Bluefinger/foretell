/* eslint-disable @typescript-eslint/ban-types */
export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";
export const isObject = (val: unknown): val is object =>
  val !== null && typeof val === "object";
