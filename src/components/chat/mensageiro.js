import {
  api,
  esc,
  icon,
  initials,
  dateTime,
  empty,
  toast,
  modal,
  form,
  handle,
  notice,
} from "../../utils/ui.js";
// A abertura do painel não navega nem confirma leitura de nenhuma sala.
export function openTeamChat(D, task = null) {
  const previous = document.getElementById("team-drawer");
  if (previous?.open && !task) return;
  previous?.close();
  const drawer = document.createElement("dialog");
  drawer.id = "team-drawer";
  drawer.className = "team-drawer";
  drawer.setAttribute("aria-labelledby", "team-title");
  drawer.innerHTML =
    '<header class="drawer-head"><span class="drawer-brand">' +
    icon("chat", 21) +
    '</span><div><small>COMUNICAÇÃO DA EQUIPE</small><h2 id="team-title">Chat interno</h2></div><button type="button" class="ibtn drawer-close" aria-label="Fechar chat interno">' +
    icon("x", 19) +
    '</button></header><div class="drawer-body" data-area="interno"><p class="drawer-wait" role="status">Carregando conversas…</p></div>';
  document.body.append(drawer);
  const launcher = document.querySelector("[data-act=teamchat]");
  launcher?.setAttribute("aria-expanded", "true");
  const close = () => drawer.close();
  drawer.querySelector(".drawer-close").onclick = close;
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) {
      const b = drawer.getBoundingClientRect();
      if (
        e.clientX < b.left ||
        e.clientX > b.right ||
        e.clientY < b.top ||
        e.clientY > b.bottom
      )
        close();
    }
  });
  drawer.addEventListener(
    "close",
    () => {
      drawer.remove();
      if (!document.getElementById("team-drawer")?.open) {
        const button = document.querySelector("[data-act=teamchat]");
        button?.setAttribute("aria-expanded", "false");
        button?.focus({ preventScroll: true });
      }
    },
    { once: true },
  );
  drawer.showModal();
  const host = drawer.querySelector(".drawer-body");
  messenger(host, D, task).catch((err) => {
    if (host.isConnected) {
      host.innerHTML =
        notice(err.message, true) +
        '<button type="button" class="btn outline drawer-retry">Tentar novamente</button>';
      host.querySelector("button").onclick = () => {
        drawer.close();
        openTeamChat(D, task);
      };
    }
  });
}
async function messenger(root, D, task) {
  const guard = () => root.isConnected && root.closest("dialog")?.open;
  const roomsInfo = () => api("interno/salas");
  let info = await roomsInfo();
  if (!guard()) return;
  let room = task || null,
    screen = room ? "thread" : "inbox",
    query = "",
    items = [],
    reply = null,
    editing = null,
    older = false,
    read = 0,
    version = 0;
  const path = (s, r = room) =>
    "interno/" + s + "?sala=" + encodeURIComponent(r.id);
  const thumb = (s) => '<span class="avatar">' + esc(initials(s)) + "</span>";
  const cmd = (t, a, i) =>
    '<button type="button" title="' +
    esc(t) +
    '" aria-label="' +
    esc(t) +
    '" data-chat="' +
    a +
    '" class="ibtn">' +
    icon(i, 15) +
    "</button>";
  const folderNames = {
    geral: "Toda a equipe",
    operacional: "Equipe operacional",
    administrativo: "Equipe administrativa",
    vendas: "Equipe de vendas",
    executivo: "Equipe executiva",
  };
  const normal = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  function when(value) {
    if (!value) return "";
    const d = new Date(value),
      today = new Date();
    return d.toLocaleDateString("pt-BR") === today.toLocaleDateString("pt-BR")
      ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  function entry(r, directory = false) {
    const own = r.last?.author === D.user.id ? "Você: " : "";
    const preview = directory
      ? "Iniciar conversa"
      : r.last
        ? own + r.last.preview
        : folderNames[r.id] || "Conversa em grupo";
    return (
      '<button type="button" class="drawer-entry" data-room="' +
      esc(r.id) +
      '">' +
      (r.type === "direta"
        ? thumb(r.name)
        : '<span class="drawer-group-icon">' +
          icon(r.id === "geral" ? "globe" : "users", 19) +
          "</span>") +
      '<span class="drawer-entry-copy"><strong>' +
      esc(r.name) +
      "</strong><small>" +
      esc(preview) +
      '</small></span><span class="drawer-entry-meta">' +
      (!directory && r.last
        ? '<time datetime="' +
          esc(r.last.created) +
          '">' +
          esc(when(r.last.created)) +
          "</time>"
        : "") +
      (r.unread
        ? '<b aria-label="' + r.unread + ' não lidas">' + r.unread + "</b>"
        : "") +
      "</span></button>"
    );
  }
  function rows() {
    const list = root.querySelector(".drawer-list");
    if (!list) return;
    const f = normal(query),
      match = (r) => normal(r.name).includes(f);
    const dm = info.rooms.filter((r) => r.type === "direta" && match(r));
    const groups = info.rooms.filter((r) => r.type === "canal" && match(r));
    const recent = dm
      .filter((r) => r.last)
      .sort((a, b) => b.last.id - a.last.id);
    const block = (title, arr, none, dir = false) =>
      '<section class="drawer-section"><h3>' +
      esc(title) +
      "</h3>" +
      (arr.length
        ? arr.map((r) => entry(r, dir)).join("")
        : '<p class="drawer-empty">' + esc(none) + "</p>") +
      "</section>";
    const html =
      screen === "people"
        ? block(
            "Funcionários",
            dm.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
            f
              ? "Nenhum funcionário encontrado."
              : "Nenhum outro funcionário com acesso ativo.",
            true,
          )
        : block(
            "Conversas recentes",
            recent,
            f
              ? "Nenhuma conversa encontrada."
              : "Suas conversas com colegas aparecerão aqui.",
          ) + block("Grupos", groups, "Nenhum grupo encontrado.");
    if (list.innerHTML !== html) {
      const focused = list.contains(document.activeElement)
        ? document.activeElement.closest("[data-room]")?.dataset.room
        : null;
      list.innerHTML = html;
      if (focused)
        Array.from(list.querySelectorAll("[data-room]"))
          .find((el) => el.dataset.room === focused)
          ?.focus({ preventScroll: true });
    }
  }
  function inbox(mode = "inbox", focus = false) {
    version++;
    room = null;
    screen = mode;
    query = "";
    reply = editing = null;
    root.innerHTML =
      '<div class="drawer-tools">' +
      (mode === "inbox"
        ? '<button class="btn primary" type="button" data-chat="people">' +
          icon("plus", 16) +
          " Nova conversa</button>"
        : '<button type="button" class="drawer-back" data-chat="inbox">' +
          icon("left", 16) +
          " Voltar para conversas</button>") +
      '<label class="search">' +
      icon("search", 16) +
      '<input type="search" placeholder="' +
      (mode === "inbox" ? "Buscar conversa ou grupo" : "Buscar funcionário") +
      '" aria-label="' +
      (mode === "inbox" ? "Buscar conversa ou grupo" : "Buscar funcionário") +
      '"></label></div><div class="drawer-list"></div>';
    const input = root.querySelector("input");
    input.oninput = () => {
      query = input.value;
      rows();
    };
    rows();
    if (focus) input.focus({ preventScroll: true });
  }
  function marker() {
    const bar = root.querySelector("#replybar");
    if (bar)
      bar.innerHTML =
        reply || editing
          ? "<span>" +
            esc(
              editing
                ? "Editando sua mensagem"
                : "Respondendo a " +
                    reply.name +
                    ": " +
                    (reply.body || "Anexo").slice(0, 70),
            ) +
            "</span>" +
            cmd("Cancelar", "clear", "x")
          : "";
  }
  function draw(keep = false) {
    const box = root.querySelector("#teammsgs");
    if (!box) return;
    const dist = box.scrollHeight - box.scrollTop - box.clientHeight;
    box.innerHTML =
      (older
        ? '<button class="btn micro" data-chat="older">Ver anteriores</button>'
        : "") +
      (items.length
        ? items
            .map(
              (m) =>
                '<article class="teambubble ' +
                (m.author === D.user.id ? "mine" : "") +
                '"><div class="teammeta">' +
                thumb(m.name) +
                "<b>" +
                esc(m.name) +
                "</b><time>" +
                esc(dateTime(m.created)) +
                (m.edited ? " · editada" : "") +
                "</time></div>" +
                (m.preview
                  ? "<blockquote>" +
                    esc(m.preview.name) +
                    " · " +
                    esc(m.preview.body || "Anexo") +
                    "</blockquote>"
                  : "") +
                "<p>" +
                esc(m.deleted ? "Mensagem apagada" : m.body).replace(
                  /(@[\p{L}\p{N}_.-]+)/gu,
                  "<mark>$1</mark>",
                ) +
                "</p>" +
                m.files
                  .map(
                    (f) =>
                      '<a class="attach" href="/empresa-tech-teste/api/interno/arquivos/' +
                      f.id +
                      '" download>' +
                      icon("download", 14) +
                      " " +
                      esc(f.name) +
                      "</a>",
                  )
                  .join("") +
                (m.deleted
                  ? ""
                  : '<div class="msgtools">' +
                    cmd("Responder", "reply:" + m.id, "chat") +
                    (m.author === D.user.id
                      ? cmd("Editar", "edit:" + m.id, "edit") +
                        cmd("Apagar", "remove:" + m.id, "x")
                      : "") +
                    "</div>") +
                "</article>",
            )
            .join("")
        : empty(
            "chat",
            "Ainda não há mensagens",
            "Comece a conversa com a equipe.",
          ));
    if (!keep || dist < 60) box.scrollTop = box.scrollHeight;
  }
  async function sync(force = false) {
    const r = room,
      ver = version,
      ans = await api(path("mensagens", r));
    if (!guard() || ver !== version) return;
    const keep = items.filter((m) => m.id < (ans.rows[0]?.id || 0));
    const next = [...keep, ...ans.rows];
    if (force || JSON.stringify(next) !== JSON.stringify(items)) {
      items = next;
      older = keep.length ? older : ans.more;
      draw(!force);
    }
    if (items.length && items.at(-1).id > read) {
      read = items.at(-1).id;
      await api(path("lida", r), "POST", { id: read });
    }
  }
  function setup() {
    root.innerHTML =
      '<button type="button" class="drawer-back" data-chat="inbox">' +
      icon("left", 16) +
      ' Conversas e grupos</button><section class="teamthread drawer-thread"><div class="panelhead"><div><div class="eyebrow">' +
      (room.type === "direta"
        ? "MENSAGEM DIRETA"
        : room.type === "tarefa"
          ? "DISCUSSÃO DA DEMANDA"
          : "GRUPO") +
      "</div><h2>" +
      esc(room.name) +
      '</h2></div><span class="pill cancelado">' +
      icon("lock", 12) +
      ' Equipe</span></div><div class="teammsgs" id="teammsgs" role="log"></div><form id="teamform" class="composer"><div id="replybar"></div><label class="field"><span class="sr">Mensagem</span><textarea name="body" maxlength="4000" rows="2" placeholder="Escreva para a equipe…"></textarea></label><div class="composerbar"><label class="btn micro" title="Arquivo até 5 MB">' +
      icon("file", 15) +
      ' Anexar<input type="file" name="file" class="sr"></label><select aria-label="Mencionar pessoa" id="mention"><option value="">@ Mencionar</option>' +
      info.members
        .map(
          (p) =>
            '<option value="' + esc(p.name) + '">' + esc(p.name) + "</option>",
        )
        .join("") +
      '</select><small id="filename"></small><button type="submit" class="btn primary">' +
      icon("send", 15) +
      ' Enviar</button></div><p class="formerr" role="alert"></p></form></section>';

    marker();
    const f = root.querySelector("#teamform"),
      input = f.elements.body;
    f.querySelector("[type=file]").onchange = () => {
      root.querySelector("#filename").textContent =
        f.elements.file.files[0]?.name || "";
    };
    root.querySelector("#mention").onchange = (e) => {
      input.setRangeText(
        "@" + e.target.value + " ",
        input.selectionStart,
        input.selectionEnd,
        "end",
      );
      e.target.value = "";
      input.focus();
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        f.requestSubmit();
      }
      if (e.key === "Escape" && (reply || editing)) {
        e.preventDefault();
        reply = editing = null;
        input.value = "";
        marker();
      }
    };
    handle("teamform", async (a) => {
      const destination = room,
        sendVersion = version,
        replyId = reply?.id,
        editId = editing?.id;
      let file;
      const att = f.elements.file.files[0];
      if (att) {
        if (editing)
          throw Error("Edite o texto ou envie o anexo em outra mensagem.");
        if (att.size > 5 * 1024 * 1024)
          throw Error("Limite de 5 MB por arquivo.");
        const base64 = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result.split(",")[1]);
          r.onerror = reject;
          r.readAsDataURL(att);
        });
        file = { name: att.name, base64 };
      }
      await api(
        path("mensagens" + (editId ? "/" + editId : ""), destination),
        editId ? "PUT" : "POST",
        { body: a.body, file, reply: replyId },
      );
      summaries.delete(destination.id);
      if (!guard() || sendVersion !== version) return;
      f.reset();
      root.querySelector("#filename").textContent = "";
      reply = editing = null;
      marker();
      await sync(true);
    });
  }
  async function refreshList() {
    const n = version,
      result = await roomsInfo();
    if (!guard() || version !== n || room) return;
    info = result;
    rows();
  }
  if (room) {
    setup();
    await sync(true);
  } else inbox();
  root.onclick = async (e) => {
    const r = e.target.closest("[data-room]")?.dataset.room,
      action = e.target.closest("[data-chat]")?.dataset.chat;
    if (!r && !action) return;
    try {
      if (r) {
        const next = [...info.rooms, ...(task ? [task] : [])].find(
          (x) => x.id === r,
        );
        if (!next || r === room?.id) return;
        screen = "thread";
        version++;
        room = next;
        reply = editing = null;
        items = [];
        read = 0;
        older = false;
        setup();
        await sync(true);
        if (guard() && room?.id === r)
          root.querySelector(".drawer-back")?.focus({ preventScroll: true });
        return;
      }
      const [k, id] = action.split(":"),
        msg = items.find((m) => m.id === +id),
        input = root.querySelector("textarea");
      if (k === "inbox" || k === "people") {
        inbox(k, true);
        await refreshList();
        return;
      }
      if (!room) return;
      if (k === "reply" || k === "edit") {
        reply = k === "reply" ? msg : null;
        editing = k === "edit" ? msg : null;
        if (editing) input.value = msg.body;
        input.focus();
        marker();
      }
      if (k === "clear") {
        reply = editing = null;
        input.value = "";
        marker();
      }
      if (k === "older") {
        const n = version;
        const ans = await api(path("mensagens") + "&antes=" + items[0].id);
        if (!guard() || n !== version) return;
        const box = root.querySelector("#teammsgs"),
          h = box.scrollHeight;
        items = [...ans.rows, ...items];
        older = ans.more;
        draw(true);
        box.scrollTop = box.scrollHeight - h;
      }
      if (k === "remove") {
        modal(
          "Apagar sua mensagem?",
          form(
            notice("O texto e o anexo serão removidos desta conversa."),
            "Apagar mensagem",
          ),
        );
        const removingFrom = room;
        handle("editForm", async () => {
          await api(path("mensagens/" + id, removingFrom), "DELETE", {});
          summaries.delete(removingFrom.id);
          document.querySelector("#dialog").close();
          await sync();
        });
      }
    } catch (err) {
      toast(err.message);
    }
  };
  const poll = setInterval(() => {
    if (!guard()) {
      clearInterval(poll);
      return;
    }
    if (!document.hidden) (room ? sync() : refreshList()).catch(() => {});
  }, 5000);
}
