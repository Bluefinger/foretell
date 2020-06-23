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

Accepts arrays as input, does not accept iterables for the sake of small code size. Use `Array.from` if you need to convert iterables into arrays.

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

Accepts arrays as input, does not accept iterables for the sake of small code size. Use `Array.from` if you need to convert iterables into arrays.

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

### Node.js v14.4.0

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 2,897,719 ±0.38%           | 21,952 ±0.45%    | 76,078 ±0.34%      |
| Foretell | 1,783,529 ±0.19%           | 15,116 ±0.30%    | 82,167 ±0.16%      |
| Zousan   | 1,487,790 ±0.37%           | 10,591 ±0.81%    | 40,340 ±0.43%      |
| Bluebird | 291,128 ±0.26%             | 9,511 ±0.61%     | 78,763 ±0.84%      |

### Chrome 83.0.4103.106

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 454,074 ±0.65%             | 22,229 ±0.52%    | 72,444 ±1.78%      |
| Foretell | 230,428 ±0.34%             | 14,817 ±0.21%    | 83,596 ±0.20%      |
| Zousan   | 74,584 ±1.88%              | 11,072 ±0.52%    | 45,776 ±0.95%      |
| Bluebird | 4,804 ±0.79%               | 95.97 ±0.25%     | 442 ±3.22%         |

### Firefox v68.0.2 (no queueMicrotask)

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 164,723 ±1.59%             | 567 ±2.32%       | 3,036 ±1.85%       |
| Foretell | 216,060 ±0.46%             | 4,383 ±2.10%     | 24,936 ±1.64%      |
| Zousan   | 186,790 ±0.50%             | 1,913 ±2.17%     | 6,807 ±1.90%       |
| Bluebird | 19,817 ±1.69%              | 110 ±1.64%       | 399 ±1.92%         |

### Firefox v77.0.1 (with queueMicrotask)

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 248,655 ±2.63%             | 757 ±0.95%       | 3,966 ±1.32%       |
| Foretell | 452,917 ±2.08%             | 4,900 ±2.62%     | 27,667 ±4.55%      |
| Zousan   | 285,515 ±2.66%             | 2,964 ±1.80%     | 11,085 ±1.59%      |
| Bluebird | 22,959 ±1.18%              | 115 ±1.75%       | 483 ±1.23%         |

## Licensing

Foretell is MIT licensed.
