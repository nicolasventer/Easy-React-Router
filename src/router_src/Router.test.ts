import { describe, expect, test } from "bun:test";

// ========= copy from Router.ts =========

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

type SplitPath<T extends string, Prefix extends ":" | "?" | "/" | "" = ""> = T extends `${infer U}:${infer V}`
	? SplitPath<U, Prefix> | SplitPath<V, ":">
	: T extends `${infer U}?${infer V}`
	? SplitPath<U, Prefix> | SplitPath<V, "?">
	: T extends `${infer U}/${infer V}`
	? SplitPath<U, Prefix> | SplitPath<V, "/">
	: T extends ``
	? never
	: `${Prefix}${T}`;

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

type PublicRoutePath<RoutePath extends string> = RoutePath extends "/"
	? "/"
	: RoutePath extends `${infer _}/`
	? never
	: RoutePath;

type BuildLinkParams<RoutePath extends string> = keyof RouteParams_<RoutePath> extends never
	? [path: RoutePath]
	: [path: RoutePath, params: RouteParams_<RoutePath>];

// ========= data =========

const routes = [
	"/about",
	"/hugePage",
	"?id",
	"//",
	"/",
	"/posts/:id",
	"/posts/",
	"/posts",
	"/client/:id/:name",
	"/client?name?age",
	"/client",
	"/client/",
] as const;

type RoutePath = (typeof routes)[number];

type SubPath = RoutePathWithSubPaths<RoutePath>;

const notFoundRoutes = ["/", "/posts", "/client"] as const satisfies SubPath[];

// ========= computed data =========

const routeRegexes = [...routes]
	.sort((a, b) => a.length - b.length)
	.sort((a, b) => Number(a.endsWith("/")) - Number(b.endsWith("/")))
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

const sortedRoutes = routeRegexes.map(({ path }) => ({
	conditionFn: (p: RoutePath | undefined, subPath: SubPath) => {
		if (subPath !== "/" && path === "/") return p === "/";
		return !!p && subPath !== path && `${p}/`.startsWith(path);
	},
	Then: path,
}));

// ========= functions to test =========

type CurrentRouteOutput<T extends RoutePath> = {
	currentRoute: PublicRoutePath<T> | undefined;
	notFoundRoute: SubPath | undefined;
	routeParams: RouteParams_<T> | {};
};

const getCurrentRoute = <T extends RoutePath>(pathname: string): CurrentRouteOutput<T> => {
	const url = new URL("http://www.localhost.com" + pathname);
	const path = url.pathname.replace(/\/$/, "") || "/";
	let routeRegex = routeRegexes.find(
		({ regex, optionalKeys }) => (url.search === "") === (optionalKeys.length === 0) && regex.test(path)
	);
	routeRegex ??= routeRegexes.find(({ regex }) => regex.test(path));
	if (!routeRegex) {
		const sortedSubPathArray = routes.filter((a) => a === "/" || !a.endsWith("/")).sort((a, b) => b.length - a.length);
		const sortedSubPath = sortedSubPathArray.find((subPath) => path.startsWith(subPath));
		return { currentRoute: undefined, notFoundRoute: sortedSubPath as SubPath, routeParams: {} };
	}
	const params = path.match(routeRegex.regex)!.slice(1);
	const routeParams = {} as any;
	routeRegex.keys.forEach((key, i) => (routeParams[key] = params[i]));
	const searchParams = url.searchParams;
	searchParams.forEach((value, key) => (routeParams[key] = value));
	return { currentRoute: routeRegex.path as PublicRoutePath<T>, notFoundRoute: undefined, routeParams };
};

const isRouteVisible = <T extends PublicRoutePath<RoutePath>>(
	path: T,
	{ currentRoute, notFoundRoute }: Omit<CurrentRouteOutput<RoutePath>, "routeParams">
) =>
	path === "/" || path.startsWith("?")
		? (currentRoute ?? notFoundRoute) === path
		: (currentRoute ?? notFoundRoute)?.startsWith(path);

