import { icon, esc } from "../utils/ui.js";
export const zoneNames = {
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
export function areaChooser(firstName, portals, areaHref, showExit = true) {
  return `
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
              `<a class="area-card area-${k}" href="${esc(areaHref(k))}" aria-label="Abrir portal ${zoneNames[k]}">
            <span class="area-symbol">${icon(zoneIcons[k], 27)}</span>
            <h2>${zoneNames[k]}</h2><p>${zoneDescriptions[k]}</p>
            <span class="area-open">Abrir ${icon("arrow", 16)}</span>
          </a>`,
          )
          .join("")}
        </nav>
        ${showExit ? `<button class="area-logout" type="button" data-act="logout">${icon("logout", 16)} Sair da demonstração</button>` : ""}
      </div>
    </main>`;
}
