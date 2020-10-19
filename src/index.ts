import { buildCallAndWrapErrorString } from "./callAndWrapError";
import { repairAccessors } from "./repair/accessors";
import { repairFunctions } from "./repair/functions";
import { getSharedGlobalDescs } from "./stdlib";
import { safeStringifyFunction } from "./utilities";

export * from "./evaluators";

// The unsafeRec is shim-specific. It acts as the mechanism to obtain a fresh
// set of intrinsics together with their associated eval and Function
// evaluators. These must be used as a matched set, since the evaluators are
// tied to a set of intrinsics, aka the "undeniables". If it were possible to
// mix-and-match them from different contexts, that would enable some
// attacks.
export function createUnsafeRec(
  unsafeGlobal: Record<string, any>,
  allShims = [],
  configurableGlobals = false
) {
  const sharedGlobalDescs = getSharedGlobalDescs(
    unsafeGlobal,
    configurableGlobals
  );

  const unsafeEval = unsafeGlobal.eval;
  const unsafeFunction = unsafeGlobal.Function;
  const callAndWrapError = unsafeEval(buildCallAndWrapErrorString)();
  
  return Object.freeze({
    unsafeGlobal,
    sharedGlobalDescs,
    unsafeEval,
    unsafeFunction,
    callAndWrapError,
    allShims,
  });
}

const repairAccessorsString = safeStringifyFunction(repairAccessors);
const repairFunctionsString = safeStringifyFunction(repairFunctions);

// Create a new unsafeRec from a brand new context, with new intrinsics and a
// new global object
export function createNewUnsafeRec(unsafeGlobal: any, allShims = [], configurableGlobals = false) {
  const unsafeRec = createUnsafeRec(
    unsafeGlobal,
    allShims,
    configurableGlobals
  );
  const { unsafeEval } = unsafeRec;
  unsafeEval(repairAccessorsString)();
  unsafeEval(repairFunctionsString)();
  return unsafeRec;
}