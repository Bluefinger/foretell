import { UNDEF } from "./constants";

export const logError =
  typeof console !== UNDEF
    ? console.error
    : ((() => {}) as (...args: unknown[]) => void);
export const extractErrorMsg = (e: unknown): string =>
  `${e && (e as Error).stack ? (e as Error).stack : e}`;
