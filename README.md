# Foretell

[![Build Status](https://travis-ci.com/Bluefinger/foretell.svg?branch=master)](https://travis-ci.com/Bluefinger/foretell) [![codecov](https://codecov.io/gh/Bluefinger/foretell/branch/master/graph/badge.svg)](https://codecov.io/gh/Bluefinger/foretell) [![npm version](https://badge.fury.io/js/foretell.svg)](https://badge.fury.io/js/foretell)

A small, performant Promise/A+ 1.1 implementation in Typescript.

## Installation and Usage

### ES6 via NPM

```
npm install foretell
```

```js
import Foretell from "foretell";

const delay = ms => new Foretell(resolve => setTimeout(resolve, ms));

delay(100).then(() => {
  // do something
});
```

### UMD via NPM

```js
const Foretell = require("foretell");
```

### Polyfill for browser

```html
<script src="./dist/umd/foretell.polyfill.js"></script>
```

## Goals

- Provide a small, but fast Promises library for polyfilling personal projects.

## Documentation

`Foretell` is a Promise/A+ 1.1 compliant library, and implements `.then` as well as a few additional utilities to have parity with browser implementations.

#### `new Foretell<T>(func?: (resolve: (arg?: T) => void, reject: (reason: any) => void) => void)`

Constructor for Foretell. Foretell does not implement the Deferred pattern.

```js
const promise = new Foretell((resolve, reject) => {
  // resolve or reject here
});
```

#### `.then<TResult = T, TReject = never>(onfulfilled?: ((value: T) => TResult | PromiseLike<TResult>) | undefined | null, onrejected?: ((reason: any) => TReject | PromiseLike<TReject>) | undefined | null ): PromiseLike<TResult | TReject>`

Runs callbacks when a Promise resolves or rejects. Returns a new Promise, allowing `.then` to be chained. Accepts a callback for resolved Promises, and a callback for rejected Promises.

```js
const delay = ms => new Foretell(resolve => setTimeout(resolve, ms));

delay(100)
  .then(() => {
    return 6;
  })
  .then(value => {
    // do something with the value
  });
```

#### `.catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): PromiseLike<T | TResult>;`

Runs a callback on a Promise rejection, and returns a new Promise. Sugar function for `.then(null, errorHandler)`.

```js
const delay = ms => new Foretell(resolve => setTimeout(resolve, ms));

delay(100)
  .then(() => {
    return Foretell.reject(new Error("Something bad"));
  })
  .catch(error => {
    // handle error
  });
```

#### `finally(onfinally?: (() => any) | undefined | null): PromiseLike<T>;`

Runs a callback regardless of whether the Promise has resolved or rejected. Sugar function for `.then(sameHandler, sameHandler)`.

```js
const delay = ms => new Foretell(resolve => setTimeout(resolve, ms));

delay(100)
  .then(() => {
    return Foretell.reject(new Error("Something bad"));
  })
  .catch(error => {
    // handle error
  })
  .finally(() => {
    // Do something after then/catch
  });
```

#### `Foretell.resolve<U>(arg?: U): PromiseLike<U>`

Provides an immediately resolved Promise.

```js
const promise = Foretell.resolve(42);

promise.then(value => console.log(`value ${value} is immediately resolved`));
```

#### `Foretell.reject<U = never>(error?: U): PromiseLike<U>;`

Provides an immediately rejected Promise.

```js
const promise = Foretell.reject(42);

promise.catch(value => console.log(`value ${value} is immediately rejected`));
```

#### `Foretell.all(promises: PromiseLike<any>[]): PromiseLike<any[]>;`

Resolves after all promises/values in the input array are resolved. Rejects immediately on the first promise to be rejected.

Accepts arrays as input, does not accept iterables for the sake of small code size. Use `Array.from` if you need to covert iterables into arrays.

```js
const delay = (ms, value) =>
  new Foretell(resolve => setTimeout(resolve, ms, value));

const promises = [Foretell.resolve(2), delay(100, "5"), "something"];

Foretell.all(promises).then(values => {
  // passes all resolved values as an array
});
```

#### `Foretell.race(promises: PromiseLike<any>[]): PromiseLike<any>;`

Resolves on the first promise/value to resolve in the input array. Also rejects immediately on the first promise to be rejected.

Accepts arrays as input, does not accept iterables for the sake of small code size. Use `Array.from` if you need to covert iterables into arrays.

```js
const delay = (ms, value) =>
  new Foretell(resolve => setTimeout(resolve, ms, value));

const promises = [delay(100, 1), delay(50, 2), delay(300, 3)];

Foretell.race(promises).then(value => {
  // returns first value to resolve, in this example, value is 2
});
```

## Benchmarks

Tested against Native Promises, Zousan, and Bluebird, with the test machine being Ryzen 1700 @ 3.8Ghz with 32GB 3066 RAM. Test cases are in the benchmarks folder. Both serial and parallel tests include mixing of deferred and immediate return values.

### Node.js v12.7.0

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 2,689,659 ±0.59%           | 20,085 ±0.39%    | 66,448 ±0.40%      |
| Foretell | 2,863,081 ±0.30%           | 14,417 ±0.20%    | 80,481 ±0.35%      |
| Zousan   | 2,626,906 ±0.35%           | 9,925 ±0.41%     | 34,841 ±0.46%      |
| Bluebird | 386,197 ±0.29%             | 8,615 ±0.51%     | 65,907 ±0.51%      |

### Chrome 76.0.3809.132

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 208,831 ±1.16%             | 20,915 ±0.30%    | 67,129 ±0.37%      |
| Foretell | 101,461 ±0.82%             | 14,389 ±0.29%    | 95,577 ±0.42%      |
| Zousan   | 104,357 ±0.88%             | 9,525 ±0.45%     | 41,303 ±0.38%      |
| Bluebird | 4,936 ±1.13%               | 87.12 ±6.43%     | 371 ±2.87%         |

### Firefox v68.0.2

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 161,798 ±2.93%             | 573 ±0.88%       | 2,581 ±3.07%       |
| Foretell | 218,908 ±0.61%             | 4,336 ±2.38%     | 24,027 ±1.94%      |
| Zousan   | 192,285 ±0.57%             | 1,873 ±1.70%     | 6,651 ±1.88%       |
| Bluebird | 19,800 ±3.76%              | 109 ±1.98%       | 395 ±1.60%         |

## Licensing

Foretell is MIT licensed.
