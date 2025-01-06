import { getRouteParams } from "../routerInstance.gen";

export const Example = () => <div>Hello {getRouteParams("/example?name").value.name ?? "my friend"}</div>;