const buildRouteLink = <T extends PublicRoutePath<RoutePath>>(...params: BuildLinkParams<T>) => {
	const [path, p] = params;
	if (!p) return `${path}`;
	const routeRegex = routeRegexes.find(({ path: p }) => p === (path as unknown as RoutePath));
	if (!routeRegex) return `${path}`; // Should never happen
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
	return `${result}`;
};

const MultiIf = ({ branches, else: else_ }: { branches: { condition: boolean; then: RoutePath }[]; else?: RoutePath }) => {
	const branch = branches.find((branch) => branch.condition);
	return branch?.then ?? else_;
};

const RouterRender = ({
	currentRoute,
	notFoundRoute,
	subPath,
}: { subPath: RoutePathWithSubPaths<PublicRoutePath<RoutePath>> } & Omit<CurrentRouteOutput<RoutePath>, "routeParams">) =>
	MultiIf({
		branches: sortedRoutes.map(({ conditionFn, Then }) => ({
			condition: conditionFn(currentRoute ?? (notFoundRoute === subPath ? undefined : notFoundRoute), subPath),
			then: Then,
		})),
		else: notFoundRoutes.find((path) => path === subPath),
	});

// ========= tests =========

describe("Router", () => {
	test("getCurrentRoute", () => {
		expect(getCurrentRoute("/")).toEqual({ currentRoute: "/", notFoundRoute: undefined, routeParams: {} });
		expect(getCurrentRoute("/about")).toEqual({ currentRoute: "/about", notFoundRoute: undefined, routeParams: {} });
		expect(getCurrentRoute("/posts")).toEqual({ currentRoute: "/posts", notFoundRoute: undefined, routeParams: {} });
		expect(getCurrentRoute("/posts/")).toEqual({ currentRoute: "/posts", notFoundRoute: undefined, routeParams: {} });
		expect(getCurrentRoute("/posts/123")).toEqual({
			currentRoute: "/posts/:id",
			notFoundRoute: undefined,
			routeParams: { id: "123" },
		});
		expect(getCurrentRoute("/posts/123/")).toEqual({
			currentRoute: "/posts/:id",
			notFoundRoute: undefined,
			routeParams: { id: "123" },
		});
		expect(getCurrentRoute("/posts/123?name=abc")).toEqual({
			currentRoute: "/posts/:id",
			notFoundRoute: undefined,
			routeParams: { id: "123", name: "abc" },
		});
		expect(getCurrentRoute("/posts/123/?name=abc")).toEqual({
			currentRoute: "/posts/:id",
			notFoundRoute: undefined,
			routeParams: { id: "123", name: "abc" },
		});
		expect(getCurrentRoute("/client/123/abc")).toEqual({
			currentRoute: "/client/:id/:name",
			notFoundRoute: undefined,
			routeParams: { id: "123", name: "abc" },
		});
		expect(getCurrentRoute("/client/123/abc/")).toEqual({
			currentRoute: "/client/:id/:name",
			notFoundRoute: undefined,
			routeParams: { id: "123", name: "abc" },
		});
		expect(getCurrentRoute("/client?name=abc")).toEqual({
			currentRoute: "/client?name?age",
			notFoundRoute: undefined,
			routeParams: { name: "abc" },
		});
		expect(getCurrentRoute("/client?age=123&name=abc")).toEqual({
			currentRoute: "/client?name?age",
			notFoundRoute: undefined,
			routeParams: { name: "abc", age: "123" },
		});
		expect(getCurrentRoute("/client/?name=abc")).toEqual({
			currentRoute: "/client?name?age",
			notFoundRoute: undefined,
			routeParams: { name: "abc" },
		});
	});
	test("isRouteVisible", () => {
		expect(isRouteVisible("/", { currentRoute: "/", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/", { currentRoute: undefined, notFoundRoute: "/" })).toBe(true);
		expect(isRouteVisible("?id", { currentRoute: "?id", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/", { currentRoute: "?id", notFoundRoute: undefined })).toBe(false);
		expect(isRouteVisible("/", { currentRoute: "/about", notFoundRoute: undefined })).toBe(false);
		expect(isRouteVisible("/posts", { currentRoute: "/posts", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/posts", { currentRoute: undefined, notFoundRoute: "/posts" })).toBe(true);
		expect(isRouteVisible("/posts", { currentRoute: "/", notFoundRoute: undefined })).toBe(false);
		expect(isRouteVisible("/posts/:id", { currentRoute: "/posts/:id", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/posts", { currentRoute: "/posts/:id", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/client", { currentRoute: "/client/:id/:name", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/client", { currentRoute: "/client?name?age", notFoundRoute: undefined })).toBe(true);
		expect(isRouteVisible("/client?name?age", { currentRoute: "/client/:id/:name", notFoundRoute: undefined })).toBe(false);
		expect(isRouteVisible("/client/:id/:name", { currentRoute: "/client?name?age", notFoundRoute: undefined })).toBe(false);
	});
	test("buildRouteLink", () => {
		expect(buildRouteLink("/")).toBe("/");
		expect(buildRouteLink("?id", {})).toBe("/");
		expect(buildRouteLink("?id", { id: "123" })).toBe("/?id=123");
		expect(buildRouteLink("/about")).toBe("/about");
		expect(buildRouteLink("/posts")).toBe("/posts");
		expect(buildRouteLink("/posts/:id", { id: "123" })).toBe("/posts/123");
		expect(buildRouteLink("/client/:id/:name", { id: "123", name: "abc" })).toBe("/client/123/abc");
		expect(buildRouteLink("/client?name?age", { name: "abc" })).toBe("/client?name=abc");
		expect(buildRouteLink("/client?name?age", { age: "123", name: "abc" })).toBe("/client?name=abc&age=123");
		expect(buildRouteLink("/client?name?age", { name: "abc", age: "123" })).toBe("/client?name=abc&age=123");
	});
	test("RouterRender", () => {
		expect(RouterRender({ subPath: "/", currentRoute: "/", notFoundRoute: undefined })).toBe("//");
		expect(RouterRender({ subPath: "/", currentRoute: undefined, notFoundRoute: "/" })).toBe("/");
		expect(RouterRender({ subPath: "/", currentRoute: "?id", notFoundRoute: undefined })).toBe("?id");
		expect(RouterRender({ subPath: "/", currentRoute: "/about", notFoundRoute: undefined })).toBe("/about");
		expect(RouterRender({ subPath: "/", currentRoute: "/posts", notFoundRoute: undefined })).toBe("/posts");
		expect(RouterRender({ subPath: "/posts", currentRoute: "/posts", notFoundRoute: undefined })).toBe("/posts/");
		expect(RouterRender({ subPath: "/posts", currentRoute: "/posts/:id", notFoundRoute: undefined })).toBe("/posts/:id");
		expect(RouterRender({ subPath: "/posts", currentRoute: undefined, notFoundRoute: "/posts" })).toBe("/posts");
		expect(RouterRender({ subPath: "/", currentRoute: "/posts/:id", notFoundRoute: undefined })).toBe("/posts");
		expect(RouterRender({ subPath: "/", currentRoute: "/client", notFoundRoute: undefined })).toBe("/client");
		expect(RouterRender({ subPath: "/", currentRoute: "/client/:id/:name", notFoundRoute: undefined })).toBe("/client");
		expect(RouterRender({ subPath: "/", currentRoute: "/client?name?age", notFoundRoute: undefined })).toBe("/client");
		expect(RouterRender({ subPath: "/client", currentRoute: "/client", notFoundRoute: undefined })).toBe("/client/");
		expect(RouterRender({ subPath: "/client", currentRoute: "/client/:id/:name", notFoundRoute: undefined })).toBe(
			"/client/:id/:name"
		);
		expect(RouterRender({ subPath: "/client", currentRoute: "/client?name?age", notFoundRoute: undefined })).toBe(
			"/client?name?age"
		);
	});
});
