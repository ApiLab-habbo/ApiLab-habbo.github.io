// ============================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================================
const roomId = sessionStorage.getItem("roomId");
const apiLeitura = sessionStorage.getItem("apiLeitura");
const apiEscrito = sessionStorage.getItem("apiEscrito");

let dadosGlobaisCarregados = {};
let dadosUsuarioCarregados = {};
let dadosMobiCarregados = {};
let usuarioAtual = null; 
let nomesDeVariaveisDisponiveis = []; 
let perfilUsuarioExiste = false;

// ============================================================
// ELEMENTOS DO DOM - LOGIN
// ============================================================
const formularioLogin = document.getElementById("login-form");
const campoRoomId = document.getElementById("room-id");
const campoApiEscrito = document.getElementById("write-api-key");
const campoApiLeitura = document.getElementById("read-api-key");
const loginErro = document.getElementById("login-error");

// ============================================================
// ELEMENTOS DO DOM - GLOBAL
// ============================================================
const globalVariableSearch = document.getElementById("global-variable-search");
const globalFilterClear = document.getElementById("global-filter-clear");
const globalLoadButton = document.getElementById("global-load-button");
const globalError = document.getElementById("global-error");
const globalLoading = document.getElementById("global-loading");
const globalTableSection = document.getElementById("global-table-section");
const globalTableCount = document.getElementById("global-table-count");
const globalTableBody = document.getElementById("global-table-body");
const globalEmpty = document.getElementById("global-empty");

// ============================================================
// ELEMENTOS DO DOM - USUÁRIO
// ============================================================
const userKind = document.getElementById("user-kind");
const userSearchType = document.getElementById("user-search-type");
const userEntityId = document.getElementById("user-entity-id");
const userEntityLabel = document.getElementById("user-entity-label");
const userAvatarArea = document.getElementById("user-avatar-area");
const userAvatarImage = document.getElementById("user-avatar-image");
const userAvatarFallback = document.getElementById("user-avatar-fallback");
const userAvatarName = document.getElementById("user-avatar-name");
const userVariableSearch = document.getElementById("user-variable-search");
const userFilterClear = document.getElementById("user-filter-clear");
const userLoadVariablesButton = document.getElementById("user-load-variables-button");
const userVariablesError = document.getElementById("user-variables-error");
const userVariablesLoading = document.getElementById("user-variables-loading");
const userTableSection = document.getElementById("user-table-section");
const userTableCount = document.getElementById("user-table-count");
const userTableBody = document.getElementById("user-table-body");
const userVariablesEmpty = document.getElementById("user-variables-empty");
const userAddVariableArea = document.getElementById("user-add-variable-area");
const userNewVarName = document.getElementById("user-new-var-name");
const userNewVarValue = document.getElementById("user-new-var-value");
const userAddVarButton = document.getElementById("user-add-var-button");
const userFilterBar = document.getElementById("user-filter-bar");

// ============================================================
// ELEMENTOS DO DOM - MOBI
// ============================================================
const mobiKind = document.getElementById("mobi-kind");
const mobiId = document.getElementById("mobi-id");
const mobiVariableSearch = document.getElementById("mobi-variable-search");
const mobiFilterClear = document.getElementById("mobi-filter-clear");
const mobiLoadVariablesButton = document.getElementById("mobi-load-variables-button");
const mobiVariablesError = document.getElementById("mobi-variables-error");
const mobiVariablesLoading = document.getElementById("mobi-variables-loading");
const mobiTableSection = document.getElementById("mobi-table-section");
const mobiTableCount = document.getElementById("mobi-table-count");
const mobiTableBody = document.getElementById("mobi-table-body");
const mobiVariablesEmpty = document.getElementById("mobi-variables-empty");

// ============================================================
// TOASTS
// ============================================================
const toastContainer = document.getElementById("toast-container");

