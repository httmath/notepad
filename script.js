// Pega todas as colunas e o espaço das abas
const colunas = document.querySelectorAll(".coluna");
const abas = document.getElementById("abas");

let quadros = JSON.parse(localStorage.getItem("quadros")) || [{ id: 1, nome: "Geral" }];
let quadroAtual = Number(localStorage.getItem("quadroAtual")) || quadros[0].id;
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];


cartoes.forEach(function (c) {
  if (c.coluna === "feito") c.coluna = "concluido";
  if (!c.quadro) c.quadro = quadros[0].id;});

if (!quadros.some(function (q) { return q.id === quadroAtual; })) {
  quadroAtual = quadros[0].id;
}

function salvar() {
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  localStorage.setItem("quadros", JSON.stringify(quadros));
  localStorage.setItem("quadroAtual", quadroAtual);
}

// ---------- ABAS ----------

function desenharAbas() {
  abas.innerHTML = "";

  quadros.forEach(function (quadro) {
    const aba = document.createElement("div");
    aba.className = "aba";
    if (quadro.id === quadroAtual) aba.classList.add("ativa");

    const nome = document.createElement("button");
    nome.className = "aba-nome";
    nome.textContent = quadro.nome;
    nome.title = "Clique para abrir, duplo clique para renomear";

    nome.addEventListener("click", function () {
      quadroAtual = quadro.id;
      salvar();
      desenharAbas();
      desenhar();
    });

    nome.addEventListener("dblclick", function () {
      renomearQuadro(quadro);
    });

    aba.appendChild(nome);

    // Só dá para excluir se sobrar pelo menos um quadro
    if (quadros.length > 1) {
      const excluir = document.createElement("button");
      excluir.className = "aba-excluir";
      excluir.textContent = "×";
      excluir.title = "Excluir quadro";
      excluir.addEventListener("click", function () {
        excluirQuadro(quadro.id);
      });
      aba.appendChild(excluir);
    }

    abas.appendChild(aba);
  });

  // Botão "+" para criar uma aba nova
  const nova = document.createElement("button");
  nova.className = "aba-nova";
  nova.textContent = "+";
  nova.title = "Novo quadro";
  nova.addEventListener("click", criarQuadro);
  abas.appendChild(nova);
}

function criarQuadro() {
  const nome = prompt("Nome do novo quadro:");
  if (!nome || nome.trim() === "") return;

  const quadro = { id: Date.now(), nome: nome.trim() };
  quadros.push(quadro);
  quadroAtual = quadro.id;
  salvar();
  desenharAbas();
  desenhar();
}

function renomearQuadro(quadro) {
  const nome = prompt("Novo nome do quadro:", quadro.nome);
  if (!nome || nome.trim() === "") return;

  quadro.nome = nome.trim();
  salvar();
  desenharAbas();
}

function excluirQuadro(id) {
  if (!confirm("Excluir este quadro e todos os cartões dele?")) return;

  quadros = quadros.filter(function (q) { return q.id !== id; });
  cartoes = cartoes.filter(function (c) { return c.quadro !== id; });
  quadroAtual = quadros[0].id;
  salvar();
  desenharAbas();
  desenhar();
}

// ---------- CARTÕES ----------

// Cria o elemento HTML de um cartão
function criarCartao(cartao) {
  const div = document.createElement("div");
  div.className = "cartao";
  div.draggable = true;
  div.dataset.id = cartao.id;

  const texto = document.createElement("p");
  texto.textContent = cartao.texto; // textContent é mais seguro que innerHTML

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.title = "Excluir cartão";
  botaoExcluir.addEventListener("click", function () {
    excluirCartao(cartao.id);
  });

  // Começou a arrastar
  div.addEventListener("dragstart", function () {
    div.classList.add("arrastando");
  });

  // Soltou: lê a posição final dos cartões na tela e salva
  div.addEventListener("dragend", function () {
    div.classList.remove("arrastando");
    atualizarPelaTela();
  });

  div.appendChild(texto);
  div.appendChild(botaoExcluir);
  return div;
}

