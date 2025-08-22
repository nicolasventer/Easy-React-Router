/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import type { LazySingleLoaderReturn, LoadingState } from "./lazyLoader";
import type { Store } from "./Store";
import { store } from "./Store";

/**
 * Type to split a path into its parts.
 * @template {string} T The type of the route paths.
 */
type SplitPath<T extends string, Prefix extends ":" | "?" | "/" | "" = ""> = T extends `${infer U}:${infer V}`
	? SplitPath<U, Prefix> | SplitPath<V, ":">
	: T extends `${infer U}?${infer V}`
	? SplitPath<U, Prefix> | SplitPath<V, "?">
	: T extends `${infer U}/${infer V}`
	? SplitPath<U, Prefix> | SplitPath<V, "/">
	: T extends ``
	? never
	: `${Prefix}${T}`;

/**
 * Type to get the parameters of a route path.
 * @template {string} T The type of the route paths.
 */
type RouteParams_<T extends string> = (SplitPath<T> & `:${string}` extends never
	? {}
	: {
			[K in SplitPath<T> & `:${string}` extends `:${infer L}` ? L : never]: string;
	  }) &
	(SplitPath<T> & `?${string}` extends never
		? {}
		: {
				[K in SplitPath<T> & `?${string}` extends `?${infer L}` ? L : never]?: string;
		  });

/** Type of a registered route. */
type RouteValue = LazySingleLoaderReturn<() => ReactNode>;

/**
 * Type to store the routes of the app. \
 * The keys are the paths of the routes and the values are the components of the routes.
 * @template {string} T The type of the route paths.
 */
type Routes<T extends string> = Record<T, RouteValue>;

/**
 * Type of the parameters of a route path.
 * `params` is optional if the route has no parameters.
 * @template {string} RoutePath The type of the route paths.
 * @example
 * type A = RouteParams<"/a/:b/c?d">; // { b: string; d?: string; }
 */
export type RouteParams<RoutePath extends string> = RouteParams_<RoutePath>;

/**
 * Type to get the route path that should be accessible to the public.
 * @template {string} RoutePath The type of the route paths.
 */
type PublicRoutePath<RoutePath extends string> = RoutePath extends "/"
	? "/"
	: RoutePath extends `${infer _}/`
	? never
	: RoutePath;

/**
 * Type of the parameters of the build link function. `params` is optional if the route has no parameters.
 * @template {string} RoutePath The type of the route paths.
 */
export type BuildLinkParams<RoutePath extends string> = keyof RouteParams<RoutePath> extends never
	? [path: RoutePath]
	: [path: RoutePath, params: RouteParams<RoutePath>];

/**
 * The props of the link component.
 * `params` is optional if the route has no parameters.
 * @template {string} RoutePath The type of the route paths.
 */
export type LinkProps<RoutePath extends string> = keyof RouteParams<RoutePath> extends never
	? {
			/** The path of the route to link to. */
			path: PublicRoutePath<RoutePath>;
			/** The parameters of the route. */
			params?: {};
	  }
	: {
			/** The path of the route to link to. */
			path: PublicRoutePath<RoutePath>;
			/** The parameters of the route. */
			params: RouteParams<RoutePath>;
	  };

/**
 * Type to get the subpaths of a route path.
 * @template {string} RoutePath The type of the route paths.
 * @example
 * type A = RoutePathWithSubPaths<"/a" | "/a/b/c">; // "/a"
 */
type RoutePathWithSubPaths<RoutePath extends string> = {
	[K in RoutePath]: K extends "/"
		? K
		: K extends `${infer _}/`
		? never
		: RoutePath extends `${K}${infer U}`
		? U extends ""
			? never
			: K
		: never;
}[RoutePath];

export const emptyRouteValue: RouteValue = {
	load: () => Promise.resolve(),
	Component: () => null,
	useLoading: () => "not loaded",
};

/**
 * Class that handles routing in a React app.
 * @template RoutePath The type of the route paths.
 */
export class Router<RoutePath extends string> {
	private routerBaseRoute = "";
	private useRouteTransition_ = true;
	private currentRoute_ = store<PublicRoutePath<RoutePath>>();
	private notFoundRoute_ = store<PublicRoutePath<RoutePath>>();
	private routeParams_ = store<RouteParams<RoutePath> | {}>({});
	// routes sorted by decreasing ':' then by alphabetical order then by decreasing length
	private routeRegexes: { path: RoutePath; regex: RegExp; keys: string[]; optionalKeys: string[] }[];
	private routesParentMap = new Map<RoutePath, PublicRoutePath<RoutePath>>(); // key is a path, value is the parent path

