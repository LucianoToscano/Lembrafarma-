"use strict";

const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "LembraFarma");
const apiDir = path.join(root, "LembraFarmaAPI");

const api = spawn(process.execPath, [path.join(__dirname, "dev-sandbox-api.cjs")], {
  cwd: apiDir,
  env: {
    ...process.env,
    NODE_ENV: "test",
    JWT_SECRET: randomBytes(48).toString("hex"),
  },
  stdio: "inherit",
});
const vite = spawn(process.execPath, [
  path.join(frontendDir, "node_modules/vite/bin/vite.js"),
  "--host", "0.0.0.0",
], {
  cwd: frontendDir,
  env: { ...process.env, NODE_ENV: "development" },
  stdio: "inherit",
});

const children = [api, vite];
let shuttingDown = false;
function stop(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
}
process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());
for (const child of children) {
  child.once("error", (error) => {
    console.error("Falha ao iniciar subprocesso:", error.message);
    stop(1);
  });
  child.once("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error("Um servidor encerrou:", { code, signal });
      stop(code || 1);
    }
  });
}
console.log("Modo de demonstracao: somente dados ficticios, SQLite em memoria.");
console.log("Abra a porta privada 5173 do Codespaces. Nada sera salvo no MySQL.");
