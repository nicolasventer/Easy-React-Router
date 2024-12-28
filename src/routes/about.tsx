import { signal } from "@preact/signals";
import type { FormEventHandler } from "react";
import { Router } from "../router_src/Router";
import { lazySingleLoader } from "../router_src/lazyLoader";
import { useReact } from "../router_src/useReact";

const aboutRouterSignal = signal("/");
const setAboutRouterSignalFn = (value: string) => () => (aboutRouterSignal.value = value);
const updateAboutRouterSignal: FormEventHandler<HTMLInputElement> = (e) => (aboutRouterSignal.value = e.currentTarget.value);

const AboutRouter = new Router(
	{
		"/": lazySingleLoader(() => import("../components/AboutText"), "AboutText"),
		"//": lazySingleLoader(() => import("../components/AboutText"), "AboutText"),
		"/counter": lazySingleLoader(() => import("../components/Counter"), "Counter"),
		"/debounce": lazySingleLoader(() => import("../components/DebounceTextInput"), "DebounceTextInput"),
	},
	{},
	aboutRouterSignal
);

export const About = () => (
	<div>
		<div>About</div>
		<div>
			<input type="text" value={useReact(aboutRouterSignal)} onInput={updateAboutRouterSignal} />
			<div>Current route: {AboutRouter.currentRoute.value}</div>
		</div>
		<div>
			<button onClick={setAboutRouterSignalFn("/")}>About</button>
			<button onClick={setAboutRouterSignalFn("/counter")}>Counter</button>
			<button onClick={setAboutRouterSignalFn("/debounce")}>Debounce</button>
		</div>
		<div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid black" }}>
			<AboutRouter.RouterRender subPath="/" />
		</div>
	</div>
);
