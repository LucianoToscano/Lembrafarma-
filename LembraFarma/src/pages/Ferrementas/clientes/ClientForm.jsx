import React from "react";
import { mascararTelefone } from "../../../utils/telefone.js";
import { mascararCPF, validarCPF } from "../../../utils/cpf.js";

const MEDICINES_PAGE_PATH = "/Ferrementas - Crie aqui/Medicamentos.html";

export default function ClientForm({
  cpf,
  setCpf,
  erroCpf,
  setErroCpf,
  telefone,
  setTelefone,
  address,
  notice,
  onSubmit,
  onReset,
}) {
  return (
    <form id="cliente-form" className="form-card" onSubmit={onSubmit} onReset={onReset}>
      <div className="field-group">
        <label htmlFor="cliente-nome">Nome completo</label>
        <input id="cliente-nome" name="nome" type="text" maxLength={120} required />
      </div>
      <div className="field-group">
        <label htmlFor="cliente-cpf">CPF</label>
        <input
          id="cliente-cpf"
          name="cpf"
          type="text"
          inputMode="numeric"
          maxLength={14}
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(event) => setCpf(mascararCPF(event.target.value))}
          onBlur={() => setErroCpf(cpf && !validarCPF(cpf) ? "CPF inválido" : "")}
          aria-invalid={erroCpf ? "true" : "false"}
        />
        {erroCpf && <span className="field-error">{erroCpf}</span>}
      </div>
      <div className="field-group">
        <label htmlFor="cliente-telefone">Telefone</label>
        <input
          id="cliente-telefone"
          name="telefone"
          type="tel"
          maxLength={15}
          placeholder="(00) 00000-0000"
          value={telefone}
          onChange={(event) => setTelefone(mascararTelefone(event.target.value))}
        />
      </div>
      <div className="field-group">
        <label htmlFor="cliente-email">E-mail</label>
        <input id="cliente-email" name="email" type="email" placeholder="cliente@email.com" />
      </div>

      <div className="page-heading">
        <p className="eyebrow">Endereço</p>
        <h2>Endereço do cliente</h2>
      </div>
      <div className="field-group">
        <label htmlFor="cliente-cep">CEP</label>
        <input
          id="cliente-cep"
          name="cep"
          type="text"
          inputMode="numeric"
          maxLength={9}
          placeholder="00000-000"
          value={address.cep}
          onChange={address.handleCepChange}
          aria-invalid={address.erroCep ? "true" : "false"}
        />
        {address.buscandoCep && <span className="field-error">Buscando endereço...</span>}
        {address.erroCep && <span className="field-error">{address.erroCep}</span>}
      </div>
      <div className="field-group">
        <label htmlFor="cliente-rua">Nome da rua</label>
        <input
          id="cliente-rua"
          name="rua"
          type="text"
          maxLength={120}
          value={address.rua}
          onChange={(event) => address.setRua(event.target.value)}
        />
      </div>
      <div className="field-group">
        <label htmlFor="cliente-numero">Número</label>
        <input id="cliente-numero" name="numero" type="text" maxLength={10} />
      </div>
      <div className="field-group">
        <label htmlFor="cliente-complemento">Complemento</label>
        <input
          id="cliente-complemento"
          name="complemento"
          type="text"
          maxLength={60}
          placeholder="Apto, bloco, sala..."
        />
      </div>
      <div className="field-group">
        <label htmlFor="cliente-cidade">Cidade</label>
        <input
          id="cliente-cidade"
          name="cidade"
          type="text"
          maxLength={80}
          value={address.cidade}
          onChange={(event) => address.setCidade(event.target.value)}
        />
      </div>
      <div className="field-group">
        <label htmlFor="cliente-estado">Estado</label>
        <select
          id="cliente-estado"
          name="estado"
          value={address.estado}
          onChange={(event) => address.setEstado(event.target.value)}
        >
          <option value="">
            {address.estados.length || address.erroEstados ? "Selecione" : "Carregando..."}
          </option>
          {address.estados.map(({ sigla, nome }) => (
            <option key={sigla} value={sigla}>
              {nome}
            </option>
          ))}
        </select>
        {address.erroEstados && <span className="field-error">{address.erroEstados}</span>}
      </div>

      <div className="form-actions">
        <button type="reset" className="button button-outline">Limpar</button>
        <button className="button" type="submit">Salvar cliente</button>
        <a className="button button-outline" href={MEDICINES_PAGE_PATH}>
          Voltar para medicamentos
        </a>
      </div>
      {notice && <p role="status">{notice}</p>}
    </form>
  );
}
