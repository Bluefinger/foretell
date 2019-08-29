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

### Node.js v12.7.0

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 2,719,777 ±0.43%           | 20,109 ±0.44%    | 67,935 ±0.35%      |
| Foretell | 2,908,245 ±0.35%           | 14,314 ±0.20%    | 85,626 ±0.39%      |
| Zousan   | 2,611,881 ±0.34%           | 9,609 ±0.29%     | 32,167 ±0.38%      |
| Bluebird | 397,900 ±0.31%             | 7,914 ±0.72%     | 69,059 ±0.71%      |

### Chrome 76.0.3809.132

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 211,398 ±0.98%             | 20,606 ±0.24%    | 67,515 ±0.38%      |
| Foretell | 103,626 ±0.92%             | 14,002 ±0.26%    | 91,163 ±0.25%      |
| Zousan   | 104,634 ±1.05%             | 9,590 ±0.44%     | 39,941 ±0.33%      |
| Bluebird | 5,242 ±0.56%               | 102 ±0.45%       | 444 ±1.30%         |

### Firefox v68.0.2

| Library  | Create & Resolve (ops/sec) | Serial (ops/sec) | Parallel (ops/sec) |
| -------- | -------------------------- | ---------------- | ------------------ |
| Native   | 164,723 ±1.59%             | 567 ±2.32%       | 3,036 ±1.85%       |
| Foretell | 216,060 ±0.46%             | 4,383 ±2.10%     | 24,936 ±1.64%      |
| Zousan   | 186,790 ±0.50%             | 1,913 ±2.17%     | 6,807 ±1.90%       |
| Bluebird | 19,817 ±1.69%              | 110 ±1.64%       | 399 ±1.92%         |

## Licensing

Foretell is MIT licensed.
