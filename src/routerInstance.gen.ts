// 350189d4c165c74d6d1e06a7edbc54d62559b606c6527758e0b8c4a1a0242658
import { checkValidRoute } from "./router_src/checkValidRoute";
import { lazySingleLoader } from "./router_src/lazyLoader";
import { RouteParams, Router } from "./router_src/Router";

export const {
	RouteLink,
	RouterRender,
	buildRouteLink,
	currentRoute,
	getRouteParams,
	isRouteLoaded,
	isRouteLoading,
	isRouteVisible,
	loadRouteFn,
	navigateToRouteFn,
	notFoundRoute,
	setRouterBaseRoute,
	setUseRouteTransition,
	updateCurrentRoute,
	useRoutes,
} = new Router(
	{
		[checkValidRoute("/about")]: lazySingleLoader(() => import("./routes/about"), "About"),
		[checkValidRoute("/hugePage")]: lazySingleLoader(() => import("./routes/hugePage"), "HugePage"),
		[checkValidRoute("?id")]: lazySingleLoader(() => import("./routes/index$id"), "IndexWithId"),
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
export type RouterParamsType<T extends RouterPathType> = RouteParams<T>;

updateCurrentRoute();
