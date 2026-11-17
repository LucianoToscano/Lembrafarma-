import './medicamentos-core.js';
import { getAccountStorageKey } from '../src/utils/accountStorage.js';

const STORAGE_KEYS = {
    clientes: 'lembrafarma.clientes',
    medicamentos: 'lembrafarma.medicamentos',
    apiKey: 'lembrafarma.apiKey',
};

const API_BASE_URL = (typeof window !== 'undefined' && window.LembraFarmaApiBaseUrl) || '/api';

const state = {
    clienteSelecionado: null,
    medicamentoSelecionado: null,
    timeoutBusca: null,
    controller: null,
    medicamentoEmEdicao: null,
};

function listen(element, eventName, handler) {
    element?.addEventListener(eventName, handler, {
        signal: state.controller.signal,
    });
}

function getClientes() {
    try {
        const storageKey = getAccountStorageKey(STORAGE_KEYS.clientes);
        if (!storageKey) return [];
        const dados = localStorage.getItem(storageKey);
        return dados ? JSON.parse(dados) : [];
    } catch (error) {
        console.error('Erro ao ler clientes salvos.', error);
        return [];
    }
}

function ensureDemoClient() {
    const clientes = getClientes();
    if (clientes.length > 0) {
        return clientes;
    }

    const clienteDemo = {
        id: 'cliente-demo',
        nome: 'Cliente Demo',
        cpf: '111.222.333-44',
        telefone: '(11) 98888-8888',
        email: 'cliente@demo.com',
    };

    salvarClientes([clienteDemo]);
    return [clienteDemo];
}

function salvarClientes(clientes) {
    const storageKey = getAccountStorageKey(STORAGE_KEYS.clientes);
    if (!storageKey) {
        throw new Error('Entre na sua conta antes de salvar clientes.');
    }
    localStorage.setItem(storageKey, JSON.stringify(clientes));
}

function getMedicamentos() {
    try {
        const dados = localStorage.getItem(STORAGE_KEYS.medicamentos);
        return dados ? JSON.parse(dados) : [];
    } catch (error) {
        console.error('Erro ao ler medicamentos salvos.', error);
        return [];
    }
}

async function listarMedicamentosSalvos() {
    try {
        const resposta = await fetch(`${API_BASE_URL}/medicamentos`);
        if (!resposta.ok) {
            return getMedicamentos();
        }

        const dados = await resposta.json();
        if (Array.isArray(dados)) {
            localStorage.setItem(STORAGE_KEYS.medicamentos, JSON.stringify(dados));
            return dados;
        }

        return getMedicamentos();
    } catch (error) {
        console.warn('Backend de medicamentos indisponível. Usando persistência local.', error);
        return getMedicamentos();
    }
}

async function salvarMedicamento(payload) {
    const medicamento = payload && typeof payload === 'object' ? payload : {};
    const metodo = medicamento.id ? 'PUT' : 'POST';
    const url = medicamento.id ? `${API_BASE_URL}/medicamentos/${encodeURIComponent(medicamento.id)}` : `${API_BASE_URL}/medicamentos`;

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicamento),
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            throw new Error(erro.message || 'Não foi possível salvar o medicamento no backend.');
        }

        const salvo = await resposta.json();
        const medicamentos = getMedicamentos();
        const existe = medicamentos.some((item) => String(item.id) === String(salvo.id));

        if (metodo === 'PUT') {
            const atualizados = medicamentos.map((item) => (String(item.id) === String(salvo.id) ? salvo : item));
            localStorage.setItem(STORAGE_KEYS.medicamentos, JSON.stringify(atualizados));
            return salvo;
        }

        if (!existe) {
            medicamentos.push(salvo);
            localStorage.setItem(STORAGE_KEYS.medicamentos, JSON.stringify(medicamentos));
        }

        return salvo;
    } catch (error) {
        console.warn('Falha ao salvar via backend. Salvando em fallback local.', error);
        const medicamentos = getMedicamentos();
        if (medicamento.id) {
            const index = medicamentos.findIndex((item) => String(item.id) === String(medicamento.id));
            if (index >= 0) {
                medicamentos[index] = medicamento;
            } else {
                medicamentos.push(medicamento);
            }
        } else {
            medicamentos.push(medicamento);
        }
        localStorage.setItem(STORAGE_KEYS.medicamentos, JSON.stringify(medicamentos));
        return medicamento;
    }
}

