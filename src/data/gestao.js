// Estrutura de navegação e campos compartilhados pela interface e pela validação da API.
export const adminMenu = [
  ["INÍCIO", [["administrativo", "Acesso rápido", "grid"]]],
  [
    "MARKETING",
    [
      ["mkt-tarefas", "Tarefas", "check"],
      ["editorial", "Agenda editorial", "calendar"],
    ],
  ],
  [
    "TRÁFEGO",
    [
      ["campanhas", "Campanhas", "chart"],
      ["trafego-tarefas", "Tarefas", "check"],
    ],
  ],
  [
    "DESENVOLVEDORES",
    [
      ["dev-tarefas", "Tarefas", "layers"],
      ["dev-suporte", "Suporte", "head"],
      ["ativos-ti", "Gestão de TI", "scan"],
    ],
  ],
  [
    "CLIENTES E OPERAÇÃO",
    [
      ["painel", "Painel operacional", "grid"],
      ["clientes", "Clientes", "users"],
      ["sistemas", "Produtos e contratos", "layers"],
      ["demandas", "Demandas e chamados", "head"],
      ["agenda", "Calendário", "calendar"],
      ["chat", "Chat com clientes", "chat"],
    ],
  ],
  [
    "GARAGEM",
    [
      ["veiculos", "Veículos", "truck"],
      ["rastreio", "Rastreio", "pin"],
      ["manutencoes", "Manutenções", "calendar"],
    ],
  ],
  [
    "FINANCEIRO",
    [
      ["folha", "Folha de pagamento", "file"],
      ["contas", "Contas a pagar", "brief"],
      ["relatorio-fin", "Relatório financeiro", "chart"],
    ],
  ],
  [
    "ADMINISTRATIVO",
    [
      ["funcionarios", "Funcionários", "users"],
      ["equipe", "Acessos da equipe", "shield"],
    ],
  ],
];
export const reportAreas = [
  ["vendas", "Vendas e reuniões", "funnel"],
  ["carteira", "Clientes e produtos", "layers"],
  ["operacao", "Operação e suporte", "head"],
  ["marketing", "Marketing e tráfego", "chart"],
  ["tecnologia", "Desenvolvimento e TI", "scan"],
  ["garagem", "Garagem e rastreio", "truck"],
  ["financeiro", "Financeiro e folha", "brief"],
  ["pessoas", "Pessoas e acessos", "users"],
  ["comunicacao", "Comunicação", "chat"],
];
export const execMenu = [
  ["EXECUTIVO", [["executivo", "Painel executivo", "grid"]]],
  [
    "DETALHAMENTO POR ÁREA",
    reportAreas.map(([k, n, i]) => ["exec-" + k, n, i]),
  ],
];
const fld = (key, label, type = "text", required = false, options) => ({
  key,
  label,
  type,
  required,
  options,
});
const sel = (k, l, opts) => fld(k, l, "select", true, opts),
  title = fld("title", "Título", "text", true),
  owner = fld("owner", "Responsável"),
  notes = fld("notes", "Observações", "memo"),
  due = fld("due", "Prazo", "datetime", true),
  state = sel("status", "Situação", [
    "Aberto",
    "Em andamento",
    "Aguardando cliente",
    "Concluído",
  ]),
  priority = sel("priority", "Prioridade", [
    "Normal",
    "Baixa",
    "Alta",
    "Urgente",
  ]),
  vf = fld("vehicle", "Veículo", "vehicle", true);
