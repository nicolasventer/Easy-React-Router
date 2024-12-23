import {
	isRouteLoaded,
	isRouteLoading,
	isRouteVisible,
	loadRouteFn,
	RouteLink,
	RouterRender,
	useRoutes,
	type RouterParamsType,
	type RouterPathType,
} from "../routerInstance.gen";

type NavigationItem<T extends RouterPathType> = { title: string; path: T; params: RouterParamsType<T> };

const navigationItems: NavigationItem<RouterPathType>[] = [
	{
		title: "Home",
		path: "/",
		params: {},
	},
	{
		title: "Posts",
		path: "/posts",
		params: {},
	},
	{
		title: "About",
		path: "/about",
		params: {},
	},
	{
		title: "HugePage",
		path: "/hugePage",
		params: {},
	},
];

export const MainLayout = () => (
	<div>
		{useRoutes()}
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
			<RouterRender subPath="/" />
		</div>
	</div>
);
