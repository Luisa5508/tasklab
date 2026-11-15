// =====================================================
// TaskLab — Gerenciador de Tarefas
// CRUD (cadastrar, listar, editar, excluir) + localStorage
// =====================================================
//
// FLUXO GERAL DA APLICAÇÃO
//
// Ao abrir a página:
//   carregar dados do localStorage → montar o array tarefas → renderizar
//
// Quando o usuário faz uma ação:
//   alterar o array tarefas → salvar no localStorage → renderizar
//
// A tela é SEMPRE construída a partir do array "tarefas".
// O array é a fonte da verdade; a tela só mostra o que está nele.
// =====================================================


// =====================================================
// 1. CONFIGURAÇÕES (valores fixos)
// =====================================================
// Estas constantes precisam vir ANTES do estado (seção 3),
// porque a função carregarTarefas() usa elas logo no início.
// Se viessem depois, o JavaScript daria erro ao tentar usá-las.

// Nome da "gaveta" onde as tarefas ficam guardadas no localStorage.
// Usamos um nome específico ("tasklab:...") para não misturar
// com dados de outras aplicações.
const CHAVE_TAREFAS = "tasklab:tarefas";

// Nome da "gaveta" onde guardamos o filtro escolhido (desafio 52).
const CHAVE_FILTRO = "tasklab:filtro";

// Lista dos valores de filtro que aceitamos.
// Serve para não aplicar um valor estranho que esteja salvo.
const FILTROS_VALIDOS = ["todas", "pendentes", "concluidas"];

// Desafio 51 — tarefas de exemplo.
// Elas aparecem SOMENTE no primeiro acesso (quando ainda não
// existe nada salvo). Se o usuário apagar tudo depois, elas
// NÃO voltam, porque aí já existe "[]" salvo.
const tarefasIniciais = [
    {
        id: 1,
        titulo: "Conhecer o TaskLab",
        descricao: "Explore o cadastro, a edição e a exclusão de tarefas.",
        prioridade: "normal",
        data: "2026-11-20",
        concluida: false
    },
    {
        id: 2,
        titulo: "Concluir uma tarefa",
        descricao: "Clique em Concluir e depois em Reabrir.",
        prioridade: "baixa",
        data: "2026-11-21",
        concluida: false
    },
    {
        id: 3,
        titulo: "Atualizar a página",
        descricao: "Veja que as tarefas continuam salvas.",
        prioridade: "alta",
        data: "2026-11-22",
        concluida: true
    }
];

// "Tradutor" do valor salvo para o texto mostrado na tela.
// Exemplo: NOMES_PRIORIDADE["alta"] → "Alta"
const NOMES_PRIORIDADE = {
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta"
};

// Peso de cada prioridade, usado para ORDENAR.
// Quanto maior o número, mais importante a tarefa.
const PESO_PRIORIDADE = {
    alta: 3,
    normal: 2,
    baixa: 1
};


// =====================================================
// 2. ARMAZENAMENTO (localStorage)
// =====================================================
// O localStorage guarda dados no navegador, e eles continuam
// lá mesmo depois de atualizar a página ou fechar o navegador.
//
// ATENÇÃO: o localStorage só guarda TEXTO (string).
// Por isso usamos:
//   JSON.stringify() → transforma array/objeto em texto (para salvar)
//   JSON.parse()     → transforma texto em array/objeto (para ler)

// Salva o array "tarefas" no localStorage.
function salvarTarefas() {
    // 1. Converte o array de objetos em texto JSON
    //    [ {id:1, ...} ] → '[{"id":1, ...}]'
    const dados = JSON.stringify(tarefas);

    // 2. Guarda esse texto na chave "tasklab:tarefas"
    localStorage.setItem(CHAVE_TAREFAS, dados);
}