// Redesenha as colunas com os cartões do quadro aberto
function desenhar() {
  colunas.forEach(function (coluna) {
    const nomeColuna = coluna.dataset.coluna;
    const lista = coluna.querySelector(".lista");
    lista.innerHTML = "";

    const doGrupo = cartoes.filter(function (c) {
      return c.coluna === nomeColuna && c.quadro === quadroAtual;
    });

    doGrupo.forEach(function (c) {
      lista.appendChild(criarCartao(c));
    });

    coluna.querySelector(".contador").textContent = doGrupo.length;
  });
}

// Depois de arrastar, a tela já está na ordem certa.
// Aqui a gente copia essa ordem de volta para a lista "cartoes".
function atualizarPelaTela() {
  // Cartões dos outros quadros ficam como estão
  const novaLista = cartoes.filter(function (c) {
    return c.quadro !== quadroAtual;
  });

  colunas.forEach(function (coluna) {
    const divs = coluna.querySelectorAll(".cartao");
    divs.forEach(function (div) {
      const cartao = cartoes.find(function (c) {
        return c.id === Number(div.dataset.id);
      });
      cartao.coluna = coluna.dataset.coluna;
      novaLista.push(cartao);
    });
  });

  cartoes = novaLista;
  salvar();
  desenhar();
}

function adicionarCartao(texto, nomeColuna) {
  cartoes.push({
    id: Date.now(), // usa a hora atual como id único
    texto: texto,
    coluna: nomeColuna,
    quadro: quadroAtual
  });
  salvar();
  desenhar();
}

function excluirCartao(id) {
  cartoes = cartoes.filter(function (c) {
    return c.id !== id;
  });
  salvar();
  desenhar();
}

// Descobre qual cartão está logo abaixo do mouse, para encaixar o arrastado antes dele
function cartaoDepoisDoMouse(lista, mouseY) {
  const outros = Array.from(lista.querySelectorAll(".cartao:not(.arrastando)"));

  return outros.find(function (cartao) {
    const caixa = cartao.getBoundingClientRect();
    return mouseY < caixa.top + caixa.height / 2;
  });
}

// Configura cada coluna
colunas.forEach(function (coluna) {
  const lista = coluna.querySelector(".lista");
  const botaoAbrir = coluna.querySelector(".botao-abrir");
  const form = coluna.querySelector(".form-novo");
  const campo = form.querySelector("textarea");
  const botaoCancelar = form.querySelector(".botao-cancelar");

  // Mostra o formulário
  botaoAbrir.addEventListener("click", function () {
    botaoAbrir.hidden = true;
    form.hidden = false;
    campo.focus();
  });

  // Esconde o formulário
  function fecharForm() {
    form.hidden = true;
    botaoAbrir.hidden = false;
    campo.value = "";
  }

  botaoCancelar.addEventListener("click", fecharForm);

  // Enter envia, Shift+Enter pula linha, Esc cancela
  campo.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      form.requestSubmit();
    }
    if (evento.key === "Escape") {
      fecharForm();
    }
  });

  form.addEventListener("submit", function (evento) {
    evento.preventDefault(); // não deixa a página recarregar
    const texto = campo.value.trim();
    if (texto === "") return;
    adicionarCartao(texto, coluna.dataset.coluna);
    campo.value = "";
    campo.focus(); // deixa aberto para adicionar outro
  });

  // Enquanto arrasta por cima da coluna, move o cartão na tela
  // (o preventDefault é necessário para o navegador permitir soltar aqui)
  coluna.addEventListener("dragover", function (evento) {
    evento.preventDefault();

    const arrastado = document.querySelector(".arrastando");
    if (!arrastado) return;

    const depois = cartaoDepoisDoMouse(lista, evento.clientY);
    if (depois) {
      lista.insertBefore(arrastado, depois);
    } else {
      lista.appendChild(arrastado);
    }
  });
});

// Desenha tudo pela primeira vez quando a página abre
desenharAbas();
desenhar();
