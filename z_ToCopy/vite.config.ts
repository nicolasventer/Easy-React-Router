import path from "path";
import { routerPlugin } from "./src/libs/EasyReactRouter/plugin/routerPlugin";

export default defineConfig({
	plugins: [routerPlugin({})],
	resolve: {
		alias: {
			"easy-react-router": path.resolve(__dirname, "src/libs/EasyReactRouter"),
		},
	},
});