// Lê as tarefas salvas e devolve um array.
// É chamada UMA vez, quando a página abre.
function carregarTarefas() {
    // Busca o texto guardado.
    // Se a chave não existir, o getItem devolve null.
    const dados = localStorage.getItem(CHAVE_TAREFAS);

    // Desafio 51 — diferença entre:
    //   null  → nunca foi salvo nada = PRIMEIRO ACESSO → usa os exemplos
    //   "[]"  → já foi salvo, mas está vazio = usuário apagou tudo
    if (dados === null) {
        // Devolve uma CÓPIA de cada exemplo ({ ...tarefa }),
        // para não alterar a lista original de exemplos.
        return tarefasIniciais.map(tarefa => ({ ...tarefa }));
    }

    // try/catch: "tente fazer isto; se der erro, faça aquilo".
    // O JSON.parse() QUEBRA se o texto salvo não for um JSON válido
    // (por exemplo, se alguém editou o localStorage na mão).
    try {
        // Converte o texto de volta para array de objetos
        const tarefasSalvas = JSON.parse(dados);

        // Mesmo sendo JSON válido, pode não ser um array
        // (ex.: alguém salvou só um número ou um objeto).
        // Nesse caso, começamos com a lista vazia.
        if (!Array.isArray(tarefasSalvas)) {
            return [];
        }

        // Deu tudo certo: devolve as tarefas salvas
        return tarefasSalvas;

    } catch (erro) {
        // Se o JSON.parse() deu erro, cai aqui.
        // Mostramos o problema no console (para o desenvolvedor)
        // e a aplicação continua funcionando com a lista vazia.
        console.error(
            "Não foi possível carregar as tarefas.",
            erro
        );

        return [];
    }
}

// Desafio 52 — salva o filtro de situação escolhido.
// É um texto simples ("todas", "pendentes"...), então
// não precisa de JSON.stringify.
function salvarFiltro() {
    localStorage.setItem(CHAVE_FILTRO, filtroSituacao.value);
}

// Desafio 52 — recupera o filtro salvo e aplica no <select>.
function carregarFiltro() {
    const filtroSalvo = localStorage.getItem(CHAVE_FILTRO);

    // Só aplica se for um valor que conhecemos.
    // Se for null (nunca salvo) ou algo estranho, mantém "Todas".
    if (FILTROS_VALIDOS.includes(filtroSalvo)) {
        filtroSituacao.value = filtroSalvo;
    }
}


// =====================================================
// 3. ESTADO DA APLICAÇÃO
// =====================================================
// "Estado" = os dados que a aplicação está usando agora.

// ESTADO PERSISTENTE (é salvo no localStorage).
// Em vez de começar com [], começa com o que estava salvo.
// É "let" (e não "const") porque no "Apagar todas"
// a variável recebe um array NOVO: tarefas = [].
let tarefas = carregarTarefas();

// ESTADO TEMPORÁRIO (NÃO é salvo).
// Guarda o id da tarefa que está sendo editada.
//   null → formulário está CADASTRANDO
//   número → formulário está EDITANDO a tarefa com esse id
// Se a página for atualizada no meio de uma edição,
// tudo bem perder essa informação.
let idEmEdicao = null;


// =====================================================
// 4. ELEMENTOS DA PÁGINA (HTML)
// =====================================================
// Pegamos os elementos UMA vez e guardamos em constantes,
// para não precisar procurar no HTML toda hora.

// Campos do formulário
const formulario = document.querySelector("#form-tarefa");
const campoTitulo = document.querySelector("#titulo");
const campoDescricao = document.querySelector("#descricao");
const campoPrioridade = document.querySelector("#prioridade");
const campoData = document.querySelector("#data");
const mensagemFormulario = document.querySelector("#mensagem-formulario");

// Elementos que mudam no modo edição
const tituloFormulario = document.querySelector("#titulo-formulario");
const botaoSalvar = document.querySelector("#botao-salvar");
const botaoCancelar = document.querySelector("#botao-cancelar");

// Área da lista
const listaTarefas = document.querySelector("#lista-tarefas");
const resumoTarefas = document.querySelector("#resumo-tarefas");
const botaoApagarTodas = document.querySelector("#botao-apagar-todas");

// Filtros e ordenação
const filtroSituacao = document.querySelector("#filtro-situacao");
const filtroPrioridade = document.querySelector("#filtro-prioridade");
const campoOrdenacao = document.querySelector("#ordenacao");

// Mensagem para confirmar que o arquivo JS foi carregado
console.log("TaskLab iniciado.");


// =====================================================
// 5. FUNÇÕES AUXILIARES (pequenas tarefas reutilizáveis)
// =====================================================

// Gera o próximo id disponível.
// Exemplo: ids [1, 2, 5] → próximo id = 6
function gerarProximoId() {
    // Lista vazia: o primeiro id é 1
    if (tarefas.length === 0) {
        return 1;
    }

    // map() cria um array só com os ids: [1, 2, 5]
    const ids = tarefas.map(tarefa => tarefa.id);

    // Math.max(...ids) pega o maior id (o "..." espalha o array)
    // e somamos 1
    return Math.max(...ids) + 1;
}

