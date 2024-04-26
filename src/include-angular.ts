import type { Type } from "@angular/core";
import express from "express";
import { join, resolve } from "node:path";
import type { Server } from "./server";

export type BootstrapLoader = () => Promise<{
  default: Type<{}> | (() => Promise<unknown>);
}>;

export async function includeAngular({
  server,
  serverDistFolder,
  bootstrapLoader,
  browserDistFolder = resolve(serverDistFolder, "../browser"),
}: {
  server: Server;
  serverDistFolder: string;
  browserDistFolder?: string;
  bootstrapLoader?: BootstrapLoader;
}) {
  const { APP_BASE_HREF } = await import("@angular/common");
  const { CommonEngine } = await import("@angular/ssr");

  const indexHtml = join(serverDistFolder, "index.server.html");

  const commonEngine = new CommonEngine();

  server.server.set("view engine", "html");
  server.server.set("views", browserDistFolder);

  server.server.use(express.static("server/public"));
  server.server.use(express.static(browserDistFolder));

  // Serve static files from /browser
  server.server.get(
    "*.*",
    express.static(browserDistFolder, {
      maxAge: "1y",
    })
  );

  const bootstrap = (await bootstrapLoader?.())?.default as Type<{}>;

  // All regular routes use the Angular engine
  server.server.get("*", (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });
}
