import React from "react";

export default function ClientsList({ clients, loadError }) {
  return (
    <aside className="info-card">
      <h2>Clientes cadastrados</h2>
      {loadError ? (
        <p role="alert">Não foi possível carregar os clientes salvos.</p>
      ) : clients.length ? (
        <div id="lista-clientes" className="client-list">
          {clients.map((client) => (
            <div className="client-item" key={client.id}>
              <strong>{client.nome}</strong>
              <span>{client.cpf || "CPF não informado"}</span>
              <small>
                {client.telefone || client.email || "Contato não informado"}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <div id="lista-clientes" className="client-list">
          <p className="empty-state-message">
            Ainda não há clientes cadastrados.
          </p>
        </div>
      )}
    </aside>
  );
}
