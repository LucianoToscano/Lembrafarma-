"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { setTimeout: sleep } = require("node:timers/promises");

const root = path.resolve(__dirname, "..");
const child = spawn(process.execPath, [path.join(__dirname, "dev-sandbox.cjs")], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    output = (output + chunk.toString()).slice(-10000);
  });
}

const base = "http://127.0.0.1:5173";
async function request(pathname, options = {}) {
  const response = await fetch(base + pathname, {
    ...options,
    signal: AbortSignal.timeout(4000),
  });
  const contentType = response.headers.get("content-type") || "";
  const json = contentType.includes("application/json") ? await response.json() : null;
  return { status: response.status, json };
}
function expectStatus(actual, expected, context) {
  if (actual !== expected) throw new Error(context + ": HTTP " + actual + " (esperado " + expected + ")");
}

async function main() {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const health = await request("/api/auth/health");
      const page = await request("/");
      if (health.status === 200 && health.json?.status === "ok" && page.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // Servidores ainda estao iniciando.
    }
    await sleep(400);
  }
  if (!ready) throw new Error("Vite ou API sandbox nao inicializaram.");

  const email = "sandbox-" + randomUUID() + "@example.test";
  const senha = "SomenteTeste123!";
  const headers = { "Content-Type": "application/json" };
  const cadastro = await request("/api/auth/usuarios", {
    method: "POST",
    headers,
    body: JSON.stringify({ nome: "Farmacia Teste", email, senha }),
  });
  expectStatus(cadastro.status, 201, "Cadastro via proxy Vite");

  const login = await request("/api/auth/usuarios/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, senha }),
  });
  expectStatus(login.status, 200, "Login via proxy Vite");
  if (!login.json?.token) throw new Error("Login nao retornou token.");

  const auth = { ...headers, Authorization: "Bearer " + login.json.token };
  const lista = await request("/api/auth/clientes", { headers: auth });
  expectStatus(lista.status, 200, "Listagem de clientes via proxy");
  if (!Array.isArray(lista.json?.clientes)) throw new Error("Formato inesperado da lista de clientes.");

  const novo = await request("/api/auth/clientes", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ nome: "Cliente Ficticio" }),
  });
  expectStatus(novo.status, 201, "Cadastro de cliente via proxy");
  if (!novo.json?.cliente?.id) throw new Error("Cliente criado sem ID.");

  const listagem = await request("/api/auth/clientes", { headers: auth });
  expectStatus(listagem.status, 200, "Listagem apos cadastro");
  if (!listagem.json?.clientes?.some(c => c.id === novo.json.cliente.id)) {
    throw new Error("Cliente salvo nao retornou na lista.");
  }

  console.log("Smoke test aprovado: React + proxy + API + login JWT + clientes (SQLite temporario).");
}
main().catch((error) => {
  console.error(error.message);
  console.error("Ultimas saidas da sandbox:\n", output);
  process.exitCode = 1;
}).finally(async () => {
  child.kill("SIGTERM");
  // O processo pai recebe o SIGTERM e encerra os dois filhos.
});
