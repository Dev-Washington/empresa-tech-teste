import { can } from "../../data/permissoes.js";
import { products, stages, roles } from "../../data/catalogo.js";
import {
  icon,
  esc,
  api,
  btn,
  field,
  select,
  area,
  form,
  handle,
  modal,
  toast,
  notice,
  pill,
  empty,
  dateTime,
  money,
  statuses,
} from "../../utils/ui.js";
const d = () => document.querySelector("#dialog"),
  opts = products.map((p) => [p.id, p.name]),
  pname = (v) => products.find((p) => p.id === v)?.name || v;
const rows = (items) =>
  '<dl class="details">' +
  items
    .map(
      ([k, v]) =>
        "<div><dt>" + esc(k) + "</dt><dd>" + esc(v || "—") + "</dd></div>",
    )
    .join("") +
  "</dl>";
function localTime(v) {
  const dt = new Date(v);
  return new Date(+dt - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export async function editor(kind, id, ctx) {
  const { D, reload, act } = ctx,
    c = D.clients.find((x) => x.id === id) || {},
    s = D.systems.find((x) => x.id === id) || {},
    l = D.leads.find((x) => x.id === id) || {},
    e = D.events.find((x) => x.id === id) || {},
    u = D.users.find((x) => x.id === id) || {},
    cs = D.clients.filter((x) => !x.archived).map((x) => [x.id, x.company]),
    ls = D.leads
      .filter((x) => !["Ganha", "Perdida"].includes(x.stage))
      .map((x) => [x.id, x.company]);
  const end = async (msg) => {
    d().close();
    await reload();
    toast(msg);
  };
  function show(title, fields, submit, save, tag) {
    modal(title, form(fields, submit), tag);
    handle("editForm", save);
  }
  if (kind === "profile") {
    const sy = D.systems.filter((x) => x.client === id),
      le = D.leads.filter((x) => x.client === id);
    modal(
      c.company,
      rows([
        ["Contato", c.contact],
        ["E-mail", c.email],
        ["Telefone", c.phone],
        ["Observações", c.notes],
        [
          "Vendas de origem",
          le.map((z) => "#" + z.id + " · " + pname(z.product)).join("; "),
        ],
      ]) +
        "<h3>Produtos contratados</h3>" +
        (sy.length
          ? sy
              .map(
                (z) =>
                  '<button class="listbtn" data-act="contract:' +
                  z.id +
                  '"><b>' +
                  esc(pname(z.product)) +
                  "</b>" +
                  pill(z.status) +
                  "</button>",
              )
              .join("")
          : empty("layers", "Nenhum produto vinculado")) +
        '<div class="modaltools">' +
        btn("Editar cadastro", "client:" + id, "edit", "outline") +
        (!c.archived
          ? btn("Vincular produto", "system:" + id, "plus", "outline") +
            btn("Abrir conversa", "talk:" + id, "chat", "outline") +
            btn("Portal do cliente", "portal:" + id, "link", "outline")
          : "") +
        btn(
          c.archived ? "Restaurar" : "Arquivar",
          "archive:" + id,
          "box",
          "plain",
        ) +
        "</div>",
      "CADASTRO DO CLIENTE",
    );
    return;
  }
  if (kind === "client") {
    show(
      id ? "Editar cliente" : "Novo cliente",
      '<div class="pair">' +
        field("Empresa", "company", c.company, "text", true) +
        field("Pessoa de contato", "contact", c.contact, "text", true) +
        '</div><div class="pair">' +
        field("E-mail", "email", c.email, "email") +
        field("Telefone", "phone", c.phone, "tel") +
        "</div>" +
        area("Observações", "notes", c.notes),
      "Salvar cliente",
      async (a) => {
        await api("clientes" + (id ? "/" + id : ""), id ? "PUT" : "POST", a);
        await end("Cadastro salvo.");
      },
      "CARTEIRA DE CLIENTES",
    );
    return;
  }
  if (kind === "archive") {
    show(
      c.archived ? "Restaurar cadastro" : "Arquivar cadastro",
      notice(
        c.archived
          ? "O cliente voltará para a carteira ativa."
          : "O cadastro sai da carteira ativa e o link do portal será revogado. Só é possível arquivar após todos os prazos de exportação.",
      ),
      c.archived ? "Restaurar" : "Arquivar",
      async () => {
        await api("clientes/" + id + "/arquivo", "POST", {});
        await end("Cadastro atualizado.");
      },
    );
    return;
  }
  if (kind === "talk") {
    d().close();
    ctx.openChat(id);
    return;
  }
  if (kind === "portal" || kind === "key") {
    const key = kind === "key";
    const title = key ? "Chave de integração" : "Link do portal";
    const make = async () => {
      const r = await api(
          key ? "sistemas/" + id + "/chave" : "clientes/" + id + "/portal",
          "POST",
          {},
        ),
        value = key ? r.token : location.origin + "/empresa-tech-teste/portal#" + r.token;
      modal(
        title,
        notice(
          key
            ? "Use esta chave apenas no servidor do produto deste contrato. Ao gerar outra, a anterior deixa de funcionar."
            : "Compartilhe este link exclusivamente com o cliente. Quem o possuir poderá acessar o portal deste cadastro.",
        ) +
          '<label class="field">' +
          (key ? "Chave do contrato" : "Link privado") +
          '<input id="copyValue" readonly value="' +
          esc(value) +
          '"></label><div class="modaltools"><button type="button" class="btn primary" id="copyButton">' +
          icon("copy", 16) +
          " Copiar</button>" +
          (!key
            ? '<a class="btn outline" target="_blank" rel="noopener" href="' +
              esc(value) +
              '">Abrir portal ' +
              icon("out", 15) +
              "</a>"
            : "") +
          "</div>",
      );
      document.querySelector("#copyButton").onclick = async () => {
        const input = document.querySelector("#copyValue");
        input.select();
        try {
          await navigator.clipboard.writeText(input.value);
          toast("Copiado.");
        } catch {
          toast("Texto selecionado. Use Ctrl+C para copiar.");
        }
      };
      await reload();
    };
    show(
      title,
      notice(
        key
          ? "A chave identifica apenas este produto deste cliente. Se já houver uma integração, a chave anterior será invalidada."
          : "Gere um link privado para " +
              c.company +
              ". Se já existir outro, ele deixará de funcionar.",
      ),
      key ? "Gerar chave" : "Gerar link privado",
      make,
    );
    return;
  }
  if (kind === "system") {
    if (!cs.length) {
      modal(
        "Vincular produto",
        empty("users", "Cadastre um cliente primeiro") +
          btn("Cadastrar cliente", "client", "plus"),
      );
      return;
    }
    show(
      "Vincular produto",
      select("Cliente", "client", cs, id || cs[0][0], true) +
        select("Produto contratado", "product", opts, opts[0][0], true) +
        field("Período pago até (opcional)", "paid_until", "", "date") +
        notice(
          "Se informar uma data, o bloqueio ocorre após o último dia pago (horário de Brasília). Em branco, o controle é manual.",
        ),
      "Criar contrato",
      async (a) => {
        const r = await api("sistemas", "POST", a);
        await end("Produto vinculado.");
        await act("contract:" + r.id);
      },
      "SISTEMAS E CONTRATOS",
    );
    return;
  }
  if (kind === "contract") {
    const cc = D.clients.find((q) => q.id === s.client);
    const live = ["ativo", "atrasado"].includes(s.status);
    modal(
      pname(s.product),
      '<div class="contractline"><strong>' +
        esc(cc?.company) +
        "</strong>" +
        pill(s.status) +
        "</div>" +
        rows([
          ["Contrato", "#" + s.id],
          [
            "Execução de tarefas",
            s.status === "ativo" ? "Liberada" : "Bloqueada",
          ],
          ["Chave de integração", s.connected ? "Emitida" : "Não emitida"],
          [
            "Dados na central",
            s.records + " registros · " + s.files + " arquivos",
          ],
          [
            "Período pago até",
            s.paid_until
              ? s.paid_until.split("-").reverse().join("/")
              : "Controle manual",
          ],
          ["Última alteração", dateTime(s.updated)],
          ...(s.reason ? [["Motivo", s.reason]] : []),
          ...(s.expires ? [["Download até", dateTime(s.expires)]] : []),
        ]) +
        (s.status === "cancelado"
          ? notice(
              "Somente exportação. O cliente baixa o ZIP pelo portal até a data acima.",
            )
          : s.status === "expirado"
            ? notice(
                "O prazo terminou. Os registros e arquivos deste contrato foram removidos.",
              )
            : notice(
                "O produto precisa consultar a central antes de executar cada tarefa e sincronizar os dados para exportação.",
              )) +
        '<div class="modaltools">' +
        (s.status === "ativo"
          ? btn("Período pago", "billing:" + id, "calendar", "outline")
          : "") +
        (live
          ? btn(
              s.status === "ativo"
                ? "Bloquear por atraso"
                : "Regularizar acesso",
              (s.status === "ativo" ? "late:" : "resume:") + id,
              "power",
              "outline",
            ) +
            btn("Chave de integração", "key:" + id, "key", "outline") +
            btn("Cancelar contrato", "cancel:" + id, "x", "danger")
          : "") +
        btn("Portal do cliente", "portal:" + s.client, "link", "plain") +
        "</div>",
      "CONTRATO / " + String(id).padStart(4, "0"),
    );
    return;
  }
  if (kind === "billing") {
    show(
      "Atualizar período pago",
      field(
        "Liberado até (inclusive)",
        "paid_until",
        s.paid_until || "",
        "date",
      ) +
        notice(
          "Após esse dia, o contrato será bloqueado por atraso. Deixe em branco para controle manual.",
        ),
      "Salvar vencimento",
      async (a) => {
        await api("sistemas/" + id + "/vencimento", "POST", a);
        await end("Período atualizado.");
        await act("contract:" + id);
      },
    );
    return;
  }
  if (["late", "resume", "cancel"].includes(kind)) {
    const st = { late: "atrasado", resume: "ativo", cancel: "cancelado" }[kind],
      t = {
        late: "Bloquear por atraso",
        resume: "Regularizar acesso",
        cancel: "Cancelar contrato",
      }[kind];
    show(
      t,
      notice(
        {
          late: "As tarefas deste produto serão bloqueadas. Os dados ficam preservados e você pode regularizar o acesso depois.",
          resume:
            "A execução de tarefas será liberada novamente para este contrato.",
          cancel:
            "Esta ação encerra o contrato. O cliente terá 30 dias corridos para baixar os dados no portal. Depois, registros e arquivos deste produto serão excluídos da central. O cancelamento não pode ser desfeito.",
        }[kind],
        kind === "cancel",
      ) +
        field(
          kind === "resume" ? "Observação" : "Motivo",
          "reason",
          "",
          "text",
          kind !== "resume",
          'maxlength="500"',
        ) +
        (kind === "resume"
          ? field("Novo período pago até (opcional)", "paid_until", "", "date")
          : "") +
        (kind === "cancel"
          ? '<label class="checkbox"><input required type="checkbox"> Confirmo o cancelamento de ' +
            esc(pname(s.product)) +
            " para " +
            esc(D.clients.find((x) => x.id === s.client)?.company) +
            ".</label>"
          : ""),
      t,
      async (a) => {
        await api("sistemas/" + id + "/estado", "POST", { ...a, status: st });
        await end("Estado do contrato atualizado.");
        await act("contract:" + id);
      },
      "CONTROLE DO PRODUTO",
    );
    return;
  }
  if (kind === "lead") {
    if (!can(D.user.role, "vendas") || (D.user.role === "sdr" && l.closer_id)) {
      modal(
        l.company,
        rows([
          ["Contato", l.contact],
          ["E-mail", l.email],
          ["Telefone", l.phone],
          ["Produto", pname(l.product)],
          ["Etapa", l.stage],
          ["Valor", money(l.amount)],
          ["Responsável", l.owner],
          ["Origem", l.source],
          ["Observações", l.notes],
        ]),
        "OPORTUNIDADE ENCAMINHADA",
      );
      return;
    }
    show(
      id ? "Detalhes da oportunidade" : "Novo lead",
      '<div class="pair">' +
        field("Empresa", "company", l.company, "text", true) +
        field("Contato", "contact", l.contact, "text", true) +
        '</div><div class="pair">' +
        field("E-mail", "email", l.email, "email") +
        field("Telefone", "phone", l.phone, "tel") +
        "</div>" +
        select("Produto", "product", opts, l.product || opts[0][0], true) +
        '<div class="pair">' +
        select(
          "Etapa",
          "stage",
          l.stage === "Ganha"
            ? ["Ganha"]
            : D.user.role === "sdr"
              ? [
                  ...new Set([
                    l.stage || "Entrada",
                    "Entrada",
                    "Qualificação",
                    "Perdida",
                  ]),
                ]
              : stages,
          ctx.stage || l.stage || "Entrada",
        ) +
        field(
          "Valor estimado (R$)",
          "amount",
          l.amount ?? 0,
          "number",
          false,
          'min="0" step="0.01"',
        ) +
        "</div>" +
        (D.user.role === "closer"
          ? notice("Encaminhada por: " + (l.owner || "Equipe comercial"))
          : select(
              "Responsável pela prospecção",
              "owner_id",
              [
                ...(D.user.role === "sdr" ? [] : [["", "Não atribuído"]]),
                ...D.reps
                  .filter((r) => r.role !== "closer")
                  .map((r) => [r.id, r.name]),
              ],
              l.owner_id || (D.user.role === "sdr" ? D.user.id : ""),
            )) +
        (D.user.role === "closer"
          ? ""
          : select(
              "Encaminhar ao Closer",
              "closer_id",
              [
                ["", "Sem encaminhamento"],
                ...D.reps
                  .filter((r) => r.role === "closer")
                  .map((r) => [r.id, r.name]),
              ],
              l.closer_id || "",
            )) +
        area("Histórico e próximos passos", "notes", l.notes) +
        '<div id="wonFields">' +
        (l.client
          ? notice(
              "Venda vinculada ao cliente " +
                (D.clients.find((x) => x.id === l.client)?.company ||
                  "#" + l.client) +
                ".",
            )
          : select(
              "Ao ganhar a venda",
              "client",
              [["", "Criar um novo cliente"], ...cs],
              "",
            ) +
            notice(
              "Ao salvar como ganha, o cadastro fica disponível na operação. A equipe poderá vincular os produtos contratados.",
            )) +
        "</div>" +
        (id ? '<p class="muted">Origem: ' + esc(l.source) + "</p>" : ""),
      "Salvar oportunidade",
      async (a) => {
        await api("leads" + (id ? "/" + id : ""), id ? "PUT" : "POST", a);
        await end(
          a.stage === "Ganha"
            ? "Venda vinculada à carteira operacional."
            : "Oportunidade salva.",
        );
      },
      "CRM DE VENDAS",
    );
    const st = d().querySelector("[name=stage]"),
      f = d().querySelector("#wonFields");
    const toggle = () => (f.hidden = st.value !== "Ganha");
    st.onchange = toggle;
    toggle();
    return;
  }
  if (kind === "event") {
    const sale = id
      ? e.scope === "vendas" || (!e.client && (e.lead || e.kind === "Call"))
      : ctx.call || ctx.salesArea || !can(D.user.role, "operacao");
    const start = e.start
      ? localTime(e.start)
      : (ctx.day || localTime(new Date()).slice(0, 10)) + "T09:00";
    show(
      id ? "Editar compromisso" : "Novo compromisso",
      field("Título", "title", e.title, "text", true) +
        field("Data e horário local", "start", start, "datetime-local", true) +
        '<div class="pair">' +
        select(
          "Tipo",
          "kind",
          D.user.role === "closer"
            ? ["Reunião"]
            : sale
              ? ["Call", "Reunião", "Retorno"]
              : ["Reunião", "Implantação", "Suporte", "Retorno"],
          e.kind || (ctx.call && D.user.role !== "closer" ? "Call" : "Reunião"),
        ) +
        select(
          "Resultado",
          "outcome",
          ["Agendada", "Realizada", "Perdida", "Cancelada"],
          e.outcome || "Agendada",
        ) +
        "</div>" +
        (sale && D.reps.length
          ? select(
              "Responsável comercial",
              "owner_id",
              ["sdr", "closer"].includes(D.user.role)
                ? D.reps.map((r) => [r.id, r.name])
                : [["", "Não atribuído"], ...D.reps.map((r) => [r.id, r.name])],
              e.owner_id || D.user.id,
            )
          : "") +
        (can(D.user.role, "operacao") && !sale
          ? select("Cliente", "client", [["", "Sem cliente"], ...cs], e.client)
          : "") +
        (sale
          ? select(
              "Lead",
              "lead",
              [
                ["", "Sem lead"],
                ...ls,
                ...(e.lead && !ls.some((x) => x[0] === e.lead)
                  ? [
                      [
                        e.lead,
                        D.leads.find((x) => x.id === e.lead)?.company ||
                          "#" + e.lead,
                      ],
                    ]
                  : []),
              ],
              e.lead,
              D.user.role === "closer",
            )
          : "") +
        (id ? btn("Excluir compromisso", "delevent:" + id, "x", "danger") : ""),
      "Salvar compromisso",
      async (a) => {
        await api("agenda" + (id ? "/" + id : ""), id ? "PUT" : "POST", {
          ...a,
          scope: sale ? "vendas" : "operacao",
          start: new Date(a.start).toISOString(),
          done: a.done === "1",
        });
        await end("Calendário atualizado.");
      },
      "AGENDA DA EQUIPE",
    );
    return;
  }
  if (kind === "delevent") {
    show(
      "Excluir compromisso",
      notice(e.title + " será removido do calendário."),
      "Excluir",
      async () => {
        await api("agenda/" + id, "DELETE", {});
        await end("Compromisso excluído.");
      },
    );
    return;
  }
  if (kind === "user") {
    show(
      id ? "Editar acesso" : "Adicionar pessoa",
      (id
        ? rows([
            ["Nome", u.name],
            ["E-mail", u.email],
          ])
        : field("Nome", "name", "", "text", true) +
          field("E-mail", "email", "", "email", true) +
          field(
            "Senha inicial",
            "password",
            "",
            "password",
            true,
            'minlength="10" placeholder="Pelo menos 10 caracteres"',
          )) +
        select(
          "Cargo de acesso",
          "role",
          [["", "Escolha um cargo"], ...Object.entries(roles)],
          id ? (Object.hasOwn(roles, u.role) ? u.role : "") : "sdr",
          true,
        ) +
        (id
          ? select(
              "Acesso",
              "active",
              [
                ["1", "Liberado"],
                ["0", "Bloqueado"],
              ],
              u.active,
            )
          : "") +
        notice(
          "O cargo define os módulos e os grupos disponíveis. Founder e CEO acessam todas as áreas e podem gerenciar acessos. Uma mudança encerra as sessões abertas da pessoa.",
        ),
      "Salvar acesso",
      async (a) => {
        await api("equipe" + (id ? "/" + id : ""), id ? "PUT" : "POST", {
          ...a,
          active: a.active === "1",
        });
        await end("Acesso salvo.");
      },
      "ADMINISTRAÇÃO",
    );
    return;
  }
}
