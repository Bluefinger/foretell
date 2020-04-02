"use strict";

import assert from "assert";
import { deferred, resolved, rejected } from "./helpers/adapter";
import type Foretell from "../../src/promise";
import { reasons } from "./helpers/reasons";
import { fulfilled, rejected as rejects } from "./helpers/thenables";

const dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it
const sentinel = { sentinel: "sentinel" }; // a sentinel fulfillment value to test for with strict equality
const other = { other: "other" }; // a value we don't want to be strict equal to
const sentinelArray = [sentinel]; // a sentinel fulfillment value to test when we need an array

const testPromiseResolution = (
  xFactory: () => any,
  test: (promise: Foretell<any>, done: Mocha.Done) => void
) => {
  specify("via return from a fulfilled promise", (done) => {
    const promise = resolved(dummy).then(() => {
      return xFactory();
    });

    test(promise, done);
  });

  specify("via return from a rejected promise", (done) => {
    const promise = rejected(dummy).then(null, () => {
      return xFactory();
    });

    test(promise, done);
  });
};

const testCallingResolvePromise = (
  yFactory: () => any,
  stringRepresentation: string,
  test: (promise: Foretell<any>, done: Mocha.Done) => void
) => {
  describe("`y` is " + stringRepresentation, () => {
    describe("`then` calls `resolvePromise` synchronously", () => {
      const xFactory = () => {
        return {
          then: (resolvePromise: any) => {
            resolvePromise(yFactory());
          },
        };
      };

      testPromiseResolution(xFactory, test);
    });

    describe("`then` calls `resolvePromise` asynchronously", () => {
      const xFactory = () => {
        return {
          then: (resolvePromise: any) => {
            setTimeout(() => {
              resolvePromise(yFactory());
            }, 0);
          },
        };
      };

      testPromiseResolution(xFactory, test);
    });
  });
};

const testCallingRejectPromise = (
  r: any,
  stringRepresentation: string,
  test: (promise: Foretell<any>, done: Mocha.Done) => void
) => {
  describe("`r` is " + stringRepresentation, () => {
    describe("`then` calls `rejectPromise` synchronously", () => {
      const xFactory = () => {
        return {
          then: (_: unknown, rejectPromise: any) => {
            rejectPromise(r);
          },
        };
      };

      testPromiseResolution(xFactory, test);
    });

    describe("`then` calls `rejectPromise` asynchronously", () => {
      const xFactory = () => {
        return {
          then: (_: unknown, rejectPromise: any) => {
            setTimeout(() => {
              rejectPromise(r);
            }, 0);
          },
        };
      };

      testPromiseResolution(xFactory, test);
    });
  });
};

const testCallingResolvePromiseFulfillsWith = (
  yFactory: () => any,
  stringRepresentation: string,
  fulfillmentValue: any
) => {
  testCallingResolvePromise(yFactory, stringRepresentation, (promise, done) => {
    promise
      .then((value) => {
        assert.strictEqual(value, fulfillmentValue);
      })
      .then(done, done);
  });
};

const testCallingResolvePromiseRejectsWith = (
  yFactory: () => any,
  stringRepresentation: string,
  rejectionReason: any
) => {
  testCallingResolvePromise(yFactory, stringRepresentation, (promise, done) => {
    promise
      .then(null, (reason) => {
        assert.strictEqual(reason, rejectionReason);
      })
      .then(done, done);
  });
};

const testCallingRejectPromiseRejectsWith = (
  reason: any,
  stringRepresentation: string
) => {
  testCallingRejectPromise(reason, stringRepresentation, (promise, done) => {
    promise
      .then(null, (rejectionReason) => {
        assert.strictEqual(rejectionReason, reason);
      })
      .then(done, done);
  });
};

