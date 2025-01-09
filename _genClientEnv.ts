import Bun from "bun";
import { env } from "process";

Bun.write(
	"./src/bProd.gen.ts",
	`/** enable production mode */
export const B_PROD = ${env.B_PROD ?? "false"};`
);
console.log("bProd.gen.ts generated successfully.");
