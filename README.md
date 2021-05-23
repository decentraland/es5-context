# @dcl/es5-context

This library is a "good enough" effort to sandbox as much as possible the context of the WebWorkers.

With the objective of migrating to a future light weight runtime for the scene code, we must keep our environment as small as possible. That is the reason why we chose to stick to the ES5 standard for our scenes.

## Usage

```bash
npm i -D @dcl/es5-context
```

```ts
import { createRealmRec, createNewUnsafeRec } from "@dcl/es5-context";

const rec = createRealmRec(createNewUnsafeRec(globalThis));

rec.safeGlobal.aaa = "test";
rec.safeGlobal.log = (msg) => {
  console.log(msg);
  return 1;
};

const result = rec.safeEval("log(`hi ${aaa}`)"); // prints "hi test"
// result == 1

rec.safeEval("console"); // undefined
rec.safeEval("Proxy"); // undefined
rec.safeEval("Promise"); // [Function: Promise]
```

### Publishing

This repository is automatically published on merge to master by oddish
