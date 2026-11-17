import "../js/medicamentos-core.js";
import test from "node:test";
import assert from "node:assert/strict";
const {
  normalizarTexto,
  validarIntervaloCompra,
  encontrarClientesPorTermo,
  montarPayloadMedicamento,
  validarChaveApiMedicamentos,
} = globalThis.MedicamentosCore;

test('normalizarTexto remove acentos e deixa o texto em minúsculas', () => {
  assert.equal(normalizarTexto('Loratadina'), 'loratadina');
  assert.equal(normalizarTexto('Amoxicilina ãéí'), 'amoxicilina aei');
});

test('validarIntervaloCompra aceita apenas inteiros positivos', () => {
  assert.equal(validarIntervaloCompra(30), true);
  assert.equal(validarIntervaloCompra('45'), true);
  assert.equal(validarIntervaloCompra('30 dias'), true);
  assert.equal(validarIntervaloCompra('45 dias'), true);
  assert.equal(validarIntervaloCompra(0), false);
  assert.equal(validarIntervaloCompra(-10), false);
  assert.equal(validarIntervaloCompra('abc'), false);
});

test('encontrarClientesPorTermo busca por nome ou CPF sem depender de caixa', () => {
  const clientes = [
    { id: '1', nome: 'Ana Souza', cpf: '123.456.789-09' },
    { id: '2', nome: 'Bruno Costa', cpf: '987.654.321-00' },
  ];

  assert.deepEqual(encontrarClientesPorTermo(clientes, 'ana'), [clientes[0]]);
  assert.deepEqual(encontrarClientesPorTermo(clientes, '98765432100'), [clientes[1]]);
  assert.deepEqual(encontrarClientesPorTermo(clientes, 'nao existe'), []);
});

test('montarPayloadMedicamento exige cliente e medicamento validados', () => {
  const payload = montarPayloadMedicamento({
    clienteId: '1',
    clienteNome: 'Ana Souza',
    medicamento: {
      registro: '123456789',
      nome: 'Loratadina',
      principioAtivo: 'Loratadina',
      classificacao: 'genérico'
    },
    apresentacao: 'Comprimido',
    concentracao: '10 mg',
    quantidade: '20',
    unidadeQuantidade: 'comprimidos',
    intervaloCompra: '30',
    observacoes: 'Uso contínuo'
  });

  assert.equal(payload.clienteId, '1');
  assert.equal(payload.medicamento.nome, 'Loratadina');
  assert.equal(payload.intervaloCompraDias, 30);
  assert.equal(payload.observacoes, 'Uso contínuo');

  assert.throws(() => {
    montarPayloadMedicamento({
      clienteId: '',
      medicamento: null,
      apresentacao: 'Comprimido',
      quantidade: '10',
      unidadeQuantidade: 'comprimidos',
      intervaloCompra: '30'
    });
  }, /cliente|medicamento/i);
});

test('validarChaveApiMedicamentos rejeita chaves vazias ou inválidas', async () => {
  const vazio = await validarChaveApiMedicamentos('');
  assert.equal(vazio.ok, false);
  assert.match(vazio.message, /informe a chave|chave/i);

  const invalida = await validarChaveApiMedicamentos('abc', async () => ({
    ok: false,
    status: 401,
    json: async () => ({ erro: 'chave_invalida' }),
  }));

  assert.equal(invalida.ok, false);
  assert.match(invalida.message, /inválida|permissão|autoriz/i);
});

test('validarChaveApiMedicamentos aceita uma chave validada pela API', async () => {
  const resultado = await validarChaveApiMedicamentos('chave-valida-123', async () => ({
    ok: true,
    json: async () => ({ resultados: [{ registro: '123456' }] }),
  }));

  assert.equal(resultado.ok, true);
  assert.match(resultado.message, /validada|sucesso/i);
});