	// Signal that simulates the URL for the router instance. This should start with '/'.
	private urlStore: Store<string> | undefined;

	/**
	 * Creates a new router instance.
	 * @param routes The routes of the app with their components.
	 * @param notFoundRoutes The routes of the app that are displayed when the current route is not found.
	 * @param isGlobal Whether the router is global. If true, the router will use window.location.href to update the current route and will listen to popstate events.
	 */
	constructor(
		private routes: Routes<RoutePath>,
		private notFoundRoutes: Partial<Routes<RoutePathWithSubPaths<PublicRoutePath<RoutePath>>>>,
		isGlobal: boolean
	) {
		this.routeRegexes = Object.keys(routes)
			.sort((a, b) => {
				for (let i = 0; i < Math.min(a.length, b.length); i++) {
					const ca = a[i];
					const cb = b[i];
					if (ca === cb) continue;
					if (ca === ":") return 1;
					if (cb === ":") return -1;
					return ca.localeCompare(cb);
				}
				return b.length - a.length;
			})
			.map((path) => ({
				path: path as RoutePath,
				regex: new RegExp(
					`^${path
						// Replace :[^/]* with ([^/]+)
						.replace(/:[^/]*/g, "([^/]+)")
						// Replace start ? with /?
						.replace(/^\?/, "/?")
						// Replace ?.* with nothing
						.replace(/\?.*$/, "")}$`
				),
				keys: path.match(/:([^/]+)/g)?.map((s) => s.slice(1)) ?? [],
				optionalKeys: path.match(/\?([^/?]+)/g)?.map((s) => s.slice(1)) ?? [],
			}));

		for (const { path } of this.routeRegexes) {
			if (path === "/") continue;
			if (path.startsWith("?")) {
				this.routesParentMap.set(path, "/" as PublicRoutePath<RoutePath>); // we assume that "/" is always a RoutePath
				continue;
			}
			for (const { path: parentPath } of this.routeRegexes) {
				if (path === parentPath) continue;
				if (parentPath !== "/" && parentPath.endsWith("/")) continue;
				if (path.startsWith(parentPath)) {
					const oldParent = this.routesParentMap.get(path);
					if (oldParent && oldParent.length > parentPath.length) continue;
					this.routesParentMap.set(path, parentPath as PublicRoutePath<RoutePath>);
				}
			}
		}
		if (isGlobal)
			window.addEventListener("popstate", () => {
				if (this.useRouteTransition_) document.startViewTransition(() => flushSync(this.updateCurrentRoute));
				else this.updateCurrentRoute();
			});
		else this.urlStore = store<string>("");
	}

	/** Returns the URL state of the router, available only if the router is local. */
	useUrlState = () => {
		if (!this.urlStore) throw new Error("Router is global");
		return this.urlStore.useState();
	};

	/**
	 * @deprecated (set as deprecated to discourage use) \
	 * Returns the URL state of the router, available only if the router is local.
	 */
	getUrlStore = () => this.urlStore;

	/** Sets the base route of the router, should be called in the root file of the app (that call render and import the Main Layout component). */
	setRouterBaseRoute = (value: string) => {
		if (this.routerBaseRoute === value) return;
		this.routerBaseRoute = value;
		this.updateCurrentRoute();
	};

	/** Sets if the router should use transitions when navigating to a new route. */
	setUseRouteTransition = (value: boolean) => (this.useRouteTransition_ = value);

	/** Updates the current route based on the current URL. It is called automatically when the app starts and when {@link navigateToRouteFn} is called. */
	updateCurrentRoute = () => {
		const urlSignalSlash = this.urlStore?.value?.startsWith("/") ? "" : "/";
		const url = this.urlStore?.value
			? new URL(`http://x${this.routerBaseRoute}${urlSignalSlash}${this.urlStore.value}`)
			: new URL(window.location.href);
		const path = url.pathname.replace(this.routerBaseRoute, "").replace(/\/$/, "") || "/";
		let routeRegex = this.routeRegexes.find(
			({ regex, optionalKeys }) => (url.search === "") === (optionalKeys.length === 0) && regex.test(path)
		);
		routeRegex ??= this.routeRegexes.find(({ regex }) => regex.test(path));
		if (!routeRegex) {
			const sortedSubPathArray = Object.keys(this.routes)
				.filter((a) => a === "/" || !a.endsWith("/"))
				.sort((a, b) => b.length - a.length);
			const sortedSubPath = sortedSubPathArray.find((subPath) => path.startsWith(subPath));
			this.currentRoute_.value = undefined;
			this.notFoundRoute_.value = sortedSubPath as PublicRoutePath<RoutePath>;
			this.routeParams_.value = {};
			return;
		}
		this.currentRoute_.value = routeRegex.path as PublicRoutePath<RoutePath>;
		this.notFoundRoute_.value = undefined;
		const params = path.match(routeRegex.regex)!.slice(1);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const routeParams = {} as any;
		routeRegex.keys.forEach((key, i) => (routeParams[key] = params[i]));
		const searchParams = new URLSearchParams(url.search);
		searchParams.forEach((value, key) => (routeParams[key] = value));
		this.routeParams_.value = routeParams ?? {};
	};

