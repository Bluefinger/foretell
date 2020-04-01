export const enum STATE {
  PENDING,
  FULFILLED,
  REJECTED,
}

export const UNDEF = "undefined";
export const QUEUE_SIZE = 2048;

export const IDENTITY = (n: any) => n;
export const THROW_IDENTITY = (n: any) => {
  throw n;
};
export const ARRAY_ERROR = (value: any) =>
  new TypeError(`Can't convert ${value} to an array`);
