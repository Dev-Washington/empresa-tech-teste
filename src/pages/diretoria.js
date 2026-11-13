import { reportAreas } from "../data/gestao.js";
import { api, esc, icon, money, modal, toast, empty } from "../utils/ui.js";
let days = 30,
  month = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" })
    .format(new Date())
    .slice(0, 7);
const value = (r) =>
  r.unit === "centavos"
    ? money(r.value / 100)
    : r.unit === "real"
      ? money(r.value)
      : new Intl.NumberFormat("pt-BR").format(r.value);
const filters = () => "?dias=" + days + "&competencia=" + month;
const br = (s) => s.split("-").reverse().join("/");
const card = (r, i) =>
  '<button type="button" class="exec-card" data-ind="' +
  esc(r.key) +
  '"><span class="exec-caption">' +
  icon(i, 16) +
  esc(r.scope) +
  "</span><strong>" +
  esc(value(r)) +
  "</strong><span>" +
  esc(r.title) +
  "</span><small>Ver registros " +
  icon("right", 13) +
  "</small></button>";
async function detail(key, page = 1) {
  const data = await api("diretoria/" + key + filters() + "&pagina=" + page),
    pages = Math.max(1, Math.ceil(data.n / data.pageSize));
  const tbl = data.rows.length
    ? '<div class="tablewrap"><table><thead><tr>' +
      data.columns.map((k) => "<th>" + esc(k) + "</th>").join("") +
      "</tr></thead><tbody>" +
      data.rows
        .map(
          (row) =>
            "<tr>" +
            row.map((v) => "<td>" + esc(v) + "</td>").join("") +
            "</tr>",
        )
        .join("") +
      "</tbody></table></div>"
    : empty("search", "Nenhum registro para este recorte");
  modal(
    data.title,
    '<div class="exec-detail"><div class="exec-number">' +
      esc(value(data)) +
      "</div><p>" +
      esc(data.basis) +
      "</p><small>" +
      esc(data.scope) +
      (data.scope === "Competência"
        ? " · " + esc(month)
        : data.scope === "Período"
          ? " · Últimos " + days + " dias"
          : "") +
      "</small></div>" +
      tbl +
      '<div class="reporttools"><span>' +
      data.n +
      " registro(s) · Página " +
      page +
      " de " +
      pages +
      "</span>" +
      (page > 1
        ? '<button class="btn outline" data-pg="' +
          (page - 1) +
          '">Anterior</button>'
        : "") +
      (page < pages
        ? '<button class="btn outline" data-pg="' +
          (page + 1) +
          '">Próxima</button>'
        : "") +
      "</div>",
    "DIRETORIA / DETALHAMENTO",
  );
  document
    .querySelectorAll("#dialog [data-pg]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          detail(key, +b.dataset.pg).catch((e) => toast(e.message))),
    );
}
export async function execPage(v, D, host, actions) {
  const x = await api("diretoria" + filters());
  if (!host.isConnected) return;
  const area = v.startsWith("exec-") ? v.slice(5) : "",
    group = reportAreas.find((a) => a[0] === area);
  const metrics = x.indicators,
    byKey = (k) => metrics.find((r) => r.key === k);
  const header =
    '<div class="pagehead"><div><div class="eyebrow">DIRETORIA / ' +
    (area ? "DETALHAMENTO" : "VISÃO GERAL") +
    "</div><h1>" +
    esc(group?.[1] || "Painel executivo") +
    "</h1><p>" +
    (area
      ? "Clique em um indicador para consultar a composição e o critério de cálculo."
      : "Acompanhe os resultados das áreas e identifique o que precisa de atenção hoje.") +
    "</p></div></div>";
  const options = [7, 30, 90]
    .map(
      (n) =>
        '<option value="' +
        n +
        '" ' +
        (n === days ? "selected" : "") +
        ">Últimos " +
        n +
        " dias</option>",
    )
    .join("");
  const controls =
    '<div class="reporttools"><label>Período <select data-range>' +
    options +
    '</select></label><label>Competência financeira <input type="month" value="' +
    esc(month) +
    '" data-month></label><small>' +
    br(x.from) +
    " a " +
    br(x.until) +
    " · Brasília</small></div>";
  let body;
  if (!area) {
    const alerts = [
      "clientes-atrasados",
      "contrato-atrasado",
      "vencidas",
      "perdidas",
      "canceladas",
    ].map(byKey);
    body =
      '<section class="exec-alerts"><div class="eyebrow">ACOMPANHAMENTO</div><h2>Pontos de atenção</h2><div class="exec-cards">' +
      alerts.map((r) => card(r, "activity")).join("") +
      '</div></section><div class="sectionline"><h2>Visão por área</h2></div><div class="exec-overview">' +
      reportAreas
        .map(([k, label, i]) => {
          const rs = metrics.filter((r) => r.area === k);
          return (
            '<section class="office-group"><a class="exec-section-link" href="#exec-' +
            k +
            '"><span>' +
            icon(i, 20) +
            " " +
            esc(label) +
            "</span>" +
            icon("right", 16) +
            "</a>" +
            rs
              .slice(0, 3)
              .map(
                (r) =>
                  '<button data-ind="' +
                  r.key +
                  '" class="exec-line"><span>' +
                  esc(r.title) +
                  "</span><b>" +
                  esc(value(r)) +
                  "</b></button>",
              )
              .join("") +
            '<a class="textlink" href="#exec-' +
            k +
            '">Ver ' +
            rs.length +
            " indicadores " +
            icon("arrow", 14) +
            "</a></section>"
          );
        })
        .join("") +
      "</div>";
  } else
    body =
      '<a class="textlink" href="#executivo">' +
      icon("left", 14) +
      ' Voltar à visão geral</a><div class="exec-cards exec-sector">' +
      metrics
        .filter((r) => r.area === area)
        .map((r) => card(r, group?.[2] || "chart"))
        .join("") +
      "</div>";
  host.innerHTML = header + controls + body;
  host.onclick = (e) => {
    const b = e.target.closest("[data-ind]");
    if (b) detail(b.dataset.ind).catch((e) => toast(e.message));
  };
  host.onchange = (e) => {
    if (e.target.matches("[data-range]")) days = +e.target.value;
    else if (e.target.matches("[data-month]") && e.target.value)
      month = e.target.value;
    else return;
    execPage(v, D, host, actions).catch((e) => toast(e.message));
  };
}
