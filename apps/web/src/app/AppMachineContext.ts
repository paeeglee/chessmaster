import { createActorContext } from "@xstate/react";
import { appMachine } from "./appMachine";

export const AppMachineContext = createActorContext(appMachine);
