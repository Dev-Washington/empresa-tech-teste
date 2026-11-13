import { departments } from "../data/permissoes.js";
import {
  api,
  esc,
  icon,
  btn,
  empty,
  field,
  area,
  select,
  form,
  handle,
  modal,
  notice,
  toast,
  dt,
  dateTime,
  hour,
  pill,
  money,
} from "../utils/ui.js";
import { products } from "../data/catalogo.js";
const nowDay = () =>
    new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    ),
  pName = (id) => products.find((p) => p.id === id)?.short || "—",
  local = (v) => {
    const t = new Date(v);
    return new Date(+t - t.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
const cash = (n) =>
    (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  rls = departments,
  teams = ["TI", "Marketing", "Tráfego", "Produtos", "Atendimento"],
  ws = ["Aberto", "Em andamento", "Aguardando cliente", "Concluído"],
  xp = ["Agendada", "Realizada", "Perdida", "Cancelada"];
let period = nowDay().slice(0, 7),
  workFilter = "Todos",
  labelFilter = "Todos",
  crmFilter = "Todos";
const X = (txt, act, ic = "", style = "outline") =>
  btn(txt, "local", ic, style, 'data-x="' + esc(act) + '"').replace(
    'data-act="local"',
    "",
  );
const jump = (label, v, ic) =>
  '<a class="btn outline" href="#' +
  v +
  '">' +
  icon(ic, 15) +
  esc(label) +
  "</a>";
const kpis = (items) =>
  '<div class="kpis">' +
  items
    .map(
      ([label, value, ic, color = "violet"]) =>
        '<article><span class="iconbox ' +
        color +
        '">' +
        icon(ic, 18) +
        "</span><div><small>" +
        esc(label) +
        "</small><strong>" +
        esc(value) +
        "</strong></div></article>",
    )
    .join("") +
  "</div>";
const table = (heads, data) =>
  data.length
    ? '<div class="tablewrap"><table><thead><tr>' +
      heads.map((x) => "<th>" + esc(x) + "</th>").join("") +
      "</tr></thead><tbody>" +
      data
        .map(
          (a) => "<tr>" + a.map((x) => "<td>" + x + "</td>").join("") + "</tr>",
        )
        .join("") +
      "</tbody></table></div>"
    : empty("layers", "Nenhum registro neste recorte");
const banner = (area, title, desc, actions = "") =>
  '<div class="deptbanner"><div class="eyebrow"><i class="dash"></i> ' +
  esc(area) +
  '</div><div class="pagehead"><div><h1>' +
  esc(title) +
  "<em>.</em></h1><p>" +
  esc(desc) +
  '</p></div><div class="inline">' +
  actions +
  "</div></div></div>";
const line = (name,v)=>'<div class="statline"><span>'+esc(name)+'</span><b>'+esc(v)+'</b></div>';
const badge = (s) =>
  pill(
    ["Paga", "Realizada", "Concluído", "Ativo"].includes(s)
      ? "ativo"
      : ["Perdida", "Vencido", "Urgente"].includes(s)
        ? "atrasado"
        : ["Cancelada", "Fechada"].includes(s)
          ? "cancelado"
          : "expirado",
    s,
  );
const monthInput = () =>
  '<label class="monthfield">Competência <input type="month" id="per" value="' +
  esc(period) +
  '" required></label>';
const options = (vals, selected) =>
  vals
    .map(
      (v) =>
        "<option " +
        (v === selected ? "selected" : "") +
        ">" +
        esc(v) +
        "</option>",
    )
    .join("");
const getSum = (a, k = "n") => a.reduce((n, x) => n + x[k], 0);
const amountField = (label, n, v) =>
  field(label, n, (v || 0) / 100, "number", true, 'step="0.01" min="0"');
function sheet(title, fields, label, cb) {
  modal(title, form(fields, label));
  handle("editForm", cb);
}
const close = () => document.querySelector("#dialog").close();
function csv(data) {
  const quote = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const b = new Blob(
      ["\uFEFF" + data.map((l) => l.map(quote).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
    url = URL.createObjectURL(b),
    a = document.createElement("a");
  a.href = url;
  a.download = "folha-" + period + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export const extraViews = {
  funcionarios: "Funcionários",
  folha: "Folha de pagamento",
  contas: "Contas a pagar",
  demandas: "Chamados e demandas",
  comercial: "Calls e reuniões",
};
export async function extra(v, D, root, actions) {
  const guard = () => root.isConnected && root.dataset.area === v;
  let hr, work;
  const refresh = async () => {
      if (guard()) await extra(v, D, root, actions);
    },
    done = async (s) => {
      close();
      await refresh();
      toast(s);
    };
  root.onclick = null;
  root.onchange = null;
  if (["funcionarios", "folha", "contas"].includes(v)) {
    hr = await api("adm?competencia=" + period);
    if (!guard()) return;
    const em = hr.employees,
      py = hr.payroll,
      ex = hr.expenses,
      net = (p) => p.base + p.extra + p.commission - p.discount;
    if (v === "funcionarios")
      root.innerHTML =
        banner(
          "ADMINISTRATIVO / PESSOAS",
          "Funcionários",
          "Cadastro funcional, lotação, admissão, salário e desligamento.",
          X("Novo funcionário", "emp", "plus", "primary"),
        ) +
        table(
          ["Funcionário", "Cargo", "Área", "Salário base", "Situação", ""],
          em.map((e) => [
            "<strong>" +
              esc(e.name) +
              "</strong><small>" +
              esc(e.email) +
              "</small>",
            esc(e.job),
            esc(e.dept),
            cash(e.salary),
            badge(e.active ? "Ativo" : "Desligado"),
            X("Editar", "emp:" + e.id, "edit", "plain"),
          ]),
        );
    if (v === "folha")
      root.innerHTML =
        banner(
          "ADMINISTRATIVO / FINANCEIRO",
          "Folha de pagamento",
          "Gere os lançamentos, revise proventos e descontos e registre os pagamentos.",
          X("Gerar folha", "gerar", "plus", "primary"),
        ) +
        '<div class="reporttools">' +
        monthInput() +
        X("Exportar CSV", "csv", "download") +
        "</div>" +
        kpis([
          [
            "Proventos",
            cash(py.reduce((n, x) => n + x.base + x.extra + x.commission, 0)),
            "brief",
          ],
          ["Descontos", cash(getSum(py, "discount")), "file", "amber"],
          [
            "Líquido",
            cash(py.reduce((n, x) => n + net(x), 0)),
            "chart",
            "mint",
          ],
        ]) +
        table(
          [
            "Funcionário",
            "Salário base",
            "Extras + comissão",
            "Descontos",
            "Líquido",
            "Situação",
            "",
          ],
          py.map((p) => [
            esc(p.employeeName),
            cash(p.base),
            cash(p.extra + p.commission),
            cash(p.discount),
            "<strong>" + cash(net(p)) + "</strong>",
            badge(p.status),
            X(
              p.status === "Paga" ? "Consultar" : "Revisar",
              "pay:" + p.id,
              "right",
              "plain",
            ),
          ]),
        );
    if (v === "contas")
      root.innerHTML =
        banner(
          "ADMINISTRATIVO / FINANCEIRO",
          "Contas a pagar",
          "Acompanhe fornecedores e vencimentos por competência.",
          X("Nova conta", "expense", "plus", "primary"),
        ) +
        '<div class="reporttools">' +
        monthInput() +
        "</div>" +
        table(
          ["Descrição", "Fornecedor", "Vencimento", "Valor", "Estado", ""],
          ex.map((x) => [
            esc(x.title),
            esc(x.vendor),
            dt(x.due + "T12:00:00", { dateStyle: "short" }),
            cash(x.amount),
            badge(x.paid ? "Paga" : x.due < nowDay() ? "Vencido" : "Em aberto"),
            x.paid ? "—" : X("Gerenciar", "expense:" + x.id, "right", "plain"),
          ]),
        );
  } else if (v === "demandas") {
    work = await api("demandas");
    if (!guard()) return;
    const opened = work.filter((x) => x.status !== "Concluído"),
      late = (x) => x.status !== "Concluído" && Date.parse(x.due) < Date.now(),
      f = work.filter(
        (x) =>
          (workFilter === "Todos" || x.area === workFilter) &&
          (labelFilter === "Todos" ||
            (labelFilter === "Vencidos" ? late(x) : x.kind === labelFilter)),
      );
    root.innerHTML =
      banner(
        "OPERACIONAL / FILA DE TRABALHO",
        "Chamados e demandas",
        "Priorize o suporte aos clientes e o trabalho de TI, marketing e produtos.",
        X("Abrir demanda", "work", "plus", "primary"),
      ) +
      kpis([
        [
          "Chamados abertos",
          opened.filter((x) => x.kind === "Chamado").length,
          "head",
          "blue",
        ],
        [
          "Demandas internas",
          opened.filter((x) => x.kind === "Demanda interna").length,
          "layers",
        ],
        ["Prazo vencido", opened.filter(late).length, "clock", "amber"],
      ]) +
      '<div class="reporttools"><label>Área <select id="workArea">' +
      options(["Todos", ...teams], workFilter) +
      '</select></label><label>Fila <select id="workKind">' +
      options(
        ["Todos", "Chamado", "Demanda interna", "Vencidos"],
        labelFilter,
      ) +
      "</select></label></div>" +
      table(
        [
          "Solicitação",
          "Área / prioridade",
          "Responsável",
          "Prazo",
          "Estado",
          "",
        ],
        f.map((x) => [
          "<strong>" +
            esc(x.title) +
            "</strong><small>" +
            esc(
              x.kind +
                " · " +
                (D.clients.find((c) => c.id === x.client)?.company ||
                  "Equipe interna"),
            ) +
            "</small>",
          esc(x.area) + "<small>" + esc(x.priority) + "</small>",
          esc(x.owner || "—"),
          esc(dateTime(x.due)) +
            (late(x) ? '<small class="red">Prazo vencido</small>' : ""),
          badge(x.status),
          X("Abrir", "work:" + x.id, "right", "plain"),
        ]),
      );
  } else if (v === "comercial") {
    const ev = D.events.filter(
        (x) =>
          x.scope === "vendas" || (!x.client && (x.lead || x.kind === "Call")),
      ),
      f = ev.filter((x) => crmFilter === "Todos" || x.outcome === crmFilter);
    root.innerHTML =
      banner(
        "VENDAS / ATIVIDADES COMERCIAIS",
        "Calls e reuniões",
        "Registre o resultado de cada contato e acompanhe a agenda comercial.",
        btn(
          D.user.role === "closer" ? "Agendar reunião" : "Agendar call",
          "salescall",
          "plus",
          "primary",
        ),
      ) +
      kpis([
        [
          D.user.role === "closer" ? "Reuniões agendadas" : "Calls agendadas",
          ev.filter(
            (x) =>
              x.kind === (D.user.role === "closer" ? "Reunião" : "Call") &&
              x.outcome === "Agendada",
          ).length,
          "calendar",
          "blue",
        ],
        [
          D.user.role === "closer" ? "Reuniões perdidas" : "Calls perdidas",
          ev.filter(
            (x) =>
              x.kind === (D.user.role === "closer" ? "Reunião" : "Call") &&
              x.outcome === "Perdida",
          ).length,
          "head",
          "amber",
        ],
        [
          "Reuniões realizadas",
          ev.filter((x) => x.kind === "Reunião" && x.outcome === "Realizada")
            .length,
          "users",
          "mint",
        ],
      ]) +
      '<div class="reporttools"><label>Resultado <select id="crmStatus">' +
      options(["Todos", ...xp], crmFilter) +
      "</select></label>" +
      jump("Abrir funil", "funil", "funnel") +
      "</div>" +
      table(
        ["Atividade", "Lead", "Responsável", "Data e hora", "Resultado", ""],
        f.map((x) => [
          "<strong>" +
            esc(x.title) +
            "</strong><small>" +
            esc(x.kind) +
            "</small>",
          esc(D.leads.find((l) => l.id === x.lead)?.company || "—"),
          esc(
            D.reps.find((r) => r.id === x.owner_id)?.name || "Sem responsável",
          ),
          esc(dateTime(x.start)),
          badge(x.outcome),
          btn("Editar", "event:" + x.id, "edit", "plain"),
        ]),
      );
  }
  if (!guard()) return;
  root.onchange = (ev) => {
    const a = ev.target;
    if (a.id === "per" && a.value) period = a.value;
    else if (a.id === "workArea") workFilter = a.value;
    else if (a.id === "workKind") labelFilter = a.value;
    else if (a.id === "crmStatus") crmFilter = a.value;
    else return;
    refresh().catch((e) => toast(e.message));
  };
  root.onclick = async (ev) => {
    const el = ev.target.closest("[data-x]");
    if (!el) return;
    const [k, sid] = el.dataset.x.split(":"),
      id = Number(sid) || 0;
    try {
      if (k === "emp") {
        const e = hr.employees.find((z) => z.id === id) || {};
        sheet(
          id ? "Editar funcionário" : "Novo funcionário",
          '<div class="pair">' +
            field("Nome", "name", e.name, "text", true) +
            field("Cargo", "job", e.job, "text", true) +
            "</div>" +
            select("Área", "dept", rls, e.dept) +
            field("E-mail", "email", e.email, "email") +
            '<div class="pair">' +
            field("Admissão", "hired", e.hired || nowDay(), "date", true) +
            amountField("Salário base (R$)", "salary", e.salary) +
            "</div>" +
            select(
              "Situação",
              "active",
              [
                ["1", "Ativo"],
                ["0", "Desligado"],
              ],
              e.active ?? 1,
            ) +
            field(
              "Data do desligamento (se aplicável)",
              "ended",
              e.ended,
              "date",
            ),
          "Salvar cadastro",
          async (a) => {
            await api(
              "funcionarios" + (id ? "/" + id : ""),
              id ? "PUT" : "POST",
              { ...a, active: a.active === "1" },
            );
            await done("Cadastro funcional salvo.");
          },
        );
      }
      if (k === "gerar") {
        const r = await api("folha/gerar", "POST", { period });
        await refresh();
        toast(
          r.created
            ? r.created + " lançamento(s) gerado(s)."
            : "Nenhum novo lançamento para esta competência.",
        );
      }
      if (k === "csv") {
        csv([
          [
            "Competência",
            "Funcionário",
            "Base",
            "Extras",
            "Comissão",
            "Descontos",
            "Líquido",
            "Situação",
          ],
          ...hr.payroll.map((p) => [
            period,
            p.employeeName,
            ...[
              p.base,
              p.extra,
              p.commission,
              p.discount,
              p.base + p.extra + p.commission - p.discount,
            ].map(cash),
            p.status,
          ]),
        ]);
        return;
      }
      if (k === "pay") {
        const p = hr.payroll.find((x) => x.id === id),
          li = p.base + p.extra + p.commission - p.discount;
        if (p.status === "Paga") {
          modal(
            "Folha registrada como paga",
            line("Funcionário", p.employeeName) +
              line("Competência", period) +
              line("Líquido", cash(li)) +
              line("Baixa", dateTime(p.paid)) +
              line("Observações", p.notes || "—"),
          );
          return;
        }
        sheet(
          p.employeeName + " · " + period,
          p.status === "Fechada"
            ? notice(
                "Líquido fechado: " +
                  cash(li) +
                  ". A baixa registra um pagamento já realizado.",
              ) +
                select("Ação", "status", [
                  ["Paga", "Marcar como paga"],
                  ["Rascunho", "Reabrir para revisão"],
                ])
            : '<div class="pair">' +
                amountField("Salário base (R$)", "base", p.base) +
                amountField("Adicionais (R$)", "extra", p.extra) +
                '</div><div class="pair">' +
                amountField("Comissões (R$)", "commission", p.commission) +
                amountField("Descontos totais (R$)", "discount", p.discount) +
                "</div>" +
                area("Observações de cálculo", "notes", p.notes) +
                select(
                  "Salvar como",
                  "status",
                  ["Rascunho", "Fechada"],
                  p.status,
                ) +
                notice(
                  "Informe os valores apurados pela folha/contabilidade, inclusive descontos e ajustes proporcionais.",
                ),
          "Salvar lançamento",
          async (a) => {
            await api("folha/" + id, "PUT", a);
            await done("Lançamento atualizado.");
          },
        );
      }
      if (k === "expense") {
        const e = hr.expenses.find((x) => x.id === id) || {};
        sheet(
          id ? "Gerenciar conta" : "Nova conta",
          field("Descrição", "title", e.title, "text", true) +
            field("Fornecedor", "vendor", e.vendor, "text", true) +
            '<div class="pair">' +
            field("Vencimento", "due", e.due || period + "-01", "date", true) +
            amountField("Valor (R$)", "amount", e.amount) +
            "</div>" +
            (id
              ? select("Ação", "action", [
                  ["editar", "Salvar alterações"],
                  ["pagar", "Registrar pagamento do valor já cadastrado"],
                ])
              : ""),
          "Salvar conta",
          async (a) => {
            await api("despesas" + (id ? "/" + id : ""), id ? "PUT" : "POST", {
              ...a,
              markPaid: a.action === "pagar",
            });
            await done("Conta atualizada.");
          },
        );
      }
      if (k === "work") {
        const w = work.find((x) => x.id === id) || {};
        sheet(
          id ? "Gerenciar solicitação" : "Abrir solicitação",
          field("Título", "title", w.title, "text", true) +
            '<div class="pair">' +
            select(
              "Tipo",
              "kind",
              ["Chamado", "Demanda interna"],
              w.kind || "Demanda interna",
            ) +
            select("Área responsável", "area", teams, w.area) +
            "</div>" +
            select(
              "Cliente (obrigatório para chamado)",
              "client",
              [
                ["", "Interno"],
                ...D.clients
                  .filter((c) => !c.archived)
                  .map((c) => [c.id, c.company]),
              ],
              w.client,
            ) +
            select(
              "Produto",
              "product",
              [["", "Sem produto"], ...products.map((p) => [p.id, p.name])],
              w.product,
            ) +
            '<div class="pair">' +
            select(
              "Prioridade",
              "priority",
              ["Baixa", "Normal", "Alta", "Urgente"],
              w.priority || "Normal",
            ) +
            select("Estado", "status", ws, w.status) +
            "</div>" +
            field("Responsável", "owner", w.owner || D.user.name) +
            field(
              "Prazo de atendimento",
              "due",
              local(w.due || Date.now() + 86400000),
              "datetime-local",
              true,
            ) +
            area("Descrição e andamento", "notes", w.notes) +
            (id
              ? '<button class="btn outline" id="taskchat" type="button">' +
                icon("chat", 16) +
                " Chat interno desta demanda</button>"
              : ""),
          "Salvar solicitação",
          async (a) => {
            await api("demandas" + (id ? "/" + id : ""), id ? "PUT" : "POST", {
              ...a,
              due: new Date(a.due).toISOString(),
            });
            await done("Fila operacional atualizada.");
          },
        );
        if (id)
          document.querySelector("#taskchat").onclick = () => {
            close();
            actions.openTeamChat({
              id: "tarefa:" + id,
              name: w.title,
              type: "tarefa",
            });
          };
      }
    } catch (e) {
      toast(e.message);
    }
  };
}
