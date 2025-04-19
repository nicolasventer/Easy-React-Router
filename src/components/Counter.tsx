import { lazyLoader } from "easy-react-router";

export const CounterLazyLoader = lazyLoader(() => import("./Counter.lazy"));
export const Counter = CounterLazyLoader.getComponent("Counter");
