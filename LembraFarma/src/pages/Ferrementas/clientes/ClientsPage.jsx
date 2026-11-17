import React, { useState } from "react";
import ToolSidebar from "../../../components/ToolSidebar.jsx";
import useClientsStorage from "./useClientsStorage.js";
import useAddressLookup from "./useAddressLookup.js";
import ClientForm from "./ClientForm.jsx";
import ClientsList from "./ClientsList.jsx";
import { validarCPF } from "../../../utils/cpf.js";

export default function ClientsPage() {
  const { clients, loadError, addClient } = useClientsStorage();
  const address = useAddressLookup();

  const [cpf, setCpf] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [notice, setNotice] = useState("");

  function resetForm(form) {
    setCpf("");
    setErroCpf("");
    setTelefone("");
    address.reset();
    form?.reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("nome") || "").trim();

    if (!name) {
      setNotice("Informe o nome do cliente.");
      return;
    }

    if (cpf && !validarCPF(cpf)) {
      setErroCpf("CPF inválido");
      setNotice("Corrija o CPF antes de salvar.");
      return;
    }
    setErroCpf("");

    const newClient = {
      nome: name,
      cpf,
      telefone,
      email: String(formData.get("email") || "").trim(),
      endereco: {
        cep: address.cep,
        rua: address.rua,
        numero: String(formData.get("numero") || "").trim(),
        complemento: String(formData.get("complemento") || "").trim(),
        cidade: address.cidade,
        estado: address.estado,
      },
    };

    if (!(await addClient(newClient))) {
      setNotice("Não foi possível salvar o cliente na API.");
      return;
    }

    setNotice("Cliente cadastrado com sucesso.");
    resetForm(form);
  }

  return (
    <div className="tool-layout">
      <ToolSidebar active="Clientes" />
      <main className="tool-layout-content page-shell">
        <section className="page-panel page-panel-xl">
          <div className="page-heading">
            <p className="eyebrow">Clientes</p>
            <h1>Cadastro de clientes</h1>
          </div>
          <div className="two-column-layout">
            <ClientForm
              cpf={cpf}
              setCpf={setCpf}
              erroCpf={erroCpf}
              setErroCpf={setErroCpf}
              telefone={telefone}
              setTelefone={setTelefone}
              address={address}
              notice={notice}
              onSubmit={handleSubmit}
              onReset={(event) => resetForm(event.currentTarget)}
            />
            <ClientsList clients={clients} loadError={loadError} />
          </div>
        </section>
      </main>
    </div>
  );
}