function exibirToast(mensagem, tipo = "danger") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `<div><strong>${tipo === "danger" ? "Atenção:" : tipo === "success" ? "Sucesso:" : "Info:"}</strong> ${mensagem}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("hiding");
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}

async function mostrarErroAPI(res, defaultMsg) {
    let detalhe = "";
    try {
        const corpo = await res.json();
        detalhe = corpo.error ? ` (${corpo.error})` : "";
    } catch (e) { }
    exibirToast(`${defaultMsg} Status: ${res.status}${detalhe}`, "danger");
}

// ============================================================
// CARREGAR NOMES DE VARIÁVEIS (APENAS ESCOPO "users")
// ============================================================
async function carregarNomesDeVariaveis() {
    if (!roomId || !apiLeitura) return;
    try {
        const res = await fetch(`https://www.habbo.com.br/api/public/rooms/${roomId}/variables`, {
            headers: { "X-Wired-Read-Key": apiLeitura }
        });
        if (!res.ok) return;
        const dados = await res.json();
        
        const nomesApenasDeUsuarios = dados.users || [];
        nomesDeVariaveisDisponiveis = [...new Set(nomesApenasDeUsuarios)];

        if (userNewVarName) {
            userNewVarName.innerHTML = '<option value="">Selecione uma variável de usuário...</option>';
            if (nomesDeVariaveisDisponiveis.length === 0) {
                userNewVarName.innerHTML = '<option value="">Nenhuma variável de usuário encontrada no quarto</option>';
            } else {
                nomesDeVariaveisDisponiveis.forEach(nome => {
                    const option = document.createElement("option");
                    option.value = nome;
                    option.textContent = nome;
                    userNewVarName.appendChild(option);
                });
            }
        }
    } catch (err) {
        console.warn("Não foi possível carregar a lista de variáveis.", err);
        if (userNewVarName) {
            userNewVarName.innerHTML = '<option value="">Erro ao carregar variáveis</option>';
        }
    }
}

// ============================================================
// CRIAÇÃO DE LINHA DE TABELA
// ============================================================
function criarLinhaTabela(variable_name, detalhes, urlPatch, urlDelete) {
    const linha = document.createElement("tr");
    linha.innerHTML = `
        <td>${variable_name}</td>
        <td><input type="text" value="${detalhes.value}"></td>
        <td>${detalhes.creation_time ? new Date(detalhes.creation_time).toLocaleString("pt-BR") : "-"}</td>
        <td class="cell-atualizacao">${detalhes.update_time ? new Date(detalhes.update_time).toLocaleString("pt-BR") : "-"}</td>
        <td class="cell-actions">
            <div class="cell-actions-inner">
                <button type="button" class="is-danger">Excluir</button>
            </div>
        </td>
    `;
    const input = linha.querySelector("input");
    const cellAtualizacao = linha.querySelector(".cell-atualizacao");
    const btnExcluir = linha.querySelector(".is-danger");

    input.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const valorNum = Number(input.value);
        if (!Number.isSafeInteger(valorNum)) return exibirToast("O valor deve ser um número inteiro.", "danger");

        try {
            const res = await fetch(urlPatch, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "X-Wired-Write-Key": apiEscrito },
                body: JSON.stringify({ variables: { [variable_name]: valorNum } })
            });
            if (!res.ok) { await mostrarErroAPI(res, "Erro ao salvar."); return; }
            cellAtualizacao.textContent = new Date().toLocaleString("pt-BR");
            input.blur();
            exibirToast("Valor atualizado com sucesso!", "success");
        } catch (err) {
            console.error("Erro de rede:", err);
            exibirToast("Erro de rede ao salvar. Verifique sua conexão.", "danger");
        }
    });

    if (btnExcluir) {
        btnExcluir.addEventListener("click", async () => {
            if (!urlDelete) return exibirToast("Exclusão não disponível para este tipo de variável.", "info");
            if (!confirm(`Excluir a variável "${variable_name}"?`)) return;
            try {
                const res = await fetch(urlDelete, { method: "DELETE", headers: { "X-Wired-Write-Key": apiEscrito } });
                if (!res.ok) { await mostrarErroAPI(res, "Erro ao excluir."); return; }
                linha.remove();
                const countEl = document.querySelector(".category-panel.is-active .table-count > span");
                if (countEl) countEl.textContent = document.querySelector(".category-panel.is-active tbody").children.length;
                exibirToast(`Variável "${variable_name}" excluída!`, "success");
            } catch (err) {
                console.error("Erro de rede:", err);
                exibirToast("Erro de rede ao excluir.", "danger");
            }
        });
    }

    return linha;
}

