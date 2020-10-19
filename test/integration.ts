import test from "tape";
import sinon from "sinon";
import { createNewUnsafeRec, createRealmRec } from "../src";

test("integration 1, ES5 scope", (t) => {
  const rec = createRealmRec(createNewUnsafeRec(globalThis));

  t.ok("then" in rec.safeEval("Promise.resolve(1)"), "Promise is present");
  t.equals(rec.safeEval("Proxy"), undefined, "Proxy is not present");
  t.equals(rec.safeEval("process"), undefined, "process is not present");

  t.end();
});

test("integration 2, ES5 scope", (t) => {
  const rec = createRealmRec(createNewUnsafeRec(globalThis));

  rec.safeGlobal.aaa = 1;
  rec.safeGlobal.fetch = 444;
  rec.safeGlobal.WebSocket = 555;

  t.ok("then" in rec.safeEval("Promise.resolve(1)"), "Promise is present");
  t.equals(rec.safeEval("Proxy"), undefined, "Proxy is not present");
  t.equals(rec.safeEval("process"), undefined, "process is not present");
  t.equals(
    rec.safeEval("setInterval"),
    undefined,
    "setInterval is not present"
  );
  t.equals(rec.safeEval("setTimeout"), undefined, "setInterval is not present");
  t.equals(rec.safeEval("aaa"), 1, "injecting aaa from the outside works");
  t.equals(
    rec.safeEval("fetch"),
    444,
    "injecting fetch from the outside works"
  );
  t.equals(
    rec.safeEval("WebSocket"),
    555,
    "injecting WebSocket from the outside works"
  );
  t.ok(rec.safeEval("this.tres = 3"), "creating variable from eval");
  t.equals(rec.safeGlobal.tres, 3, "read variable from the outside");
  t.ok(
    rec.safeEval("function fn(){ return 1 };this.fn=fn"),
    "creating function from eval"
  );
  t.equals(rec.safeGlobal.fn(), 1, "call function from the outside");

  t.end();
});
