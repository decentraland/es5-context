import test from "tape";
import { createNewUnsafeRec } from "../src";

declare var global: any;
declare var document: any;
const isBrowser = typeof document === "object";

test("createNewUnsafeRec", (t) => {
  t.plan(7);

  const unsafeRec = createNewUnsafeRec(globalThis);
  const {
    unsafeGlobal,
    sharedGlobalDescs,
    unsafeEval,
    unsafeFunction,
    allShims,
  } = unsafeRec;

  t.ok(Object.isFrozen(unsafeRec));

  // todo: more thorough test of descriptors.
  t.deepEqual(sharedGlobalDescs.Object, {
    value: unsafeGlobal.Object,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  t.equal(unsafeEval, unsafeGlobal.eval);
  t.deepEqual(unsafeFunction, unsafeGlobal.Function);
  t.deepEqual(allShims, []);

  t.ok(unsafeGlobal instanceof unsafeGlobal.Object, "global must be an Object");

  t.ok("then" in unsafeEval("Promise.resolve(1)"), "promise works");
});
