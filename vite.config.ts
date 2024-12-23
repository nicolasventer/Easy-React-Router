import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { watch } from "vite-plugin-watch";

const routesGenWatcher = watch({
	pattern: "src/routes/**",
	command: "bun _genRoutes.ts", // add --json to also generate json file, add --force to always generate
});

const lazyComponentWatcher = watch({
	pattern: "src/**/*.{tsx,ts}",
	command: (filePath) => `bun _genLazyComponent.ts ${filePath}`,
});

// https://vite.dev/config/
export default defineConfig({
	base: "./",
	plugins: [react(), routesGenWatcher, lazyComponentWatcher],
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
