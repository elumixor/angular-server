import cors from "cors";
import express from "express";
import "reflect-metadata";
import type { RequestMetadata } from "./request-metadata";
import { requestSymbol } from "./request-symbol";
import chalk from "chalk";

export class Server {
  readonly port;
  readonly server = express();

  constructor(
    readonly ip: string,
    devPort: string | number,
    prodPort: string | number,
    devMode: boolean
  ) {
    this.port = Number(devMode ? devPort : prodPort);
    this.server.use(express.json());

    // eslint-disable-next-line no-console
    console.log(chalk.green(`Whitelisting ${ip}:${prodPort} for CORS`));
    this.server.use(cors({ origin: `http://${ip}:${prodPort}` }));
  }

  start() {
    // eslint-disable-next-line no-console
    this.server.listen(this.port, () =>
      console.log(chalk.green(`Listening on http://${this.ip}:${this.port}`))
    );
  }

  registerConnections(target: object) {
    // Get all the methods, from the request symbol
    const keys = (Reflect.getMetadata(requestSymbol, target) ??
      []) as RequestMetadata[];

    for (const { path, propertyKey, method } of keys) {
      // eslint-disable-next-line no-console
      console.log(
        `Registering path ${method} ` +
          chalk.blue(`/api/${path}`) +
          ` -> ${String(propertyKey)}()`
      );

      this.server[method](
        `/api/${path}`,
        (req, res) =>
          void (async (req, res) => {
            try {
              const now = new Date();
              const date = `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]`;

              const params = req.params;

              // Replace :param with actual values
              let substituted = path;
              for (const [key, value] of Object.entries(params))
                substituted = substituted.replace(
                  `:${String(key)}`,
                  String(value)
                );

              if (process.env["NG_DEV"]) {
                // eslint-disable-next-line no-console
                console.log(chalk.cyan(`${date}: API request: ${substituted}`));
                // eslint-disable-next-line no-console
                console.dir(req.body, { depth: null, colors: true });
              }

              res.type("application/json");

              const handler = (
                target[propertyKey as keyof typeof target] as (
                  params: Record<string, unknown>
                ) => PromiseLike<unknown>
              ).bind(target);

              const p = { ...req.body, ...req.params } as Record<
                string,
                unknown
              >;

              const result = (await handler(p)) ?? {};

              if (process.env["NG_DEV"]) {
                // eslint-disable-next-line no-console
                console.log(
                  chalk.magenta(`${date}: API response ${substituted}`)
                );
                // eslint-disable-next-line no-console
                console.dir(result, { depth: null, colors: true });
              }
              res.status(200).send(result);
            } catch (e) {
              const message =
                (e as { message?: string }).message ?? "unknown error";
              const stackTrace = e instanceof Error ? e.stack ?? "" : "";
              // eslint-disable-next-line no-console
              console.error(chalk.red(String(e)) + "\n" + stackTrace);

              res.status(500).send({ message, stackTrace });
            }
          })(req, res)
      );
    }
  }
}