// ============================================================
// LÓGICA: LOGIN
// ============================================================
if (formularioLogin) {
    formularioLogin.addEventListener("submit", function (event) {
        event.preventDefault();
        const roomId = campoRoomId.value.trim();
        const apiLeitura = campoApiLeitura.value.trim();
        const apiEscrito = campoApiEscrito.value.trim();

        if (!roomId || !apiLeitura || !apiEscrito) {
            loginErro.hidden = false;
            loginErro.querySelector(".alert-message").textContent = "Preencha o ID do quarto e as duas chaves.";
            return;
        }

        sessionStorage.setItem("roomId", roomId);
        sessionStorage.setItem("apiLeitura", apiLeitura);
        sessionStorage.setItem("apiEscrito", apiEscrito);
        loginErro.hidden = true;
        window.location.href = "gerenciamento.html";
    });
}

// ============================================================
// LÓGICA: NAVEGAÇÃO DE CATEGORIAS
// ============================================================
const categoryTabs = document.querySelectorAll(".category-tab");
if (categoryTabs.length > 0) {
    categoryTabs.forEach(botao => {
        botao.addEventListener("click", () => {
            const categoria = botao.dataset.category;
            categoryTabs.forEach(tab => { tab.classList.remove("is-active"); tab.setAttribute("aria-selected", "false"); });
            botao.classList.add("is-active");
            botao.setAttribute("aria-selected", "true");

            document.querySelectorAll(".category-panel").forEach(painel => {
                if (painel.dataset.category === categoria) { painel.hidden = false; painel.classList.add("is-active"); }
                else { painel.hidden = true; painel.classList.remove("is-active"); }
            });
        });
    });
}

// ============================================================
// LÓGICA: GLOBAL
// ============================================================
async function carregarVariaveisGlobais() {
    if (!roomId || !apiLeitura) return window.location.href = "index.html";
    globalLoading.hidden = false; globalError.hidden = true; globalEmpty.hidden = true; globalTableSection.hidden = true;
    globalTableBody.replaceChildren();
    try {
        const res = await fetch(`https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/global`, { headers: { "X-Wired-Read-Key": apiLeitura } });
        if (!res.ok) { await mostrarErroAPI(res, "Erro ao carregar variáveis globais."); return; }
        const dados = await res.json();
        dadosGlobaisCarregados = dados.variables || {};
        if (Object.keys(dadosGlobaisCarregados).length === 0) { globalEmpty.hidden = false; return; }
        Object.keys(dadosGlobaisCarregados).forEach(nome => {
            const urlPatch = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/global`;
            globalTableBody.appendChild(criarLinhaTabela(nome, dadosGlobaisCarregados[nome], urlPatch, null));
        });
        globalTableCount.textContent = Object.keys(dadosGlobaisCarregados).length;
        globalTableSection.hidden = false;
    } catch (err) {
        console.error("Erro de rede:", err);
        exibirToast("Erro de rede ao carregar variáveis globais.", "danger");
    } finally { globalLoading.hidden = true; }
}

if (globalVariableSearch) {
    globalVariableSearch.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = {};
        Object.keys(dadosGlobaisCarregados).forEach(nome => {
            if (nome.toLowerCase().includes(termo)) filtrados[nome] = dadosGlobaisCarregados[nome];
        });
        globalTableBody.replaceChildren();
        if (Object.keys(filtrados).length === 0) { globalEmpty.hidden = false; return; }
        Object.keys(filtrados).forEach(nome => {
            const urlPatch = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/global`;
            globalTableBody.appendChild(criarLinhaTabela(nome, filtrados[nome], urlPatch, null));
        });
    });
}

if (globalFilterClear) globalFilterClear.addEventListener("click", () => { globalVariableSearch.value = ""; carregarVariaveisGlobais(); });
if (globalLoadButton) globalLoadButton.addEventListener("click", carregarVariaveisGlobais);

// ============================================================
// LÓGICA: USUÁRIO
// ============================================================
if (userSearchType) {
    userSearchType.addEventListener("change", () => {
        if (userSearchType.value === "name") { userEntityLabel.textContent = "Nome do usuário"; userEntityId.placeholder = "Ex.: Steve"; }
        else { userEntityLabel.textContent = "ID da entidade"; userEntityId.placeholder = "Ex.: 12345678"; }
        userEntityId.value = ""; userAvatarArea.hidden = true; userAddVariableArea.hidden = true;
    });
}

