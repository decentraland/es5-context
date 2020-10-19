import { safeStringifyFunction } from "./utilities";

export type TransformResult = {
  src: string;
  endowments: any;
};

export type CodeTransform = {
  rewrite: null;
};

export function applyTransforms(
  rewriterState: TransformResult,
  transforms: CodeTransform[]
) {
  const { create, getOwnPropertyDescriptors } = Object;
  const { apply } = Reflect;
  const uncurryThis = <T extends (this: V, ...args: any) => any, V>(fn: T) => (
    thisArg: ThisParameterType<T>,
    ...args: Parameters<T>
  ): ReturnType<T> => apply(fn, thisArg, args);
  const arrayReduce: any = uncurryThis(Array.prototype.reduce);

  // Clone before calling transforms.
  rewriterState = {
    src: `${rewriterState.src}`,
    endowments: create(
      null,
      getOwnPropertyDescriptors(rewriterState.endowments)
    ),
  };

  // Rewrite the source, threading through rewriter state as necessary.
  rewriterState = arrayReduce(
    transforms,
    (rs: any, transform: any) =>
      transform.rewrite ? transform.rewrite(rs) : rs,
    rewriterState
  );

  // Clone after transforms
  rewriterState = {
    src: `${rewriterState.src}`,
    endowments: create(
      null,
      getOwnPropertyDescriptors(rewriterState.endowments)
    ),
  };

  return rewriterState;
}

export const applyTransformsString = safeStringifyFunction(applyTransforms);
