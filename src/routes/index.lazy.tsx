import type { RouterParamsType, RouterPathType } from "../routerInstance.gen";
import { loadRouteFn, RouteLink, RouterRender, useCurrentRoute, useLoadingState } from "../routerInstance.gen";

type NavigationItem<T extends RouterPathType> = { title: string; path: T; params: RouterParamsType<T> };

type NavigationItemParams<T extends RouterPathType> = keyof RouterParamsType<T> extends never
	? [title: string, path: T]
	: [title: string, path: T, params: RouterParamsType<T>];

const navigationItem = <T extends RouterPathType>(...params: NavigationItemParams<T>): NavigationItem<T> => ({
	title: params[0],
	path: params[1],
	params: params[2] as RouterParamsType<T>,
});

const navigationItems = [
	navigationItem("Home", "/"),
	navigationItem("Home with id", "?id", { id: "abc" }),
	navigationItem("Posts", "/posts"),
	navigationItem("About", "/about"),
	navigationItem("HugePage", "/hugePage"),
	navigationItem("InvalidPage", "/invalid" as "/"),
] as const;

// @routeExport
export const MainLayout = () => {
	const { currentRoute, isRouteVisible } = useCurrentRoute();
	const { isRouteLoaded, isRouteLoading } = useLoadingState();

	return (
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
			<div style={{ paddingTop: 10 }}>
				{currentRoute && isRouteLoading(currentRoute) ? "loading..." : <RouterRender subPath="/" />}
			</div>
		</div>
	);
};
