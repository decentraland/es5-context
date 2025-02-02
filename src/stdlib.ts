import { getOwnPropertyDescriptor } from "./commons";
import { assert } from "./utilities";

// These value properties of the global object are non-writable,
// non-configurable data properties.
const frozenGlobalPropertyNames = [
  // *** 18.1 Value Properties of the Global Object

  "Infinity",
  "NaN",
  "undefined",
];

// All the following stdlib items have the same name on both our intrinsics
// object and on the global object. Unlike Infinity/NaN/undefined, these
// should all be writable and configurable. This is divided into two
// sets. The stable ones are those the shim can freeze early because
// we don't expect anyone will want to mutate them. The unstable ones
// are the ones that we correctly initialize to writable and
// configurable so that they can still be replaced or removed.
const stableGlobalPropertyNames = [
  // *** 18.2 Function Properties of the Global Object

  // 'eval', // comes from safeEval instead
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",

  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",

  // *** 18.3 Constructor Properties of the Global Object

  "Array",
  "ArrayBuffer",
  "Boolean",
  "DataView",
  // 'Date',  // Unstable
  // 'Error',  // Unstable
  "EvalError",
  "Float32Array",
  "Float64Array",
  // 'Function',  // comes from safeFunction instead
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Number",
  "Object",
  // 'Promise',  // Unstable
  // 'Proxy',  // Unstable
  "RangeError",
  "ReferenceError",
  // 'RegExp',  // Unstable
  // 'SharedArrayBuffer'  // removed on Jan 5, 2018
  "String",
  "SyntaxError",
  "TypeError",
  "Uint8Array",
  "Uint8ClampedArray",
  "Uint16Array",
  "Uint32Array",
  "URIError",

  // *** 18.4 Other Properties of the Global Object

  // 'Atomics', // removed on Jan 5, 2018
  "JSON",
  "Math",

  "escape",
  "unescape"
];

const unstableGlobalPropertyNames = [
  "Date",
  "Error",
  "Promise", // NOT ES5
  "RegExp",
  "Intl", // NOT ES5
];

export function getSharedGlobalDescs(
  unsafeGlobal: any,
  configurableGlobals = false
) {
  const descriptors: Record<string, PropertyDescriptor> = {};

  function describe(
    names: string[],
    writable: boolean,
    enumerable: boolean,
    configurable: boolean
  ) {
    for (const name of names) {
      const desc = getOwnPropertyDescriptor(unsafeGlobal, name);
      if (desc) {
        // Abort if an accessor is found on the unsafe global object
        // instead of a data property. We should never get into this
        // non standard situation.
        assert(
          "value" in desc,
          `unexpected accessor on global property: ${name}`
        );

        descriptors[name] = {
          value: desc.value,
          writable,
          enumerable,
          configurable,
        };
      }
    }
  }

  if (configurableGlobals) {
    describe(frozenGlobalPropertyNames, true, false, true);
    // The following is correct but expensive.
    describe(stableGlobalPropertyNames, true, false, true);
  } else {
    // Instead, for now, we let these get optimized.
    describe(frozenGlobalPropertyNames, false, false, false);
    describe(stableGlobalPropertyNames, false, false, false);
  }
  // These we keep replaceable and removable, because we expect
  // others, e.g., SES, may want to do so.
  describe(unstableGlobalPropertyNames, true, false, true);

  return descriptors;
}
