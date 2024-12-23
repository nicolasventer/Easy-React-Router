/* eslint-disable no-mixed-spaces-and-tabs */
import { batch, signal, type ReadonlySignal } from "@preact/signals";
import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { clientEnv } from "../clientEnv";
import { LazySingleLoaderReturn } from "./lazyLoader";
import { MultiIf } from "./MultiIf";
import { useReact } from "./useReact";

type SplitSlashOrDollar<T extends string, Prefix extends "$" | "/$" | "/" | "" = ""> = T extends `${infer U}/$${infer V}`
	? SplitSlashOrDollar<U, Prefix> | SplitSlashOrDollar<V, "/$">
	: T extends `${infer U}/${infer V}`
	? SplitSlashOrDollar<U, Prefix> | SplitSlashOrDollar<V, "/">
	: T extends `${infer U}$${infer V}`
	? SplitSlashOrDollar<U, Prefix> | SplitSlashOrDollar<V, "$">
	: T extends ``
	? never
	: `${Prefix}${T}`;

type RouteParams_<T extends string> = (SplitSlashOrDollar<T> & `/$${string}` extends never
	? {}
	: {
			[K in SplitSlashOrDollar<T> & `/$${string}` extends `/$${infer L}` ? L : never]: string;
	  }) &
	(SplitSlashOrDollar<T> & `$${string}` extends never
		? {}
		: {
				[K in SplitSlashOrDollar<T> & `$${string}` extends `$${infer L}` ? L : never]?: string;
		  });

type Routes<T extends string> = Record<T, LazySingleLoaderReturn<() => ReactNode>>;

export type RouteParams<RoutePath extends string> = RouteParams_<RoutePath>;

type PublicRoutePath<RoutePath extends string> = RoutePath extends "/"
	? "/"
	: RoutePath extends `${infer _}/`
	? never
	: RoutePath;

type BuildLinkParams<RoutePath extends string> = keyof RouteParams<RoutePath> extends never
	? [path: RoutePath]
	: [path: RoutePath, params: RouteParams<RoutePath>];

export type LinkProps<RoutePath extends string> = keyof RouteParams<RoutePath> extends never
	? { path: PublicRoutePath<RoutePath>; params?: {} }
	: { path: PublicRoutePath<RoutePath>; params: RouteParams<RoutePath> };

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

const ROUTER_BASE_ROUTE = clientEnv.BASE_URL;

export class Router<RoutePath extends string> {
	private currentRoute_ = signal<RoutePath>();
	private notFoundRoute_ = signal<RoutePath>();
	private routeParams_ = signal<RouteParams<RoutePath> | {}>({});
	// routes sorted by increasing length and then by decreasing ending slash
	private sortedRoutes: {
		conditionFn: (p: PublicRoutePath<RoutePath>, subPath: PublicRoutePath<RoutePath>) => boolean;
		Then: () => ReactNode;
	}[];
	private routeRegexes: { path: RoutePath; regex: RegExp; keys: string[]; optionalKeys: string[] }[];

	constructor(
		private routes: Routes<RoutePath>,
		private notFoundRoutes: Partial<Routes<RoutePathWithSubPaths<RoutePath>>>,
		private useRouteTransition_ = true
	) {
		this.sortedRoutes = Object.entries(routes)
			.sort(([a], [b]) => a.length - b.length)
			.sort(([a], [b]) => Number(a.endsWith("/")) - Number(b.endsWith("/")))
			.map(([path, loader]) => ({
				conditionFn: (p, subPath) => {
					if (subPath !== "/" && path === "/") return p === "/";
					return p && subPath !== path && `${p}/`.startsWith(path);
				},
				Then: (loader as Routes<RoutePath>[RoutePath]).Component,
			}));
		this.routeRegexes = Object.keys(routes).map((path) => ({
			path: path as RoutePath,
			regex: new RegExp(
				`^${path
					// Replace /$[^/]* with /([^/]+)
					.replace(/\/\$[^/]*$/, "/([^/]+)")
					// Replace $.* with nothing
					.replace(/\$.*$/, "")}$`
			),
			keys: path.match(/\/\$([^/]+)/g)?.map((s) => s.slice(2)) ?? [],
			optionalKeys:
				path
					.match(/\/?\$([^/$]+)/g)
					?.filter((s) => s[0] !== "/")
					.map((s) => s.slice(1)) ?? [],
		}));
		window.addEventListener("popstate", () => this.updateCurrentRoute());
	}

	useRoutes = () => {
		useReact(this.currentRoute_);
		useReact(this.notFoundRoute_);
		useReact(this.routeParams_);
		// eslint-disable-next-line react-hooks/rules-of-hooks
		for (const route of Object.values(this.routes)) useReact((route as LazySingleLoaderReturn<() => ReactNode>).loadingState);
		return null;
	};

	getUseRouteTransition = () => this.useRouteTransition_;

	setUseRouteTransition = (value: boolean) => (this.useRouteTransition_ = value);

