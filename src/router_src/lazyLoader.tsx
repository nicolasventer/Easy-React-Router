/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ReadonlySignal, signal } from "@preact/signals";
import { type FunctionComponent, lazy, Suspense } from "react";

type Params<T> = T extends (...args: [infer U]) => any ? U : Record<string, never>;

// eslint-disable-next-line react-refresh/only-export-components
const Suspender = <T extends (...args: any) => any>(Comp: T) => {
	const Suspended = (props: Params<T>) => (
		<Suspense fallback>
			<Comp {...props} />
		</Suspense>
	);
	return Suspended;
};

type FCKeys<T extends object> = { [K in keyof T]: T[K] extends FunctionComponent ? K : never }[keyof T];

/** The possible states of a loading operation. */
export type LoadingState = "notStarted" | "loading" | "loaded";

export const lazyLoader = <T extends object>(importFn: () => Promise<T>) => {
	const loadingState = signal<LoadingState>("notStarted");
	const mod_ = signal<T>();

	const load = () => {
		if (!mod_.value) {
			loadingState.value = "loading";
			return importFn()
				.then((m) => (mod_.value = m))
				.then(() => (loadingState.value = "loaded"))
				.then(() => mod_.value!);
		}
		return new Promise<T>((resolve) => resolve(mod_.value!));
	};

	const getComponent = <U extends FCKeys<T>>(key: U) =>
		Suspender(lazy(() => load().then((modValue) => ({ default: modValue[key] as FunctionComponent })))) as T[U];

	return { getComponent, load, loadingState: loadingState as ReadonlySignal<LoadingState> };
};

export const lazySingleLoader = <T extends object, U extends FCKeys<T>>(importFn: () => Promise<T>, key: U) => {
	const loadingState = signal<LoadingState>("notStarted");
	const mod_ = signal<T>();

	const load = () => {
		if (!mod_.value) {
			loadingState.value = "loading";
			return importFn()
				.then((m) => (mod_.value = m))
				.then(() => (loadingState.value = "loaded"))
				.then(() => mod_.value!);
		}
		return new Promise<T>((resolve) => resolve(mod_.value!));
	};

	const Component = Suspender(lazy(() => load().then((modValue) => ({ default: modValue[key] as FunctionComponent })))) as T[U];

	return { Component, load, loadingState: loadingState as ReadonlySignal<LoadingState> };
};

export type LazySingleLoaderReturn<T> = {
	Component: T;
	load: () => Promise<unknown>;
	loadingState: ReadonlySignal<LoadingState>;
};
