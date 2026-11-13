// Um cargo controla tanto os links exibidos quanto as permissões verificadas no servidor.
export const roles = {
  founder: "Founder",
  ceo: "CEO",
  coordenador_ti: "Coordenador de TI",
  tech_lead: "Tech Lead",
  dev_senior: "Desenvolvedor Sênior",
  dev_pleno: "Desenvolvedor Pleno",
  dev_junior: "Desenvolvedor Júnior",
  gerente_vendas: "Gerente de Vendas",
  closer: "Closer",
  sdr: "SDR",
  gerente_administrativo: "Gerente Administrativo",
  auxiliar_administrativo: "Auxiliar Administrativo",
  gerente_marketing: "Gerente de Marketing",
  marketing: "Marketing",
  gestor_trafego: "Gestor de Tráfego",
};
export const legacyRoles = {
  operacao: "Operação (legado)",
  administrativo: "Administrativo / RH (legado)",
  pendente: "Aguardando definição de cargo",
};
const tech = [
    "coordenador_ti",
    "tech_lead",
    "dev_senior",
    "dev_pleno",
    "dev_junior",
  ],
  adm = ["gerente_administrativo", "auxiliar_administrativo"];
const all = [
  "interno",
  "operacao",
  "marketing",
  "trafego",
  "tecnologia",
  "garagem",
  "financeiro",
  "pessoas",
  "vendas",
  "executivo",
  "acessos",
];
const groups = {
  founder: all,
  ceo: all,
  ...Object.fromEntries(
    adm.map((r) => [
      r,
      all.filter((x) => !["vendas", "executivo", "acessos"].includes(x)),
    ]),
  ),
  ...Object.fromEntries(tech.map((r) => [r, ["interno", "tecnologia"]])),
  gerente_marketing: ["interno", "marketing", "trafego"],
  marketing: ["interno", "marketing"],
  gestor_trafego: ["interno", "marketing", "trafego"],
  gerente_vendas: ["vendas"],
  closer: ["vendas"],
  sdr: ["vendas"],
  operacao: ["interno", "operacao"],
  administrativo: ["interno", "financeiro", "pessoas"],
  pendente: [],
};
export const can = (r, cap) =>
  Object.hasOwn(groups, r) && groups[r].includes(cap);
export const withCap = (cap) => Object.keys(groups).filter((r) => can(r, cap));
export const knownRoles = Object.keys(groups);
export const roleName = (r) => roles[r] || legacyRoles[r] || "Sem cargo";
export const moduleCap = {
  "mkt-tarefas": "marketing",
  editorial: "marketing",
  campanhas: "trafego",
  "trafego-tarefas": "trafego",
  "dev-tarefas": "tecnologia",
  "dev-suporte": "tecnologia",
  "ativos-ti": "tecnologia",
  veiculos: "garagem",
  rastreio: "garagem",
  manutencoes: "garagem",
  administrativo: "interno",
  folha: "financeiro",
  contas: "financeiro",
  "relatorio-fin": "financeiro",
  funcionarios: "pessoas",
  painel: "operacao",
  clientes: "operacao",
  sistemas: "operacao",
  demandas: "operacao",
  chat: "operacao",
  equipe: "acessos",
};
export const chatGroups = (r) => [
  "geral",
  ...(can(r, "operacao") ? ["operacional"] : []),
  ...(can(r, "financeiro") ? ["administrativo"] : []),
  ...(can(r, "tecnologia") ? ["desenvolvimento"] : []),
  ...(can(r, "marketing") ? ["marketing"] : []),
  ...(can(r, "trafego") ? ["trafego"] : []),
  ...(can(r, "vendas") ? ["vendas"] : []),
  ...(can(r, "executivo") ? ["executivo"] : []),
];
// Lotação do funcionário na folha é independente do cargo de acesso.
export const departments = [
  "Administrativo e Operacional",
  "Desenvolvimento e TI",
  "Marketing",
  "Tráfego",
  "Garagem",
  "Financeiro",
  "Vendas",
  "Executivo",
  "Operacional",
  "Administrativo",
];
