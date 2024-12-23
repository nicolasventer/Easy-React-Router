type ValidRoute<T extends Readonly<string>> = T extends `${infer _}?${infer _}/${infer _}` ? never : T;

export const checkValidRoute = <T extends Readonly<string>>(t: ValidRoute<T>) => t;
