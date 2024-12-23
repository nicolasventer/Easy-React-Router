import fs from "fs";
import path from "path";

const SRC_DIR = `./src`;

const getSubTextPosArray = (text: string, subText: string, bStartOfLine: boolean): number[] => {
	const posArray: number[] = [];
	let index = text.indexOf(subText);
	while (index !== -1) {
		if (!bStartOfLine || index === 0 || text[index - 1] === "\n") posArray.push(index);
		index = text.indexOf(subText, index + 1);
	}
	return posArray;
};

const argFilePath = Bun.argv[2] || "*";

const formatFile = async (filePath: string) => {
	if (filePath.match(/.*\.lazy\.tsx?/)) {
		const notLazyFilePath = filePath.replace(".lazy", "");
		const lazyFileStat = fs.statSync(filePath);
		const notLazyFileStat = fs.existsSync(notLazyFilePath) ? fs.statSync(notLazyFilePath) : lazyFileStat;
		if (lazyFileStat.mtimeMs < notLazyFileStat.mtimeMs) return;
		const fileNameNoExt = filePath.slice(filePath.lastIndexOf("/") + 1).replace(/\.tsx?/, "");
		const fileNameNoExtNoLazy = fileNameNoExt.replace(".lazy", "");
		const relativePathToSrc = path.relative(path.dirname(notLazyFilePath), SRC_DIR).replace(/\\/g, "/");
		const fileContent = await Bun.file(filePath).text();
		const exportPosArray = getSubTextPosArray(fileContent, "export ", true);

		const exportList: string[] = [];
		let hasDefaultExport = false;
		for (const exportPos of exportPosArray) {
			// get export name
			const exportLinePos = fileContent.indexOf("\n", exportPos);
			const exportLine = fileContent.slice(exportPos, exportLinePos);
			const exportName = exportLine.match(/export (const|let|var|function) (\w+)/)?.[2];
			if (exportName) exportList.push(exportName);
			else hasDefaultExport = true;
		}
		const notLazyFileContent = `/* eslint-disable react-refresh/only-export-components */
import { lazyLoader } from "${relativePathToSrc}/router_src/lazyLoader";

const ${fileNameNoExtNoLazy}LazyLoader = lazyLoader(() => import("./${fileNameNoExtNoLazy}.lazy"));
export const loadingState = ${fileNameNoExtNoLazy}LazyLoader.loadingState;
${exportList.map((exp) => `export const ${exp} = ${fileNameNoExtNoLazy}LazyLoader.getComponent("${exp}");`).join("\n")}
${
	hasDefaultExport ? `const default_ = ${fileNameNoExtNoLazy}LazyLoader.getComponent("default");\nexport default default_;` : ""
}`;

		await Bun.write(notLazyFilePath, notLazyFileContent);
		console.log(`${notLazyFilePath} generated.`);
	} else {
		const fileContent = await Bun.file(filePath).text();
		if (!fileContent.match(/import.*from.*\.lazy/)) return;
		const newFileContent = fileContent.replace(/(import.*from.*)\.lazy/g, "$1");
		await Bun.write(filePath, newFileContent);
		console.log(`${filePath} formatted.`);
	}
};

if (argFilePath === "*") {
	for (const fileObj of fs.readdirSync(SRC_DIR, { recursive: true, withFileTypes: true })) {
		if (!fileObj.isFile() || !fileObj.name.match(/.*\.tsx?/)) continue;
		await formatFile(`./${fileObj.parentPath}/${fileObj.name}`);
	}
} else if (fs.existsSync(argFilePath) && argFilePath.match(/.*\.tsx?/)) {
	await formatFile(argFilePath);
}
