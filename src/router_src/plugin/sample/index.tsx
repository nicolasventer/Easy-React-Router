import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MainLayout } from "./routes";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MainLayout />
	</StrictMode>
);
