export const enum STATE {
  PENDING,
  FULFILLED,
  REJECTED
}

export const UNDEF = "undefined";

export const IDENTITY = (n: any) => n;
export const THROW_IDENTITY = (n: any) => {
  throw n;
};
