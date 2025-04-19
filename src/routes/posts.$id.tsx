import { useRouteParams } from "../routerInstance.gen";

export const PostWithId = () => {
	const { id } = useRouteParams("/posts/:id");

	return <div>This is the post: {id}</div>;
};
