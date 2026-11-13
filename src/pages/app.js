import { adminMenu, execMenu, modules } from "../data/gestao.js";
import { can, moduleCap, roleName } from "../data/permissoes.js";
import { adminPage } from "./administrativo.js";
import { execPage } from "./diretoria.js";
import { extra, extraViews } from "./departamentos.js";
import { products, stages, roles } from "../data/catalogo.js";
import {
  brand,
  icon,
  esc,
  api,
  btn,
  empty,
  dt,
  hour,
  money,
  pill,
  initials,
  toast,
  modal,
  notice,
  form,
  area,
  handle,
  bubble,
} from "../utils/ui.js";
import { marketing, loginScreen, portal } from "./publico.js";
import { editor } from "../components/gestao/editores.js";
import { openTeamChat } from "../components/chat/mensageiro.js";
const app = document.querySelector("#app"),
  dlg = document.querySelector("#dialog"),
  prod = (id) => products.find((p) => p.id === id) || products[0];
let D,
  view = "painel",
  filter = "",
  term = "",
  month = new Date(),
  day = "",
  chatId = 0,
  chatLast = null;
const titles = {
  ...extraViews,
  ...Object.fromEntries(
    [...adminMenu, ...execMenu].flatMap(([, items]) =>
      items.map(([key, label]) => [key, modules[key]?.title || label]),
    ),
  ),
  painel: "Visão geral",
  clientes: "Clientes",
  sistemas: "Sistemas e contratos",
  agenda: "Calendário",
  chat: "Conversas",
  funil: "Funil de vendas",
  equipe: "Acessos da equipe",
};
const icons = {
  executivo: "chart",
  administrativo: "brief",
  funcionarios: "users",
  folha: "file",
  contas: "brief",
  demandas: "head",
  comercial: "calendar",
  interno: "chat",
  painel: "grid",
  clientes: "users",
  sistemas: "layers",
  agenda: "calendar",
  chat: "chat",
  funil: "funnel",
  equipe: "shield",
};
const subtitles = {
  clientes: "Gerencie os cadastros e o relacionamento com cada cliente.",
  sistemas:
    "Controle a execução de tarefas e os prazos de exportação por contratação.",
  agenda: "Acompanhe reuniões, implantações e retornos da equipe.",
  chat: "Converse com os clientes pelo portal de atendimento.",
  funil: "Acompanhe as oportunidades da entrada ao fechamento.",
  equipe: "Defina quem acessa a central e o que cada pessoa pode fazer.",
};
const localDay = (v) => {
  const t = new Date(v);
  return [
    t.getFullYear(),
    String(t.getMonth() + 1).padStart(2, "0"),
    String(t.getDate()).padStart(2, "0"),
  ].join("-");
};
const cName = (id) => D.clients.find((c) => c.id === id)?.company || "",
  lName = (id) => D.leads.find((c) => c.id === id)?.company || "";
const navItem = (k, name) =>
  '<a href="#' +
  k +
  '" class="navitem ' +
  (view === k ? "selected" : "") +
  '" ' +
  (view === k ? 'aria-current="page"' : "") +
  ">" +
  icon(
    icons[k] ||
      [...adminMenu, ...execMenu]
        .flatMap((g) => g[1])
        .find((x) => x[0] === k)?.[2] ||
      "grid",
  ) +
  "<span>" +
  esc(name || titles[k]) +
  "</span></a>";
const group = (label, html) =>
  '<div class="navgroup"><div class="navlabel">' +
  label +
  "</div>" +
  html +
  "</div>";
const section = (title, sub, act = "") =>
  '<div class="pagehead"><div><h1>' +
  esc(title) +
  "</h1><p>" +
  esc(sub) +
  "</p></div>" +
  act +
  "</div>";
const head = (title, act = "") =>
  '<div class="panelhead"><h2>' + esc(title) + "</h2>" + act + "</div>";
const viewAll = (v, label = "Ver todos") =>
  '<a class="textlink" href="#' +
  v +
  '">' +
  label +
  " " +
  icon("right", 13) +
  "</a>";
const opt = (label, value) =>
  '<option value="' +
  esc(value) +
  '" ' +
  (filter === value ? "selected" : "") +
  ">" +
  esc(label) +
  "</option>";