async function carregarVariaveisUsuario() {
    if (!roomId || !apiLeitura) return window.location.href = "login.html";
    userVariablesLoading.hidden = false; userVariablesError.hidden = true; userVariablesEmpty.hidden = true; userTableSection.hidden = true; userAddVariableArea.hidden = true;
    userTableBody.replaceChildren();
    perfilUsuarioExiste = false;

    const entrada = userEntityId.value.trim();
    const tipo = userKind.value;
    if (!entrada) return exibirToast("Informe um nome ou ID.", "danger");

    try {
        let urlProfile = "";
        let identificadorParaPut = entrada;
        let nomeExibicao = entrada;

        if (tipo === "users") {
            const resPerfil = await fetch(`https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(entrada)}`);
            if (!resPerfil.ok) { await mostrarErroAPI(resPerfil, "Usuário não encontrado."); return; }
            const dadosPerfil = await resPerfil.json();
            
            identificadorParaPut = dadosPerfil.uniqueId; 
            nomeExibicao = dadosPerfil.name;

            // Avatar e dados do perfil
            userAvatarImage.src = `https://www.habboassets.com/imaging/avatar.png?figure=${encodeURIComponent(dadosPerfil.figureString)}&size=l`;
            userAvatarImage.hidden = false;
            userAvatarName.textContent = nomeExibicao;

            // Status
            const indicador = document.getElementById("user-status-indicator");
            const rotuloStatus = document.getElementById("user-status-label");
            if (dadosPerfil.online) {
                rotuloStatus.textContent = "Online";
                indicador.classList.add("status-indicator-online");
                indicador.classList.remove("status-indicator-offline");
            } else {
                rotuloStatus.textContent = "Offline";
                indicador.classList.add("status-indicator-offline");
                indicador.classList.remove("status-indicator-online");
            }

            // Missão
            const elementoMissao = document.getElementById("user-avatar-mission");
            if (dadosPerfil.motto && dadosPerfil.motto.trim()) {
                elementoMissao.textContent = dadosPerfil.motto;
                elementoMissao.hidden = false;
            } else {
                elementoMissao.hidden = true;
            }

            // Datas
            const formatarData = (isoString) => {
                if (!isoString) return "—";
                try {
                    return new Date(isoString).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                    });
                } catch (e) { return "—"; }
            };
            document.getElementById("user-last-access").textContent = formatarData(dadosPerfil.lastAccessTime);
            document.getElementById("user-member-since").textContent = formatarData(dadosPerfil.memberSince);

            userAvatarArea.hidden = false;
            urlProfile = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/user/users?name=${encodeURIComponent(nomeExibicao)}`;
        } else {
            userAvatarArea.hidden = true;
            urlProfile = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/user/${tipo}/${entrada}`;
        }

        const res = await fetch(urlProfile, { headers: { "X-Wired-Read-Key": apiLeitura } });
        
        if (res.status === 404) {
            dadosUsuarioCarregados = {};
            usuarioAtual = { tipo: tipo, id: identificadorParaPut, name: nomeExibicao };
            exibirToast("Este usuário ainda não possui variáveis no quarto. Para criar a primeira, é necessário atribuir uma variável inicial pelo jogo (via Wired). Depois, recarregue o perfil aqui.", "info");
            userAddVariableArea.hidden = true;
        } else if (!res.ok) {
            await mostrarErroAPI(res, "Erro ao buscar perfil."); 
            return;
        } else {
            const dados = await res.json();
            dadosUsuarioCarregados = dados.variables || {};
            perfilUsuarioExiste = true;
            const idReal = (dados.user && dados.user.id) ? dados.user.id : identificadorParaPut;
            usuarioAtual = { tipo: tipo, id: idReal, name: nomeExibicao };
        }

        const urlProfileBase = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/user/${tipo}/${usuarioAtual.id}`;

        if (perfilUsuarioExiste) {
            userAddVariableArea.hidden = false;
        }
        userFilterBar.hidden = false;

        if (Object.keys(dadosUsuarioCarregados).length === 0) {
            userVariablesEmpty.hidden = false;
        } else {
            Object.keys(dadosUsuarioCarregados).forEach(nome => {
                const urlDeleteIndividual = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables/user/${nome}/${tipo}/${usuarioAtual.id}`;
                userTableBody.appendChild(criarLinhaTabela(
                    nome, 
                    dadosUsuarioCarregados[nome], 
                    urlProfileBase, 
                    urlDeleteIndividual
                ));
            });
            userTableCount.textContent = Object.keys(dadosUsuarioCarregados).length;
            userTableSection.hidden = false;
        }
    } catch (err) {
        console.error("Erro de rede:", err);
        exibirToast("Erro de rede ao buscar perfil.", "danger");
        userAvatarArea.hidden = true;
    } finally { userVariablesLoading.hidden = true; }
}

