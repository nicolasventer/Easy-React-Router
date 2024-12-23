import { useMemo, useState } from "react";

const debounceFn = <T extends unknown[]>(fn: (...args: T) => void, delay: number) => {
	let timeoutId: Timer | undefined;
	return (...args: T) => {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
};

export const DebounceTextInput = () => {
	const [debouncedValue, setDebouncedValue] = useState("");
	const debouncedUpdate = useMemo(() => debounceFn(setDebouncedValue, 500), []);
	return (
		<div>
			<input type="text" onInput={(e) => debouncedUpdate(e.currentTarget.value)} />
			<div>Debounced value: {debouncedValue}</div>
		</div>
	);
};
