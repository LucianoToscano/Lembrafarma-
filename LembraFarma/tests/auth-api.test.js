import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import viteConfig from "../vite.config.js";
import {
  clearAuthenticatedAccount,
  getAccountEmail,
  getAccountProfile,
  getAccessToken,
  loginAccount,
  registerAccount,
} from "../src/utils/accountStorage.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

const originalFetch = globalThis.fetch;
const originalSessionStorage = globalThis.sessionStorage;
const originalLocalStorage = globalThis.localStorage;
let sessionStorage;
let localStorage;

beforeEach(() => {
  sessionStorage = createStorage();
  localStorage = createStorage();
  globalThis.sessionStorage = sessionStorage;
  globalThis.localStorage = localStorage;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.sessionStorage = originalSessionStorage;
  globalThis.localStorage = originalLocalStorage;
});

function mockResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

test("proxy de autenticação encaminha para a API e remove o prefixo do frontend", () => {
  const proxy = viteConfig.server.proxy["/api/auth"];
  assert.equal(proxy.target, "http://localhost:3000");
  assert.equal(proxy.rewrite("/api/auth/usuarios/login"), "/usuarios/login");
});

test("cadastro converte os campos do formulário para o contrato da API", async () => {
  let requestUrl;
  let requestOptions;
  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return mockResponse({
      usuario: { id: 1, nome: "Farmácia Central", email: "central@example.com" },
    }, 201);
  };

  const result = await registerAccount({
    pharmacy: "Farmácia Central",
    cnpj: "12.345.678/0001-90",
    email: "central@example.com",
    phone: "(85) 99999-9999",
    password: "senha-segura-123",
  });

  assert.equal(requestUrl, "/api/auth/usuarios");
  assert.deepEqual(JSON.parse(requestOptions.body), {
    nome: "Farmácia Central",
    cnpj: "12.345.678/0001-90",
    email: "central@example.com",
    telefone: "(85) 99999-9999",
    senha: "senha-segura-123",
  });
  assert.equal(result.nome, "Farmácia Central");
});

test("login envia senha no formato da API e guarda o token de acesso", async () => {
  globalThis.fetch = async () => mockResponse({
    token: "jwt-de-teste",
    usuario: { id: 1, nome: "Farmácia Central", email: "central@example.com" },
  });

  const usuario = await loginAccount("central@example.com", "senha-segura-123");

  assert.equal(usuario.nome, "Farmácia Central");
  assert.equal(getAccessToken(), "jwt-de-teste");
  assert.equal(getAccountEmail(), "central@example.com");
});

test("perfil consulta a rota protegida da API com o token salvo", async () => {
  sessionStorage.setItem("lembrafarma.accessToken", "jwt-de-teste");
  let requestUrl;
  let requestOptions;
  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return mockResponse({
      usuario: { id: 1, nome: "Farmácia Central", email: "central@example.com" },
    });
  };

  const profile = await getAccountProfile();

  assert.equal(requestUrl, "/api/auth/perfil");
  assert.equal(requestOptions.headers.Authorization, "Bearer jwt-de-teste");
  assert.deepEqual(profile, { name: "Farmácia Central", photo: "" });
});

test("sair remove a sessão local sem chamar uma rota de logout inexistente", () => {
  sessionStorage.setItem("lembrafarma.accessToken", "jwt-de-teste");
  sessionStorage.setItem("lembrafarma.accountEmail", "central@example.com");
  clearAuthenticatedAccount();
  assert.equal(getAccessToken(), null);
  assert.equal(getAccountEmail(), null);
});