function toolsBar(place, opts) {
  return (
    '<div class="toolbar"><label class="search">' +
    icon("search", 16) +
    '<input id="search" aria-label="' +
    esc(place) +
    '" placeholder="' +
    esc(place) +
    '" value="' +
    esc(term) +
    '"></label>' +
    (opts
      ? '<select aria-label="Filtrar registros" id="filter">' +
        opts.map((x) => opt(x[1], x[0])).join("") +
        "</select>"
      : "") +
    "</div>"
  );
}
const hit = (...v) =>
  v
    .join(" ")
    .toLocaleLowerCase("pt-BR")
    .includes(term.toLocaleLowerCase("pt-BR"));
function avatar(name, i = 0) {
  return (
    '<span class="avatar a' +
    (Number(i) % 5) +
    '">' +
    esc(initials(name)) +
    "</span>"
  );
}
const actionFor = () =>
  ({
    clientes: btn("Novo cliente", "client", "plus"),
    sistemas: btn("Vincular produto", "system", "plus"),
    agenda: btn("Novo compromisso", "event", "plus"),
    funil:
      can(D.user.role, "vendas") && D.user.role !== "closer"
        ? btn("Novo lead", "lead", "plus")
        : "",
    equipe: btn("Adicionar pessoa", "user", "plus"),
  })[view] || "";
const menus = {
  administrativo: adminMenu,
  vendas: [
    [
      "VENDAS",
      [
        ["comercial", "Calls e reuniões"],
        ["funil", "Funil de vendas"],
        ["agenda", "Calendário comercial"],
      ],
    ],
  ],
  executivo: execMenu,
};
const zoneNames = {
    administrativo: "Administrativo e Operacional",
    vendas: "Vendas",
    executivo: "Executivo",
  },
  zoneIcons = {
    administrativo: "building",
    vendas: "funnel",
    executivo: "chart",
  };
const zoneDescriptions = {
  administrativo:
    "Operação e gestão interna. As seções disponíveis seguem o seu cargo.",
  vendas: "Oportunidades, prospecção, calls e reuniões comerciais.",
  executivo:
    "Indicadores de todas as áreas, com acesso aos registros de origem.",
};
let zone = "administrativo";
const zones = () =>
  Object.keys(menus).filter((k) =>
    can(D.user.role, k === "administrativo" ? "interno" : k),
  );
const allowed = (z, k) =>
  z === "administrativo"
    ? can(D.user.role, k === "agenda" ? "operacao" : moduleCap[k])
    : can(D.user.role, z);
const items = (z) =>
  menus[z]
    .flatMap(([, arr]) => arr)
    .filter(([k]) => allowed(z, k))
    .map(([k]) => k);