const queue = (label, area, kind) => ({
  title: label,
  area,
  kind,
  entity: kind === "Chamado" ? "chamado" : "tarefa",
  fields: [
    title,
    owner,
    priority,
    due,
    state,
    ...(kind === "Chamado" ? [fld("client", "Cliente", "client", true)] : []),
    ...(area === "Tráfego"
      ? [fld("campaign", "Campanha vinculada", "campaign")]
      : []),
    notes,
  ],
  cols: ["title", "owner", "due", "status"],
  desc:
    kind === "Chamado"
      ? "Acompanhe os chamados dos clientes por responsável e prazo."
      : "Organize responsáveis, prioridades, prazos e andamento das entregas.",
});
export const modules = {
  "mkt-tarefas": queue("Tarefas de marketing", "Marketing", "Demanda interna"),
  "trafego-tarefas": queue("Tarefas de tráfego", "Tráfego", "Demanda interna"),
  "dev-tarefas": queue("Tarefas de desenvolvimento", "TI", "Demanda interna"),
  "dev-suporte": queue("Suporte ao cliente", "Atendimento", "Chamado"),
  editorial: {
    title: "Agenda editorial",
    entity: "conteúdo",
    table: "adm_editorial",
    desc: "Planeje peças por canal, data de publicação e responsável.",
    fields: [
      title,
      sel("channel", "Canal", [
        "Instagram",
        "LinkedIn",
        "Site",
        "E-mail",
        "Outro",
      ]),
      owner,
      fld("due", "Publicação prevista", "date", true),
      sel("status", "Situação", [
        "Pauta",
        "Em produção",
        "Em revisão",
        "Agendado",
        "Publicado",
      ]),
      notes,
    ],
    cols: ["title", "channel", "due", "status"],
  },
  campanhas: {
    title: "Campanhas de tráfego",
    entity: "campanha",
    table: "adm_campaigns",
    desc: "Controle canais, orçamento, investimento realizado e leads informados pela equipe.",
    fields: [
      title,
      sel("channel", "Canal", [
        "Google Ads",
        "Meta Ads",
        "LinkedIn Ads",
        "Outro",
      ]),
      fld("goal", "Objetivo"),
      owner,
      fld("start", "Início", "date", true),
      fld("end", "Término", "date"),
      sel("status", "Situação", ["Planejada", "Ativa", "Pausada", "Encerrada"]),
      fld("budget", "Orçamento (R$)", "money"),
      fld("spent", "Investimento realizado (R$)", "money"),
      fld("leads", "Leads informados", "int"),
      notes,
    ],
    cols: ["title", "channel", "status", "budget", "spent", "leads"],
  },
  "ativos-ti": {
    title: "Gestão de TI",
    entity: "ativo",
    table: "adm_assets",
    desc: "Mantenha o inventário de equipamentos, licenças e serviços e acompanhe as revisões.",
    fields: [
      fld("tag", "Patrimônio / identificador", "code", true),
      fld("title", "Nome do ativo", "text", true),
      sel("category", "Categoria", [
        "Equipamento",
        "Software",
        "Licença",
        "Infraestrutura",
      ]),
      owner,
      sel("status", "Situação", [
        "Em uso",
        "Disponível",
        "Em manutenção",
        "Baixado",
      ]),
      fld("due", "Próxima revisão", "date"),
      notes,
    ],
    cols: ["tag", "title", "category", "owner", "status", "due"],
  },
  veiculos: {
    title: "Veículos",
    entity: "veículo",
    table: "adm_vehicles",
    desc: "Cadastro da frota, condutor, quilometragem e disponibilidade.",
    fields: [
      fld("plate", "Placa", "plate", true),
      fld("title", "Modelo / identificação", "text", true),
      fld("driver", "Condutor responsável"),
      fld("km", "Quilometragem atual", "int"),
      sel("status", "Situação", [
        "Disponível",
        "Em uso",
        "Em manutenção",
        "Inativo",
      ]),
      notes,
    ],
    cols: ["plate", "title", "driver", "km", "status"],
  },
  rastreio: {
    title: "Rastreio de veículos",
    entity: "posição",
    table: "adm_positions",
    appendOnly: true,
    desc: "Veja a última posição conhecida de cada veículo e consulte os pontos registrados por dia.",
    fields: [
      vf,
      fld("at", "Data e horário da posição", "datetime", true),
      fld("place", "Local / referência", "text", true),
      fld("lat", "Latitude", "lat"),
      fld("lng", "Longitude", "lng"),
      notes,
    ],
    cols: ["vehicle", "at", "place", "lat", "lng"],
  },
  manutencoes: {
    title: "Manutenções da frota",
    entity: "manutenção",
    table: "adm_maintenance",
    desc: "Programe serviços por veículo e registre o custo de manutenção.",
    fields: [
      vf,
      fld("title", "Serviço", "text", true),
      fld("due", "Data prevista", "date", true),
      fld("vendor", "Oficina / fornecedor"),
      sel("status", "Situação", [
        "Agendada",
        "Em andamento",
        "Concluída",
        "Cancelada",
      ]),
      fld("cost", "Custo informado (R$)", "money"),
      notes,
    ],
    cols: ["vehicle", "title", "due", "status", "cost"],
  },
};
export const queueWhere = {
  "mkt-tarefas": "kind='Demanda interna' AND area='Marketing'",
  "trafego-tarefas": "kind='Demanda interna' AND area='Tráfego'",
  "dev-tarefas": "kind='Demanda interna' AND area IN ('TI','Produtos')",
  "dev-suporte": "kind='Chamado'",
};
