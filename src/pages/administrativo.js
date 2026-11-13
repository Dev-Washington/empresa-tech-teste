import { adminMenu, modules } from "../data/gestao.js";
import { can, moduleCap } from "../data/permissoes.js";
import {
  api,
  esc,
  icon,
  field,
  area,
  select,
  form,
  handle,
  modal,
  toast,
  empty,
  money,
  dateTime,
} from "../utils/ui.js";
const local = (v) => {
  const d = new Date(v);
  return new Date(+d - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const header = (tag, title, sub, actions = "") =>
  '<div class="pagehead"><div><div class="eyebrow">' +
  esc(tag) +
  "</div><h1>" +
  esc(title) +
  "</h1><p>" +
  esc(sub) +
  "</p></div>" +
  actions +
  "</div>";
const table = (cols, rows) =>
  rows.length
    ? '<div class="tablewrap"><table><thead><tr>' +
      cols.map((x) => "<th>" + esc(x) + "</th>").join("") +
      "</tr></thead><tbody>" +
      rows
        .map(
          (row) =>
            "<tr>" + row.map((x) => "<td>" + x + "</td>").join("") + "</tr>",
        )
        .join("") +
      "</tbody></table></div>"
    : empty("search", "Nenhum registro encontrado");
const tile = (label, value, detail = "") =>
  '<article class="metric"><span class="metriclabel">' +
  esc(label) +
  "</span><strong>" +
  esc(value) +
  "</strong><small>" +
  esc(detail) +
  "</small></article>";
const sum = (rows, f) => rows.reduce((n, r) => n + f(r), 0);
let per = local(Date.now()).slice(0, 7);
export async function adminPage(v, D, host, actions) {
  if (v === "administrativo") {
    const x = await api("gestao/inicio");
    if (!host.isConnected) return;
    const cards = [
      ["Tarefas abertas", x.tarefas],
      ["Chamados abertos", x.chamados],
      ["Campanhas ativas", x.campanhas],
      ["Contas vencidas", x.vencidas],
    ].filter(([, n]) => n != null);
    const links = adminMenu
      .slice(1)
      .map(([label, entries]) => {
        const allowed = entries.filter(([k]) =>
          can(D.user.role, moduleCap[k] || (k === "agenda" ? "operacao" : "")),
        );
        return !allowed.length
          ? ""
          : '<section class="office-group"><h2>' +
              esc(label) +
              "</h2>" +
              allowed
                .map(
                  ([k, n, i]) =>
                    '<a href="#' +
                    k +
                    '">' +
                    icon(i, 17) +
                    "<span>" +
                    esc(n) +
                    "</span>" +
                    icon("right", 14) +
                    "</a>",
                )
                .join("") +
              "</section>";
      })
      .join("");
    host.innerHTML =
      header(
        "GESTÃO INTERNA",
        "Acesso rápido",
        "Abra uma seção do seu cargo ou confira o próximo prazo da equipe.",
      ) +
      '<div class="metrics">' +
      cards.map(([l, n]) => tile(l, n)).join("") +
      '</div><div class="office-grid">' +
      links +
      '</div><div class="sectionline"><h2>Próximos prazos</h2></div>' +
      table(
        ["Entrega", "Equipe", "Tipo", "Prazo"],
        x.pending.map((r) => [
          esc(r.title),
          esc(r.area),
          esc(r.kind),
          esc(dateTime(r.due)),
        ]),
      );
    return;
  }
  if (v === "relatorio-fin") {
    const x = await api("adm?competencia=" + per);
    if (!host.isConnected) return;
    const payroll = x.payroll,
      expenses = x.expenses,
      net = (r) => r.base + r.extra + r.commission - r.discount,
      fmt = (n) => money(n / 100);
    const parts = [
      ["Folha · salários-base", sum(payroll, (r) => r.base)],
      [
        "Folha · extras e comissões",
        sum(payroll, (r) => r.extra + r.commission),
      ],
      ["Folha · descontos", sum(payroll, (r) => r.discount)],
      ["Folha · líquido", sum(payroll, net)],
      [
        "Folha · líquido pago",
        sum(
          payroll.filter((r) => r.paid),
          net,
        ),
      ],
      [
        "Despesas · em aberto",
        sum(
          expenses.filter((r) => !r.paid),
          (r) => r.amount,
        ),
      ],
      [
        "Despesas · pagas",
        sum(
          expenses.filter((r) => r.paid),
          (r) => r.amount,
        ),
      ],
    ];
    host.innerHTML =
      header(
        "FINANCEIRO",
        "Relatório financeiro",
        "Folha da competência e despesas pelo mês de vencimento.",
      ) +
      '<div class="reporttools"><label>Competência <input type="month" value="' +
      esc(per) +
      '" id="fin-month"></label><button class="btn outline" id="fin-csv">Baixar CSV</button></div><div class="metrics">' +
      [parts[3], parts[5], parts[6]].map(([l, n]) => tile(l, fmt(n))).join("") +
      "</div>" +
      table(
        ["Composição", "Valor"],
        parts.map(([l, n]) => [esc(l), esc(fmt(n))]),
      );
    host.querySelector("#fin-month").onchange = (e) => {
      if (e.target.value) {
        per = e.target.value;
        adminPage(v, D, host, actions).catch((e) => toast(e.message));
      }
    };
    host.querySelector("#fin-csv").onclick = () => {
      const data =
          "\ufeffCompetência;Composição;Valor (R$)\r\n" +
          parts
            .map(([l, n]) =>
              [per, l, (n / 100).toFixed(2).replace(".", ",")].join(";"),
            )
            .join("\r\n"),
        url = URL.createObjectURL(
          new Blob([data], { type: "text/csv;charset=utf-8" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = "financeiro-" + per + ".csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    return;
  }
  const mod = modules[v],
    snapshot = v === "rastreio" ? await api("gestao/mapa") : null;
  const { items, refs } = snapshot
    ? {
        items: [],
        refs: {
          vehicle: snapshot.fleet.map((r) => ({
            id: r.id,
            label: r.plate + " · " + r.title,
          })),
        },
      }
    : await api("gestao/" + v);
  if (!host.isConnected) return;
  const label = (k) => mod.fields.find((f) => f.key === k)?.label || k;
  function display(f, n) {
    if (n === null || n === undefined || n === "") return "—";
    return refs[f.type]
      ? refs[f.type].find((r) => r.id === n)?.label || "#" + n
      : f.type === "money"
        ? money(n / 100)
        : f.type === "datetime"
          ? dateTime(n)
          : f.type === "date"
            ? n.split("-").reverse().join("/")
            : String(n);
  }
  function input(f, r) {
    let n = r[f.key] ?? "";
    if (refs[f.type])
      return select(
        f.label,
        f.key,
        [["", "Selecione"], ...refs[f.type].map((o) => [o.id, o.label])],
        n,
        f.required,
      );
    if (f.type === "select")
      return select(f.label, f.key, f.options, n || f.options[0], f.required);
    if (f.type === "memo") return area(f.label, f.key, n);
    const type =
      {
        datetime: "datetime-local",
        date: "date",
        money: "number",
        lat: "number",
        lng: "number",
        int: "number",
      }[f.type] || "text";
    if (f.type === "datetime") n = n ? local(n) : local(Date.now());
    if (f.type === "date" && !n && f.required)
      n = local(Date.now()).slice(0, 10);
    if (f.type === "money" && n !== "") n = n / 100;
    return field(
      f.label,
      f.key,
      n,
      type,
      f.required,
      {
        money: 'step=".01" min="0"',
        int: 'step="1" min="0"',
        lat: 'step="any" min="-90" max="90"',
        lng: 'step="any" min="-180" max="180"',
      }[f.type] || "",
    );
  }
  const newLabel =
    (mod.entity === "ativo" ||
    mod.entity === "conteúdo" ||
    mod.entity === "veículo" ||
    mod.entity === "chamado"
      ? "Novo "
      : "Nova ") + mod.entity;
  function edit(r) {
    modal(
      r.id ? "Editar " + mod.entity : newLabel,
      form(
        mod.fields.map((f) => input(f, r)).join("") +
          (r.id && mod.kind
            ? '<button type="button" class="btn outline" id="discuss-work">Abrir conversa da demanda</button>'
            : ""),
        "Salvar",
      ),
      mod.title,
    );
    const discuss = document.querySelector("#discuss-work");
    if (discuss)
      discuss.onclick = () => {
        document.querySelector("#dialog").close();
        actions.openTeamChat({
          id: "tarefa:" + r.id,
          name: r.title,
          type: "tarefa",
        });
      };
    handle("editForm", async (a) => {
      for (const f of mod.fields)
        if (f.type === "datetime" && a[f.key])
          a[f.key] = new Date(a[f.key]).toISOString();
      await api(
        "gestao/" + v + (r.id ? "/" + r.id : ""),
        r.id ? "PUT" : "POST",
        a,
      );
      document.querySelector("#dialog").close();
      if (host.isConnected) await adminPage(v, D, host, actions);
      toast("Registro salvo.");
    });
  }
  if (snapshot) {
    host.innerHTML =
      header(
        "GARAGEM",
        mod.title,
        mod.desc,
        '<button class="btn primary" data-new>' +
          icon("plus", 16) +
          " Registrar posição</button>",
      ) + "<div data-fleet-app></div>";
    const { tracking } = await import("../components/garagem/mapa-frota.js");
    if (!host.isConnected) return;
    const addPosition = (id = 0) => {
      if (!refs.vehicle.length) {
        modal(
          "Registrar posição",
          empty("truck", "Cadastre um veículo primeiro") +
            '<a class="btn primary" href="#veiculos" id="open-fleet">Abrir veículos</a>',
        );
        document.querySelector("#open-fleet").onclick = () =>
          document.querySelector("#dialog").close();
        return;
      }
      edit({ vehicle: id || refs.vehicle[0].id });
    };
    host.querySelector("[data-new]").onclick = () => addPosition();
    tracking(
      host.querySelector("[data-fleet-app]"),
      snapshot,
      addPosition,
      (fleet) => {
        refs.vehicle = fleet.map((r) => ({
          id: r.id,
          label: r.plate + " · " + r.title,
        }));
      },
    );
    return;
  }
  host.innerHTML =
    header(
      adminMenu.find(([, arr]) => arr.some(([k]) => k === v))?.[0] ||
        "GESTÃO INTERNA",
      mod.title,
      mod.desc,
      '<button class="btn primary" data-new>' +
        icon("plus", 16) +
        esc(newLabel) +
        "</button>",
    ) +
    '<div class="reporttools"><label>Pesquisar <input type="search" placeholder="Buscar nesta seção" data-find></label><small>' +
    items.length +
    " registro(s)</small></div><div data-list></div>";
  const draw = (q = "") => {
    const rows = items.filter((r) =>
      mod.fields.some((f) =>
        display(f, r[f.key])
          .toLocaleLowerCase("pt-BR")
          .includes(q.toLocaleLowerCase("pt-BR")),
      ),
    );
    host.querySelector("[data-list]").innerHTML = table(
      [...mod.cols.map(label), ""],
      rows.map((r) => [
        ...mod.cols.map((k) =>
          esc(
            display(
              mod.fields.find((f) => f.key === k),
              r[k],
            ),
          ),
        ),
        mod.appendOnly
          ? r.lat != null && r.lng != null
            ? '<a class="textlink" href="https://www.openstreetmap.org/?mlat=' +
              encodeURIComponent(r.lat) +
              "&amp;mlon=" +
              encodeURIComponent(r.lng) +
              '" target="_blank" rel="noopener">Ver no mapa</a>'
            : "—"
          : '<button class="btn plain" data-edit="' +
            r.id +
            '">Editar</button>',
      ]),
    );
  };
  host.querySelector("[data-new]").onclick = () => edit({});
  host.querySelector("[data-find]").oninput = (e) => draw(e.target.value);
  host.querySelector("[data-list]").onclick = (e) => {
    const id = e.target.closest("[data-edit]")?.dataset.edit;
    if (id) edit(items.find((r) => r.id === Number(id)));
  };
  draw();
}
