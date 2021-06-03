import test from "tape"
import expect from "expect"

import { createNewUnsafeRec, createRealmRec, UnsafeRec } from "../src/index"

import { buildCallAndWrapErrorString } from "../src/callAndWrapError"

const unsafeRec: UnsafeRec = {
  unsafeGlobal: {} as any,
  unsafeEval: eval,
  unsafeFunction: Function,
  sharedGlobalDescs: {},
  callAndWrapError: (a: any, b: any) => {
    throw "stub"
  },
}

unsafeRec.callAndWrapError = unsafeRec.unsafeEval(buildCallAndWrapErrorString)()

test("eval() works", (t) => {
  t.plan(4)

  const rec = createRealmRec(createNewUnsafeRec(globalThis))

  Object.assign(rec.safeGlobal, Object.create(null))

  t.equal(rec.safeEval('eval("true")'), true)
  t.equal(rec.safeEval("setTimeout"), undefined, "setTimeout must not exist in empty context")
  t.equal(rec.safeEval('eval("setTimeout")'), undefined, "setTimeout must not exist in eval empty context")
  t.throws(() => rec.safeEval('eval("setTimeout()")'), "setTimeout call should fail")
})

test("eval() works with sourceURL", (t) => {
  t.plan(2)

  const rec = createRealmRec(createNewUnsafeRec(globalThis))

  Object.assign(rec.safeGlobal, Object.create(null))

  checkStack(t, `throw new Error("A");\n//# sourceURL=gamess.js`, /eval \(gamess.js:1:7\)/)
  checkStack(t, `eval('throw new Error("B");\\n//# sourceURL=test.js')`, /eval \(test.js:1:7\)/)
  checkStack(t, `eval('throw new Error("C")')`, /eval \(eval/)
})

function checkStack(t: test.Test, fn: string, regex: RegExp | string) {
  try {
    const rec = createRealmRec(createNewUnsafeRec(globalThis))
    Object.assign(rec.safeGlobal, Object.create(null))
    rec.safeEval(fn)
    t.error("did not fail")
  } catch (e) {
    expect(e.stack).toMatch(regex)
  }
}
