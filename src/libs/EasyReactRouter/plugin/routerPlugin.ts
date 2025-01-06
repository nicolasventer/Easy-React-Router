import path from "path";
import { watch } from "vite-plugin-watch";

/** Options for generating the router instance */
type GenRouterInstanceOptions = {
	/** Whether to generate an additional json file */
	json?: boolean;
	/** Whether to always generate */
	force?: boolean;
	/** Whether to show help */
	help?: boolean;
};

const getGenRouterInstanceCommand = (p?: GenRouterInstanceOptions) =>
	`bun ${path.resolve(__dirname, "_genRoutes.ts")}${p?.json ? " --json" : ""}${p?.force ? " --force" : ""}${
		p?.help ? " --help" : ""
	}`;

/**
 * Generate the router instance
 * @param p The options
 * @returns The command execution
 */
export const genRouterInstance = (p?: GenRouterInstanceOptions) => Bun.$`${getGenRouterInstanceCommand(p)}`;

type GenLazyComponentOptions = {
	/** The file path to generate */
	filePath?: string;
	/** Whether to always generate */
	force?: boolean;
	/** Whether to disable eslint warning */
	eslintDisableWarning?: boolean;
	/** Whether to show help */
	help?: boolean;
};

const getGenLazyComponentCommand = (p?: GenLazyComponentOptions) =>
	`bun ${path.resolve(__dirname, "_genLazyComponent.ts")} ${p?.filePath ?? ""}${p?.force ? " --force" : ""}` +
	`${p?.eslintDisableWarning ? " --eslint-disable-warning" : ""}${p?.help ? " --help" : ""}`;

/**
 * Generate lazy components
 * @param p The options
 * @returns The command execution
 */
export const genLazyComponent = (p?: GenLazyComponentOptions) => Bun.$`${getGenLazyComponentCommand(p)}`;

/**
 * Vite plugin to watch for changes in routes and components and generate routes and lazy components
 * @param p - The options.
 * @param p.routes - The options for routes generation.
 * @param p.lazyComponent - The options for lazy component generation.
 * @returns The watchers.
 */
export const routerPlugin = (p?: { routes?: GenRouterInstanceOptions; lazyComponent?: GenLazyComponentOptions }) => {
	const routesGenWatcher = watch({
		pattern: "src/routes/**",
		command: getGenRouterInstanceCommand(p?.routes),
	});

	const lazyComponentWatcher = watch({
		pattern: "src/**/*.{tsx,ts}",
		command: (filePath) => getGenLazyComponentCommand({ ...p?.lazyComponent, filePath }),
	});

	return [routesGenWatcher, lazyComponentWatcher];
};

/** Options for generating html routes */
type GenHtmlRoutesOptions = {
	/** The html file to copy */
	htmlFile: string;
	/** Whether to overwrite existing file */
	overwrite?: boolean;
	/** Whether to show help */
	help?: boolean;
};

const getGenHtmlRoutesCommand = (p: GenHtmlRoutesOptions) =>
	`bun ${path.resolve(__dirname, "_genRoutes.ts")} --html ${p.htmlFile}${p.overwrite ? " --overwrite" : ""}${
		p.help ? " --help" : ""
	}`;

/**
 * Generate html routes
 * @param p The options
 * @returns The command execution
 */
export const genHtmlRoutes = (p: GenHtmlRoutesOptions) => Bun.$`${getGenHtmlRoutesCommand(p)}`;
