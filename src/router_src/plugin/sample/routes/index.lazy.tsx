import { RouteLink, RouterRender, useRoutes } from "../routerInstance.gen";

// @routeExport
export const MainLayout = () => (
	<div>
		{useRoutes()}
		<div style={{ display: "flex", gap: 10, borderBottom: "solid" }}>
			<RouteLink path="/">
				<h3>Home</h3>
			</RouteLink>
			<RouteLink path="/example?name" params={{}}>
				<h3>Example </h3>
			</RouteLink>
			<RouteLink path="/example?name" params={{ name: "Bob" }}>
				<h3>Example Bob</h3>
			</RouteLink>
		</div>
		<div style={{ paddingTop: 10 }}>
			<RouterRender subPath="/" />
		</div>
	</div>
);
