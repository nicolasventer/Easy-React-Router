import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { routerPlugin } from "./src/router_src/plugin/routerPlugin";

// https://vite.dev/config/
export default defineConfig({
	base: "./",
	plugins: [react(), routerPlugin({ routes: { force: true }, lazyComponent: { force: true, eslintDisableWarning: true } })],
	resolve: {
		alias: {
			"easy-react-router": path.resolve(__dirname, "src/router_src"),
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
