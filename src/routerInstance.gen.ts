// e50b3d2907bea197c92d6efd7a0bd895dc04d0262f58ceb384320751a8e45bc9
import { checkValidRoute } from "./router_src/checkValidRoute";
import { lazySingleLoader } from "./router_src/lazyLoader";
import { Router } from "./router_src/Router";

export const {
	NotFoundRouteRender,
	RouteLink,
	RouterRender,
	buildRouteLink,
	currentRoute,
	getRouteParams,
	getUseRouteTransition,
	isRouteLoaded,
	isRouteLoading,
	isRouteVisible,
	loadRouteFn,
	navigateToRouteFn,
	notFoundRoute,
	setUseRouteTransition,
	updateCurrentRoute,
	useRoutes,
} = new Router(
	{
		[checkValidRoute("/about")]: lazySingleLoader(() => import("./routes/about"), "About"),
		[checkValidRoute("/hugePage")]: lazySingleLoader(() => import("./routes/hugePage"), "HugePage"),
		[checkValidRoute(":id")]: lazySingleLoader(() => import("./routes/index$id"), "IndexWithId"),
		[checkValidRoute("//")]: lazySingleLoader(() => import("./routes/index.index"), "Home"),
		[checkValidRoute("/")]: lazySingleLoader(() => import("./routes/index"), "MainLayout"),
		[checkValidRoute("/posts/:id")]: lazySingleLoader(() => import("./routes/posts.$id"), "PostWithId"),
		[checkValidRoute("/posts/")]: lazySingleLoader(() => import("./routes/posts.index.index"), "PostWithoutId"),
		[checkValidRoute("/posts")]: lazySingleLoader(() => import("./routes/posts"), "PostsLayout"),
	},
	{
		[checkValidRoute("/")]: lazySingleLoader(() => import("./routes/404"), "NotFound"),
		[checkValidRoute("/posts")]: lazySingleLoader(() => import("./routes/posts.404"), "PostNotFound"),
	}
);

export type RouterPathType = typeof currentRoute.value;
export type RouterParamsType<T extends RouterPathType> = ReturnType<typeof getRouteParams>[T];

updateCurrentRoute();
