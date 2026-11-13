import * as L from "/empresa-tech-teste/vendor/leaflet/leaflet-src.esm.js";
import { api, esc, icon, dateTime, toast } from "../../utils/ui.js";

const located = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
const coords = (p) => [p.lat, p.lng];
const dayBR = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
const timeBR = (at) =>
  new Date(at).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function tracking(root, snapshot, addPosition, onLoad) {
  let fleet = snapshot.fleet,
    selected = 0,
    filter = "all",
    query = "",
    showTrack = false,
    date = dayBR(),
    points = [],
    trackState = "",
    req = 0,
    busy = false,
    dead = false;
  root.innerHTML =
    '<div class="fleet-bar"><div><span class="eyebrow">POSIÇÕES DA FROTA</span><small data-stamp></small></div><button type="button" class="btn outline" data-refresh>Atualizar</button></div>' +
    '<div class="fleet-layout"><section class="fleet-surface"><div class="fleet-map-wrap"><div class="fleet-map" role="region" aria-label="Mapa interativo da frota" tabindex="0"></div><button type="button" class="fleet-fit" data-fit>' +
    icon("scan", 15) +
    ' Enquadrar frota</button><span role="status" class="fleet-tile-warning" hidden></span></div><div class="fleet-detail" data-detail></div></section>' +
    '<aside class="fleet-side"><div class="fleet-side-top"><div class="eyebrow">GARAGEM</div><h2>Veículos</h2><label class="search">' +
    icon("search", 16) +
    '<input type="search" aria-label="Buscar placa, modelo ou condutor" placeholder="Placa, modelo ou condutor"></label><div class="fleet-filters" data-filters></div></div><div class="fleet-cars" data-cars></div><p class="fleet-note">Posições registradas pela equipe. O horário indica quando o veículo esteve no local.</p></aside></div>';
  const $ = (q) => root.querySelector(q),
    box = $(".fleet-map"),
    notice = $(".fleet-tile-warning");
  const map = L.map(box, {
    zoomControl: false,
    maxZoom: 19,
    minZoom: 2,
    scrollWheelZoom: false,
    worldCopyJump: true,
  });
  map.attributionControl.setPrefix(false);
  L.control
    .zoom({
      position: "topleft",
      zoomInTitle: "Aproximar",
      zoomOutTitle: "Afastar",
    })
    .addTo(map);
  const base = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    referrerPolicy: "origin",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  });
  base.on("tileerror", () => {
    notice.textContent =
      "Não foi possível carregar parte do mapa de ruas. Os pontos cadastrados continuam disponíveis.";
    notice.hidden = false;
  });
  base.on("load", () => {
    if (!box.querySelector(".leaflet-tile:not(.leaflet-tile-loaded)"))
      notice.hidden = true;
  });
  const markers = L.layerGroup().addTo(map),
    route = L.layerGroup().addTo(map);
  const current = () => fleet.find((v) => v.id === selected);
  const visible = () =>
    fleet.filter(
      (v) =>
        (filter === "all" || located(v) === (filter === "mapped")) &&
        norm([v.plate, v.title, v.driver].join(" ")).includes(norm(query)),
    );
  function frame(pts, zoom = 15) {
    if (!pts.length) map.setView([-14.24, -52.3], 3);
    else if (pts.every((p) => p.lat === pts[0].lat && p.lng === pts[0].lng))
      map.setView(coords(pts[0]), zoom);
    else
      map.fitBounds(L.latLngBounds(pts.map(coords)), {
        padding: [46, 46],
        maxZoom: 16,
        animate: false,
      });
  }
  function stamp(at) {
    $("[data-stamp]").textContent =
      "Consulta às " +
      timeBR(at) +
      " · atualização a cada minuto enquanto a tela estiver aberta";
  }
  function filters() {
    const n = fleet.filter(located).length;
    $("[data-filters]").innerHTML = [
      ["all", "Todos", fleet.length],
      ["mapped", "No mapa", n],
      ["missing", "Sem coordenadas", fleet.length - n],
    ]
      .map(
        ([k, t, n]) =>
          '<button type="button" aria-pressed="' +
          (k === filter) +
          '" data-filter="' +
          k +
          '">' +
          t +
          " <b>" +
          n +
          "</b></button>",
      )
      .join("");
  }
  function list() {
    filters();
    const vs = visible();
    $("[data-cars]").innerHTML = vs.length
      ? vs
          .map(
            (v) =>
              '<button type="button" class="fleet-car" aria-pressed="' +
              (selected === v.id) +
              '" data-car="' +
              v.id +
              '"><span class="fleet-icon ' +
              (located(v) ? "" : "missing") +
              '">' +
              icon("truck", 18) +
              "</span><span><strong>" +
              esc(v.plate) +
              "</strong><small>" +
              esc(v.title) +
              "</small><small>" +
              esc(located(v) ? v.place : "Sem coordenadas registradas") +
              "</small></span>" +
              icon("right", 14) +
              "</button>",
          )
          .join("")
      : '<p class="fleet-blank">' +
        (fleet.length
          ? "Nenhum veículo neste filtro."
          : "Nenhum veículo cadastrado.") +
        "</p>";
  }
  function drawMarkers() {
    markers.clearLayers();
    for (const v of visible().filter(located)) {
      const pin = L.divIcon({
        className: "fleet-pin",
        html:
          '<span class="' +
          (selected === v.id ? "active" : "") +
          '">' +
          icon("truck", 16) +
          esc(v.plate) +
          "</span>",
        iconSize: [91, 29],
        iconAnchor: [45, 29],
      });
      const m = L.marker(coords(v), {
        icon: pin,
        alt: "Selecionar " + v.plate,
        title: v.plate + " · " + v.place,
        zIndexOffset: selected === v.id ? 300 : 0,
        keyboard: true,
      });
      m.on("click", () => choose(v.id));
      m.addTo(markers);
    }
  }
  function trace(fit = false) {
    route.clearLayers();
    if (!showTrack) return;
    const gps = points.filter(located);
    if (gps.length > 1)
      L.polyline(gps.map(coords), {
        color: "#663dc4",
        weight: 4,
        opacity: 0.9,
        dashArray: "7 5",
      }).addTo(route);
    gps.forEach((p, i) => {
      L.circleMarker(coords(p), {
        radius: i === 0 || i === gps.length - 1 ? 7 : 4,
        color: "#fff",
        fillColor:
          i === 0 ? "#277559" : i === gps.length - 1 ? "#b53c49" : "#6741c4",
        fillOpacity: 1,
        weight: 2,
      })
        .bindPopup("<b>" + esc(timeBR(p.at)) + "</b><br>" + esc(p.place))
        .addTo(route);
    });
    if (fit && gps.length) frame(gps, 16);
  }
  function details() {
    const el = $("[data-detail]"),
      v = current();
    if (!v) {
      el.innerHTML =
        "<strong>" +
        icon("pin", 17) +
        " Visão da frota</strong><p>Selecione uma placa na lista ou um marcador para consultar o local, o horário e o trajeto do dia.</p>";
      return;
    }
    let h =
      '<div class="fleet-summary"><div><div class="eyebrow">VEÍCULO SELECIONADO</div><h2>' +
      esc(v.plate) +
      " <small>" +
      esc(v.title) +
      "</small></h2><p>" +
      esc(v.driver || "Sem condutor informado") +
      " · " +
      esc(v.status) +
      '</p></div><button type="button" class="btn outline" data-clear>Ver frota</button></div>';
    h +=
      '<div class="fleet-pos">' +
      icon("pin", 18) +
      "<div><b>" +
      esc(located(v) ? v.place : v.latestPlace || "Sem posição registrada") +
      "</b><small>" +
      esc(
        located(v)
          ? "Última coordenada conhecida · " + dateTime(v.at)
          : v.latestAt
            ? "Registro sem coordenadas · " + dateTime(v.latestAt)
            : "Cadastre uma posição com latitude e longitude para colocar este veículo no mapa.",
      ) +
      "</small></div></div>";
    if (located(v) && v.latestAt > v.at)
      h +=
        '<p class="fleet-note">Registro posterior sem coordenadas: ' +
        esc(v.latestPlace) +
        " · " +
        esc(dateTime(v.latestAt)) +
        ".</p>";
    h +=
      '<div class="fleet-actions"><button type="button" class="btn outline" data-route aria-expanded="' +
      showTrack +
      '">' +
      (showTrack ? "Ocultar trajeto" : "Ver trajeto") +
      '</button><button type="button" class="btn plain" data-record>Registrar posição</button></div>';
    if (showTrack) {
      h +=
        '<div class="fleet-trip"><label>Dia do trajeto <input aria-label="Dia do trajeto" type="date" data-date max="' +
        dayBR() +
        '" value="' +
        esc(date) +
        '"></label><p role="status">' +
        esc(trackState) +
        "</p>";
      if (points.length)
        h +=
          "<ol>" +
          points
            .map(
              (p) =>
                "<li><time>" +
                esc(timeBR(p.at)) +
                "</time> " +
                esc(p.place) +
                (located(p)
                  ? ' <button type="button" class="textlink" data-point="' +
                    p.id +
                    '">Localizar</button>'
                  : " <small>Sem coordenadas</small>") +
                "</li>",
            )
            .join("") +
          "</ol>";
      h += "</div>";
    }
    el.innerHTML = h;
  }
  async function loadTrack(fit) {
    const seq = ++req,
      id = selected;
    if (!showTrack || !id) return;
    points = [];
    trackState = "Consultando posições…";
    trace();
    details();
    try {
      const res = await api(
        "gestao/mapa/" + id + "?dia=" + encodeURIComponent(date),
      );
      if (dead || seq !== req || !showTrack || id !== selected) return;
      points = res.points;
      const n = points.filter(located).length;
      trackState =
        n > 1
          ? n + " pontos no mapa, unidos por ordem de registro."
          : n === 1
            ? "Um ponto no mapa. São necessários dois para desenhar um trajeto."
            : points.length
              ? "Os registros deste dia não têm coordenadas."
              : "Nenhuma posição registrada neste dia.";
      trace(fit);
      details();
    } catch (e) {
      if (!dead && seq === req) {
        trackState = e.message;
        details();
      }
    }
  }
  function choose(id) {
    req++;
    selected = id;
    showTrack = false;
    points = [];
    trace();
    drawMarkers();
    list();
    details();
    const v = current();
    if (located(v)) frame([v], 16);
    else frame(visible().filter(located));
  }
  function filtering() {
    if (!visible().some((v) => v.id === selected)) {
      req++;
      selected = 0;
      showTrack = false;
      points = [];
    }
    list();
    drawMarkers();
    details();
    trace();
    frame(visible().filter(located));
  }
  async function refresh(user) {
    if (busy || dead) return;
    busy = true;
    $("[data-refresh]").disabled = true;
    try {
      const data = await api("gestao/mapa");
      if (dead) return;
      fleet = data.fleet;
      onLoad(fleet);
      if (selected && !current()) choose(0);
      list();
      drawMarkers();
      details();
      stamp(data.updated);
      if (showTrack) await loadTrack(false);
      if (user) toast("Posições atualizadas.");
    } catch (e) {
      if (!dead) toast(e.message);
    } finally {
      busy = false;
      if (!dead) $("[data-refresh]").disabled = false;
    }
  }
  root.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b || !root.contains(b)) return;
    const d = b.dataset;
    if ("filter" in d) {
      filter = d.filter;
      filtering();
    } else if ("car" in d) choose(+d.car);
    else if ("fit" in d || "clear" in d) {
      choose(0);
      frame(visible().filter(located));
    } else if ("record" in d) addPosition(selected);
    else if ("refresh" in d) refresh(true);
    else if ("route" in d) {
      showTrack = !showTrack;
      if (showTrack) loadTrack(true);
      else {
        req++;
        points = [];
        trace();
        details();
        if (located(current())) frame([current()], 16);
      }
    } else if ("point" in d) {
      const p = points.find((p) => p.id === +d.point);
      if (located(p)) {
        frame([p], 17);
        L.popup()
          .setLatLng(coords(p))
          .setContent(esc(timeBR(p.at)) + " · " + esc(p.place))
          .openOn(map);
      }
    }
  };
  root.querySelector("input[type=search]").oninput = (e) => {
    query = e.target.value;
    filtering();
  };
  root.onchange = (e) => {
    if (
      e.target.matches("[data-date]") &&
      e.target.value &&
      e.target.validity.valid
    ) {
      date = e.target.value;
      loadTrack(true);
    }
  };
  list();
  drawMarkers();
  details();
  frame(fleet.filter(located));
  base.addTo(map);
  stamp(snapshot.updated);
  const resize = new ResizeObserver(() => {
    if (!dead) map.invalidateSize({ pan: false });
  });
  resize.observe(box);
  const tick = setInterval(() => {
    if (!document.hidden && root.isConnected) refresh(false);
  }, 60000);
  const observer = new MutationObserver(() => {
    if (!root.isConnected) {
      dead = true;
      req++;
      clearInterval(tick);
      resize.disconnect();
      observer.disconnect();
      map.remove();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
