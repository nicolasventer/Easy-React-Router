// cad31e166e7f84fe5843818ba787f2c86551d5098b23228cd620c4c413740a20
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
		[checkValidRoute("/")]: lazySingleLoader(() => import("./routes/index"), "MainLayout"),
		[checkValidRoute("/posts/$id")]: lazySingleLoader(() => import("./routes/posts.$id"), "PostWithId"),
		[checkValidRoute("/posts")]: lazySingleLoader(() => import("./routes/posts"), "PostsLayout"),
		[checkValidRoute("/posts/")]: lazySingleLoader(() => import("./routes/posts._slash"), "PostWithoutId"),
		[checkValidRoute("//")]: lazySingleLoader(() => import("./routes/_slash"), "Home"),
	},
	{
		[checkValidRoute("/posts")]: lazySingleLoader(() => import("./routes/posts._notFound"), "PostNotFound"),
		[checkValidRoute("/")]: lazySingleLoader(() => import("./routes/_notFound"), "NotFound"),
	}
);

export type RouterPathType = typeof currentRoute.value;
export type RouterParamsType<T extends RouterPathType> = ReturnType<typeof getRouteParams>[T];

updateCurrentRoute();
