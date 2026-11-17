import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ToolSidebar from "../../components/ToolSidebar.jsx";
import {
  getAccountEmail,
  getAccountProfile,
  isAuthenticatedAccount,
  saveAccountProfile,
  updateAccountPassword,
} from "../../utils/accountStorage.js";

const maxPhotoSize = 1.5 * 1024 * 1024;
const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Não foi possível ler a imagem selecionada."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState("");
  const [profileName, setProfileName] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  useEffect(() => {
    let active = true;
    getAccountProfile()
      .then((profile) => {
        if (!active) return;
        setPhoto(profile.photo || "");
        setProfileName(profile.name || "");
      })
      .catch((error) => {
        console.error("Erro ao carregar o perfil da conta.", error);
        if (error.status === 401) {
          navigate("/pages/lembrafarma_auth.html", { replace: true });
          return;
        }
        if (active) {
          setNotice("Não foi possível carregar as configurações salvas.");
          setNoticeIsError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!isAuthenticatedAccount() || !getAccountEmail()) {
    return <Navigate to="/pages/lembrafarma_auth.html" replace />;
  }

  async function handlePhotoChange(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!allowedPhotoTypes.includes(file.type)) {
      setNotice("Escolha uma imagem JPG, PNG ou WEBP.");
      setNoticeIsError(true);
      event.currentTarget.value = "";
      return;
    }
    if (file.size > maxPhotoSize) {
      setNotice("A imagem deve ter no máximo 1,5 MB.");
      setNoticeIsError(true);
      event.currentTarget.value = "";
      return;
    }

    try {
      const photoData = await readPhoto(file);
      await saveAccountProfile({ photo: photoData });
      setPhoto(photoData);
      setNotice("Foto de perfil atualizada.");
      setNoticeIsError(false);
    } catch (error) {
      console.error("Erro ao salvar foto do perfil.", error);
      setNotice("Não foi possível salvar a foto neste navegador.");
      setNoticeIsError(true);
    }
  }

  async function removePhoto() {
    try {
      await saveAccountProfile({ photo: "" });
      setPhoto("");
      setNotice("Foto de perfil removida.");
      setNoticeIsError(false);
    } catch (error) {
      console.error("Erro ao remover foto do perfil.", error);
      setNotice("Não foi possível remover a foto.");
      setNoticeIsError(true);
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    const name = profileName.trim();
    if (!name) {
      setNotice("Informe um nome para o perfil.");
      setNoticeIsError(true);
      return;
    }

    try {
      await saveAccountProfile({ name });
      setProfileName(name);
      setNotice("Nome do perfil atualizado.");
      setNoticeIsError(false);
    } catch (error) {
      console.error("Erro ao salvar o nome do perfil.", error);
      setNotice("Não foi possível salvar o nome neste navegador.");
      setNoticeIsError(true);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (newPassword.length < 8) {
      setNotice("A nova senha precisa ter pelo menos 8 caracteres.");
      setNoticeIsError(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice("A confirmação não corresponde à nova senha.");
      setNoticeIsError(true);
      return;
    }

    try {
      if (!await updateAccountPassword(currentPassword, newPassword)) {
        setNotice("A senha atual está incorreta.");
        setNoticeIsError(true);
        return;
      }
      form.reset();
      setNotice("Senha alterada. Use a nova senha no próximo login.");
      setNoticeIsError(false);
    } catch (error) {
      console.error("Erro ao atualizar a senha.", error);
      setNotice("Não foi possível salvar a nova senha neste navegador.");
      setNoticeIsError(true);
    }
  }

  return (
    <div className="tool-layout">
      <ToolSidebar active="Configurações" />
      <main className="tool-layout-content page-shell">
        <section className="page-panel page-panel-xl">
          <div className="page-heading">
            <p className="eyebrow">Conta</p>
            <h1>Configurações</h1>
            <p>Gerencie o nome, a senha e a foto do perfil de {getAccountEmail()}.</p>
          </div>

          <div className="settings-grid">
            <form className="form-card settings-card" onSubmit={handleProfileSave}>
              <h2>Nome do perfil</h2>
              <div className="field-group">
                <label htmlFor="profile-name">Nome exibido no painel</label>
                <input
                  id="profile-name"
                  name="profileName"
                  type="text"
                  maxLength={80}
                  autoComplete="nickname"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  required
                />
              </div>
              <button className="button" type="submit">Salvar nome</button>
            </form>

            <section className="form-card settings-card" aria-labelledby="profile-title">
              <h2 id="profile-title">Foto do perfil</h2>
              <div className="settings-profile">
                {photo ? (
                  <img className="settings-avatar" src={photo} alt="Prévia da foto de perfil" />
                ) : (
                  <span className="settings-avatar settings-avatar-placeholder" aria-hidden="true">LF</span>
                )}
                <div>
                  <label className="button button-small" htmlFor="profile-photo">Escolher foto</label>
                  <input
                    className="settings-file-input"
                    id="profile-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                  />
                  {photo && (
                    <button className="button button-small button-outline" type="button" onClick={removePhoto}>
                      Remover foto
                    </button>
                  )}
                  <p className="settings-help">JPG, PNG ou WEBP, até 1,5 MB.</p>
                </div>
              </div>
            </section>

            <form className="form-card settings-card" onSubmit={handlePasswordChange}>
              <h2>Alterar senha</h2>
              <div className="field-group">
                <label htmlFor="current-password">Senha atual</label>
                <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
              </div>
              <div className="field-group">
                <label htmlFor="new-password">Nova senha</label>
                <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
              </div>
              <div className="field-group">
                <label htmlFor="confirm-password">Confirmar nova senha</label>
                <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
              </div>
              <button className="button" type="submit">Salvar nova senha</button>
            </form>
          </div>

          <p className="settings-storage-note">
            Os dados do perfil e da senha são gerenciados pela API de autenticação LembraFarma.
          </p>
          {notice && (
            <p className={noticeIsError ? "settings-notice settings-notice-error" : "settings-notice"} role={noticeIsError ? "alert" : "status"}>
              {notice}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