describe("2.3.3: Otherwise, if `x` is an object or function,", () => {
  describe("2.3.3.1: Let `then` be `x.then`", () => {
    describe("`x` is an object with null prototype", () => {
      let numberOfTimesThenWasRetrieved: number;

      beforeEach(() => {
        numberOfTimesThenWasRetrieved = 0;
      });

      const xFactory = () => {
        return Object.create(null, {
          then: {
            get: () => {
              ++numberOfTimesThenWasRetrieved;
              return (onFulfilled: any) => {
                onFulfilled();
              };
            },
          },
        });
      };

      testPromiseResolution(xFactory, (promise, done) => {
        promise
          .then(() => {
            assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
          })
          .then(done, done);
      });
    });

    describe("`x` is an object with normal Object.prototype", () => {
      let numberOfTimesThenWasRetrieved: number;

      beforeEach(() => {
        numberOfTimesThenWasRetrieved = 0;
      });

      const xFactory = () => {
        return Object.create(Object.prototype, {
          then: {
            get: () => {
              ++numberOfTimesThenWasRetrieved;
              return (onFulfilled: any) => {
                onFulfilled();
              };
            },
          },
        });
      };

      testPromiseResolution(xFactory, (promise, done) => {
        promise
          .then(() => {
            assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
          })
          .then(done, done);
      });
    });

    describe("`x` is a function", () => {
      let numberOfTimesThenWasRetrieved: number;

      beforeEach(() => {
        numberOfTimesThenWasRetrieved = 0;
      });

      const xFactory = () => {
        const x = () => {};

        Object.defineProperty(x, "then", {
          get: () => {
            ++numberOfTimesThenWasRetrieved;
            return (onFulfilled: any) => {
              onFulfilled();
            };
          },
        });

        return x;
      };

      testPromiseResolution(xFactory, (promise, done) => {
        promise
          .then(() => {
            assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
          })
          .then(done, done);
      });
    });
  });

  describe(
    "2.3.3.2: If retrieving the property `x.then` results in a thrown exception `e`, reject `promise` with " +
      "`e` as the reason.",
    () => {
      const testRejectionViaThrowingGetter = (
        e: any,
        stringRepresentation: string
      ) => {
        const xFactory = () => {
          return Object.create(Object.prototype, {
            then: {
              get: () => {
                throw e;
              },
            },
          });
        };

        describe("`e` is " + stringRepresentation, () => {
          testPromiseResolution(xFactory, (promise, done) => {
            promise
              .then(null, (reason) => {
                assert.strictEqual(reason, e);
              })
              .then(done, done);
          });
        });
      };

      for (const [key, value] of reasons) {
        testRejectionViaThrowingGetter(value, key);
      }
    }
  );

  describe(
    "2.3.3.3: If `then` is a function, call it with `x` as `this`, first argument `resolvePromise`, and " +
      "second argument `rejectPromise`",
    () => {
      describe("Calls with `x` as `this` and two function arguments", () => {
        const xFactory = () => {
          const x = {
            then: function (onFulfilled: any, onRejected: any) {
              assert.strictEqual(this, x);
              assert.strictEqual(typeof onFulfilled, "function");
              assert.strictEqual(typeof onRejected, "function");
              onFulfilled();
            },
          };
          return x;
        };

        testPromiseResolution(xFactory, (promise, done) => {
          promise.then(() => done(), done);
        });
      });

      describe("Uses the original value of `then`", () => {
        let numberOfTimesThenWasRetrieved: number;

        beforeEach(() => {
          numberOfTimesThenWasRetrieved = 0;
        });

        const xFactory = () => {
          return Object.create(Object.prototype, {
            then: {
              get: () => {
                if (numberOfTimesThenWasRetrieved === 0) {
                  return (onFulfilled: any) => {
                    onFulfilled();
                  };
                }
                return null;
              },
            },
          });
        };

        testPromiseResolution(xFactory, (promise, done) => {
          promise.then(() => done(), done);
        });
      });

      describe("2.3.3.3.1: If/when `resolvePromise` is called with value `y`, run `[[Resolve]](promise, y)`", () => {
        describe("`y` is not a thenable", () => {
          testCallingResolvePromiseFulfillsWith(
            () => {
              return undefined;
            },
            "`undefined`",
            undefined
          );
          testCallingResolvePromiseFulfillsWith(
            () => {
              return null;
            },
            "`null`",
            null
          );
          testCallingResolvePromiseFulfillsWith(
            () => {
              return false;
            },
            "`false`",
            false
          );
          testCallingResolvePromiseFulfillsWith(
            () => {
              return 5;
            },
            "`5`",
            5
          );
          testCallingResolvePromiseFulfillsWith(
            () => {
              return sentinel;
            },
            "an object",
            sentinel
          );
          testCallingResolvePromiseFulfillsWith(
            () => {
              return sentinelArray;
            },
            "an array",
            sentinelArray
          );
        });

        describe("`y` is a thenable", () => {
          for (const [stringRepresentation, thenable] of fulfilled) {
            const yFactory = () => thenable(sentinel);

            testCallingResolvePromiseFulfillsWith(
              yFactory,
              stringRepresentation,
              sentinel
            );
          }

          for (const [stringRepresentation, thenable] of rejects) {
            const yFactory = () => thenable(sentinel);

            testCallingResolvePromiseRejectsWith(
              yFactory,
              stringRepresentation,
              sentinel
            );
          }
        });

        describe("`y` is a thenable for a thenable", () => {
          for (const [outerStringRepresentation, outerThenable] of fulfilled) {
            for (const [
              innerStringRepresentation,
              innerThenable,
            ] of fulfilled) {
              const stringRepresentation = `${outerStringRepresentation} for ${innerStringRepresentation}`;
              const yFactory = () => outerThenable(innerThenable(sentinel));
              testCallingResolvePromiseFulfillsWith(
                yFactory,
                stringRepresentation,
                sentinel
              );
            }
            for (const [innerStringRepresentation, innerThenable] of rejects) {
              const stringRepresentation = `${outerStringRepresentation} for ${innerStringRepresentation}`;
              const yFactory = () => outerThenable(innerThenable(sentinel));
              testCallingResolvePromiseRejectsWith(
                yFactory,
                stringRepresentation,
                sentinel
              );
            }
          }
        });
      });

      describe("2.3.3.3.2: If/when `rejectPromise` is called with reason `r`, reject `promise` with `r`", () => {
        for (const [stringRepresentation, value] of reasons) {
          testCallingRejectPromiseRejectsWith(value(), stringRepresentation);
        }
      });

      describe(
        "2.3.3.3.3: If both `resolvePromise` and `rejectPromise` are called, or multiple calls to the same " +
          "argument are made, the first call takes precedence, and any further calls are ignored.",
        () => {
          describe("calling `resolvePromise` then `rejectPromise`, both synchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  resolvePromise(sentinel);
                  rejectPromise(other);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `resolvePromise` synchronously then `rejectPromise` asynchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  resolvePromise(sentinel);

                  setTimeout(() => {
                    rejectPromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `resolvePromise` then `rejectPromise`, both asynchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  setTimeout(() => {
                    resolvePromise(sentinel);
                  }, 0);

                  setTimeout(() => {
                    rejectPromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe(
            "calling `resolvePromise` with an asynchronously-fulfilled promise, then calling " +
              "`rejectPromise`, both synchronously",
            () => {
              const xFactory = () => {
                const d = deferred();
                setTimeout(() => {
                  d.resolve(sentinel);
                }, 5);

                return {
                  then: (resolvePromise: any, rejectPromise: any) => {
                    resolvePromise(d.promise);
                    rejectPromise(other);
                  },
                };
              };

              testPromiseResolution(xFactory, (promise, done) => {
                promise
                  .then((value) => {
                    assert.strictEqual(value, sentinel);
                  })
                  .then(done, done);
              });
            }
          );

          describe(
            "calling `resolvePromise` with an asynchronously-rejected promise, then calling " +
              "`rejectPromise`, both synchronously",
            () => {
              const xFactory = () => {
                const d = deferred();
                setTimeout(() => {
                  d.reject(sentinel);
                }, 5);

                return {
                  then: (resolvePromise: any, rejectPromise: any) => {
                    resolvePromise(d.promise);
                    rejectPromise(other);
                  },
                };
              };

              testPromiseResolution(xFactory, (promise, done) => {
                promise
                  .then(null, (reason) => {
                    assert.strictEqual(reason, sentinel);
                  })
                  .then(done, done);
              });
            }
          );

          describe("calling `rejectPromise` then `resolvePromise`, both synchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  rejectPromise(sentinel);
                  resolvePromise(other);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `rejectPromise` synchronously then `resolvePromise` asynchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  rejectPromise(sentinel);

                  setTimeout(() => {
                    resolvePromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `rejectPromise` then `resolvePromise`, both asynchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  setTimeout(() => {
                    rejectPromise(sentinel);
                  }, 0);

                  setTimeout(() => {
                    resolvePromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `resolvePromise` twice synchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any) => {
                  resolvePromise(sentinel);
                  resolvePromise(other);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `resolvePromise` twice, first synchronously then asynchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any) => {
                  resolvePromise(sentinel);

                  setTimeout(() => {
                    resolvePromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `resolvePromise` twice, both times asynchronously", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any) => {
                  setTimeout(() => {
                    resolvePromise(sentinel);
                  }, 0);

                  setTimeout(() => {
                    resolvePromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe(
            "calling `resolvePromise` with an asynchronously-fulfilled promise, then calling it again, both " +
              "times synchronously",
            () => {
              const xFactory = () => {
                const d = deferred();
                setTimeout(() => {
                  d.resolve(sentinel);
                }, 5);

                return {
                  then: (resolvePromise: any) => {
                    resolvePromise(d.promise);
                    resolvePromise(other);
                  },
                };
              };

              testPromiseResolution(xFactory, (promise, done) => {
                promise
                  .then((value) => {
                    assert.strictEqual(value, sentinel);
                  })
                  .then(done, done);
              });
            }
          );

          describe(
            "calling `resolvePromise` with an asynchronously-rejected promise, then calling it again, both " +
              "times synchronously",
            () => {
              const xFactory = () => {
                const d = deferred();
                setTimeout(() => {
                  d.reject(sentinel);
                }, 5);

                return {
                  then: (resolvePromise: any) => {
                    resolvePromise(d.promise);
                    resolvePromise(other);
                  },
                };
              };

              testPromiseResolution(xFactory, (promise, done) => {
                promise
                  .then(null, (reason) => {
                    assert.strictEqual(reason, sentinel);
                  })
                  .then(done, done);
              });
            }
          );

          describe("calling `rejectPromise` twice synchronously", () => {
            const xFactory = () => {
              return {
                then: (_: unknown, rejectPromise: any) => {
                  rejectPromise(sentinel);
                  rejectPromise(other);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `rejectPromise` twice, first synchronously then asynchronously", () => {
            const xFactory = () => {
              return {
                then: (_: unknown, rejectPromise: any) => {
                  rejectPromise(sentinel);

                  setTimeout(() => {
                    rejectPromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("calling `rejectPromise` twice, both times asynchronously", () => {
            const xFactory = () => {
              return {
                then: (_: unknown, rejectPromise: any) => {
                  setTimeout(() => {
                    rejectPromise(sentinel);
                  }, 0);

                  setTimeout(() => {
                    rejectPromise(other);
                  }, 0);
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("saving and abusing `resolvePromise` and `rejectPromise`", () => {
            let savedResolvePromise: any, savedRejectPromise: any;

            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  savedResolvePromise = resolvePromise;
                  savedRejectPromise = rejectPromise;
                },
              };
            };

            beforeEach(() => {
              savedResolvePromise = null;
              savedRejectPromise = null;
            });

            testPromiseResolution(xFactory, (promise, done) => {
              let timesFulfilled = 0;
              let timesRejected = 0;

              promise.then(
                () => {
                  ++timesFulfilled;
                },
                () => {
                  ++timesRejected;
                }
              );

              if (savedResolvePromise && savedRejectPromise) {
                savedResolvePromise(dummy);
                savedResolvePromise(dummy);
                savedRejectPromise(dummy);
                savedRejectPromise(dummy);
              }

              setTimeout(() => {
                savedResolvePromise(dummy);
                savedResolvePromise(dummy);
                savedRejectPromise(dummy);
                savedRejectPromise(dummy);
              }, 5);

              setTimeout(() => {
                assert.strictEqual(timesFulfilled, 1);
                assert.strictEqual(timesRejected, 0);
                done();
              }, 10);
            });
          });
        }
      );

      describe("2.3.3.3.4: If calling `then` throws an exception `e`,", () => {
        describe("2.3.3.3.4.1: If `resolvePromise` or `rejectPromise` have been called, ignore it.", () => {
          describe("`resolvePromise` was called with a non-thenable", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any) => {
                  resolvePromise(sentinel);
                  throw other;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`resolvePromise` was called with an asynchronously-fulfilled promise", () => {
            const xFactory = () => {
              const d = deferred();
              setTimeout(() => {
                d.resolve(sentinel);
              }, 5);

              return {
                then: (resolvePromise: any) => {
                  resolvePromise(d.promise);
                  throw other;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`resolvePromise` was called with an asynchronously-rejected promise", () => {
            const xFactory = () => {
              const d = deferred();
              setTimeout(() => {
                d.reject(sentinel);
              }, 5);

              return {
                then: (resolvePromise: any) => {
                  resolvePromise(d.promise);
                  throw other;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`rejectPromise` was called", () => {
            const xFactory = () => {
              return {
                then: (_: unknown, rejectPromise: any) => {
                  rejectPromise(sentinel);
                  throw other;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`resolvePromise` then `rejectPromise` were called", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  resolvePromise(sentinel);
                  rejectPromise(other);
                  throw other;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then((value) => {
                  assert.strictEqual(value, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`rejectPromise` then `resolvePromise` were called", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any, rejectPromise: any) => {
                  rejectPromise(sentinel);
                  resolvePromise(other);
                  throw other;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });
        });

        describe("2.3.3.3.4.2: Otherwise, reject `promise` with `e` as the reason.", () => {
          describe("straightforward case", () => {
            const xFactory = () => {
              return {
                then: () => {
                  throw sentinel;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`resolvePromise` is called asynchronously before the `throw`", () => {
            const xFactory = () => {
              return {
                then: (resolvePromise: any) => {
                  setTimeout(() => {
                    resolvePromise(other);
                  }, 0);
                  throw sentinel;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });

          describe("`rejectPromise` is called asynchronously before the `throw`", () => {
            const xFactory = () => {
              return {
                then: (_: unknown, rejectPromise: any) => {
                  setTimeout(() => {
                    rejectPromise(other);
                  }, 0);
                  throw sentinel;
                },
              };
            };

            testPromiseResolution(xFactory, (promise, done) => {
              promise
                .then(null, (reason) => {
                  assert.strictEqual(reason, sentinel);
                })
                .then(done, done);
            });
          });
        });
      });
    }
  );

  describe("2.3.3.4: If `then` is not a function, fulfill promise with `x`", () => {
    const testFulfillViaNonFunction = (
      then: any,
      stringRepresentation: string
    ) => {
      let x: any;

      beforeEach(() => {
        x = { then: then };
      });

      const xFactory = () => {
        return x;
      };

      describe("`then` is " + stringRepresentation, () => {
        testPromiseResolution(xFactory, (promise, done) => {
          promise
            .then((value) => {
              assert.strictEqual(value, x);
            })
            .then(done, done);
        });
      });
    };

    testFulfillViaNonFunction(5, "`5`");
    testFulfillViaNonFunction({}, "an object");
    testFulfillViaNonFunction([() => {}], "an array containing a function");
    testFulfillViaNonFunction(/a-b/i, "a regular expression");
    testFulfillViaNonFunction(
      Object.create(Function.prototype),
      "an object inheriting from `Function.prototype`"
    );
  });
});
