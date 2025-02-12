import preact from "@preact/preset-vite";
import path from "path";
import { defineConfig } from "vite";
import { routerPlugin } from "./src/libs/EasyReactRouter/plugin/routerPlugin";

export default defineConfig({
	base: "./",
	plugins: [preact(), routerPlugin({ lazyComponent: { eslintDisableWarning: true } })],
	resolve: {
		alias: {
			"easy-react-router": path.resolve(__dirname, "src/libs/EasyReactRouter"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				dir: path.resolve(__dirname, "dist"),
				entryFileNames: "[name].js",
				assetFileNames: "asset/[name].[ext]",
				chunkFileNames: "[name].chunk.js",
				manualChunks: undefined,
			},
			onLog(level, log, handler) {
				if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
				handler(level, log);
			},
		},
	},
});
