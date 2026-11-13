const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 4a4 4 0 0 1 0 7 M20 21v-2a4 4 0 0 0-3-3.8",
  box: "M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10 M7.5 4.5l9 5",
  calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2",
  chat: "M21 11a8 8 0 0 1-8 8H8l-5 3 1.4-6A8 8 0 1 1 21 11z",
  funnel: "M3 4h18l-7 9v6l-4 2v-8z",
  chart: "M3 20h18 M6 16v-4 M12 16V8 M18 16V4",
  globe:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M2 12h20 M12 2c-5 5-5 15 0 20 5-5 5-15 0-20",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  out: "M7 17L18 6 M7 6h11v11",
  down: "M6 9l6 6 6-6",
  right: "M9 5l7 7-7 7",
  left: "M15 5l-7 7 7 7",
  plus: "M12 5v14 M5 12h14",
  search: "M17 17l4 4 M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0",
  logout: "M10 4H4v16h6 M9 12h12 M16 7l5 5-5 5",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  pin: "M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0 M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0",
  pulse: "M2 13h5l3-8 4 14 3-7h5",
  bolt: "M13 2L4 14h7l-1 8 10-13h-8z",
  shield: "M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5z M8 12l3 3 5-6",
  link: "M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l2-2",
  check: "M4 12l5 5L20 6",
  x: "M5 5l14 14 M19 5L5 19",
  scan: "M3 9V4h5 M16 4h5v5 M21 15v5h-5 M8 20H3v-5 M6 12h12",
  truck:
    "M2 5h12v12H2z M14 9h4l4 5v3h-8 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  mail: "M3 5h18v14H3z M3 6l9 7 9-7",
  building: "M4 21V3h12v18 M16 10h4v11 M2 21h20 M8 7h4 M8 11h4 M8 15h4",
  edit: "M4 20l5-1 12-12-4-4L5 15z M14 6l4 4",
  info: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 11v6 M12 7v.5",
  download: "M12 3v12 M7 10l5 5 5-5 M4 15v5h16v-5",
  key: "M14 3a6 6 0 1 1-2.8 11.3L5 21H2v-4l6.3-6.3A6 6 0 0 1 14 3z M16 7h.1",
  activity: "M4 4v16h16 M7 15l4-5 3 2 5-7",
  send: "M22 2l-7 20-4-9L2 9z M11 13L22 2",
  layers: "M2 8l10-6 10 6-10 6z M2 12l10 6 10-6 M2 16l10 6 10-6",
  file: "M5 2h9l5 5v15H5z M14 2v6h5 M8 13h8 M8 17h6",
  power: "M12 2v10 M6 5a9 9 0 1 0 12 0",
  brief: "M3 7h18v13H3z M8 7V4h8v3 M3 12c5 3 13 3 18 0",
  lock: "M5 10h14v11H5z M8 10V7a4 4 0 1 1 8 0v3",
  head: "M3 14v-3a9 9 0 0 1 18 0v5 M3 12h4v7H3z M17 12h4v7h-4z M20 19c-1 2-4 3-7 3",
  copy: "M8 8h13v13H8z M16 8V3H3v13h5",
};
export function icon(k, size = 18) {
  return (
    '<svg class="icon" width="' +
    size +
    '" height="' +
    size +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
    (paths[k] || paths.grid) +
    '"/></svg>'
  );
}
