import { useEffect, useState } from "react";
import { getAccountStorageKey, getAccessToken } from "../../../utils/accountStorage.js";

const storageName = "lembrafarma.clientes";

function readClients() {
  try {
    const storageKey = getAccountStorageKey(storageName);
    if (!storageKey) return [];
    const stored = localStorage.getItem(storageKey);
    const clients = stored ? JSON.parse(stored) : [];
    return Array.isArray(clients) ? clients : [];
  } catch (error) {
    console.error("Erro ao carregar clientes", error);
    return null;
  }
}

export default function useClientsStorage() {
  const [clients, setClients] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const savedClients = readClients();
    if (savedClients === null) {
      setLoadError(true);
      return;
    }
    setClients(savedClients);
    const token = getAccessToken();
    if (token) fetch('/api/auth/clientes', { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => { if (!response.ok) throw new Error('Falha ao carregar clientes do MySQL'); return response.json(); })
      .then(data => { if (active) { setClients(data); const key = getAccountStorageKey(storageName); if (key) localStorage.setItem(key, JSON.stringify(data)); } })
      .catch(error => { console.error(error); if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);

  async function addClient(client) {
    const token = getAccessToken();
    if (!token) return false;
    try {
      const response = await fetch("/api/auth/clientes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(client) });
      if (!response.ok) return false;
    } catch (error) { console.error(error); return false; }
    const nextClients = [...clients, client];
    try {
      const storageKey = getAccountStorageKey(storageName);
      if (!storageKey) return false;
      localStorage.setItem(storageKey, JSON.stringify(nextClients));
    } catch (error) {
      console.error("Erro ao salvar cliente", error);
      return false;
    }
    setClients(nextClients);
    return true;
  }

  return { clients, loadError, addClient };
}
