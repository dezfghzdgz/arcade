// Síťová vrstva. Hostitel = prohlížeč toho, kdo místnost založil; ostatní se připojí kódem/odkazem.
// Transport: Supabase Realtime (broadcast + presence) když je vyplněný config, jinak BroadcastChannel
// (funguje jen mezi taby jednoho prohlížeče – hodí se na vývoj a testy).
window.Net = (() => {
  const cfg = SK_CONFIG;
  const myId = Storage.device.slice(0, 8) + "-" + Math.random().toString(36).slice(2, 6);
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const makeCode = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");

  const online = () => !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);

  // ---------- transporty: open(code, onMsg, onLeave) -> {send(to, type, payload), close()}
  function localTransport(code, onMsg, onLeave) {
    const bc = new BroadcastChannel("snakes:" + code);
    bc.onmessage = (e) => { const m = e.data; if (m.from === myId) return; if (m.to && m.to !== myId) return; if (m.type === "__leave") onLeave(m.from); else onMsg(m); };
    return {
      kind: "local",
      send(to, type, payload) { bc.postMessage({ from: myId, to, type, payload }); },
      close() { bc.postMessage({ from: myId, type: "__leave" }); bc.close(); },
    };
  }

  function supabaseTransport(code, onMsg, onLeave) {
    if (!Net._client) Net._client = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { realtime: { params: { eventsPerSecond: 40 } } });
    const ch = Net._client.channel("snakes:" + code, { config: { broadcast: { self: false }, presence: { key: myId } } });
    let ready = false, queue = [];
    ch.on("broadcast", { event: "m" }, ({ payload: m }) => { if (m.to && m.to !== myId) return; onMsg(m); });
    ch.on("presence", { event: "leave" }, ({ leftPresences }) => leftPresences.forEach(p => onLeave(p.id)));
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") { ready = true; ch.track({ id: myId }); queue.forEach(q => ch.send(q)); queue = []; }
    });
    return {
      kind: "online",
      send(to, type, payload) { const m = { type: "broadcast", event: "m", payload: { from: myId, to, type, payload } }; ready ? ch.send(m) : queue.push(m); },
      close() { ch.unsubscribe(); },
    };
  }

  // ---------- místnost (společné pro hosta i klienta)
  let tr = null, handlers = {}, code = null, isHost = false;

  function on(type, fn) { handlers[type] = fn; }
  function emit(m) { const h = handlers[m.type]; if (h) h(m.payload, m.from); }

  function open(c, asHost) {
    close();
    code = c; isHost = asHost;
    const onLeave = (id) => emit({ type: "leave", payload: { id }, from: id });
    tr = online() ? supabaseTransport(code, emit, onLeave) : localTransport(code, emit, onLeave);
    return tr.kind;
  }
  function close() { if (tr) { tr.close(); tr = null; } code = null; }
  function send(type, payload, to) { if (tr) tr.send(to || null, type, payload); }

  // Časovač ve Web Workeru: prohlížeč ho na pozadí neškrtí tak agresivně jako setInterval stránky,
  // takže hostitel nezastaví hru všem, když si přepne záložku.
  function workerInterval(fn, ms) {
    let handle;
    try {
      const blob = new Blob([`let t=null;onmessage=e=>{if(e.data.ms){clearInterval(t);t=setInterval(()=>postMessage(1),e.data.ms)}else{clearInterval(t)}}`], { type: "text/javascript" });
      const wk = new Worker(URL.createObjectURL(blob));
      wk.onmessage = fn; wk.postMessage({ ms });
      handle = { stop() { wk.postMessage({}); wk.terminate(); } };
    } catch { const id = setInterval(fn, ms); handle = { stop() { clearInterval(id); } }; }
    return handle;
  }

  return {
    myId, makeCode, online, open, close, send, on, workerInterval,
    get code() { return code; }, get isHost() { return isHost; }, get connected() { return !!tr; }, get kind() { return tr ? tr.kind : null; },
    roomLink(c) { const base = cfg.webUrl || (location.origin + location.pathname); return base + "?room=" + c; },
  };
})();
