import { getRouteParams } from "../routerInstance.gen";

export const PostWithId = () => <div>This is the post: {getRouteParams("/posts/:id").value.id}</div>;
