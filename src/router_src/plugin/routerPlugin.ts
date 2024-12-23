import path from "path";
import { watch } from "vite-plugin-watch";

/**
 * Vite plugin to watch for changes in routes and components and generate routes and lazy components
 * @param p - The options.
 * @param p.routes - The options for routes generation.
 * @param p.routes.json - Whether to generate json file.
 * @param p.routes.force - Whether to always generate.
 * @param p.lazyComponent - The options for lazy component generation.
 * @param p.lazyComponent.force - Whether to always generate.
 * @returns The watchers.
 */
export const routerPlugin = (p?: {
	routes?: { json?: boolean; force?: boolean };
	lazyComponent?: { force?: boolean; eslintDisableWarning?: boolean };
}) => {
	const routesGenWatcher = watch({
		pattern: "src/routes/**",
		command:
			`bun ${path.resolve(__dirname, "_genRoutes.ts")}` +
			`${p?.routes?.json ? " --json" : ""}${p?.routes?.force ? " --force" : ""}`,
	});

	const lazyComponentWatcher = watch({
		pattern: "src/**/*.{tsx,ts}",
		command: (filePath) =>
			`bun ${path.resolve(__dirname, "_genLazyComponent.ts")}` +
			` ${filePath}${p?.lazyComponent?.force ? " --force" : ""}` +
			`${p?.lazyComponent?.eslintDisableWarning ? " --eslint-disable-warning" : ""}`,
	});

	return [routesGenWatcher, lazyComponentWatcher];
};

/**
 * Generate static html routes
 * @param htmlFile html file to copy
 * @param bOverwrite set to true to overwrite existing file
 * @returns the command execution
 */
export const genHtmlRoutes = (htmlFile: string, bOverwrite?: boolean) =>
	Bun.$`bun ${path.resolve(__dirname, "_genRoutes.ts")} --html ${htmlFile}${bOverwrite ? " --overwrite" : ""}`;
