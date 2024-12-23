import { getRouteParams } from "../routerInstance.gen";

export const IndexWithId = () => <div>Index with id: {getRouteParams("?id").value.id}</div>;