function getApiKey() {
    const chaveSalva = localStorage.getItem(STORAGE_KEYS.apiKey);
    return chaveSalva ? String(chaveSalva).trim() : '';
}

function setApiKey(chave) {
    const valor = String(chave || '').trim();

    if (!valor) {
        localStorage.removeItem(STORAGE_KEYS.apiKey);
        return;
    }

    localStorage.setItem(STORAGE_KEYS.apiKey, valor);
}

function mostrarMensagem(elemento, mensagem, tipo = 'info') {
    if (!elemento) {
        return;
    }

    elemento.textContent = mensagem;
    elemento.className = `status-message status-${tipo}`;
}

function atualizarVisibilidadeConfiguracaoApi() {
    const box = document.querySelector('.api-config-box');
    if (!box) {
        return;
    }

    const chaveAtiva = getApiKey();
    box.style.display = chaveAtiva ? 'none' : 'block';
}

function selecionarCliente(cliente) {
    state.clienteSelecionado = cliente;

    const clienteCard = document.getElementById('cliente-selecionado');
    if (!clienteCard) {
        return;
    }

    if (!cliente) {
        clienteCard.innerHTML = '<p>Nenhum cliente selecionado.</p>';
        return;
    }

    clienteCard.innerHTML = `
        <div class="selected-client-header">
            <span class="badge badge-success">Cliente confirmado</span>
            <strong>${cliente.nome}</strong>
        </div>
        <ul>
            <li><span>CPF:</span> ${cliente.cpf || 'Não informado'}</li>
            <li><span>Telefone:</span> ${cliente.telefone || 'Não informado'}</li>
            <li><span>E-mail:</span> ${cliente.email || 'Não informado'}</li>
        </ul>
    `;

    const clienteResumo = document.getElementById('cliente-nome-resumo');
    if (clienteResumo) {
        clienteResumo.value = cliente.nome;
    }
}

