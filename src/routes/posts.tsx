import { B_PROD } from "../_bProd";
import { clientEnv } from "../clientEnv";
import { currentRoute, getRouteParams, RouteLink, RouterRender } from "../routerInstance.gen";

export const PostsLayout = () => (
	<div style={{ display: "flex", flex: "horizontal", justifyContent: "space-between" }}>
		<div>
			<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
				<RouteLink path="/posts" style={{ color: currentRoute.value === "/posts" ? "blue" : "black", marginBottom: 10 }}>
					Unselected
				</RouteLink>
				{Array.from({ length: 10 }).map((_, i) => (
					<RouteLink
						key={i}
						path="/posts/:id"
						params={{ id: i.toString() }}
						style={{
							color:
								getRouteParams("/posts/:id").value.id === i.toString() || (i === 3 && currentRoute.value === "/posts/3")
									? "blue"
									: "black",
						}}
					>
						Post {i}
						{i === 3 ? " (special)" : ""}
						{B_PROD && i < 5 ? " (statically deployed)" : ""}
					</RouteLink>
				))}
				<a href={`${clientEnv.BASE_URL}/posts/0/invalid`}>Invalid post{B_PROD ? " (statically deployed)" : ""}</a>
				<a href={`${clientEnv.BASE_URL}/posts/1/invalid`}>Invalid post</a>
			</div>
		</div>
		<div>
			<RouterRender subPath="/posts" />
		</div>
	</div>
);
