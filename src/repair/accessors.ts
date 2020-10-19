// Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

/**
 * Replace the legacy accessors of Object to comply with strict mode
 * and ES2016 semantics, we do this by redefining them while in 'use strict'.
 *
 * todo: list the issues resolved
 *
 * This function can be used in two ways: (1) invoked directly to fix the primal
 * realm's Object.prototype, and (2) converted to a string to be executed
 * inside each new RootRealm to fix their Object.prototypes. Evaluation requires
 * the function to have no dependencies, so don't import anything from
 * the outside.
 */

// todo: this file should be moved out to a separate repo and npm module.
export function repairAccessors() {
  const {
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getPrototypeOf,
    prototype: objectPrototype,
  } = Object;

  // On some platforms, the implementation of these functions act as
  // if they are in sloppy mode: if they're invoked badly, they will
  // expose the global object, so we need to repair these for
  // security. Thus it is our responsibility to fix this, and we need
  // to include repairAccessors. E.g. Chrome in 2016.

  try {
    // Verify that the method is not callable.
    // eslint-disable-next-line no-restricted-properties, no-underscore-dangle
    // @ts-ignore
    (0, objectPrototype.__lookupGetter__)("x");
  } catch (ignore) {
    // Throws, no need to patch.
    return;
  }

  const { apply } = Reflect;
  // %Object.prototype.valueOf% performs:
  // 1. Return ? ToObject(this value)
  const uncurryThis = <T extends (this: V, ...args: any) => any, V>(fn: T) => (
    thisArg: V,
    ...args: Parameters<T>
  ): ReturnType<T> => apply(fn, thisArg, args);
  const toObject = uncurryThis(objectPrototype.valueOf);

  function asPropertyName(obj: Symbol | string) {
    if (typeof obj === "symbol") {
      return obj;
    }
    return `${obj}`;
  }

  function aFunction(obj: any, accessor: string) {
    if (typeof obj !== "function") {
      throw TypeError(`invalid ${accessor} usage`);
    }
    return obj;
  }

  // We use the the concise method syntax to create methods without
  // a [[Construct]] internal method (such that the invocation
  // "new __method__()" throws "TypeError: __method__ is not a constructor"),
  // but which still accepts a 'this' binding.
  const {
    __defineGetter__,
    __defineSetter__,
    __lookupGetter__,
    __lookupSetter__,
  } = {
    // eslint-disable-next-line no-underscore-dangle
    __defineGetter__(prop: any, func: any) {
      const O = toObject(this);
      defineProperty(O, prop, {
        get: aFunction(func, "getter"),
        enumerable: true,
        configurable: true,
      });
    },

    // eslint-disable-next-line no-underscore-dangle
    __defineSetter__(prop: any, func: any) {
      const O = toObject(this);
      defineProperty(O, prop, {
        set: aFunction(func, "setter"),
        enumerable: true,
        configurable: true,
      });
    },

    // eslint-disable-next-line no-underscore-dangle
    __lookupGetter__(prop: any) {
      let O = toObject(this);
      prop = asPropertyName(prop);
      let desc;
      while (O !== null && !(desc = getOwnPropertyDescriptor(O, prop))) {
        O = getPrototypeOf(O);
      }
      return desc && desc.get;
    },

    // eslint-disable-next-line no-underscore-dangle
    __lookupSetter__(prop: any) {
      let O = toObject(this);
      prop = asPropertyName(prop);
      let desc;
      while (O !== null && !(desc = getOwnPropertyDescriptor(O, prop))) {
        O = getPrototypeOf(O);
      }
      return desc && desc.set;
    },
  };

  defineProperties(objectPrototype, {
    __defineGetter__: { value: __defineGetter__ },
    __defineSetter__: { value: __defineSetter__ },
    __lookupGetter__: { value: __lookupGetter__ },
    __lookupSetter__: { value: __lookupSetter__ },
  });
}
