const API_PATH = "/api/auth/clientes";

function getEndereco(client) {
  const endereco = client?.endereco ?? {};
  return {
    cep: endereco.cep ?? client?.cep ?? "",
    rua: endereco.rua ?? client?.logradouro ?? "",
    numero: endereco.numero ?? client?.numero ?? "",
    complemento: endereco.complemento ?? client?.complemento ?? "",
    bairro: endereco.bairro ?? client?.bairro ?? "",
    cidade: endereco.cidade ?? client?.cidade ?? "",
    estado: endereco.estado ?? client?.estado ?? "",
  };
}

export function clienteParaApi(client) {
  const endereco = getEndereco(client);
  const campos = {
    nome: client?.nome?.trim(),
    cpf: client?.cpf,
    telefone: client?.telefone,
    email: client?.email,
    cep: endereco.cep,
    logradouro: endereco.rua,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado,
  };
  if (!campos.nome) throw new Error("Informe o nome do cliente.");
  return Object.fromEntries(Object.entries(campos).filter(([, value]) =>
    value !== null && value !== undefined && value !== ""
  ));
}

export function clienteDaApi(client) {
  if (!client || client.id == null || typeof client.nome !== "string") {
    throw new Error("O servidor retornou dados invalidos de cliente.");
  }
  return {
    ...client,
    id: String(client.id),
    endereco: getEndereco(client),
  };
}

async function requisitar(path, token, options, fetchFn) {
  if (!token) throw new Error("Sessao expirada. Faca login novamente.");
  const response = await fetchFn(path, {
    method: options?.method ?? "GET",
    headers: {
      ...(options?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      Authorization: "Bearer " + token,
    },
    ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("A API de clientes retornou uma resposta invalida.");
  }
  if (!response.ok) {
    throw new Error(data?.mensagem || "Falha ao consultar a API de clientes.");
  }
  return data;
}

export async function buscarClientes(token, fetchFn = globalThis.fetch) {
  const data = await requisitar(API_PATH, token, null, fetchFn);
  if (!Array.isArray(data?.clientes)) {
    throw new Error("A API nao retornou uma lista valida de clientes.");
  }
  return data.clientes.map(clienteDaApi);
}

export async function cadastrarCliente(client, token, fetchFn = globalThis.fetch) {
  const data = await requisitar(API_PATH, token, {
    method: "POST",
    body: clienteParaApi(client),
  }, fetchFn);
  return clienteDaApi(data?.cliente);
}
