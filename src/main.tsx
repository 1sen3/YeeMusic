import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSettings } from "./lib/store/settingStore/settingStore";
import { initLocalMusic } from "./lib/store/localMusicStore/localMusicStore";

initSettings();
initLocalMusic();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
