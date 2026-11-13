import { icon } from "../components/ui/icons.js";
export { icon };
export const $ = (q) => document.querySelector(q),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (x) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[x],
    );
export const brand = () =>
  '<a class="brand" href="/empresa-tech-teste/empresa"><img src="/empresa-tech-teste/marca.svg" alt=""><span>EMPRESA<span class="brand-sub">TECH TESTE</span></span></a>';
export {api} from "/empresa-tech-teste/demo-client.js";
export const btn = (label, act, ic = "", style = "primary", extra = "") =>
  '<button type="button" class="btn ' +
  style +
  '" data-act="' +
  esc(act) +
  '" ' +
  extra +
  ">" +
  (ic ? icon(ic, 16) : "") +
  esc(label) +
  "</button>";
export const field = (
  label,
  name,
  value = "",
  type = "text",
  req = false,
  extra = "",
) =>
  '<label class="field">' +
  esc(label) +
  (req ? " <i>*</i>" : "") +
  '<input name="' +
  name +
  '" type="' +
  type +
  '" value="' +
  esc(value) +
  '" ' +
  (req ? "required " : "") +
  extra +
  "></label>";
export const select = (label, name, items, value = "", req = false) =>
  '<label class="field">' +
  esc(label) +
  (req ? " <i>*</i>" : "") +
  '<select name="' +
  name +
  '" ' +
  (req ? "required" : "") +
  ">" +
  items
    .map((x) => {
      const [k, t] = Array.isArray(x) ? x : [x, x];
      return (
        '<option value="' +
        esc(k) +
        '" ' +
        (String(k) === String(value) ? "selected" : "") +
        ">" +
        esc(t) +
        "</option>"
      );
    })
    .join("") +
  "</select></label>";
export const area = (label, name, v = "") =>
  '<label class="field">' +
  esc(label) +
  '<textarea name="' +
  name +
  '" rows="3" maxlength="4000">' +
  esc(v) +
  "</textarea></label>";
export const statuses = {
  ativo: "Ativo",
  atrasado: "Em atraso",
  cancelado: "Em exportação",
  expirado: "Encerrado",
};
export const pill = (s, label) =>
  '<span class="pill ' +
  esc(s) +
  '"><i></i>' +
  esc(label || statuses[s] || s) +
  "</span>";
export const dt = (v, opts = { day: "2-digit", month: "short" }) =>
  new Intl.DateTimeFormat("pt-BR", opts).format(new Date(v));
export const dateTime = (v) =>
  dt(v, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export const hour = (v) => dt(v, { hour: "2-digit", minute: "2-digit" });
export const money = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export const initials = (v) =>
  (v || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .filter((_, i, a) => !i || i === a.length - 1)
    .join("")
    .toUpperCase();
export const empty = (ic, title, desc = "") =>
  '<div class="empty">' +
  icon(ic, 25) +
  "<strong>" +
  esc(title) +
  "</strong>" +
  (desc ? "<small>" + esc(desc) + "</small>" : "") +
  "</div>";
export const notice = (s, warn = false) =>
  '<div class="notice ' +
  (warn ? "warn" : "") +
  '">' +
  icon("info", 17) +
  "<span>" +
  esc(s) +
  "</span></div>";
let timer;
export function toast(s) {
  const n = $("#toast");
  n.textContent = s;
  n.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => n.classList.remove("show"), 3800);
}
export function modal(title, inner, tag = "EMPRESA TECH TESTE") {
  const n = $("#dialog");
  if (n.open) n.close();
  n.innerHTML =
    '<div class="modalhead"><div><div class="eyebrow">' +
    esc(tag) +
    "</div><h2>" +
    esc(title) +
    '</h2></div><button type="button" class="ibtn" aria-label="Fechar" data-close>' +
    icon("x") +
    '</button></div><div class="modalbody">' +
    inner +
    "</div>";
  n.showModal();
  n.querySelector("[data-close]").onclick = () => n.close();
}
export function form(fields, label = "Salvar", id = "editForm") {
  return (
    '<form id="' +
    id +
    '" class="form">' +
    fields +
    '<p class="formerr" role="alert"></p><div class="formactions"><button type="submit" class="btn primary">' +
    esc(label) +
    icon("arrow", 16) +
    "</button></div></form>"
  );
}
export function handle(id, fn) {
  const f = document.getElementById(id);
  if (!f) return;
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (f.dataset.busy) return;
    const b = f.querySelector("button[type=submit]"),
      err = f.querySelector(".formerr");
    f.dataset.busy = "1";
    if (b) b.disabled = true;
    if (err) err.textContent = "";
    try {
      await fn(Object.fromEntries(new FormData(f)), f);
    } catch (e) {
      if (err) err.textContent = e.message;
      else toast(e.message);
    } finally {
      delete f.dataset.busy;
      if (b) b.disabled = false;
    }
  };
}
export const bubble = (m) =>
  '<div class="bubble ' +
  (m.sender === "equipe" ? "staff" : "") +
  '"><b>' +
  esc(m.author) +
  "</b><p>" +
  esc(m.body) +
  "</p><small>" +
  esc(dateTime(m.created)) +
  "</small></div>";
export const signature = () =>
  '<span class="signature"><i></i> EMPRESA TECH TESTE</span>';