// Confere se os dados do formulário estão corretos.
// Devolve:
//   uma MENSAGEM DE ERRO → se algo estiver errado
//   ""  (texto vazio)    → se estiver tudo certo
// O "return" para a função no primeiro erro encontrado.
function validarTarefa(dados) {
    if (dados.titulo === "") {
        return "Informe o título da tarefa.";
    }

    if (dados.titulo.length < 5) {
        return "O título deve ter no mínimo 5 caracteres.";
    }

    if (dados.prioridade === "") {
        return "Selecione a prioridade da tarefa.";
    }

    if (dados.data === "") {
        return "Informe a data da tarefa.";
    }

    // Passou por todas as verificações
    return "";
}

// Converte a data do formato do input para o formato brasileiro.
// "2026-12-02" → "02/12/2026"
function formatarData(data) {
    // split("-") separa o texto: ["2026", "12", "02"]
    // e cada parte vai para uma variável (desestruturação)
    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}

// Cria um botão de ação para o card.
// Exemplo: criarBotao("Editar", "editar", 3) gera:
//   <button type="button" data-acao="editar" data-id="3">Editar</button>
function criarBotao(texto, acao, id) {
    const botao = document.createElement("button");

    // type="button" impede que o botão envie o formulário sem querer
    botao.type = "button";
    botao.textContent = texto;

    // dataset cria os atributos data-*
    // dataset.acao → data-acao | dataset.id → data-id
    botao.dataset.acao = acao;
    botao.dataset.id = id;

    return botao;
}

// Mostra uma mensagem (erro ou sucesso) abaixo do formulário.
function mostrarMensagem(texto) {
    mensagemFormulario.textContent = texto;
}


// =====================================================
// 6. INTERFACE (RENDERIZAÇÃO)
// =====================================================
// "Renderizar" = desenhar na tela o que está no array tarefas.

// Monta o card (o "cartão") de UMA tarefa e devolve ele pronto.
function criarCardTarefa(tarefa) {
    const card = document.createElement("article");
    card.classList.add("tarefa");

    // A aparência é CONSEQUÊNCIA dos dados:
    // se a tarefa está concluída, o card recebe a classe
    // que deixa ele riscado/apagado (definida no CSS).
    if (tarefa.concluida) {
        card.classList.add("tarefa-concluida");
    }

    // Título
    const titulo = document.createElement("h3");
    titulo.textContent = tarefa.titulo;

    // Descrição ( || = "se estiver vazia, use este texto")
    const descricao = document.createElement("p");
    descricao.textContent = tarefa.descricao || "Sem descrição.";

    // Prioridade (traduzida: "alta" → "Alta")
    const prioridade = document.createElement("p");
    prioridade.textContent =
        `Prioridade: ${NOMES_PRIORIDADE[tarefa.prioridade]}`;

    // Data no formato brasileiro
    const data = document.createElement("p");
    data.textContent = `Data: ${formatarData(tarefa.data)}`;

    // Situação: operador ternário (um "if" curto)
    //   condição ? valorSeVerdadeiro : valorSeFalso
    const situacao = document.createElement("p");
    situacao.textContent =
        `Situação: ${tarefa.concluida ? "Concluída" : "Pendente"}`;

    // Área dos botões
    const acoes = document.createElement("div");
    acoes.classList.add("tarefa-acoes");

    // O mesmo botão serve para concluir OU reabrir;
    // só o texto muda conforme o estado.
    const textoConcluir = tarefa.concluida ? "Reabrir" : "Concluir";

    acoes.append(
        criarBotao(textoConcluir, "concluir", tarefa.id),
        criarBotao("Editar", "editar", tarefa.id),
        criarBotao("Excluir", "excluir", tarefa.id)
    );

    // Coloca tudo dentro do card, na ordem
    card.append(titulo, descricao, prioridade, data, situacao, acoes);

    return card;
}

// Atualiza o texto com a quantidade de tarefas.
// 1 → "1 tarefa" (singular) | 0, 2, 5... → "X tarefas" (plural)
function atualizarResumo() {
    const quantidade = tarefas.length;

    if (quantidade === 1) {
        resumoTarefas.textContent = "1 tarefa";
    } else {
        resumoTarefas.textContent = `${quantidade} tarefas`;
    }
}