	updateCurrentRoute = () => {
		const path = window.location.pathname.replace(ROUTER_BASE_ROUTE, "");
		const routeRegex = this.routeRegexes.find(({ regex }) => regex.test(path));
		if (!routeRegex) {
			const sortedSubPathArray = Object.keys(this.routes)
				.sort((a, b) => b.length - a.length)
				.filter((a) => a === "/" || !a.endsWith("/"));
			const sortedSubPath = sortedSubPathArray.find((subPath) => path.startsWith(subPath));
			this.currentRoute_.value = undefined;
			this.notFoundRoute_.value = sortedSubPath as RoutePath;
			this.routeParams_.value = {};
			return;
		}
		this.currentRoute_.value = routeRegex.path;
		this.notFoundRoute_.value = undefined;
		const params = path.match(routeRegex.regex)!.slice(1);
		const routeParams = {} as any;
		routeRegex.keys.forEach((key, i) => (routeParams[key] = params[i]));
		const searchParams = new URLSearchParams(window.location.search);
		searchParams.forEach((value, key) => (routeParams[key] = value));
		this.routeParams_.value = routeParams ?? {};
	};

	currentRoute = this.currentRoute_ as ReadonlySignal<PublicRoutePath<RoutePath>>;

	notFoundRoute = this.notFoundRoute_ as ReadonlySignal<PublicRoutePath<RoutePath>>;

	getRouteParams = <T extends PublicRoutePath<RoutePath>>(_: T) => this.routeParams_ as ReadonlySignal<RouteParams<T>>;

	isRouteVisible = <T extends PublicRoutePath<RoutePath>>(path: T) =>
		path === "/" || path === "//"
			? (this.currentRoute_.value ?? this.notFoundRoute_.value) === "/"
			: (this.currentRoute_.value ?? this.notFoundRoute_.value)?.startsWith(path);

	isRouteLoading = (path: PublicRoutePath<RoutePath>) =>
		path !== "/" && this.routes[path as RoutePath].loadingState.value === "loading";

	isRouteLoaded = (path: PublicRoutePath<RoutePath>) =>
		path === "/" || this.routes[path as RoutePath].loadingState.value === "loaded";

	buildRouteLink = <T extends PublicRoutePath<RoutePath>>(...params: BuildLinkParams<T>) => {
		const [path, p] = params;
		if (!p) return `${ROUTER_BASE_ROUTE}${path}`;
		const routeRegex = this.routeRegexes.find(({ path: p }) => p === (path as unknown as RoutePath));
		if (!routeRegex) return `${ROUTER_BASE_ROUTE}${path}`; // Should never happen
		let result: string = path;
		for (const key of routeRegex.keys) {
			const value = p[key as keyof typeof p] as string | undefined;
			if (!value) throw new Error(`Missing param ${key}`);
			result = result.replace(`$${key}`, encodeURIComponent(value));
		}
		const searchParams = new URLSearchParams();
		for (const key of routeRegex.optionalKeys) {
			const value = p[key as keyof typeof p] as string | undefined;
			if (value) searchParams.set(key, value);
			result = result.replace(`$${key}`, "");
		}
		const search = searchParams.toString();
		if (search) result += `?${search}`;
		return `${ROUTER_BASE_ROUTE}${result}`;
	};

	loadRouteFn =
		<T extends PublicRoutePath<RoutePath>>(path: T) =>
		() =>
			this.routes[path as unknown as RoutePath].load();

	navigateToRouteFn =
		<T extends PublicRoutePath<RoutePath>>(...params: BuildLinkParams<T>) =>
		(ev?: Event) => {
			ev?.preventDefault();
			const navigateFn = () => {
				const [path, p] = params;
				batch(() => {
					this.currentRoute_.value = path as unknown as RoutePath;
					this.routeParams_.value = (p as unknown as RouteParams<RoutePath>) ?? {};
				});
				const link = this.buildRouteLink(...(params as BuildLinkParams<T>));
				const link2 = link === "//" ? "/" : link; // this is a hack
				window.history.pushState({}, "", link2 || "/");
			};
			if (this.useRouteTransition_) document.startViewTransition(() => flushSync(navigateFn));
			else navigateFn();
		};

	RouteLink = <T extends PublicRoutePath<RoutePath>>({
		path,
		params,
		children,
		...props
	}: LinkProps<T> & ComponentPropsWithoutRef<"a">) => (
		<a
			{...props}
			href={this.buildRouteLink(...([path, params] as unknown as BuildLinkParams<T>))}
			onClick={this.navigateToRouteFn(...([path, params] as unknown as BuildLinkParams<T>))}
		>
			{children}
		</a>
	);

	RouterRender = ({ subPath }: { subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>> }) => (
		<>
			{this.useRoutes()}
			<MultiIf
				branches={this.sortedRoutes.map(({ conditionFn, Then }) => ({
					condition: conditionFn(
						this.currentRoute.value ?? (this.notFoundRoute_.value === subPath ? undefined : this.notFoundRoute_.value),
						subPath
					),
					then: <Then />,
				}))}
				else={<this.NotFoundRouteRender subPath={subPath} />}
			/>
		</>
	);

	NotFoundRouteRender = ({ subPath }: { subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>> }) =>
		this.notFoundRoutes[subPath]?.Component() ?? null;
}
