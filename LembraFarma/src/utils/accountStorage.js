const accountEmailKey = "lembrafarma.accountEmail";
const accessTokenKey = "lembrafarma.accessToken";
const legacyAuthenticatedKey = "lembrafarma.authenticated";

async function authRequest(path, { method = "GET", body, token = getAccessToken() } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api/auth${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("A API de autenticação retornou uma resposta inválida.");
  }
  if (!response.ok) {
    const error = new Error(payload?.mensagem || payload?.message || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function getAccessToken() {
  return sessionStorage.getItem(accessTokenKey);
}

export function getAccountEmail() {
  return getAccessToken()
    ? sessionStorage.getItem(accountEmailKey)?.trim().toLowerCase() || null
    : null;
}

export function isAuthenticatedAccount() {
  return Boolean(getAccessToken());
}

export function getAccountStorageKey(key) {
  const email = getAccountEmail();
  return email ? `${key}::${encodeURIComponent(email)}` : null;
}

function moveLegacyAccountData(email) {
  const accountKeys = ["lembrafarma.clientes", "lembrafarma-compras"];

  for (const key of accountKeys) {
    const legacyData = localStorage.getItem(key);
    const scopedKey = `${key}::${encodeURIComponent(email)}`;
    if (legacyData === null || localStorage.getItem(scopedKey) !== null) continue;

    const parsedData = JSON.parse(legacyData);
    if (!Array.isArray(parsedData)) {
      throw new Error(`Os dados antigos de "${key}" não estão no formato esperado.`);
    }

    localStorage.setItem(scopedKey, legacyData);
    localStorage.removeItem(key);
  }
}

export async function loginAccount(email, password) {
  const result = await authRequest("/usuarios/login", {
    method: "POST",
    body: { email, senha: password },
    token: null,
  });
  if (!result.usuario?.email || !result.token) {
    throw new Error("A API não retornou os dados necessários para autenticar.");
  }
  authenticateAccount(result.usuario.email, result.token);
  return result.usuario;
}

export async function registerAccount(account) {
  const result = await authRequest("/usuarios", {
    method: "POST",
    body: {
      nome: account.pharmacy,
      cnpj: account.cnpj,
      email: account.email,
      telefone: account.phone,
      senha: account.password,
    },
    token: null,
  });
  return result.usuario;
}

export function authenticateAccount(email, token) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !token) {
    throw new Error("A API não retornou os dados necessários para autenticar.");
  }

  moveLegacyAccountData(normalizedEmail);
  sessionStorage.removeItem(legacyAuthenticatedKey);
  sessionStorage.setItem(accountEmailKey, normalizedEmail);
  sessionStorage.setItem(accessTokenKey, token);
}

export async function getAccountProfile() {
  const result = await authRequest("/perfil");
  if (!result.usuario || typeof result.usuario !== "object" || Array.isArray(result.usuario)) {
    throw new Error("Os dados do perfil retornados pela API estão inválidos.");
  }
  return {
    name: result.usuario.nome,
    photo: "",
  };
}

export async function saveAccountProfile(profile) {
  const currentProfile = await getAccountProfile();
  const result = await authRequest("/me/profile", {
    method: "PUT",
    body: {
      name: profile.name ?? currentProfile.name,
      photo: profile.photo ?? currentProfile.photo,
    },
  });
  if (!result.profile || typeof result.profile !== "object") {
    throw new Error("A API não retornou o perfil atualizado.");
  }
  return result.profile;
}

export async function updateAccountPassword(currentPassword, newPassword) {
  await authRequest("/me/password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
  return true;
}

export function clearAuthenticatedAccount() {
  sessionStorage.removeItem(accountEmailKey);
  sessionStorage.removeItem(accessTokenKey);
  sessionStorage.removeItem(legacyAuthenticatedKey);
}