	/** Returns the current route and the not found route and a function to check if a route is visible. */
	useCurrentRoute = () => ({
		currentRoute: this.currentRoute_.use(),
		notFoundRoute: this.notFoundRoute_.use(),
		isRouteVisible: this.isRouteVisible,
	});

	/**
	 * @deprecated (set as deprecated to discourage use) \
	 * Returns the current route store.
	 */
	getCurrentRouteStore = () => this.currentRoute_;

	/**
	 * @deprecated (set as deprecated to discourage use) \
	 * Returns the not found route store.
	 */
	getNotFoundRouteStore = () => this.notFoundRoute_;

	/** The parameters of the current route. */
	useRouteParams = <T extends PublicRoutePath<RoutePath>>(_: T) => this.routeParams_.use() as RouteParams<T>;

	/**
	 * @deprecated (set as deprecated to discourage use) \
	 * Returns the parameters of the current route.
	 */
	getRouteParams = <T extends PublicRoutePath<RoutePath>>(_: T) => this.routeParams_.value as RouteParams<T>;

	/**
	 * @deprecated (set as deprecated to discourage use) \
	 * Whether the current route is visible.
	 */
	isRouteVisible = <T extends PublicRoutePath<RoutePath>>(path: T) =>
		path === "/" || path.startsWith("?")
			? (this.currentRoute_.value ?? this.notFoundRoute_.value) === path
			: (this.currentRoute_.value ?? this.notFoundRoute_.value)?.startsWith(path);

	useLoadingState = () => {
		const loadingState = Object.fromEntries(
			Object.entries(this.routes).map(([path, route]) => [path, (route as RouteValue).useLoading()])
		) as Record<RoutePath, LoadingState>;

		return {
			/** Whether the route is loading. */
			isRouteLoading: (path: PublicRoutePath<RoutePath>) => loadingState[path as RoutePath] === "loading",
			/** Whether the route is loaded. */
			isRouteLoaded: (path: PublicRoutePath<RoutePath>) => loadingState[path as RoutePath] === "loaded",
		};
	};

	/** Builds a link to a route. */
	buildRouteLink = <T extends PublicRoutePath<RoutePath>>(...params: BuildLinkParams<T>) => {
		const [path, p] = params;
		if (!p) return `${this.routerBaseRoute}${path}`;
		const routeRegex = this.routeRegexes.find(({ path: p }) => p === (path as unknown as RoutePath));
		if (!routeRegex) return `${this.routerBaseRoute}${path}`; // Should never happen
		let result: string = path;
		for (const key of routeRegex.keys) {
			const value = p[key as keyof typeof p] as string | undefined;
			if (!value) throw new Error(`Missing param ${key}`);
			result = result.replace(`:${key}`, encodeURIComponent(value));
		}
		const searchParams = new URLSearchParams();
		for (const key of routeRegex.optionalKeys) {
			const value = p[key as keyof typeof p] as string | undefined;
			if (value) searchParams.set(key, value);
			result = result.replace(`?${key}`, "");
		}
		if (result === "") result = "/";
		const search = searchParams.toString();
		if (search) result += `?${search}`;
		return `${this.routerBaseRoute}${result}`;
	};

	/**
	 * Starts loading a route if it is not already loaded.
	 * @param path The path of the route to load.
	 * @returns A function that starts loading the route and returns a promise that resolves when the route is loaded.
	 */
	loadRouteFn =
		<T extends PublicRoutePath<RoutePath>>(path: T) =>
		() =>
			this.routes[path as unknown as RoutePath]?.load();

