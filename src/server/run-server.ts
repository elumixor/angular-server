import chalk from "chalk";
import type { BootstrapLoader } from "./include-angular";
import { Server } from "./server";
import { wslIp } from "../util/wsl-ip";

export async function run(
  handler: object,
  options?: {
    ip?: string;
    useWslIp?: boolean;
    ipEnvFlag?: string;
    devEnvFlag?: string;
    devPort?: number;
    prodPort?: number;
    angular?: {
      multiLanguage?: boolean;
      serverDistFolder: string;
      browserDistFolder?: string;
      bootstrapLoader?: BootstrapLoader;
    };
  }
) {
  // Figure out the arguments
  const ip =
    options?.ip ??
    (options?.useWslIp
      ? wslIp()
      : process.env[options?.ipEnvFlag ?? "IP"] ?? "localhost");

  const angular = options?.angular;
  const devEnvFlag = options?.devEnvFlag ?? "NG_DEV";
  const devMode = !!process.env[devEnvFlag];
  const devPort = options?.devPort ?? process.env.PORT ?? 4000;
  const prodPort = options?.prodPort ?? devPort;

  // Create our server
  const server = new Server(ip, devPort, prodPort, devMode);

  // Create a handler and register it
  server.registerConnections(handler);

  // Include angular stuff, but not in dev mode
  if (angular && !devMode) {
    const { includeAngular } = await import("./include-angular");
    await includeAngular({ server, ...angular });
  } // eslint-disable-next-line no-console
  else console.log(chalk.yellow("[DEV MODE]: Skipping Angular SSR"));

  // Start the server
  server.start();
}