// Devolve as tarefas que devem APARECER na tela,
// já filtradas e ordenadas, SEM alterar o array original.
function obterTarefasVisiveis() {
    // filter() cria um array NOVO só com as tarefas que passam.
    // Para cada tarefa: return true = fica | return false = sai
    const resultado = tarefas.filter(tarefa => {
        // Filtro "Pendentes": tira as concluídas
        if (filtroSituacao.value === "pendentes" && tarefa.concluida) {
            return false;
        }

        // Filtro "Concluídas": tira as pendentes
        if (filtroSituacao.value === "concluidas" && !tarefa.concluida) {
            return false;
        }

        // Filtro de prioridade: se não for "todas",
        // tira as que têm prioridade diferente da escolhida
        if (
            filtroPrioridade.value !== "todas" &&
            tarefa.prioridade !== filtroPrioridade.value
        ) {
            return false;
        }

        // Passou em todos os filtros
        return true;
    });

    // ORDENAÇÃO
    // sort() altera o array em que é usado. Como "resultado" é
    // uma CÓPIA (criada pelo filter), o array "tarefas" fica intacto.

    // Por data: localeCompare compara textos.
    // "2026-11-20" vem antes de "2026-12-01" → ordem cronológica
    if (campoOrdenacao.value === "data") {
        resultado.sort((a, b) => a.data.localeCompare(b.data));
    }

    // Por prioridade: b - a → do maior peso (alta) para o menor (baixa)
    if (campoOrdenacao.value === "prioridade") {
        resultado.sort(
            (a, b) => PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade]
        );
    }

    // Por título: ordem alfabética, respeitando acentos do português
    if (campoOrdenacao.value === "titulo") {
        resultado.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    }

    // "cadastro" não entra em nenhum if → mantém a ordem original

    return resultado;
}

// Mostra um aviso quando não há cards para exibir.
function mostrarListaVazia(texto) {
    const mensagem = document.createElement("p");
    mensagem.classList.add("mensagem-vazia");
    mensagem.textContent = texto;
    listaTarefas.append(mensagem);
}

// Desenha a lista inteira de novo, do zero.
function renderizarTarefas() {
    // 1. Limpa os cards antigos (senão eles se repetiriam)
    listaTarefas.innerHTML = "";

    // 2. Atualiza o contador "X tarefas"
    atualizarResumo();

    // 3. Nenhuma tarefa cadastrada → mostra o aviso e para aqui
    if (tarefas.length === 0) {
        mostrarListaVazia("Nenhuma tarefa cadastrada.");
        return;
    }

    // 4. Aplica filtros e ordenação
    const visiveis = obterTarefasVisiveis();

    // 5. Existem tarefas, mas nenhuma passou nos filtros
    if (visiveis.length === 0) {
        mostrarListaVazia("Nenhuma tarefa encontrada com esses filtros.");
        return;
    }

    // 6. Cria um card para cada tarefa visível e coloca na página
    visiveis.forEach(tarefa => {
        listaTarefas.append(criarCardTarefa(tarefa));
    });
}


// =====================================================
// 7. SINCRONIZAÇÃO
// =====================================================
// REGRA: sempre que o array "tarefas" mudar, chamamos esta função.
// Assim dados, armazenamento e tela ficam sempre iguais,
// e não repetimos salvar + renderizar em vários lugares.
function atualizarAplicacao() {
    salvarTarefas();      // 1. guarda no localStorage
    renderizarTarefas();  // 2. redesenha a tela (já atualiza o resumo)
}


// =====================================================
// 8. FORMULÁRIO (modo cadastro x modo edição)
// =====================================================

// Coloca o formulário no MODO EDIÇÃO com os dados da tarefa.
function preencherFormulario(tarefa) {
    // Copia os dados da tarefa para os campos
    campoTitulo.value = tarefa.titulo;
    campoDescricao.value = tarefa.descricao;
    campoPrioridade.value = tarefa.prioridade;
    campoData.value = tarefa.data;

    // Guarda QUAL tarefa está sendo editada
    idEmEdicao = tarefa.id;

    // A interface comunica o estado atual
    tituloFormulario.textContent = "Editar tarefa";
    botaoSalvar.textContent = "Atualizar tarefa";
    botaoCancelar.hidden = false; // mostra o "Cancelar edição"

    mostrarMensagem("");   // limpa mensagens antigas
    campoTitulo.focus();   // coloca o cursor no título
}

