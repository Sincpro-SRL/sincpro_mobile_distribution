import { installGlobalErrorHandler } from "@sincpro/mobile/infrastructure/ui/errorHandler";
import { registerRootComponent } from "expo";

import App from "./App";

installGlobalErrorHandler();

registerRootComponent(App);