if (userLoadVariablesButton) userLoadVariablesButton.addEventListener("click", carregarVariaveisUsuario);

// ============================================================
// LÓGICA: PUT (INSERIR VARIÁVEL) - BLOQUEADO SE PERFIL NÃO EXISTE
// ============================================================
if (userAddVarButton) {
    userAddVarButton.addEventListener("click", async () => {
        if (!usuarioAtual) return exibirToast("Carregue um perfil primeiro.", "danger");
        if (!perfilUsuarioExiste) {
            return exibirToast("Para criar a primeira variável, use um Wired no jogo. Depois, recarregue o perfil aqui.", "info");
        }
        
        const varName = userNewVarName.value;
        const varValue = Number(userNewVarValue.value);

        if (!varName) return exibirToast("Selecione uma variável na lista.", "danger");
        if (!Number.isSafeInteger(varValue)) {
            return exibirToast("Informe um número inteiro válido.", "danger");
        }

        try {
            const urlPut = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables/user/${varName}/${usuarioAtual.tipo}/${usuarioAtual.id}`;
            console.log("PUT na URL:", urlPut);

            const res = await fetch(urlPut, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Wired-Write-Key": apiEscrito
                },
                body: JSON.stringify({ value: varValue })
            });

            console.log("Status:", res.status);
            console.log("Resposta:", await res.clone().text());

            if (!res.ok) { await mostrarErroAPI(res, "Erro ao inserir variável."); return; }
            exibirToast(`Variável "${varName}" criada com sucesso!`, "success");
            carregarVariaveisUsuario();
        } catch (err) {
            console.error("Erro de rede:", err);
            exibirToast("Erro de rede ao inserir variável.", "danger");
        }
    });
}

// ============================================================
// LÓGICA: MOBI
// ============================================================
async function carregarVariaveisMobi() {
    if (!roomId || !apiLeitura) return window.location.href = "login.html";
    mobiVariablesLoading.hidden = false; mobiVariablesError.hidden = true; mobiVariablesEmpty.hidden = true; mobiTableSection.hidden = true;
    mobiTableBody.replaceChildren();

    const entrada = mobiId.value.trim();
    const tipo = mobiKind.value;
    if (!entrada) return exibirToast("Informe o ID do mobi.", "danger");

    try {
        const urlProfile = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables_profile/furni/${tipo}/${entrada}`;
        const res = await fetch(urlProfile, { headers: { "X-Wired-Read-Key": apiLeitura } });
        if (!res.ok) { await mostrarErroAPI(res, "Erro ao buscar mobi."); return; }
        const dados = await res.json();
        dadosMobiCarregados = dados.variables || {};

        if (Object.keys(dadosMobiCarregados).length === 0) {
            mobiVariablesEmpty.hidden = false;
        } else {
            Object.keys(dadosMobiCarregados).forEach(nome => {
                const urlDeleteIndividual = `https://www.habbo.com.br/api/public/rooms/${roomId}/variables/furni/${nome}/${tipo}/${entrada}`;
                mobiTableBody.appendChild(criarLinhaTabela(nome, dadosMobiCarregados[nome], urlProfile, urlDeleteIndividual));
            });
            mobiTableCount.textContent = Object.keys(dadosMobiCarregados).length;
            mobiTableSection.hidden = false;
        }
    } catch (err) {
        console.error("Erro de rede:", err);
        exibirToast("Erro de rede ao buscar mobi.", "danger");
    } finally { mobiVariablesLoading.hidden = true; }
}

if (mobiLoadVariablesButton) mobiLoadVariablesButton.addEventListener("click", carregarVariaveisMobi);

if (mobiVariableSearch) {
    mobiVariableSearch.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        mobiTableBody.querySelectorAll("tr").forEach(linha => {
            const nome = linha.cells[0].textContent.toLowerCase();
            linha.style.display = nome.includes(termo) ? "" : "none";
        });
    });
}

if (mobiFilterClear) {
    mobiFilterClear.addEventListener("click", () => {
        mobiVariableSearch.value = "";
        mobiTableBody.querySelectorAll("tr").forEach(linha => linha.style.display = "");
    });
}

// ============================================================
// AUTO-CARREGAMENTO
// ============================================================
if (globalLoadButton && roomId && apiLeitura) {
    carregarVariaveisGlobais();
    carregarNomesDeVariaveis();
}
