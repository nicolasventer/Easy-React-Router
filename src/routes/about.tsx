import { Router, emptyRouteValue, lazySingleLoader } from "easy-react-router";
import { useEffect, type FormEventHandler } from "react";

const { RouterRender, useUrlState } = new Router(
	{
		"/": emptyRouteValue,
		"//": lazySingleLoader(() => import("../components/AboutText"), "AboutText"),
		"/counter": lazySingleLoader(() => import("../components/Counter"), "Counter"),
		"/debounce": lazySingleLoader(() => import("../components/DebounceTextInput"), "DebounceTextInput"),
	},
	{},
	false
);

export const About = () => {
	const [path, setPath] = useUrlState();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => setPath("/"), []);

	const setPathFn = (newPath: string) => () => setPath(newPath);
	const evSetPath: FormEventHandler<HTMLInputElement> = (e) => setPath(e.currentTarget.value);

	return (
		<div>
			<div>About</div>
			<div>
				<input type="text" value={path} onInput={evSetPath} />
				<div>Current route: {path}</div>
			</div>
			<div>
				<button onClick={setPathFn("/")}>About</button>
				<button onClick={setPathFn("/counter")}>Counter</button>
				<button onClick={setPathFn("/debounce")}>Debounce</button>
			</div>
			<div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid black" }}>
				<RouterRender subPath="/" />
			</div>
		</div>
	);
};
