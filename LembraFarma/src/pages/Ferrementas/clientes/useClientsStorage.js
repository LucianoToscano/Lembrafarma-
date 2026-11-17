import { useEffect, useState } from "react";
import { getAccountStorageKey, getAccessToken } from "../../../utils/accountStorage.js";
import { buscarClientes, cadastrarCliente } from "./clientsApi.js";

const storageName = "lembrafarma.clientes";

function readClients() {
  try {
    const storageKey = getAccountStorageKey(storageName);
    if (!storageKey) return [];
    const stored = localStorage.getItem(storageKey);
    const clients = stored ? JSON.parse(stored) : [];
    return Array.isArray(clients) ? clients : [];
  } catch (error) {
    console.error("Erro ao carregar clientes locais", error);
    return [];
  }
}

function cacheClients(clients) {
  try {
    const storageKey = getAccountStorageKey(storageName);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(clients));
  } catch (error) {
    console.warn("Cache local de clientes indisponivel", error);
  }
}

export default function useClientsStorage() {
  const [clients, setClients] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setClients(readClients());
    const token = getAccessToken();
    if (!token) {
      setLoadError(true);
      return () => { active = false; };
    }

    buscarClientes(token)
      .then((serverClients) => {
        if (!active) return;
        setClients(serverClients);
        setLoadError(false);
        cacheClients(serverClients);
      })
      .catch((error) => {
        console.error("Falha ao consultar clientes na API", error);
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, []);

  async function addClient(client) {
    try {
      const created = await cadastrarCliente(client, getAccessToken());
      const next = [...clients, created];
      setClients(next);
      setLoadError(false);
      cacheClients(next);
      return true;
    } catch (error) {
      console.error("Falha ao cadastrar cliente na API", error);
      return false;
    }
  }

  return { clients, loadError, addClient };
}