// Volta o formulário para o MODO CADASTRO.
// Usada depois de salvar, ao cancelar e ao excluir a tarefa em edição.
function resetarFormulario() {
    formulario.reset();   // limpa todos os campos
    idEmEdicao = null;    // não está mais editando nada

    // Restaura os textos originais
    tituloFormulario.textContent = "Nova tarefa";
    botaoSalvar.textContent = "Salvar tarefa";
    botaoCancelar.hidden = true; // esconde o "Cancelar edição"
}


// =====================================================
// 9. CRUD — operações sobre o array tarefas
// =====================================================
// C = Create (cadastrar) | R = Read (listar)
// U = Update (editar/concluir) | D = Delete (excluir)
// Toda operação que muda "tarefas" termina com atualizarAplicacao().

// CREATE — cria uma tarefa nova e adiciona no array
function cadastrarTarefa(dados) {
    const novaTarefa = {
        id: gerarProximoId(),
        titulo: dados.titulo,
        descricao: dados.descricao,
        prioridade: dados.prioridade,
        data: dados.data,
        concluida: false // toda tarefa nova começa pendente
    };

    tarefas.push(novaTarefa); // adiciona no final do array
    atualizarAplicacao();     // salva + redesenha
}

// UPDATE — altera os campos editáveis de uma tarefa existente
function editarTarefa(dados) {
    // findIndex() devolve a POSIÇÃO da tarefa no array (0, 1, 2...)
    // ou -1 se não encontrar
    const indice = tarefas.findIndex(
        tarefa => tarefa.id === idEmEdicao
    );

    // Proteção: tarefa não encontrada → não faz nada
    if (indice === -1) {
        return;
    }

    // Spread (...): copia TODOS os campos da tarefa antiga
    // (incluindo id e concluida) e depois sobrescreve só os editáveis.
    // Assim o id e o estado de conclusão são PRESERVADOS.
    tarefas[indice] = {
        ...tarefas[indice],
        titulo: dados.titulo,
        descricao: dados.descricao,
        prioridade: dados.prioridade,
        data: dados.data
    };

    atualizarAplicacao();
}

// UPDATE — alterna entre pendente e concluída
function alternarConclusao(tarefa) {
    // ! inverte o valor: false → true | true → false
    tarefa.concluida = !tarefa.concluida;

    // O dado mudou → precisa salvar também!
    atualizarAplicacao();
}

// DELETE — remove uma tarefa do array
function excluirTarefa(id) {
    // Janela com OK (true) e Cancelar (false)
    const confirmou = window.confirm(
        "Deseja excluir esta tarefa?"
    );

    // Usuário clicou em Cancelar → não exclui
    if (!confirmou) {
        return;
    }

    // Descobre a posição da tarefa no array
    const indice = tarefas.findIndex(
        tarefa => tarefa.id === id
    );

    if (indice === -1) {
        return;
    }

    // splice(posição, quantidade) → remove 1 item naquela posição
    tarefas.splice(indice, 1);

    // Se a tarefa excluída era a que estava em edição,
    // o formulário volta ao modo cadastro (não dá para
    // continuar editando algo que não existe mais).
    if (idEmEdicao === id) {
        resetarFormulario();
    }

    atualizarAplicacao();
    mostrarMensagem("Tarefa excluída com sucesso!");
}

// Desafio 50 — apaga TODAS as tarefas.
// Mexe no ESTADO (tarefas = []) e depois salva.
// NÃO usa localStorage.clear(), porque ele apagaria
// TUDO do localStorage (inclusive o filtro salvo).
function apagarTodas() {
    // Lista já vazia → só avisa
    if (tarefas.length === 0) {
        mostrarMensagem("Não há tarefas para apagar.");
        return;
    }

    const confirmou = window.confirm(
        "Deseja apagar TODAS as tarefas?"
    );

    if (!confirmou) {
        return;
    }

    // Substitui o array inteiro por um vazio
    // (por isso "tarefas" foi criada com let)
    tarefas = [];

    // Se estava editando alguma, sai do modo edição
    if (idEmEdicao !== null) {
        resetarFormulario();
    }

    // Salva "[]" no localStorage.
    // Como a chave passa a existir, as tarefas de exemplo
    // NÃO voltam ao atualizar a página (desafio 51).
    atualizarAplicacao();
    mostrarMensagem("Todas as tarefas foram apagadas.");
}


