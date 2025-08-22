/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import { useEffect } from "react";
import { store } from "./Store";

type FCKeys<T extends object> = { [K in keyof T]: T[K] extends ComponentType<any> ? K : never }[keyof T];

/** The type of the loading state. */
export type LoadingState = "not loaded" | "loading" | "loaded";

/**
 * A function that returns an object with functions to load and get components and with the loading state.
 * @template {object} T the type of the module
 * @param importFn the function that imports the module
 * @returns the object with the functions and the loading state
 */
export const lazyLoader = <T extends object>(importFn: () => Promise<T>) => {
	const loadingState = store<LoadingState>("not loaded");
	const allModules = store<T | null>(null);

	const load = () => {
		if (allModules.value) return Promise.resolve(allModules.value);
		if (loadingState.value === "not loaded") loadingState.value = "loading";
		return importFn().then((m) => {
			loadingState.value = "loaded";
			allModules.value = m;
			return m;
		});
	};

	const useLoading = () => loadingState.use();

	const getComponent = <U extends FCKeys<T>>(key: U, fallback?: () => React.ReactNode) =>
		((params: unknown) => {
			const allModules_ = allModules.use();
			useEffect(() => void load(), []);
			const M = allModules_ ? allModules_[key] : fallback ?? (() => null);
			// @ts-expect-error the type of the component and of the parameters are unknown
			return <M {...params} />;
		}) as T[U];

	return {
		/** The function to get the component. */
		getComponent,
		/** The function to load the module. */
		load,
		/** Hook to get the loading state. */
		useLoading,
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
	/** Hook to get the loading state. */
	useLoading: () => LoadingState;
};

/**
 * A function that returns an object with a component, a function to load the module and the loading state.
 * @template {object} T the type of the module
 * @template {FCKeys<T>} U the key of the function component
 * @param importFn the function that imports the module
 * @param key the key of the function component
 * @param fallback the fallback component to render while the module is loading
 * @returns the object with the component, the function and the loading state
 */
export const lazySingleLoader = <T extends object, U extends FCKeys<T>>(
	importFn: () => Promise<T>,
	key: U,
	fallback?: () => React.ReactNode
): LazySingleLoaderReturn<T[U]> => {
	const { getComponent, load, useLoading } = lazyLoader(importFn);
	return { Component: getComponent(key, fallback), load, useLoading };
};
