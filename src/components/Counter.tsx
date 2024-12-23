/* eslint-disable react-refresh/only-export-components */
import { lazyLoader } from "easy-react-router";

const CounterLazyLoader = lazyLoader(() => import("./Counter.lazy"));
/** The function to load the module. */
export const load = CounterLazyLoader.load;
/** The loading state. */
export const loadingState = CounterLazyLoader.loadingState;
export const Counter = CounterLazyLoader.getComponent("Counter");
