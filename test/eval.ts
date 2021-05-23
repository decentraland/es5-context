import test from "tape";
import sinon from "sinon";

import {
  createNewUnsafeRec,
  createRealmRec,
  UnsafeRec,
} from "../src/index";

import { buildCallAndWrapErrorString } from "../src/callAndWrapError";

const unsafeRec: UnsafeRec = {
  unsafeGlobal: {} as any,
  unsafeEval: eval,
  unsafeFunction: Function,
  sharedGlobalDescs: {},
  callAndWrapError: (a: any, b: any) => {
    throw "stub";
  },
};

unsafeRec.callAndWrapError = unsafeRec.unsafeEval(
  buildCallAndWrapErrorString
)();

test("eval() works", (t) => {
  t.plan(4);

  const rec = createRealmRec(createNewUnsafeRec(globalThis))

  Object.assign(rec.safeGlobal, Object.create(null))

  t.equal(rec.safeEval('eval("true")'), true)
  t.equal(rec.safeEval('setTimeout'), undefined, 'setTimeout must not exist in empty context')
  t.equal(rec.safeEval('eval("setTimeout")'), undefined, 'setTimeout must not exist in eval empty context')
  t.throws(() => rec.safeEval('eval("setTimeout()")'), 'setTimeout call should fail')
});
