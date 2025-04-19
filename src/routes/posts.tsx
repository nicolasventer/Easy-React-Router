import { B_PROD } from "../bProd.gen";
import { clientEnv } from "../clientEnv";
import { RouteCustomLink, RouteLink, RouterRender, useCurrentRoute, useRouteParams } from "../routerInstance.gen";

export const PostsLayout = () => {
	const { currentRoute } = useCurrentRoute();
	const { id } = useRouteParams("/posts/:id");

	return (
		<div style={{ display: "flex", flex: "horizontal", justifyContent: "space-between" }}>
			<div>
				<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
					<RouteLink path="/posts" style={{ color: currentRoute === "/posts" ? "blue" : "black", marginBottom: 10 }}>
						Unselected
					</RouteLink>
					{Array.from({ length: 10 }).map((_, i) =>
						i === 3 ? (
							<RouteLink key={i} path="/posts/3" style={{ color: currentRoute === "/posts/3" ? "blue" : "black" }}>
								Post {i} (special)
								{B_PROD ? " (statically deployed)" : ""}
							</RouteLink>
						) : (
							<RouteLink
								key={i}
								path="/posts/:id"
								params={{ id: i.toString() }}
								style={{ color: id === i.toString() ? "blue" : "black" }}
							>
								Post {i}
								{B_PROD && i < 5 ? " (statically deployed)" : ""}
							</RouteLink>
						)
					)}
					<RouteCustomLink
						url={`${clientEnv.BASE_URL}/posts/0/invalid`}
						style={{ color: window.location.pathname === `${clientEnv.BASE_URL}/posts/0/invalid` ? "blue" : "black" }}
					>
						Invalid post{B_PROD ? " (statically deployed)" : ""}
					</RouteCustomLink>
					<RouteCustomLink
						url={`${clientEnv.BASE_URL}/posts/1/invalid`}
						style={{ color: window.location.pathname === `${clientEnv.BASE_URL}/posts/1/invalid` ? "blue" : "black" }}
					>
						Invalid post 2
					</RouteCustomLink>
				</div>
			</div>
			<div>
				<RouterRender subPath="/posts" />
			</div>
		</div>
	);
};
