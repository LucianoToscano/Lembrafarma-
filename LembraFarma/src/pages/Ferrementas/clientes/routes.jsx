import React, { lazy } from "react";
import { Route } from "react-router-dom";

const ClientsPage = lazy(() => import("./ClientsPage.jsx"));
const DIRECTORIES = ["Ferrementas - Crie aqui", "Ferramentas - Crie aqui"];
const FILE = "Clientes.html";

export const clientRoutes = DIRECTORIES.map((directory) => (
  <Route
    key={`${directory}/${FILE}`}
    path={`/${directory}/${FILE}`}
    element={<ClientsPage />}
  />
));
