import path from "path";

import express from "express";

import { PROJECT_ROOT_PATH } from "../const/PROJECT_ROOT_PATH";
import { FRONTEND_PORT } from "../const/URLS";
import { logger } from "../Logger";

async function enableStaticFilesServing(): Promise<void> {
  logger.log("👉 enableWebInterface");
  const app = express();

  app.use("/dist", express.static(path.join(PROJECT_ROOT_PATH, "dist")));
  app.get("/style.css", (_req, res) => {
    res.sendFile(path.join(PROJECT_ROOT_PATH, "public", "style.css"));
  });
  app.get("*", (_req, res) => {
    res.sendFile(path.join(PROJECT_ROOT_PATH, "public", "index.html"));
  });

  return new Promise((resolve) => {
    app.listen(FRONTEND_PORT, () => {
      logger.log(`✅ enableWebInterface http://localhost:${FRONTEND_PORT}`);
      resolve();
    });
  });
}

enableStaticFilesServing();
