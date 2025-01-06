import path from "path";
import { watch } from "vite-plugin-watch";

/** Type that contains the common properties between two types `A` and `B`. */
type Common<A, B> = Pick<A, Extract<keyof A, keyof B>>;

/** Options for generating the router instance */
export type GenRouterInstanceOptions = {
	/** Whether to generate an additional json file */
	json?: boolean;
	/** Whether to always generate */
	force?: boolean;
	/** Whether to show help */
	help?: boolean;
	/** Whether to be silent */
	silent?: boolean;
};

const getGenRouterInstanceCommand = (p?: GenRouterInstanceOptions) =>
	`bun ${path.resolve(__dirname, "_genRoutes.ts")}${p?.json ? " --json" : ""}${p?.force ? " --force" : ""}` +
	`${p?.help ? " --help" : ""}`;

/**
 * Generate the router instance
 * @param p The options
 * @returns The command execution
 */
export const genRouterInstance = (p?: GenRouterInstanceOptions) => Bun.$`${getGenRouterInstanceCommand(p)}`;

export type GenLazyComponentOptions = {
	/** The file path to generate */
	filePath?: string;
	/** Whether to always generate */
	force?: boolean;
	/** Whether to disable eslint warning */
	eslintDisableWarning?: boolean;
	/** Whether to show help */
	help?: boolean;
	/** Whether to be silent */
	silent?: boolean;
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

/** Options for the router plugin */
export type RouterPluginOptions = {
	/** The common options for routes and lazy components generation */
	all?: Common<GenRouterInstanceOptions, GenLazyComponentOptions>;
	/** The options for routes generation */
	routes?: GenRouterInstanceOptions;
	/** The options for lazy component generation */
	lazyComponent?: GenLazyComponentOptions;
};

/**
 * Vite plugin to watch for changes in routes and components and generate routes and lazy components
 * @param p - The options.
 * @returns The watchers.
 */
export const routerPlugin = (p?: RouterPluginOptions) => {
	const routesGenWatcher = watch({
		pattern: "src/routes/**",
		command: getGenRouterInstanceCommand({ ...p?.all, ...p?.routes }),
		silent: p?.routes?.silent ?? p?.all?.silent,
	});

	const lazyComponentWatcher = watch({
		pattern: "src/**/*.{tsx,ts}",
		command: (filePath) => getGenLazyComponentCommand({ ...p?.all, ...p?.lazyComponent, filePath }),
		silent: p?.lazyComponent?.silent ?? p?.all?.silent,
	});

	return [routesGenWatcher, lazyComponentWatcher];
};

/** Options for generating html routes */
export type GenHtmlRoutesOptions = {
	/** The html file to copy */
	htmlFile: string;
	/** Whether to overwrite existing file */
	overwrite?: boolean;
	/** Whether to show help */
	help?: boolean;
	/** Whether to be silent */
	silent?: boolean;
};

const getGenHtmlRoutesCommand = (p: GenHtmlRoutesOptions) =>
	`bun ${path.resolve(__dirname, "_genRoutes.ts")} --html ${p.htmlFile}${p.overwrite ? " --overwrite" : ""}` +
	`${p.help ? " --help" : ""}`;

/**
 * Generate html routes
 * @param p The options
 * @returns The command execution
 */
export const genHtmlRoutes = (p: GenHtmlRoutesOptions) => Bun.$`${getGenHtmlRoutesCommand(p)}`;
