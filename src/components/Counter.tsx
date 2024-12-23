/* eslint-disable react-refresh/only-export-components */
import { lazyLoader } from "../router_src/lazyLoader";

const CounterLazyLoader = lazyLoader(() => import("./Counter.lazy"));
export const loadingState = CounterLazyLoader.loadingState;
export const Counter = CounterLazyLoader.getComponent("Counter");
