import { useRouteParams } from "../routerInstance.gen";

export const IndexWithId = () => {
	const { id } = useRouteParams("?id");

	return <div>Index with id: {id}</div>;
};
