import { UNDEF } from "./constants";

export const logError =
  typeof console !== UNDEF ? console.error : ((() => void 0) as Function);
export const extractErrorMsg = (e: any) => `${e && e.stack ? e.stack : e}`;
