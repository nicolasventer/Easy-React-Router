import { hash } from "crypto";
import fs from "fs";

const ROUTES_DIRNAME = "routes";
const ROUTES_DIR = `./src/${ROUTES_DIRNAME}`;
const ROUTER_INSTANCE_FILE = "./src/routerInstance.gen.ts";
const ROUTER_INSTANCE_JSON_FILE = "./src/routerInstance.gen.json";

type ParseResult = {
	filePath: string;
	error?: { line: number; message: string };
	routePath?: string;
	usedExport?: string;
	isNotFound?: boolean;
};

const parseResultArray: ParseResult[] = [];

const getPosToLineFn = (str: string) => {
	const posToLine: number[] = [];
	for (let i = 0; i < str.length; i++) {
		if (str[i] === "\n") posToLine.push(i);
	}
	return (pos: number) => posToLine.findIndex((linePos) => linePos > pos) + 1 || posToLine.length + 1;
};

const getSubTextPosArray = (text: string, subText: string, bStartOfLine: boolean): number[] => {
	const posArray: number[] = [];
	let index = text.indexOf(subText);
	while (index !== -1) {
		if (!bStartOfLine || index === 0 || text[index - 1] === "\n") posArray.push(index);
		index = text.indexOf(subText, index + 1);
	}
	return posArray;
};

for (const fileObj of fs.readdirSync(ROUTES_DIR, { recursive: true, withFileTypes: true })) {
	if (!fileObj.isFile() || !fileObj.name.endsWith(".tsx")) continue;
	const filePath = `./${fileObj.parentPath}/${fileObj.name}`
		// replace \ with /
		.replace(/\\/g, "/");

	// if filename is (.*).tsx, then ignore it
	if (fileObj.name.match(/\(.*\).tsx/)) continue;
	// if filename ends with .lazy.tsx, then ignore it
	if (fileObj.name.endsWith(".lazy.tsx")) continue;

	const parseResult: ParseResult = { filePath };

	const fileContent = await Bun.file(filePath).text();
	const posToLine = getPosToLineFn(fileContent);

	// check if comment "// @routeExport" is present 0 or 1 time
	const routeExportPosArray = getSubTextPosArray(fileContent, "// @routeExport", true);
	if (routeExportPosArray.length > 1) {
		const foundLines = routeExportPosArray.map((pos) => posToLine(pos));
		parseResult.error = {
			line: posToLine(routeExportPosArray[1]),
			message: `Multiple routeExport comments found at lines ${foundLines.join(", ")}`,
		};
		parseResultArray.push(parseResult);
		console.error(parseResult);
		continue;
	}

	let exportPos: number;
	// if comment "// @routeExport" is present, then check if it is followed by export
	if (routeExportPosArray.length === 1) {
		const routeExportLinePos = fileContent.indexOf("\n", routeExportPosArray[0]);
		const textToFind = "\nexport ";
		if (fileContent.slice(routeExportLinePos, routeExportLinePos + textToFind.length) !== textToFind) {
			parseResult.error = {
				line: posToLine(routeExportLinePos),
				message: `Export not found after routeExport comment`,
			};
			parseResultArray.push(parseResult);
			console.error(parseResult);
			continue;
		}
		exportPos = routeExportLinePos + 1;
	} else {
		// check if export is present 0 or 1 time
		const exportPosArray = getSubTextPosArray(fileContent, "export ", true);
		if (exportPosArray.length > 1) {
			const foundLines = exportPosArray.map((pos) => posToLine(pos));
			parseResult.error = {
				line: posToLine(exportPosArray[1]),
				message: `Multiple exports found at lines ${foundLines.join(
					", "
				)}. Add '// @routeExport' comment before the export you want to use.`,
			};
			parseResultArray.push(parseResult);
			console.error(parseResult);
			continue;
		}
		// ignore file if export is not found
		if (exportPosArray.length === 0) continue;
		exportPos = exportPosArray[0];
	}

	// get export name
	const exportLinePos = fileContent.indexOf("\n", exportPos);
	const exportLine = fileContent.slice(exportPos, exportLinePos);
	const exportName = exportLine.match(/export (default )?(const|let|var|function) (\w+)/)?.[3];
	if (!exportName) {
		parseResult.error = {
			line: posToLine(exportPos),
			message: `Export name not found`,
		};
		parseResultArray.push(parseResult);
		console.error(parseResult);
		continue;
	}
	parseResult.usedExport = exportName;

	parseResult.isNotFound = filePath.endsWith("404.tsx");

	// get route path
	parseResult.routePath = filePath
		// remove ROUTES_DIR and .tsx
		.slice(ROUTES_DIR.length, -".tsx".length)
		// replace all . with /
		.replace(/\./g, "/")
		// replace all /(.*) with /
		.replace(/\/\(.*\)/g, "")
		// remove end /404
		.replace(/\/404$/, "")
		// remove one /index
		.replace(/\/index/, "")
		// replace all /index with /
		.replace(/\/index/g, "/");

	// add / if path is empty or /
	if (parseResult.routePath.length <= 1) parseResult.routePath += "/";

	parseResultArray.push(parseResult);
}