	/**
	 * Navigates to a route.
	 * @param params The path and parameters of the route to navigate to.
	 * @returns A function that navigates to the route using the current route transition setting.
	 */
	navigateToRouteFn =
		<T extends PublicRoutePath<RoutePath>>(...params: BuildLinkParams<T>) =>
		(ev?: { preventDefault: () => void }) => {
			ev?.preventDefault();
			const navigateFn = () => {
				const [path, p] = params;
				this.currentRoute_.value = path;
				this.routeParams_.value = p ?? {};
				const link = this.buildRouteLink(...(params as BuildLinkParams<T>));
				const link2 = link === "//" ? "/" : link; // this is a hack
				if (this.urlStore) this.urlStore.value = link2;
				else window.history.pushState({}, "", link2 || "/");
			};
			if (this.useRouteTransition_) document.startViewTransition(() => flushSync(navigateFn));
			else navigateFn();
		};

	/**
	 * Navigates to a URL and updates the current route.
	 * @param url The URL to navigate to.
	 * @returns A function that navigates to the URL using the current route transition setting.
	 */
	navigateToCustomRouteFn = (url: string) => (ev?: { preventDefault: () => void }) => {
		ev?.preventDefault();
		const navigateFn = () => {
			if (this.urlStore) this.urlStore.value = url;
			else {
				window.history.pushState({}, "", url);
				this.updateCurrentRoute();
			}
		};
		if (this.useRouteTransition_) document.startViewTransition(() => flushSync(navigateFn));
		else navigateFn();
	};

	/**
	 * The component that renders a link to a route.
	 * @param props The props of the link component. \
	 * Default href is buildRouteLink(path, params), onClick is navigateToRouteFn(path, params).
	 * @returns
	 */
	RouteLink = <T extends PublicRoutePath<RoutePath>>({
		path,
		params,
		children,
		href = this.buildRouteLink(...([path, params] as unknown as BuildLinkParams<T>)),
		onClick = this.navigateToRouteFn(...([path, params] as unknown as BuildLinkParams<T>)),
		...props
	}: LinkProps<T> & ComponentPropsWithoutRef<"a">) => (
		<a {...props} href={href} onClick={onClick}>
			{children}
		</a>
	);

	/** The component that renders a link to a custom URL. */
	RouteCustomLink = ({ url, children, ...props }: { url: string } & ComponentPropsWithoutRef<"a">) => (
		<a {...props} href={url} onClick={this.navigateToCustomRouteFn(url)}>
			{children}
		</a>
	);

	private getComponentToRender = (subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>>) => {
		const p = this.currentRoute_.value ?? (this.notFoundRoute_.value === subPath ? undefined : this.notFoundRoute_.value);
		if (!p) return undefined;
		if (subPath === p) {
			const SlashComp = this.routes[`${p}/` as RoutePath]?.Component;
			if (SlashComp) return SlashComp;
			const p_ = p === "/" ? "" : p;
			for (const [path, { Component }] of Object.entries<RouteValue>(this.routes))
				if (path.startsWith(`${p_}?`)) return Component;
			return undefined;
		}
		let result = p;
		let parent = this.routesParentMap.get(result as RoutePath);
		while (parent && parent !== subPath) {
			result = parent;
			parent = this.routesParentMap.get(result as RoutePath);
		}
		if (parent === subPath) return this.routes[result as RoutePath]?.Component;
		return undefined;
	};

	/**
	 * Hook that returns the component to render based on the current route. \
	 * Unless the rendered component is needed (like for setting key), it is recommended to use {@link RouterRender} instead.
	 * @param subPath The subpath of the router to render, i.e. the path of the route layout.
	 * @returns The component that renders the current route.
	 */
	useRouteRender = (subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>>) => {
		const url = this.urlStore?.use();
		const currentRoute = this.currentRoute_.use();
		useEffect(() => {
			if (this.urlStore) {
				this.updateCurrentRoute();
			}
		}, [url]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
		const Component = useCallback(this.getComponentToRender(subPath) ?? this.NotFoundRouteRender({ subPath }), [
			currentRoute,
			subPath,
		]);
		return Component;
	};

	/**
	 * The component whose render depends on the current route.
	 * @param params
	 * @param params.subPath The subpath of the router to render, i.e. the path of the route layout.
	 * @returns The component that renders the current route.
	 */
	RouterRender = ({ subPath }: { subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>> }) => {
		const Component = this.useRouteRender(subPath);
		return <Component />;
	};

	private NotFoundRouteRender = ({ subPath }: { subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>> }) =>
		this.notFoundRoutes[subPath]?.Component ?? (() => null);
}
