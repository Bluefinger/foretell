export const enum STATE {
  PENDING,
  FULFILLED,
  REJECTED,
}

export const UNDEF = "undefined";
export const QUEUE_SIZE = 2048;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const IDENTITY = (n: any): any => n;
export const THROW_IDENTITY = (n: unknown): never => {
  throw n;
};
export const ARRAY_ERROR = (value: unknown): TypeError =>
  new TypeError(`Can't convert ${value} to an array`);
