import test from "node:test";
import assert from "node:assert/strict";
import { buscarClientes, cadastrarCliente, clienteParaApi, clienteDaApi } from "../src/pages/Ferrementas/clientes/clientsApi.js";

function mockResponse(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test("mapeia endereco para API sem id local e sem objeto aninhado", () => {
  const payload = clienteParaApi({
    id: "id-local", nome: "Ana Teste", cpf: "",
    endereco: { cep: "59000-000", rua: "Rua Teste", numero: "42", cidade: "Natal", estado: "RN" },
  });
  assert.deepEqual(payload, {
    nome: "Ana Teste", cep: "59000-000", logradouro: "Rua Teste",
    numero: "42", cidade: "Natal", estado: "RN",
  });
});

test("interpreta o envelope da listagem de clientes", async () => {
  const fetchFn = async (url, options) => {
    assert.equal(url, "/api/auth/clientes");
    assert.equal(options.headers.Authorization, "Bearer token-de-teste");
    return mockResponse({ clientes: [{ id: 7, nome: "Ana", logradouro: "Rua A", cidade: "Natal" }] });
  };
  const clients = await buscarClientes("token-de-teste", fetchFn);
  assert.equal(clients.length, 1);
  assert.equal(clients[0].id, "7");
  assert.deepEqual(clients[0].endereco, {
    cep: "", rua: "Rua A", numero: "", complemento: "", bairro: "", cidade: "Natal", estado: "",
  });
});

test("cadastro usa POST e ID fornecido pelo backend", async () => {
  const fetchFn = async (url, options) => {
    assert.equal(url, "/api/auth/clientes");
    assert.equal(options.method, "POST");
    const body = JSON.parse(options.body);
    assert.equal(body.nome, "Bruno");
    assert.equal(body.logradouro, "Rua B");
    assert.equal(body.id, undefined);
    assert.equal(body.endereco, undefined);
    return mockResponse({ cliente: { id: 13, nome: "Bruno", logradouro: "Rua B" } }, 201);
  };
  const created = await cadastrarCliente({ id: "id-browser", nome: "Bruno", endereco: { rua: "Rua B" } }, "token", fetchFn);
  assert.equal(created.id, "13");
  assert.equal(created.endereco.rua, "Rua B");
});

test("falhas da API sao exibidas como erro", async () => {
  await assert.rejects(() => cadastrarCliente({ nome: "Ana" }, "token", async () =>
    mockResponse({ mensagem: "CPF ja cadastrado" }, 409)), /CPF ja cadastrado/);
  await assert.rejects(() => buscarClientes("token", async () =>
    mockResponse({ clientes: {} })), /lista valida/);
  assert.throws(() => clienteDaApi({ nome: "Sem ID" }), /dados invalidos/);
});
