import react from "@vitejs/plugin-react";
import path from "path";
import { routerPlugin } from "./src/libs/EasyReactRouter/plugin/routerPlugin";

export default defineConfig({
	plugins: [react({ babel: { plugins: ["module:@preact/signals-react-transform"] } }), routerPlugin()],
	resolve: {
		alias: {
			"easy-react-router": path.resolve(__dirname, "src/libs/EasyReactRouter"),
		},
	},
});
