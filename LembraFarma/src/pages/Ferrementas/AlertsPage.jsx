import React, { useEffect, useState } from "react";
import ToolSidebar from "../../components/ToolSidebar.jsx";
import { getAccountStorageKey } from "../../utils/accountStorage.js";

const STORAGE_NAME = "lembrafarma-compras";

function getAlerts() {
  try {
    const storageKey = getAccountStorageKey(STORAGE_NAME);
    if (!storageKey) return [];
    const saved = localStorage.getItem(storageKey);
    const purchases = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(purchases)) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return purchases
      .map((purchase) => {
        const date = purchase.dataRecompra;

        if (!date) return null;

        const parts = String(date).split(/[/-]/);

        let endDate;

        if (parts[0].length === 4) {
          endDate = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
          );
        } else {
          endDate = new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0])
          );
        }

        if (Number.isNaN(endDate.getTime())) {
          return null;
        }

        endDate.setHours(0, 0, 0, 0);

        const daysLeft = Math.round(
          (endDate - today) / 86400000
        );

        return {
          ...purchase,
          endDate,
          daysLeft,
        };
      })
      .filter(
        (purchase) =>
          purchase !== null &&
          purchase.daysLeft >= 0 &&
          purchase.daysLeft <= 3
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);
  } catch (error) {
    console.error("Erro ao carregar alertas:", error);
    return [];
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    function loadAlerts() {
      setAlerts(getAlerts());
    }

    loadAlerts();

    window.addEventListener("storage", loadAlerts);

    return () => {
      window.removeEventListener("storage", loadAlerts);
    };
  }, []);

  return (
    <div className="tool-layout">
      <ToolSidebar active="Alertas" />

      <main className="tool-layout-content page-shell">
        <section className="page-panel">
          <div className="page-heading">
            <h1>🔔 Alertas de Recompra</h1>

            <p>
              Clientes que precisam ser avisados
              nos próximos 3 dias
            </p>
          </div>

          <div id="lista-alertas">
            {alerts.length > 0 ? (
              alerts.map((client, index) => {
                const text =
                  `Olá ${client.cliente}, seu ` +
                  `${client.produto} está acabando! ` +
                  `Sua próxima recompra está prevista ` +
                  `para ${client.endDate.toLocaleDateString(
                    "pt-BR"
                  )}.`;

                const phone = String(
                  client.telefone || ""
                ).replace(/\D/g, "");

                const whatsappUrl = phone
                  ? `https://wa.me/${phone}?text=${encodeURIComponent(
                      text
                    )}`
                  : null;

                return (
                  <article
                    key={
                      client.id ||
                      `${client.cliente}-${client.dataRecompra}-${index}`
                    }
                    style={{
                      border: "1px solid #ccc",
                      padding: 15,
                      margin: "10px 0",
                      borderRadius: 8,
                      background: "#fff3cd",
                    }}
                  >
                    <strong>
                      ⚠️ {client.cliente} — {client.produto}
                    </strong>

                    <br />

                    {client.dosagem} •{" "}
                    {client.quantidadeCaixas} caixa(s)

                    <br />

                    {client.daysLeft === 0
                      ? "A recompra está prevista para hoje."
                      : `Recompra prevista em ${client.daysLeft} dia(s).`}

                    <br />

                    Data estimada:{" "}
                    {client.endDate.toLocaleDateString("pt-BR")}

                    <br />

                    Contato: {client.contato || "Pendente"}

                    <br />

                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        className="button button-small"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: 5,
                          borderRadius: 20,
                          background: "#25D366",
                          color: "white",
                          padding: "8px 14px",
                          textDecoration: "none",
                        }}
                      >
                        📱 Enviar WhatsApp
                      </a>
                    ) : (
                      <p>
                        Telefone não cadastrado para envio.
                      </p>
                    )}
                  </article>
                );
              })
            ) : (
              <p>✅ Nenhum alerta para hoje!</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}