// =====================================================
// 10. EVENTOS (o que acontece quando o usuário interage)
// =====================================================

// ENVIO DO FORMULÁRIO — serve para cadastrar E para atualizar
formulario.addEventListener("submit", event => {
    // Impede o comportamento padrão do formulário
    // (recarregar a página e colocar os dados na URL)
    event.preventDefault();

    // Junta os valores dos campos em um objeto
    // .trim() remove espaços do começo e do fim
    const dados = {
        titulo: campoTitulo.value.trim(),
        descricao: campoDescricao.value.trim(),
        prioridade: campoPrioridade.value,
        data: campoData.value
    };

    // Valida antes de qualquer coisa
    const erro = validarTarefa(dados);

    // Se tem erro: mostra a mensagem e PARA aqui.
    // Os campos continuam preenchidos (não chamamos reset).
    if (erro !== "") {
        mostrarMensagem(erro);
        return;
    }

    let mensagem;

    // idEmEdicao decide o que fazer
    if (idEmEdicao === null) {
        // Modo cadastro
        cadastrarTarefa(dados);
        mensagem = "Tarefa cadastrada com sucesso!";
    } else {
        // Modo edição
        editarTarefa(dados);
        mensagem = "Tarefa atualizada com sucesso!";
    }

    // Limpa o formulário, volta ao modo cadastro e dá o feedback
    resetarFormulario();
    mostrarMensagem(mensagem);
});

// CLIQUES NOS CARDS — delegação de eventos
// Em vez de um listener em CADA botão, colocamos UM só na lista.
// Vantagem: os cards são recriados a cada renderização, mas a
// lista continua existindo, então o listener nunca se perde.
listaTarefas.addEventListener("click", event => {
    // event.target = elemento exato que foi clicado
    // closest() procura o elemento mais próximo com data-acao
    const botao = event.target.closest("[data-acao]");

    // Clicou fora de um botão (no texto do card, por exemplo)
    if (!botao) {
        return;
    }

    // Lê os atributos data-acao e data-id do botão
    const acao = botao.dataset.acao;

    // O data-id vem como TEXTO ("3"). Number() converte para 3,
    // senão a comparação 3 === "3" daria false.
    const id = Number(botao.dataset.id);

    // find() devolve a PRÓPRIA tarefa (ou undefined)
    const tarefa = tarefas.find(
        tarefa => tarefa.id === id
    );

    // Proteção: tarefa não encontrada
    if (!tarefa) {
        return;
    }

    // Decide o que fazer conforme o botão clicado
    if (acao === "concluir") {
        alternarConclusao(tarefa);
    }

    if (acao === "editar") {
        preencherFormulario(tarefa);
    }

    if (acao === "excluir") {
        excluirTarefa(id);
    }
});

// CANCELAR EDIÇÃO — volta ao modo cadastro sem alterar a tarefa
botaoCancelar.addEventListener("click", () => {
    resetarFormulario();
    mostrarMensagem("Edição cancelada.");
});

// APAGAR TODAS (desafio 50)
botaoApagarTodas.addEventListener("click", apagarTodas);

// FILTROS E ORDENAÇÃO
// Eles mudam só a VISUALIZAÇÃO, não o array tarefas.
// Por isso chamamos só renderizarTarefas() (não precisa salvar tarefas).

// Filtro de situação: além de renderizar, salva a preferência (desafio 52)
filtroSituacao.addEventListener("change", () => {
    salvarFiltro();
    renderizarTarefas();
});

filtroPrioridade.addEventListener("change", renderizarTarefas);
campoOrdenacao.addEventListener("change", renderizarTarefas);


// =====================================================
// 11. INICIALIZAÇÃO (roda uma vez, quando a página abre)
// =====================================================
// O carregamento das tarefas já aconteceu na seção 3:
//   let tarefas = carregarTarefas();

// Aplica o filtro que o usuário tinha escolhido antes
carregarFiltro();

// Garante que o localStorage tenha o estado atual.
// No primeiro acesso, isso grava as tarefas de exemplo;
// assim elas não "reaparecem" depois de serem apagadas.
salvarTarefas();

// Desenha a tela pela primeira vez
renderizarTarefas();