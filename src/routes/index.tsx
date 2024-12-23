/* eslint-disable react-refresh/only-export-components */
import { lazyLoader } from "../router_src/lazyLoader";

const indexLazyLoader = lazyLoader(() => import("./index.lazy"));
export const loadingState = indexLazyLoader.loadingState;
// @routeExport
export const MainLayout = indexLazyLoader.getComponent("MainLayout");
