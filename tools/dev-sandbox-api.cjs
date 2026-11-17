"use strict";

const path = require("node:path");

// Este processo e somente para desenvolvimento. Nunca carrega o .env.
if (process.env.NODE_ENV !== "test" || !process.env.JWT_SECRET) {
  throw new Error("API sandbox requer NODE_ENV=test e JWT_SECRET temporario.");
}

const apiDir = path.resolve(__dirname, "../LembraFarmaAPI");
const db = require(path.join(apiDir, "src/models"));
const app = require(path.join(apiDir, "src/server"));

async function start() {
  await db.sequelize.sync();
  const server = app.listen(3000, "127.0.0.1", () => {
    console.log("API sandbox ativa em 127.0.0.1:3000 (SQLite na memoria).");
  });

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
    await db.sequelize.close();
    process.exit(0);
  }

  process.once("SIGTERM", () => void stop());
  process.once("SIGINT", () => void stop());
}

start().catch((error) => {
  console.error("Falha ao iniciar sandbox:", error.message);
  process.exitCode = 1;
});
