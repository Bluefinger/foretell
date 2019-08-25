export const isFunction = (val: any): val is Function =>
  typeof val === "function";
export const isObject = (val: any): val is object =>
  val !== null && typeof val === "object";
