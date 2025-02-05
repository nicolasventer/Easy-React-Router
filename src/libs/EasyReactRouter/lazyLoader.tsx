/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ReadonlySignal, signal } from "@preact/signals";
import { type FunctionComponent, useEffect } from "react";
import { useReact } from "./useReact";

type FCKeys<T extends object> = { [K in keyof T]: T[K] extends FunctionComponent<any> ? K : never }[keyof T];

/** The possible states of a loading operation. */
export type LoadingState = "notStarted" | "loading" | "loaded";

/**
 * A function that returns an object with functions to load and get components and with the loading state.
 * @template {object} T the type of the module
 * @param importFn the function that imports the module
 * @returns the object with the functions and the loading state
 */
export const lazyLoader = <T extends object>(importFn: () => Promise<T>) => {
	const loadingState = signal<LoadingState>("notStarted");
	const allModules = signal<T | null>(null);

	const load = () => {
		if (allModules.value) return Promise.resolve(allModules.value);
		if (loadingState.value === "notStarted") loadingState.value = "loading";
		return importFn().then((m) => {
			loadingState.value = "loaded";
			allModules.value = m;
			return m;
		});
	};

	const getComponent = <U extends FCKeys<T>>(key: U) =>
		((params: unknown) => {
			useReact(allModules);
			useEffect(() => void load(), []);
			const M = allModules.value ? allModules.value[key] : () => null;
			// @ts-expect-error the type of the component and of the parameters are unknown
			return <M {...params} />;
		}) as T[U];

	return {
		/** The function to get the component. */
		getComponent,
		/** The function to load the module. */
		load,
		/** The loading state. */
		loadingState: loadingState as ReadonlySignal<LoadingState>,
	};
};

/**
 * The return type of the {@link lazySingleLoader} function.
 * @template T the type of the component
 */
export type LazySingleLoaderReturn<T> = {
	/** The component. */
	Component: T;
	/** The function to load the module. */
	load: () => Promise<unknown>;
	/** The loading state. */
	loadingState: ReadonlySignal<LoadingState>;
};

/**
 * A function that returns an object with a component, a function to load the module and the loading state.
 * @template {object} T the type of the module
 * @template {FCKeys<T>} U the key of the function component
 * @param importFn the function that imports the module
 * @param key the key of the function component
 * @returns the object with the component, the function and the loading state
 */
export const lazySingleLoader = <T extends object, U extends FCKeys<T>>(
	importFn: () => Promise<T>,
	key: U
): LazySingleLoaderReturn<T[U]> => {
	const { getComponent, load, loadingState } = lazyLoader(importFn);
	return { Component: getComponent(key), load, loadingState };
};
