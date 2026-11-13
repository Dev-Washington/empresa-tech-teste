import { products } from "../data/catalogo.js";
import {
  brand,
  btn,
  field,
  select,
  area,
  form,
  handle,
  esc,
  icon,
  api,
  modal,
  notice,
  toast,
  pill,
  dateTime,
  empty,
  bubble,
} from "../utils/ui.js";
const opts = products.map((p) => [p.id, p.name]);
const logoNav = (sales) =>
  '<header class="pubnav">' +
  brand() +
  '<nav><a href="/empresa-tech-teste/empresa" ' +
  (!sales ? 'aria-current="page"' : "") +
  '>Empresa</a><a href="/empresa-tech-teste/vendas" ' +
  (sales ? 'aria-current="page"' : "") +
  '>Soluções</a><a href="/empresa-tech-teste/crm" class="btn outline">Área interna ' +
  icon("out", 14) +
  "</a></nav></header>";
function capture(source, selected) {
  modal(
    "Converse com a equipe",
    form(
      '<p class="muted">Conte qual solução você quer conhecer. A equipe comercial dará continuidade ao seu contato.</p><div class="pair">' +
        field("Seu nome", "contact", "", "text", true) +
        field("Empresa", "company", "", "text", true) +
        '</div><div class="pair">' +
        field("E-mail", "email", "", "email", true) +
        field("Telefone", "phone", "", "tel") +
        "</div>" +
        select(
          "Solução de interesse",
          "product",
          opts,
          selected || products[0].id,
        ) +
        area("O que você precisa?", "notes"),
      "Solicitar contato",
      "capture",
    ),
    "ATENDIMENTO COMERCIAL",
  );
  handle("capture", async (a) => {
    await api("captar", "POST", { ...a, source });
    modal(
      "Solicitação recebida",
      notice(
        "Contato fictício salvo no funil deste navegador. Nenhuma mensagem foi enviada à empresa.",
      ),
      "CONTATO REGISTRADO",
    );
  });
}
export function marketing(sales, demo = false) {
  const app = document.querySelector("#app");
  document.title = (sales ? "Soluções" : "Empresa") + " · EMPRESA TECH TESTE";
  app.innerHTML =
    '<div class="public">' +
    logoNav(sales) +
    (demo
      ? '<div class="demo">Demonstração: os formulários desta sessão enviam leads apenas para a carteira fictícia.</div>'
      : "") +
    (sales
      ? '<section class="pubhero saleshero"><div><div class="eyebrow light">CATÁLOGO DE SOLUÇÕES</div><h1>Qual parte da sua operação precisa de atenção?</h1><p>Escolha uma frente de trabalho. Vamos conversar sobre o seu processo e o que faz sentido implantar.</p><a class="btn lime" href="#solucoes">Explorar soluções ' +
        icon("down", 16) +
        "</a></div></section>"
      : '<section class="pubhero photohero"><div><div class="eyebrow light">EMPRESA TECH TESTE</div><h1>Tecnologia próxima de quem opera.</h1><p>Conheça as frentes de trabalho para empresas de saúde, comércio, segurança e logística no Nordeste.</p>' +
        btn("Falar com a equipe", "contact", "arrow", "lime") +
        '</div><figure><img src="/empresa-tech-teste/recife.jpg" alt="Vista aérea do Recife"><figcaption>Recife · Pernambuco &nbsp; / &nbsp; Foto: NERD, Porto Digital</figcaption></figure></section>') +
    '<main class="pubbody"><section id="solucoes"><div class="eyebrow">PORTFÓLIO / 01—04</div><h2>' +
    (sales ? "Encontre a sua solução" : "Quatro frentes de atuação") +
    '</h2><div class="products">' +
    products
      .map(
        (p, i) =>
          '<article><div class="producttop"><span class="iconbox">' +
          icon(p.icon, 23) +
          '</span><span class="index">0' +
          (i + 1) +
          "</span></div><small>" +
          esc(p.sector) +
          "</small><h3>" +
          esc(p.name) +
          "</h3><p>" +
          esc(p.desc) +
          "</p>" +
          btn("Tenho interesse", "contact:" + p.id, "out", "plain") +
          "</article>",
      )
      .join("") +
    '</div></section><section class="how"><div><div class="eyebrow">COMO COMEÇAR</div><h2>Do primeiro contato à implantação.</h2></div><ol><li><b>01</b><span><strong>Conte o que precisa</strong>Escolha o produto e descreva o desafio da sua empresa.</span></li><li><b>02</b><span><strong>Defina o escopo</strong>A equipe comercial conversa com você sobre objetivos e proposta.</span></li><li><b>03</b><span><strong>Acompanhe o atendimento</strong>Após a contratação, use o portal para falar com a operação.</span></li></ol></section></main><footer>' +
    brand() +
    '<span>Gestão e tecnologia · EMPRESA TECH TESTE</span><a href="/empresa-tech-teste/crm">Acesso da equipe ' +
    icon("out", 14) +
    "</a></footer></div>";
  app.onclick = (e) => {
    const a = e.target.closest("[data-act]")?.dataset.act;
    if (a?.startsWith("contact"))
      capture(
        sales ? "Página de vendas" : "Página da empresa",
        a.split(":")[1],
      );
  };
}
export function loginScreen(session, setup = false) {
  const app = document.querySelector("#app");
  if (!session.setup) setup = false;
  const code = location.hash.slice(1);
  if (setup && code) history.replaceState(null, "", location.pathname);
  document.title = "Acesso da equipe · EMPRESA TECH TESTE";
  app.innerHTML =
    '<main class="auth"><section class="authstory">' +
    brand() +
    '<div><div class="eyebrow light">PLATAFORMA DE GESTÃO</div><h1>Da primeira conversa à operação.</h1><p>O ponto de encontro entre sua equipe comercial, os clientes e os sistemas contratados.</p></div><small>EMPRESA TECH TESTE &nbsp; / &nbsp; Área interna</small></section><section class="authform"><div class="eyebrow">ÁREA DA EQUIPE</div><h2>' +
    (setup ? "Configurar a central" : "Entrar na central") +
    '</h2><p class="muted">' +
    (setup
      ? "Crie a primeira conta da empresa com o cargo Founder."
      : "Acesse a operação e o funil comercial da empresa.") +
    "</p>" +
    form(
      (setup
        ? field("Seu nome", "name", "", "text", true) +
          field("Código de primeiro acesso", "code", code, "password", true)
        : "") +
        field("E-mail", "email", "", "email", true, 'autocomplete="username"') +
        field(
          "Senha",
          "password",
          "",
          "password",
          true,
          setup
            ? 'minlength="10" placeholder="Mínimo de 10 caracteres" autocomplete="new-password"'
            : 'autocomplete="current-password"',
        ),
      setup ? "Criar conta Founder" : "Entrar",
      "login",
    ) +
    '<div class="authlinks"><a class="btn outline" href="/empresa-tech-teste/demonstracao">' +
    icon("layers", 16) +
    " Explorar demonstração</a>" +
    (session.setup && !setup
      ? '<a href="/empresa-tech-teste/configurar">Primeiro acesso</a>'
      : "") +
    '<a href="/empresa-tech-teste/empresa">Voltar à página da empresa</a></div></section></main>';
  handle("login", async (a) => {
    await api(setup ? "setup" : "login", "POST", a);
    location.replace("/empresa-tech-teste/crm");
  });
}
export async function portal() {
  document.title = "Portal do cliente · EMPRESA TECH TESTE";
  const app = document.querySelector("#app");
  const raw = location.hash.slice(1);
  if (raw) {
    history.replaceState(null, "", location.pathname);
    await api("portal/entrar", "POST", { token: raw });
  }
  let data = await api("portal/resumo");
  const render = () => {
    app.innerHTML =
      '<div class="public"><header class="pubnav">' +
      brand() +
      '<span class="pill ativo">Portal do cliente</span></header><main class="portal"><div class="eyebrow">ÁREA DO CLIENTE</div><h1>' +
      esc(data.company) +
      '</h1><p class="muted">Contratos, disponibilidade dos produtos e exportações.</p><div class="portalcards">' +
      data.systems
        .map(
          (s) =>
            '<article class="panel"><div class="producttop"><span class="iconbox">' +
            icon(products.find((p) => p.id === s.product)?.icon) +
            "</span>" +
            pill(s.status) +
            "</div><h3>" +
            esc(products.find((p) => p.id === s.product)?.name) +
            "</h3><p>" +
            {
              ativo: "Execução de tarefas liberada.",
              atrasado:
                "Execução de tarefas bloqueada por atraso. Fale com a equipe para regularizar.",
              cancelado:
                "Contrato cancelado. Baixe os registros e arquivos armazenados para este produto até " +
                (s.expires ? dateTime(s.expires) : "") +
                ". Após esse prazo, serão excluídos.",
              expirado:
                "Prazo encerrado. Os registros e arquivos deste contrato foram excluídos da central.",
            }[s.status] +
            "</p>" +
            (s.status === "cancelado"
              ? '<a class="btn primary" href="/empresa-tech-teste/api/portal/exportar/' +
                s.id +
                '">' +
                icon("download", 16) +
                " Baixar meus dados (.zip)</a>"
              : "") +
            "</article>",
        )
        .join("") +
      "</div>" +
      (!data.systems.length
        ? empty("box", "Ainda não há produtos vinculados.")
        : "") +
      (data.chat
        ? '<section class="panel portalchat" style="margin-bottom:16px"><div class="panelhead"><h2>Meus chamados</h2><button type="button" class="btn outline" id="newticket">Abrir chamado</button></div><div id="tickets"></div></section><section class="panel portalchat"><div class="eyebrow">ATENDIMENTO</div><h2>Conversa com a equipe</h2><div class="messages" id="msgs"></div>' +
          form(area("Sua mensagem", "body"), "Enviar mensagem", "talk") +
          "</section>"
        : "") +
      "</main></div>";
    if (data.chat) {
      showTickets();
      document.querySelector("#newticket").onclick = () => {
        modal(
          "Abrir chamado",
          form(
            field("Assunto", "title", "", "text", true) +
              area("Descreva o problema", "description"),
            "Enviar chamado",
            "ticket",
          ),
        );
        handle("ticket", async (a) => {
          await api("portal/chamado", "POST", a);
          document.querySelector("#dialog").close();
          await sync();
          toast("Chamado recebido pela operação.");
        });
      };
      showMsgs();
      handle("talk", async (a, f) => {
        await api("portal/mensagem", "POST", a);
        f.reset();
        await sync();
      });
    }
  };
  function showTickets() {
    const b = document.querySelector("#tickets");
    if (b)
      b.innerHTML =
        data.tickets
          .map(
            (t) =>
              '<div class="statline"><span>#' +
              t.id +
              " · " +
              esc(t.title) +
              "</span><b>" +
              esc(t.status) +
              "</b></div>",
          )
          .join("") || empty("head", "Nenhum chamado registrado");
  }
  function showMsgs() {
    const m = document.querySelector("#msgs");
    if (m) {
      m.innerHTML =
        data.messages.map(bubble).join("") ||
        empty("chat", "Comece a conversa");
      m.scrollTop = m.scrollHeight;
    }
  }
  async function sync() {
    const n = await api("portal/resumo");
    const changed =
        JSON.stringify(n.systems) !== JSON.stringify(data.systems) ||
        n.chat !== data.chat,
      before = data.messages.at(-1)?.id;
    data = n;
    if (changed) render();
    else {
      showTickets();
      if (before !== n.messages.at(-1)?.id) showMsgs();
    }
  }
  render();
  const poll = setInterval(async () => {
    if (document.hidden) return;
    try {
      await sync();
    } catch (e) {
      clearInterval(poll);
      app.innerHTML =
        '<main class="portal">' + notice(e.message, true) + "</main>";
    }
  }, 5000);
}
