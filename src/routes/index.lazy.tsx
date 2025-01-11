import {
	currentRoute,
	isRouteLoaded,
	isRouteLoading,
	isRouteVisible,
	loadRouteFn,
	RouteLink,
	RouterRender,
	type RouterParamsType,
	type RouterPathType,
} from "../routerInstance.gen";

type NavigationItem<T extends RouterPathType> = { title: string; path: T; params: RouterParamsType<T> };

const navigationItem = <T extends RouterPathType>(title: string, path: T, params: RouterParamsType<T>): NavigationItem<T> => ({
	title,
	path,
	params,
});

const navigationItems = [
	navigationItem("Home", "/", {}),
	navigationItem("Home with id", "?id", { id: "abc" }),
	navigationItem("Posts", "/posts", {}),
	navigationItem("About", "/about", {}),
	navigationItem("HugePage", "/hugePage", {}),
	navigationItem("InvalidPage", "/invalid" as "/", {}),
] as const;

// @routeExport
export const MainLayout = () => (
	<div>
		<div style={{ display: "flex", gap: 10, borderBottom: "solid" }}>
			{navigationItems.map(({ title, path, params }) => (
				<RouteLink
					key={title}
					path={path}
					params={params}
					style={{
						color: isRouteVisible(path) ? "red" : isRouteLoading(path) ? "orange" : isRouteLoaded(path) ? "green" : "black",
					}}
					onMouseEnter={loadRouteFn(path)}
				>
					<h3>{title}</h3>
				</RouteLink>
			))}
		</div>
		<div style={{ paddingTop: 10 }}>{isRouteLoading(currentRoute.value) ? "loading..." : <RouterRender subPath="/" />}</div>
	</div>
);
