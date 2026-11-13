let transport;
const timeoutError = () =>
  Error(
    "O carregamento demorou mais que o esperado. Tente abrir a área novamente.",
  );
function deadline(promise, ms, onTimeout) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        onTimeout?.();
        reject(timeoutError());
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function workerTransport() {
  const worker = new Worker(new URL("./demo-worker.js?v=04c66b273f5b", import.meta.url));
  let serial = 0;
  const pending = new Map();
  let failBoot;
  let started = false;
  const ready = new Promise((resolve, reject) => {
    failBoot = reject;
    worker.onmessage = ({ data }) => {
      if (data.ready) {
        started = true;
        resolve();
        return;
      }
      if (data.bootError) {
        reject(Error(data.bootError));
        return;
      }
      pending.get(data.id)?.resolve(data);
      pending.delete(data.id);
    };
  });
  function stop(error) {
    worker.terminate();
    if (started) transport = undefined;
    failBoot(error);
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  }
  worker.onerror = worker.onmessageerror = () =>
    stop(Error("O navegador interrompeu a execução da demonstração."));
  return deadline(ready, 12000)
    .then(() => (input) => {
      const id = ++serial;
      const reply = new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ ...input, id });
      });
      return deadline(reply, 30000, () => pending.delete(id));
    })
    .catch((error) => {
      worker.terminate();
      throw error;
    });
}
async function connect() {
  try {
    return await workerTransport();
  } catch {
    const url = new URL("./demo-runtime.js?v=036b51454459", import.meta.url);
    const module = await deadline(import(url.href), 30000);
    return deadline(module.startDemo(), 18000);
  }
}
function call(p, m = "GET", body) {
  if (!transport)
    transport = connect().catch((error) => {
      transport = undefined;
      throw error;
    });
  return transport.then((send) => send({ p: "/api/" + p, m, body }));
}
export async function api(p, m = "GET", body) {
  const { status, result, temporary } = await call(p, m, body);
  if (temporary) {
    const banner = document.querySelector(".pages-note");
    if (banner)
      banner.textContent =
        "Demonstração temporária · Use dados fictícios. As alterações duram até recarregar esta página.";
  }
  if (status >= 400) throw Error(result.error);
  return result;
}
document.addEventListener("click", async (e) => {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const u = new URL(a.href);
  if (!u.pathname.includes("/api/") || u.origin !== location.origin) return;
  e.preventDefault();
  try {
    const r = await call(u.pathname.split("/api/")[1] + u.search);
    if (r.status >= 400) throw Error(r.result.error);
    const url = URL.createObjectURL(
      new Blob([r.result], {
        type: r.headers["Content-Type"] || "application/octet-stream",
      }),
    );
    const link = document.createElement("a");
    const disposition = r.headers["Content-Disposition"]?.split("''");
    link.href = url;
    link.download = decodeURIComponent(
      disposition?.[disposition.length - 1] ||
        (u.pathname.includes("exportar") ? "dados-demo.zip" : "anexo"),
    );
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (error) {
    alert(error.message);
  }
});
