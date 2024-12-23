type ValidRoute<T extends Readonly<string>, U extends Readonly<string>> = T extends `${infer V}/$${infer W}`
	? ValidRoute<`${V}/`, U> & ValidRoute<W, U>
	: T extends `${infer _}$${infer _}/${infer _}`
	? never
	: U;

export const checkValidRoute = <T extends Readonly<string>>(t: ValidRoute<T, T>) => t;