const exisingRouterInstanceContent = await Bun.file(ROUTER_INSTANCE_FILE)
	.text()
	.catch(() => "");
const existingHashValue = exisingRouterInstanceContent.match(/\/\/ (.*)/)?.[1];

const hashValue = hash("sha256", JSON.stringify(parseResultArray, null, 2));

// if the content is the same, then exit
if (existingHashValue === hashValue) process.exit(0);

if (Bun.argv.includes("--json") || Bun.argv.includes("-j")) {
	// write to ROUTER_INSTANCE_FILE_JSON
	await Bun.write(ROUTER_INSTANCE_JSON_FILE, JSON.stringify(parseResultArray, null, 2));
	console.log(`${ROUTER_INSTANCE_JSON_FILE} generated.`);
} else {
	// remove ROUTER_INSTANCE_FILE_JSON
	if (fs.existsSync(ROUTER_INSTANCE_JSON_FILE)) fs.unlinkSync(ROUTER_INSTANCE_JSON_FILE);
}

let routerInstanceContent = `// ${hashValue}
import { checkValidRoute } from "./router_src/checkValidRoute";
import { lazySingleLoader } from "./router_src/lazyLoader";
import { Router } from "./router_src/Router";

export const {
	NotFoundRouteRender,
	RouteLink,
	RouterRender,
	buildRouteLink,
	currentRoute,
	getRouteParams,
	getUseRouteTransition,
	isRouteLoaded,
	isRouteLoading,
	isRouteVisible,
	loadRouteFn,
	navigateToRouteFn,
	notFoundRoute,
	setUseRouteTransition,
	updateCurrentRoute,
	useRoutes,
} = new Router(
	{\n`;

const appendRoutes = (useIsNotFound: boolean) => {
	for (const parseResult of parseResultArray) {
		if (parseResult.isNotFound !== useIsNotFound) continue;
		if (parseResult.error) {
			routerInstanceContent += `// Error in file: ${parseResult.filePath} at line ${parseResult.error.line}: ${parseResult.error.message}\n`;
			continue;
		}
		if (!parseResult.routePath || !parseResult.usedExport || parseResult.isNotFound === undefined) continue; // this should never happen

		routerInstanceContent +=
			`\t\t[checkValidRoute("${parseResult.routePath}")]: lazySingleLoader(` +
			`() => import("./${parseResult.filePath.slice("./src/".length).replace(".tsx", "")}"), "${parseResult.usedExport}"),\n`;
	}
};

appendRoutes(false);
routerInstanceContent += `\t},\n\t{\n`;
appendRoutes(true);
routerInstanceContent += `\t}\n);

export type RouterPathType = typeof currentRoute.value;
export type RouterParamsType<T extends RouterPathType> = ReturnType<typeof getRouteParams>[T];

updateCurrentRoute();\n`;

await Bun.write(ROUTER_INSTANCE_FILE, routerInstanceContent);

console.log(`${ROUTER_INSTANCE_FILE} generated.`);
