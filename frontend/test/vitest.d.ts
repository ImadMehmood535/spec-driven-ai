import 'vitest';

/**
 * jest-axe ships a Jest matcher; this teaches Vitest's expect about it so
 * `toHaveNoViolations()` is type-checked rather than `any`.
 */
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