function showAreaChooser() {
  const allowed = zones();
  const portals = ["administrativo", "vendas", "executivo"].filter((k) =>
    allowed.includes(k),
  );
  const firstName = D.user.name.trim().split(/\s+/)[0];
  app.innerHTML = `
    <main class="area-chooser" aria-labelledby="area-title">
      <div class="area-chooser-inner">
        <header class="area-intro">
          <div class="brand area-brand"><img src="/empresa-tech-teste/marca.svg" alt=""><span>EMPRESA<span class="brand-sub">TECH TESTE</span></span></div>
          <h1 id="area-title" tabindex="-1">Olá, ${esc(firstName)}! Qual portal você quer abrir?</h1>
          <p>${portals.length > 1 ? "Você pode trocar de área a qualquer momento pelo botão no topo da tela." : "Abra o portal disponível para o seu perfil."}</p>
        </header>
        <nav class="area-options" aria-label="Portais disponíveis">${portals
          .map(
            (k) =>
              `<a class="area-card area-${k}" href="#${items(k)[0]}" aria-label="Abrir portal ${zoneNames[k]}">
            <span class="area-symbol">${icon(zoneIcons[k], 27)}</span>
            <h2>${zoneNames[k]}</h2><p>${zoneDescriptions[k]}</p>
            <span class="area-open">Abrir ${icon("arrow", 16)}</span>
          </a>`,
          )
          .join("")}
        </nav>
        <button class="area-logout" type="button" data-act="logout">${icon("logout", 16)} Sair da demonstração</button>
      </div>
    </main>`;
}
function shell() {
  if (view === "areas") return showAreaChooser();

  app.innerHTML =
    '<div class="layout"><aside id="sidebar"><div class="railbrand">' +
    brand() +
    '<span class="tinycode">CRM</span></div><nav>' +
    menus[zone]
      .map(([label, arr]) => {
        const links = arr
          .filter(([key]) => allowed(zone, key))
          .map(([key, name]) => navItem(key, name))
          .join("");
        return links ? group(label, links) : "";
      })
      .join("") +
    '</nav><div class="railbottom"><div class="railpages"><a target="_blank" rel="noopener" href="/empresa-tech-teste/empresa">' +
    icon("globe", 16) +
    " Página da empresa " +
    icon("out", 13) +
    '</a><a target="_blank" rel="noopener" href="/empresa-tech-teste/vendas">' +
    icon("brief", 16) +
    " Página de vendas " +
    icon("out", 13) +
    '</a></div><div class="account">' +
    avatar(D.user.name) +
    "<div><strong>" +
    esc(D.user.name) +
    "</strong><small>" +
    esc(roleName(D.user.role)) +
    '</small></div><button class="ibtn" aria-label="Sair da central" title="Sair" data-act="logout">' +
    icon("logout", 16) +
    '</button></div></div></aside><button class="scrim" aria-label="Fechar menu" data-act="menu"></button><main class="mainarea"><header class="topbar"><div class="crumb"><button class="ibtn mobilemenu" aria-label="Abrir menu" data-act="menu">' +
    icon("menu") +
    "</button>" +
    icon("layers", 15) +
    "<span>" +
    zoneNames[zone] +
    "</span><i>/</i><strong>" +
    titles[view] +
    '</strong></div><div class="topmeta">' +
    '<a class="area-switch" href="#areas">' +
    icon("grid", 15) +
    " Trocar área</a>" +
    (D.demo ? '<span class="demo">Demonstração</span>' : "") +
    '<button type="button" class="ibtn" data-act="theme" title="Alternar tema claro ou escuro" aria-label="Alternar tema">' +
    icon("scan", 16) +
    '</button><span class="online"><i></i>Central online</span></div></header><div class="content" id="content"></div></main></div>' +
    '<button type="button" class="team-launcher" data-act="teamchat" aria-haspopup="dialog" aria-expanded="' +
    Boolean(document.querySelector("#team-drawer[open]")) +
    '">' +
    icon("chat", 21) +
    "<span>Chat interno</span></button>";
  content();
}
function dashboard() {
  const op = zone === "administrativo",
    act = D.systems.filter((x) => x.status === "ativo"),
    cli = D.clients.filter((x) => !x.archived),
    open = D.leads.filter((x) => !["Ganha", "Perdida"].includes(x.stage)),
    today = localDay(Date.now()),
    events = D.events.filter(
      (x) => x.outcome === "Agendada" && localDay(x.start) >= today,
    ),
    todayN = events.filter((x) => localDay(x.start) === today).length;
  const cards = op
    ? [
        ["Clientes", "users", cli.length, "Na carteira", "clientes", "mint"],
        [
          "Sistemas ativos",
          "layers",
          act.length,
          "Contratos liberados",
          "sistemas",
          "blue",
        ],
        [
          "Leads abertos",
          "funnel",
          open.length,
          "No funil de vendas",
          "funil",
          "violet",
        ],
        [
          "Agenda de hoje",
          "calendar",
          todayN,
          "Compromissos",
          "agenda",
          "amber",
        ],
      ]
    : [
        [
          "Leads abertos",
          "funnel",
          open.length,
          "No funil de vendas",
          "funil",
          "mint",
        ],
        [
          "Em proposta",
          "brief",
          open.filter((x) => x.stage === "Proposta").length,
          "Aguardando decisão",
          "funil",
          "blue",
        ],
        [
          "Vendas ganhas",
          "chart",
          D.leads.filter((x) => x.stage === "Ganha").length,
          "Convertidas em clientes",
          "funil",
          "violet",
        ],
        [
          "Agenda de hoje",
          "calendar",
          todayN,
          "Compromissos",
          "agenda",
          "amber",
        ],
      ];
  return (
    '<div class="dashline"><span class="eyebrow"><i class="dash"></i> PAINEL ' +
    (op ? "OPERACIONAL" : "COMERCIAL") +
    "</span><span>" +
    icon("calendar", 14) +
    esc(
      dt(new Date(), {
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    ) +
    '</span></div><section class="hero"><div><div class="herotag"><i></i> CENTRAL DE GESTÃO</div><h1>Visão geral<span>.</span></h1><p>Clientes, vendas e operação em um só lugar.</p></div><div class="herostamp">ET &nbsp;/&nbsp; 01 <span>✳</span></div></section><div class="sectionline"><h2>Resumo ' +
    (op ? "operacional" : "comercial") +
    '</h2><span>Atualizado agora</span></div><div class="metrics">' +
    cards
      .filter(
        ([, , , , target]) => target !== "funil" || can(D.user.role, "vendas"),
      )
      .map(
        ([title, ic, val, sub, v, color]) =>
          '<a href="#' +
          v +
          '" class="metric"><header><span class="iconbox ' +
          color +
          '">' +
          icon(ic, 18) +
          "</span>" +
          icon("out", 13) +
          '</header><span class="metriclabel">' +
          title +
          "</span><strong>" +
          val +
          "</strong><small>" +
          sub +
          "</small></a>",
      )
      .join("") +
    '</div><div class="dashcols"><section class="panel">' +
    head("Próximos compromissos", viewAll("agenda", "Ver agenda")) +
    (events.length
      ? events.slice(0, 4).map(eventRow).join("")
      : empty(
          "calendar",
          "Nenhum compromisso agendado",
          "Crie um compromisso no calendário.",
        )) +
    '</section><section class="panel">' +
    (can(D.user.role, "vendas")
      ? head("Funil comercial", viewAll("funil", "Abrir funil")) +
        '<div class="pipelineSummary"><small>Valor em aberto</small><strong>' +
        money(open.reduce((n, l) => n + l.amount, 0)) +
        '</strong></div><div class="funnelrows">' +
        stages
          .slice(0, 4)
          .map((s, i) => {
            const n = open.filter((x) => x.stage === s).length;
            return (
              '<div><span><i class="stagecolor s' +
              i +
              '"></i>' +
              s +
              '</span><div class="track"><i class="s' +
              i +
              '" style="width:' +
              Math.round((100 * n) / Math.max(1, open.length)) +
              '%"></i></div><b>' +
              n +
              "</b></div>"
            );
          })
          .join("") +
        "</div>"
      : head("Produtos contratados", viewAll("sistemas", "Ver contratos")) +
        ["ativo", "atrasado", "cancelado", "expirado"]
          .map(
            (st) =>
              '<div class="activityrow">' +
              pill(st) +
              "<b>" +
              D.systems.filter((x) => x.status === st).length +
              "</b></div>",
          )
          .join("")) +
    '</section></div><section class="panel activitypanel">' +
    head("Atividade recente") +
    (D.activity.length
      ? D.activity
          .slice(0, 5)
          .map(
            (x) =>
              '<div class="activityrow"><span class="miniicon">' +
              icon(
                x.entity === "lead"
                  ? "funnel"
                  : x.entity === "sistema"
                    ? "layers"
                    : "users",
                15,
              ) +
              "</span><div><strong>" +
              esc(x.label) +
              "</strong><small>" +
              esc(x.detail) +
              "</small></div><time>" +
              esc(dt(x.at)) +
              " · " +
              hour(x.at) +
              "</time></div>",
          )
          .join("")
      : empty("activity", "O histórico aparecerá aqui.")) +
    "</section>"
  );
}
function eventRow(x) {
  return (
    '<button type="button" class="eventrow" data-act="event:' +
    x.id +
    '"><span class="datebox"><strong>' +
    dt(x.start, { day: "2-digit" }) +
    "</strong><small>" +
    dt(x.start, { month: "short" }).replace(".", "") +
    '</small></span><span class="rowtxt"><strong>' +
    esc(x.title) +
    "</strong><small>" +
    esc(
      (cName(x.client) || lName(x.lead) || x.kind) +
        (x.outcome && x.outcome !== "Agendada" ? " · " + x.outcome : ""),
    ) +
    '</small></span><span class="eventtime">' +
    icon(x.done ? "check" : "clock", 13) +
    hour(x.start) +
    "</span></button>"
  );
}
function clients() {
  const cs = D.clients.filter(
    (x) =>
      (filter === "arquivo" ? x.archived : !x.archived) &&
      hit(x.company, x.contact, x.email, x.phone),
  );
  return (
    toolsBar("Buscar cliente ou contato…", [
      ["", "Carteira ativa"],
      ["arquivo", "Arquivados"],
    ]) +
    (cs.length
      ? '<div class="tablewrap"><table><thead><tr><th>Cliente</th><th>Contato</th><th>Produtos</th><th>Cadastro</th><th></th></tr></thead><tbody>' +
        cs
          .map(
            (c) =>
              '<tr><td><button class="cellname" data-act="profile:' +
              c.id +
              '">' +
              avatar(c.company, c.id) +
              "<b>" +
              esc(c.company) +
              "</b></button></td><td>" +
              esc(c.contact) +
              "<small>" +
              esc(c.email || c.phone) +
              "</small></td><td>" +
              D.systems.filter(
                (x) => x.client === c.id && x.status !== "expirado",
              ).length +
              "</td><td>" +
              dt(c.created) +
              "</td><td>" +
              btn("Abrir", "profile:" + c.id, "right", "plain") +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div>"
      : empty(
          "users",
          "Nenhum cliente encontrado",
          "Cadastre um cliente ou ajuste a busca.",
        ))
  );
}
function systems() {
  const ss = D.systems.filter(
    (x) =>
      (!filter || filter === x.status) &&
      hit(cName(x.client), prod(x.product).name),
  );
  return (
    toolsBar("Buscar produto ou cliente…", [
      ["", "Todos os estados"],
      ["ativo", "Ativos"],
      ["atrasado", "Em atraso"],
      ["cancelado", "Em exportação"],
      ["expirado", "Encerrados"],
    ]) +
    (ss.length
      ? '<div class="tablewrap"><table><thead><tr><th>Produto contratado</th><th>Cliente</th><th>Estado</th><th>Exportação até</th><th></th></tr></thead><tbody>' +
        ss
          .map(
            (x) =>
              '<tr><td><button class="cellname" data-act="contract:' +
              x.id +
              '"><span class="iconbox mint">' +
              icon(prod(x.product).icon) +
              "</span><b>" +
              esc(prod(x.product).name) +
              "</b></button></td><td>" +
              esc(cName(x.client)) +
              "</td><td>" +
              pill(x.status) +
              "</td><td>" +
              (x.expires
                ? dt(x.expires, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "—") +
              "</td><td>" +
              btn("Gerenciar", "contract:" + x.id, "right", "plain") +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div>"
      : empty(
          "layers",
          "Nenhum contrato encontrado",
          "Vincule um produto a um cliente para começar.",
        ))
  );
}
function funnel() {
  const ls = D.leads.filter(
    (x) =>
      (!filter || filter === x.product) &&
      hit(x.company, x.owner, x.contact, x.email),
  );
  return (
    toolsBar("Buscar oportunidade ou responsável…", [
      ["", "Todos os produtos"],
      ...products.map((x) => [x.id, x.short]),
    ]) +
    '<div class="kanban">' +
    stages
      .map((stage, i) => {
        const rows = ls.filter((l) => l.stage === stage);
        return (
          '<section class="lane" data-stage="' +
          stage +
          '"><div class="lanetitle"><i class="stagecolor s' +
          i +
          '"></i><h3>' +
          stage +
          "</h3><b>" +
          rows.length +
          "</b></div><small>" +
          money(rows.reduce((n, x) => n + x.amount, 0)) +
          "</small>" +
          rows
            .map(
              (l) =>
                '<button class="deal" data-act="lead:' +
                l.id +
                '" data-lead="' +
                l.id +
                '" draggable="' +
                (can(D.user.role, "vendas") &&
                  !(D.user.role === "sdr" && l.closer_id) &&
                  l.stage !== "Ganha") +
                '"><span class="dealtag">' +
                esc(prod(l.product).short) +
                "</span><strong>" +
                esc(l.company) +
                "</strong><small>" +
                esc(l.contact) +
                "</small><footer><b>" +
                money(l.amount) +
                "</b><span>" +
                esc(l.owner || "Sem responsável") +
                "</span></footer></button>",
            )
            .join("") +
          (!rows.length ? '<p class="lanempty">Sem oportunidades</p>' : "") +
          "</section>"
        );
      })
      .join("") +
    "</div>"
  );
}
const calendarEvents = () =>
  D.events.filter(
    (x) =>
      Boolean(
        x.scope === "vendas" || (!x.client && (x.lead || x.kind === "Call")),
      ) ===
      (zone === "vendas"),
  );
function agenda() {
  const year = month.getFullYear(),
    mn = month.getMonth(),
    offset = new Date(year, mn, 1).getDay(),
    last = new Date(year, mn + 1, 0).getDate(),
    ds = day || localDay(Date.now()),
    arr = calendarEvents().filter((x) => localDay(x.start) === ds);
  let boxes = "";
  for (let i = 0; i < Math.ceil((offset + last) / 7) * 7; i++) {
    const n = i - offset + 1;
    if (n < 1 || n > last) {
      boxes += '<span class="calblank"></span>';
      continue;
    }
    const t = localDay(new Date(year, mn, n)),
      es = calendarEvents().filter((x) => localDay(x.start) === t);
    boxes +=
      '<button data-act="day:' +
      t +
      '" class="calday ' +
      (t === ds ? "sel " : "") +
      (t === localDay(Date.now()) ? "today" : "") +
      '"><b>' +
      n +
      "</b>" +
      (es.length ? "<small>" + es.length + " <span>comp.</span></small>" : "") +
      "</button>";
  }
  return (
    '<div class="calendargrid"><section class="panel"><div class="panelhead"><h2 class="cap">' +
    dt(month, { month: "long", year: "numeric" }) +
    '</h2><div class="inline">' +
    btn("Anterior", "prev", "left", "micro") +
    btn("Hoje", "today", "", "micro") +
    btn("Próximo", "next", "right", "micro") +
    '</div></div><div class="cal">' +
    ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
      .map((x) => '<div class="weekday">' + x + "</div>")
      .join("") +
    boxes +
    '</div></section><section class="panel">' +
    head(dt(ds + "T12:00:00", { day: "numeric", month: "long" })) +
    (arr.map(eventRow).join("") ||
      empty("calendar", "Dia livre", "Nenhum compromisso nesta data.")) +
    "</section></div>"
  );
}
function chats() {
  const cs = D.clients.filter((c) => !c.archived);
  if (!cs.some((c) => c.id === chatId)) chatId = cs[0]?.id || 0;
  return cs.length
    ? '<div class="chatgrid"><section class="panel contacts">' +
        head("Clientes") +
        cs
          .map(
            (c) =>
              '<button class="contact ' +
              (chatId === c.id ? "sel" : "") +
              '" data-act="thread:' +
              c.id +
              '">' +
              avatar(c.company, c.id) +
              "<span><strong>" +
              esc(c.company) +
              "</strong><small>" +
              esc(c.contact) +
              "</small></span></button>",
          )
          .join("") +
        '</section><section class="panel chatpanel">' +
        head(
          cName(chatId),
          btn("Portal do cliente", "portal:" + chatId, "link", "plain"),
        ) +
        '<div id="msgs" class="messages"></div>' +
        form(area("Mensagem", "body"), "Enviar mensagem", "talk") +
        "</section></div>"
    : empty(
        "chat",
        "Nenhum cliente disponível",
        "Cadastre o primeiro cliente para abrir uma conversa.",
      );
}
async function syncChat(force = false) {
  if (view !== "chat" || !chatId || !document.querySelector("#msgs")) return;
  const id = chatId,
    rows = await api("clientes/" + id + "/chat");
  if (id !== chatId || view !== "chat") return;
  const k = id + ":" + (rows.at(-1)?.id || 0),
    box = document.querySelector("#msgs");
  if (box && (force || k !== chatLast)) {
    chatLast = k;
    box.innerHTML =
      rows.map(bubble).join("") ||
      empty(
        "chat",
        "A conversa começa aqui",
        "Envie o link do portal para o cliente responder.",
      );
    box.scrollTop = box.scrollHeight;
  }
}
function team() {
  return (
    '<div class="tablewrap"><table><thead><tr><th>Pessoa</th><th>Cargo</th><th>Acesso</th><th></th></tr></thead><tbody>' +
    D.users
      .map(
        (u) =>
          "<tr><td><strong>" +
          esc(u.name) +
          "</strong><small>" +
          esc(u.email) +
          "</small></td><td>" +
          esc(roleName(u.role)) +
          "</td><td>" +
          pill(
            u.active ? "ativo" : "expirado",
            u.active ? "Liberado" : "Bloqueado",
          ) +
          "</td><td>" +
          (u.id === D.user.id
            ? "Sua conta"
            : btn("Editar", "user:" + u.id, "edit", "plain")) +
          "</td></tr>",
      )
      .join("") +
    "</tbody></table></div>"
  );
}
function content() {
  const c = document.querySelector("#content");
  const custom =
    view === "executivo" || view.startsWith("exec-")
      ? execPage
      : view === "administrativo" ||
          view === "relatorio-fin" ||
          Object.hasOwn(modules, view)
        ? adminPage
        : null;
  if (custom || extraViews[view]) {
    c.innerHTML =
      '<div data-area="' +
      view +
      '"><p class="muted">Carregando área…</p></div>';
    const host = c.firstElementChild;
    (custom || extra)(view, D, host, {
      act,
      reload,
      openTeamChat: (task) => openTeamChat(D, task),
    }).catch((e) => {
      if (host.isConnected) host.innerHTML = notice(e.message, true);
    });
    return;
  }
  c.innerHTML =
    view === "painel"
      ? dashboard()
      : section(titles[view], subtitles[view], actionFor()) +
        {
          clientes: clients,
          sistemas: systems,
          agenda,
          chat: chats,
          funil: funnel,
          equipe: team,
        }[view]();
  if (view === "chat" && chatId) {
    syncChat(true).catch((e) => toast(e.message));
    handle("talk", async (a, f) => {
      await api("clientes/" + chatId + "/chat", "POST", a);
      f.reset();
      await syncChat(true);
    });
  }
}
async function reload() {
  D = await api("estado");
  shell();
}
function go() {
  const z = zones(),
    defaultZone = z.includes("executivo") ? "executivo" : z[0];
  const legacyChat = location.hash === "#interno";
  if (legacyChat)
    history.replaceState(
      null,
      "",
      "#" + items(z.includes(zone) ? zone : defaultZone)[0],
    );
  let v = location.hash.slice(1) || "areas",
    available = z.filter((k) => items(k).includes(v));
  if (!available.length) {
    zone = defaultZone;
    if(v!=="areas")history.replaceState(null,"","#areas");
    v = "areas";
  } else if (
    !z.includes(zone) ||
    (!available.includes(zone) && available.length)
  )
    zone = available[0] || defaultZone;
  view = v;
  term = filter = "";
  document.body.classList.remove("menuopen");
  document.title =
    (v === "areas" ? "Escolher área" : titles[v]) + " · EMPRESA TECH TESTE";
  shell();
  if (legacyChat) openTeamChat(D);
  if (v === "areas")
    document.getElementById("area-title")?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
async function act(a) {
  const [kind, id] = a.split(":");
  if (kind === "teamchat") return openTeamChat(D);
  if (kind === "theme") {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("central:tema", dark ? "dark" : "light");
    return;
  }
  if (kind === "salescall")
    return editor("event", 0, { D, reload, act, call: true });
  if (kind === "menu") {
    document.body.classList.toggle("menuopen");
    return;
  }
  if (kind === "logout") {
    await api("logout", "POST", {});
    location.replace("/empresa-tech-teste/empresa/");
    return;
  }
  if (kind === "day") {
    day = id;
    content();
    return;
  }
  if (["next", "prev", "today"].includes(kind)) {
    month =
      kind === "today"
        ? new Date()
        : new Date(
            month.getFullYear(),
            month.getMonth() + (kind === "next" ? 1 : -1),
            1,
          );
    day = localDay(month);
    content();
    return;
  }
  if (kind === "thread") {
    chatId = Number(id);
    content();
    return;
  }
  await editor(kind, Number(id) || 0, {
    D,
    reload,
    act,
    day,
    salesArea: zone === "vendas",
    openChat: (n) => {
      chatId = n;
      if (view === "chat") content();
      else location.hash = "chat";
    },
  });
}
async function init() {
  if (localStorage.getItem("central:tema") === "dark")
    document.documentElement.classList.add("dark");
  const p = location.pathname.slice(19).replace(/\/$/, "") || "/crm";
  if (p === "/empresa" || p === "/vendas") {
    marketing(p === "/vendas", (await api("session")).demo);
    return;
  }
  if (p === "/portal") {
    await portal();
    return;
  }
  if (p === "/demonstracao") {
    await api("demo", "POST", {});
    history.replaceState(null, "", "/empresa-tech-teste/crm" + location.hash);
  }
  const s = await api("session");
  if (!s.user || p === "/configurar") {
    loginScreen(s, p === "/configurar");
    return;
  }
  if (s.user.role === "pendente") {
    app.innerHTML =
      '<main class="portal">' +
      brand() +
      "<h1>Aguardando definição de cargo</h1>" +
      notice(
        "Solicite ao Founder ou CEO que atribua seu cargo em Acessos da equipe.",
      ) +
      '<button class="btn outline" id="exit-pending">Sair da conta</button></main>';
    document.querySelector("#exit-pending").onclick = () => act("logout");
    return;
  }
  D = await api("estado");
  go();
  window.addEventListener("hashchange", async () => {
    try {
      D = await api("estado");
      go();
    } catch (e) {
      toast(e.message);
    }
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (b) {
      e.preventDefault();
      act(b.dataset.act).catch((err) => toast(err.message));
    }
  });
  app.addEventListener("input", (e) => {
    if (e.target.id === "search") {
      term = e.target.value;
      const at = e.target.selectionStart;
      content();
      const t = document.querySelector("#search");
      t.focus();
      t.setSelectionRange(at, at);
    }
  });
  app.addEventListener("change", (e) => {
    if (e.target.id === "filter") {
      filter = e.target.value;
      content();
    }
  });
  app.addEventListener("dragstart", (e) => {
    const l = e.target.closest('[draggable="true"]');
    if (l) e.dataTransfer.setData("text/plain", l.dataset.lead);
  });
  app.addEventListener("dragover", (e) => {
    if (e.target.closest("[data-stage]") && can(D.user.role, "vendas"))
      e.preventDefault();
  });
  app.addEventListener("drop", async (e) => {
    const stage = e.target.closest("[data-stage]")?.dataset.stage,
      id = Number(e.dataTransfer.getData("text/plain")),
      lead = D.leads.find((x) => x.id === id);
    if (!lead || !stage || lead.stage === stage || !can(D.user.role, "vendas"))
      return;
    e.preventDefault();
    if (
      D.user.role === "sdr" &&
      (lead.closer_id ||
        !["Entrada", "Qualificação", "Perdida"].includes(stage))
    )
      return toast(
        "O encaminhamento e o fechamento são acompanhados pelo Closer ou gerente.",
      );
    try {
      if (stage === "Ganha") {
        await editor("lead", id, { D, reload, act, stage });
        return;
      }
      await api("leads/" + id, "PUT", { ...lead, stage });
      await reload();
      toast("Etapa atualizada.");
    } catch (err) {
      toast(err.message);
    }
  });
  setInterval(() => {
    if (!document.hidden && view === "chat" && !dlg.open)
      syncChat().catch(() => {});
  }, 4500);
  setInterval(() => {
    if (
      !document.hidden &&
      !dlg.open &&
      ["painel", "sistemas", "funil", "executivo", "comercial"].includes(
        view,
      ) &&
      !document.querySelector("#search:focus")
    )
      reload().catch(() => {});
  }, 45000);
}
init().catch((e) => {
  app.innerHTML =
    '<main class="portal">' +
    brand() +
    "<h1>Não foi possível abrir esta área</h1>" +
    notice(e.message, true) +
    '<a class="btn outline" href="/empresa-tech-teste/crm">Voltar à central</a></main>';
});
