import { useRouteParams } from "../routerInstance.gen";

export const Example = () => {
	const { name } = useRouteParams("/example?name");

	return <div>Hello {name ?? "my friend"}</div>;
};
