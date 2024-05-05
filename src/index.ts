const PENDING = "PENDING" as const;
const FULFILLED = "FULFILLED" as const;
const REJECTED = "REJECTED" as const;

type Executor<T> = (
  resolve: (value?: T | LrhmiseLike<T>) => void,
  reject: (reason?: any) => void
) => void;

interface LrhmiseLike<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | LrhmiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | LrhmiseLike<TResult2>)
      | undefined
      | null
  ): LrhmiseLike<TResult1 | TResult2>;
}

const resolveLrhmise = <T>(
  lrhmise2: Lrhmise<T>,
  x: any,
  resolve: (value?: T | LrhmiseLike<T>) => void,
  reject: (reason?: any) => void
): void => {
  if (lrhmise2 === x) {
    return reject(
      new TypeError("Chaining cycle detected for lrhmise #<Lrhmise>")
    );
  }
  let called = false;
  if ((typeof x === "object" && x !== null) || typeof x === "function") {
    try {
      const then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (y: any) => {
            if (called) return;
            called = true;
            resolveLrhmise(lrhmise2, y, resolve, reject);
          },
          (r: any) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
};

export default class Lrhmise<T> {
  status: typeof PENDING | typeof FULFILLED | typeof REJECTED;
  value: T | LrhmiseLike<T> | undefined;
  reason: any;
  onResolvedCallbacks: (() => void)[];
  onRejectedCallbacks: (() => void)[];

  constructor(executor: Executor<T>) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value?: T | LrhmiseLike<T>): void => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.onResolvedCallbacks.forEach((fn) => fn());
      }
    };

    const reject = (reason?: any): void => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then<U>(
    onFulfilled: ((value: T) => U | LrhmiseLike<U>) | null | undefined,
    onRejected?: ((reason: any) => any) | null
  ): Lrhmise<U> {
    onFulfilled =
      typeof onFulfilled === "function"
        ? onFulfilled
        : (v: T) => v as unknown as U;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (err) => {
            throw err;
          };

    const lrhmise2 = new Lrhmise<U>((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled!(this.value! as T);
            resolveLrhmise(lrhmise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected!(this.reason);
            resolveLrhmise(lrhmise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === PENDING) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled!(this.value! as T);
              resolveLrhmise(lrhmise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected!(this.reason);
              resolveLrhmise(lrhmise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }
    });

    return lrhmise2;
  }
}
