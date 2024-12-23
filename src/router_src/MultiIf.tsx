import type { ReactNode } from "react";

/**
 * A multi if statement in JSX.
 * @param props the props
 * @param props.branches the branches of the multi if statement
 * @param props.else the else branch, if none of the branches match
 * @returns the result of the multi if statement
 */
export const MultiIf = ({ branches, else: else_ }: { branches: { condition: boolean; then: ReactNode }[]; else?: ReactNode }) => {
	const branch = branches.find((branch) => branch.condition);
	return <>{branch !== undefined ? branch.then : else_}</>;
};
