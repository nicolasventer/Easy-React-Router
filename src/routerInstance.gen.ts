// c05589d94015e623fbd0f20b1b6ae3cf11adaf50b5dcee0c92795d68a3c2cc26
import { checkValidRoute, lazySingleLoader, type RouteParams, Router } from "easy-react-router";

export const {
	RouteCustomLink,
	RouteLink,
	RouterRender,
	useRouteRender,
	buildRouteLink,
	useCurrentRoute,
	useRouteParams,
	useLoadingState,
	useUrlState,
	loadRouteFn,
	navigateToCustomRouteFn,
	navigateToRouteFn,
	setRouterBaseRoute,
	setUseRouteTransition,
	updateCurrentRoute,
} = new Router(
	{
		[checkValidRoute("/about")]: lazySingleLoader(() => import("./routes/about"), "About"),
		[checkValidRoute("/hugePage")]: lazySingleLoader(() => import("./routes/hugePage"), "HugePage"),
		[checkValidRoute("?id")]: lazySingleLoader(() => import("./routes/index$id"), "IndexWithId"),
		[checkValidRoute("//")]: lazySingleLoader(() => import("./routes/index.index"), "Home"),
		[checkValidRoute("/")]: lazySingleLoader(() => import("./routes/index.lazy"), "MainLayout"),
		[checkValidRoute("/posts/:id")]: lazySingleLoader(() => import("./routes/posts.$id"), "PostWithId"),
		[checkValidRoute("/posts/3")]: lazySingleLoader(() => import("./routes/posts.3"), "PostWithId3"),
		[checkValidRoute("/posts/")]: lazySingleLoader(() => import("./routes/posts.index.index"), "PostWithoutId"),
		[checkValidRoute("/posts")]: lazySingleLoader(() => import("./routes/posts"), "PostsLayout"),
	},
	{
		[checkValidRoute("/")]: lazySingleLoader(() => import("./routes/404"), "NotFound"),
		[checkValidRoute("/posts")]: lazySingleLoader(() => import("./routes/posts.404"), "PostNotFound"),
	},
	true
);

/** The type of the route paths. */
export type RouterPathType = NonNullable<ReturnType<typeof useCurrentRoute>["currentRoute"]>;
/**
 * @template {string} RoutePath
 * Type of the parameters of a route path.
 * `params` is optional if the route has no parameters.
 * @example
 * type A = RouterParamsType<"/a/:b/c?d">; // { b: string; d?: string; }
 */
export type RouterParamsType<T extends RouterPathType> = RouteParams<T>;

updateCurrentRoute();