function renderListaClientes(clientes) {
    const container = document.getElementById('resultado-clientes');
    if (!container) {
        return;
    }

    if (!clientes.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aguardando integração com a aba de clientes.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = clientes
        .slice(0, 6)
        .map(
            (cliente) => `
                <button
                    type="button"
                    class="client-option"
                    data-cliente-id="${cliente.id}"
                    aria-label="Selecionar cliente ${cliente.nome}"
                >
                    <strong>${cliente.nome}</strong>
                    <span>${cliente.cpf || cliente.telefone || 'Cliente cadastrado'}</span>
                </button>
            `
        )
        .join('');

    container.querySelectorAll('.client-option').forEach((button) => {
        listen(button, 'click', () => {
            const id = button.dataset.clienteId;
            const cliente = getClientes().find((item) => item.id === id);
            if (cliente) {
                selecionarCliente(cliente);
            }
        });
    });
}

function procurarClientes() {
    const input = document.getElementById('cliente-search');
    const clientes = getClientes();

    if (!input) {
        return;
    }

    const busca = input.value.trim();
    const resultados = window.MedicamentosCore
        ? window.MedicamentosCore.encontrarClientesPorTermo(clientes, busca)
        : clientes;

    renderListaClientes(resultados);
}

function limparSelecaoMedicamento() {
    state.medicamentoSelecionado = null;
    state.medicamentoEmEdicao = null;
    const form = document.getElementById('cadastro-medicamento-form');
    if (!form) {
        return;
    }

    form.reset();
    document.getElementById('medicamento-selecionado').innerHTML = '<p>Nenhum medicamento validado selecionado.</p>';
    form.querySelectorAll('.field-error').forEach((element) => {
        element.textContent = '';
    });
}

function renderMedicamentoSelecionado(medicamento) {
    const target = document.getElementById('medicamento-selecionado');
    if (!target) {
        return;
    }

    if (!medicamento) {
        target.innerHTML = '<p>Nenhum medicamento validado selecionado.</p>';
        return;
    }

    target.innerHTML = `
        <div class="selected-medicine-header">
            <span class="badge badge-success">Medicamento validado</span>
            <strong>${medicamento.nome}</strong>
        </div>
        <ul>
            <li><span>Princípio ativo:</span> ${medicamento.principioAtivo || 'Não informado'}</li>
            <li><span>Registro ANVISA:</span> ${medicamento.registro || 'Não informado'}</li>
            <li><span>Concentração:</span> ${medicamento.concentracao || 'Não informado'}</li>
        </ul>
    `;
}

function renderListaMedicamentosCadastrados(medicamentos) {
    const container = document.getElementById('lista-medicamentos-cadastrados');
    if (!container) {
        return;
    }

    if (!Array.isArray(medicamentos) || !medicamentos.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum medicamento cadastrado até o momento.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = medicamentos
        .slice()
        .reverse()
        .map((medicamento) => `
            <div class="medicine-option" style="display:block; padding:0.9rem 1rem; border:1px solid #dfe3eb; border-radius:12px; background:#f8fafc; margin-bottom:0.75rem;">
                <strong>${medicamento?.medicamento?.nome || 'Medicamento sem nome'}</strong>
                <div style="display:flex; flex-wrap:wrap; gap:0.5rem 1rem; margin-top:0.5rem; color:#475569; font-size:0.8rem;">
                    <span>Cliente: ${medicamento?.clienteNome || 'Não informado'}</span>
                    <span>Registro: ${medicamento?.medicamento?.registro || 'Não informado'}</span>
                    <span>Apresentação: ${medicamento?.apresentacao || 'Não informado'}</span>
                    <span>Quantidade: ${medicamento?.quantidade || '0'} ${medicamento?.unidadeQuantidade || ''}</span>
                    <span>Intervalo: ${medicamento?.intervaloCompra || 'Não informado'}</span>
                </div>
                <div style="margin-top:0.5rem; color:#64748b; font-size:0.75rem;">
                    ${medicamento?.observacoes ? `Observações: ${medicamento.observacoes}` : 'Sem observações'}
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:0.75rem; flex-wrap:wrap;">
                    <button type="button" class="button button-small button-outline" data-action="editar" data-id="${medicamento?.id || ''}">Editar</button>
                    <button type="button" class="button button-small button-outline" data-action="excluir" data-id="${medicamento?.id || ''}">Excluir</button>
                </div>
            </div>
        `)
        .join('');

    container.querySelectorAll('[data-action]').forEach((botao) => {
        const acao = botao.dataset.action;
        const id = botao.dataset.id;

        if (!id) {
            return;
        }

        if (acao === 'editar') {
            listen(botao, 'click', async () => {
                await editarMedicamentoCadastrado(id);
            });
        }

        if (acao === 'excluir') {
            listen(botao, 'click', async () => {
                await excluirMedicamentoCadastrado(id);
            });
        }
    });
}

async function editarMedicamentoCadastrado(id) {
    const medicamentos = await listarMedicamentosSalvos();
    const cadastro = medicamentos.find((item) => String(item.id) === String(id));

    if (!cadastro) {
        mostrarMensagem(document.getElementById('medicamento-status'), 'Cadastro não encontrado para edição.', 'error');
        return;
    }

    state.medicamentoEmEdicao = cadastro.id || null;
    state.clienteSelecionado = {
        id: cadastro.clienteId,
        nome: cadastro.clienteNome,
    };
    state.medicamentoSelecionado = cadastro.medicamento || {};

    const form = document.getElementById('cadastro-medicamento-form');
    if (form) {
        const intervaloSelect = form.querySelector('[name="intervaloCompra"]');
        const intervaloCustom = form.querySelector('[name="intervaloCustomizado"]');
        const valorIntervalo = String(cadastro.intervaloCompra || '').trim();
        const intervalosPadrao = ['30', '45', '60', '90'];

        form.querySelector('[name="apresentacao"]').value = cadastro.apresentacao || '';
        form.querySelector('[name="concentracao"]').value = cadastro.concentracao || '';
        form.querySelector('[name="quantidadeAdquirida"]').value = cadastro.quantidade || '';
        form.querySelector('[name="unidadeQuantidade"]').value = cadastro.unidadeQuantidade || '';
        form.querySelector('[name="observacoes"]').value = cadastro.observacoes || '';
        form.querySelector('[name="nomeMedicamento"]').value = cadastro.medicamento?.nome || '';
        form.querySelector('[name="principioAtivo"]').value = cadastro.medicamento?.principioAtivo || '';
        form.querySelector('[name="registroAnvisa"]').value = cadastro.medicamento?.registro || '';

        if (intervalosPadrao.includes(valorIntervalo)) {
            intervaloSelect.value = valorIntervalo;
            if (intervaloCustom) {
                intervaloCustom.disabled = true;
                intervaloCustom.value = '';
            }
        } else {
            intervaloSelect.value = 'outro';
            if (intervaloCustom) {
                intervaloCustom.disabled = false;
                intervaloCustom.value = valorIntervalo || '';
            }
        }
    }

    const clienteResumo = document.getElementById('cliente-nome-resumo');
    if (clienteResumo) {
        clienteResumo.value = cadastro.clienteNome || 'Nenhum cliente selecionado';
    }

    renderMedicamentoSelecionado(state.medicamentoSelecionado);
    preencherCamposMedicamento(state.medicamentoSelecionado);
    window.dispatchEvent(new CustomEvent('lembrafarma:medicamento-tab', { detail: { tab: 'cadastro' } }));
    mostrarMensagem(document.getElementById('medicamento-status'), 'Cadastro carregado para edição.', 'info');
}

async function excluirMedicamentoCadastrado(id) {
    if (!id) {
        return;
    }

    try {
        const resposta = await fetch(`${API_BASE_URL}/medicamentos/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });

        if (!resposta.ok) {
            throw new Error('Não foi possível excluir o cadastro.');
        }

        const medicamentos = getMedicamentos().filter((item) => String(item.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.medicamentos, JSON.stringify(medicamentos));
        await carregarMedicamentosCadastrados();
        mostrarMensagem(document.getElementById('medicamento-status'), 'Cadastro removido com sucesso.', 'success');
    } catch (error) {
        const medicamentos = getMedicamentos().filter((item) => String(item.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.medicamentos, JSON.stringify(medicamentos));
        await carregarMedicamentosCadastrados();
        mostrarMensagem(document.getElementById('medicamento-status'), 'Cadastro removido do armazenamento local.', 'info');
    }
}

async function carregarMedicamentosCadastrados() {
    const container = document.getElementById('lista-medicamentos-cadastrados');
    if (!container) {
        return;
    }

    try {
        const resposta = await fetch(`${API_BASE_URL}/medicamentos`);
        const dados = resposta.ok ? await resposta.json() : getMedicamentos();
        const lista = Array.isArray(dados) ? dados : getMedicamentos();
        renderListaMedicamentosCadastrados(lista);
    } catch (error) {
        renderListaMedicamentosCadastrados(getMedicamentos());
        console.warn('Não foi possível carregar os cadastros via API. Usando fallback local.', error);
    }
}

function preencherCamposMedicamento(detalhes) {
    const form = document.getElementById('cadastro-medicamento-form');
    if (!form) {
        return;
    }

    const nomeInput = form.querySelector('[name="nomeMedicamento"]');
    const ativoInput = form.querySelector('[name="principioAtivo"]');
    const concentracaoInput = form.querySelector('[name="concentracao"]');
    const registroInput = form.querySelector('[name="registroAnvisa"]');
    const apresentacaoInput = form.querySelector('[name="apresentacao"]');

    if (nomeInput) nomeInput.value = detalhes.nome || '';
    if (ativoInput) ativoInput.value = detalhes.principioAtivo || '';
    if (concentracaoInput) concentracaoInput.value = detalhes.concentracao || '';
    if (registroInput) registroInput.value = detalhes.registro || '';

    if (apresentacaoInput && detalhes.apresentacaoDisponivel) {
        const opcoes = Array.from(apresentacaoInput.options).map((option) => option.value.toLowerCase());
        const valor = detalhes.apresentacaoDisponivel.toLowerCase();
        if (opcoes.includes(valor)) {
            apresentacaoInput.value = valor;
        }
    }
}

async function buscarDetalhesMedicamento(registro) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return null;
    }

    const url = `https://medicamentos.api.br/api/v1/medicamentos/${registro}?icms=18`;
    const resposta = await fetch(url, {
        headers: {
            'X-API-Key': apiKey,
        },
    });

    if (!resposta.ok) {
        return null;
    }

    const dados = await resposta.json();
    const apresentacaoPadrao = dados?.cmed?.apresentacoes?.[0]?.apresentacao || '';
    const concentracaoPadrao = apresentacaoPadrao.match(/\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|mL|mg\/mL|ui|UI)/i)?.[0] || '';

    return {
        nome: dados?.nome || '',
        principioAtivo: dados?.principioAtivo || '',
        registro: dados?.registro || '',
        concentracao: concentracaoPadrao || dados?.principioAtivo || '',
        apresentacaoDisponivel: apresentacaoPadrao,
    };
}

async function consultarMedicamento() {
    const input = document.getElementById('medicamento-search');
    const lista = document.getElementById('resultado-medicamentos');
    const status = document.getElementById('medicamento-status');

    if (!input || !lista || !status) {
        return;
    }

    const termo = input.value.trim();
    if (termo.length < 2) {
        lista.innerHTML = '';
        mostrarMensagem(status, 'Digite pelo menos 2 caracteres para buscar.', 'info');
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        lista.innerHTML = '';
        atualizarVisibilidadeConfiguracaoApi();
        mostrarMensagem(status, 'Configure a chave da API para consultar medicamentos.', 'error');
        return;
    }

    mostrarMensagem(status, 'Consultando medicamento...', 'info');

    const url = new URL('https://medicamentos.api.br/api/v1/medicamentos');
    url.searchParams.set('nome', termo);
    url.searchParams.set('porPagina', '5');

    try {
        const resposta = await fetch(url, {
            headers: {
                'X-API-Key': apiKey,
            },
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            const codigoErro = erro.erro;
            if (codigoErro === 'nao_autenticado' || codigoErro === 'chave_invalida') {
                throw new Error('Chave inválida ou ausente. Configure a chave local da API antes de consultar medicamentos.');
            }
            throw new Error('Não foi possível realizar a consulta naquele momento.');
        }

        const dados = await resposta.json();
        const resultados = Array.isArray(dados.resultados) ? dados.resultados : [];

        if (!resultados.length) {
            mostrarMensagem(status, 'Medicamento não localizado. Verifique a grafia ou confira as sugestões disponíveis.', 'error');
            lista.innerHTML = '';
            return;
        }

        lista.innerHTML = resultados
            .filter((item, index, array) => array.findIndex((procurado) => procurado.registro === item.registro) === index)
            .slice(0, 6)
            .map(
                (item) => `
                    <button type="button" class="medicine-option" data-registro="${item.registro}">
                        <strong>${item.nome}</strong>
                        <span>${item.principioAtivo || 'Princípio ativo não informado'}</span>
                    </button>
                `
            )
            .join('');

        lista.querySelectorAll('.medicine-option').forEach((botao) => {
            listen(botao, 'click', async () => {
                const registro = botao.dataset.registro;
                const itemSelecionado = resultados.find((item) => item.registro === registro);
                if (!itemSelecionado) {
                    return;
                }

                mostrarMensagem(status, 'Validando medicamento selecionado...', 'info');
                const detalhes = await buscarDetalhesMedicamento(registro);
                state.medicamentoSelecionado = {
                    ...itemSelecionado,
                    ...(detalhes || {}),
                };
                renderMedicamentoSelecionado(state.medicamentoSelecionado);
                preencherCamposMedicamento(state.medicamentoSelecionado);
                mostrarMensagem(status, 'Medicamento validado com sucesso pela base da ANVISA.', 'success');
            });
        });

        mostrarMensagem(status, `${resultados.length} resultado(s) encontrado(s). Selecione o medicamento correto.`, 'success');
    } catch (error) {
        lista.innerHTML = '';
        mostrarMensagem(status, error.message || 'Não foi possível realizar a consulta naquele momento.', 'error');
    }
}

function validarFormularioMedicamento() {
    const form = document.getElementById('cadastro-medicamento-form');
    if (!form) {
        return false;
    }

    const campos = {
        apresentacao: form.querySelector('[name="apresentacao"]'),
        intervalo: form.querySelector('[name="intervaloCompra"]'),
        quantidade: form.querySelector('[name="quantidadeAdquirida"]'),
        unidade: form.querySelector('[name="unidadeQuantidade"]'),
    };

    const intervaloCustom = form.querySelector('[name="intervaloCustomizado"]');
    let valido = true;

    Object.entries(campos).forEach(([nome, campo]) => {
        const target = form.querySelector(`[data-error="${nome}"]`);
        if (!campo || !target) {
            return;
        }

        if (nome === 'apresentacao' && !campo.value) {
            target.textContent = 'Selecione a apresentação farmacêutica.';
            valido = false;
        } else if (nome === 'intervalo') {
            const valorIntervalo = campo.value === 'outro' ? (intervaloCustom?.value ?? '') : campo.value;
            if (!window.MedicamentosCore.validarIntervaloCompra(valorIntervalo)) {
                target.textContent = 'Informe um intervalo válido em dias.';
                valido = false;
            } else {
                target.textContent = '';
            }
        } else if (nome === 'quantidade' && (Number(campo.value) <= 0 || !campo.value)) {
            target.textContent = 'Quantidade inválida.';
            valido = false;
        } else if (nome === 'unidade' && !campo.value) {
            target.textContent = 'Selecione a unidade.';
            valido = false;
        } else {
            target.textContent = '';
        }
    });

    if (!state.clienteSelecionado) {
        mostrarMensagem(document.getElementById('medicamento-status'), 'Selecione um cliente válido antes de salvar.', 'error');
        return false;
    }

    if (!state.medicamentoSelecionado || !state.medicamentoSelecionado.registro) {
        mostrarMensagem(document.getElementById('medicamento-status'), 'Selecione um medicamento validado pela API antes de salvar.', 'error');
        return false;
    }

    return valido;
}

async function salvarMedicamentoFormulario() {
    const form = document.getElementById('cadastro-medicamento-form');
    if (!form) {
        return;
    }

    if (!validarFormularioMedicamento()) {
        return;
    }

    const intervaloSelect = form.querySelector('[name="intervaloCompra"]');
    const intervaloCustom = form.querySelector('[name="intervaloCustomizado"]');
    const valorIntervalo = intervaloSelect.value === 'outro' ? (intervaloCustom?.value ?? '') : intervaloSelect.value;

    const payload = window.MedicamentosCore.montarPayloadMedicamento({
        clienteId: state.clienteSelecionado.id,
        clienteNome: state.clienteSelecionado.nome,
        medicamento: state.medicamentoSelecionado,
        apresentacao: form.querySelector('[name="apresentacao"]').value,
        concentracao: form.querySelector('[name="concentracao"]').value,
        quantidade: form.querySelector('[name="quantidadeAdquirida"]').value,
        unidadeQuantidade: form.querySelector('[name="unidadeQuantidade"]').value,
        intervaloCompra: valorIntervalo,
        observacoes: form.querySelector('[name="observacoes"]').value,
    });

    if (state.medicamentoEmEdicao) {
        payload.id = state.medicamentoEmEdicao;
    }

    try {
        await salvarMedicamento(payload);
        await carregarMedicamentosCadastrados();
        const mensagem = state.medicamentoEmEdicao ? 'Cadastro atualizado com sucesso.' : 'Cadastro concluído com sucesso e enviado ao backend.';
        mostrarMensagem(document.getElementById('medicamento-status'), mensagem, 'success');
        form.reset();
        limparSelecaoMedicamento();
        state.medicamentoSelecionado = null;
        state.medicamentoEmEdicao = null;
        document.getElementById('medicamento-selecionado').innerHTML = '<p>Nenhum medicamento validado selecionado.</p>';
    } catch (error) {
        mostrarMensagem(document.getElementById('medicamento-status'), error.message || 'Não foi possível salvar o cadastro do medicamento.', 'error');
    }
}

function inicializarFormularioCliente() {
    const input = document.getElementById('cliente-search');
    const lista = document.getElementById('resultado-clientes');

    if (!input || !lista) {
        return;
    }

    const clientes = ensureDemoClient();
    if (!clientes.length) {
        lista.innerHTML = `
            <div class="empty-state">
                <p>Aguardando integração com a aba de clientes.</p>
            </div>
        `;
        return;
    }

    listen(input, 'input', () => {
        if (state.timeoutBusca) {
            clearTimeout(state.timeoutBusca);
        }

        state.timeoutBusca = setTimeout(procurarClientes, 180);
    });

    procurarClientes();
}

function inicializarCampoApi() {
    const campo = document.getElementById('api-key-input');
    const botao = document.getElementById('salvar-api-key');
    if (!campo || !botao) {
        return;
    }

    campo.value = getApiKey();
    atualizarVisibilidadeConfiguracaoApi();

    listen(botao, 'click', async () => {
        const valor = String(campo.value || '').trim();
        if (!valor) {
            mostrarMensagem(document.getElementById('medicamento-status'), 'Informe a chave da API antes de salvar.', 'error');
            campo.focus();
            return;
        }

        const validacao = await window.MedicamentosCore.validarChaveApiMedicamentos(valor);
        if (!validacao.ok) {
            mostrarMensagem(document.getElementById('medicamento-status'), validacao.message, 'error');
            campo.focus();
            return;
        }

        setApiKey(valor);
        atualizarVisibilidadeConfiguracaoApi();
        mostrarMensagem(document.getElementById('medicamento-status'), validacao.message, 'success');
    });

    listen(campo, 'keydown', async (event) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        botao.click();
    });
}

function inicializarFormularioMedicamento() {
    const form = document.getElementById('cadastro-medicamento-form');
    const botaoSalvar = document.getElementById('salvar-cadastro');
    const botaoBuscar = document.getElementById('buscar-medicamento');
    const inputBusca = document.getElementById('medicamento-search');
    const botaoVoltar = document.getElementById('botao-voltar');
    const botaoCancelar = document.getElementById('botao-cancelar');

    if (!form || !botaoSalvar || !inputBusca || !botaoBuscar) {
        return;
    }

    listen(botaoBuscar, 'click', consultarMedicamento);
    listen(inputBusca, 'keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            consultarMedicamento();
        }
    });

    listen(botaoSalvar, 'click', async (event) => {
        event.preventDefault();
        await salvarMedicamentoFormulario();
    });

    if (botaoCancelar) {
        listen(botaoCancelar, 'click', () => {
            form.reset();
            state.medicamentoSelecionado = null;
            state.medicamentoEmEdicao = null;
            if (document.getElementById('medicamento-selecionado')) {
                document.getElementById('medicamento-selecionado').innerHTML = '<p>Nenhum medicamento validado selecionado.</p>';
            }
            mostrarMensagem(document.getElementById('medicamento-status'), 'Cadastro cancelado. Você pode iniciar novamente.', 'info');
        });
    }

    if (botaoVoltar) {
        listen(botaoVoltar, 'click', () => {
            window.history.back();
        });
    }

    const intervalo = form.querySelector('[name="intervaloCompra"]');
    if (intervalo) {
        listen(intervalo, 'change', () => {
            const valor = intervalo.value;
            const campoCustom = form.querySelector('[name="intervaloCustomizado"]');
            if (campoCustom) {
                campoCustom.disabled = valor !== 'outro';
                if (valor !== 'outro') {
                    campoCustom.value = '';
                }
            }
        });
    }
}

export function inicializarMedicamentos() {
    state.controller?.abort();
    state.controller = new AbortController();
    ensureDemoClient();
    selecionarCliente(null);
    inicializarFormularioCliente();
    inicializarCampoApi();
    inicializarFormularioMedicamento();
    carregarMedicamentosCadastrados();
    const status = document.getElementById('medicamento-status');
    if (status) {
        const clientes = getClientes();
        if (clientes.length > 0 && clientes[0].id === 'cliente-demo') {
            mostrarMensagem(status, 'Cliente de demonstração carregado. A integração com a aba de clientes pode substituir este registro quando ela ficar pronta.', 'info');
        } else {
            mostrarMensagem(status, 'Selecione um cliente e valide um medicamento para continuar.', 'info');
        }
    }
    return () => {
        state.controller?.abort();
        if (state.timeoutBusca) {
            clearTimeout(state.timeoutBusca);
            state.timeoutBusca = null;
        }
    };
}
