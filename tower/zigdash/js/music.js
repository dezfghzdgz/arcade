// Hudba během hry. Bez souboru hraje generovaný chiptune loop (WebAudio):
// kick + hi-hat + basa + arpeggio, tempo roste s rychlostí, FEVER přidá vrstvu.
// S ZD_CONFIG.music.url se místo toho smyčkuje vlastní soubor.
window.Music = (() => {
  const cfg = ZD_CONFIG.music || {};
  let ctx, master, filter, playing = false, timer = null;
  let intensity = 0, fever = false;
  let nextTime = 0, step = 0;
  let fileEl = null;

  // A moll pentatonika + akordy Am F C G (basové tóny)
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const BASS = [45, 41, 48, 43];                      // A2 F2 C3 G2
  const CHORDS = [[69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]];
  const PENTA = [69, 72, 74, 76, 79, 81, 84];
  let arp = [];

  const on = () => Storage.music;

  function ensure() {
    ctx = Audio2.ctx();
    if (master) return;
    master = ctx.createGain(); master.gain.value = 0;
    filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1200;
    filter.connect(master).connect(ctx.destination);
  }

  function osc(type, freq, t0, dur, vol, dest, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(dest || filter);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  let noiseBuf;
  function hat(t0, vol, dur = 0.04) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
    src.connect(hp).connect(g).connect(master); src.start(t0); src.stop(t0 + dur + 0.01);
  }

  function bpm() { return 112 + intensity * 56 + (fever ? 12 : 0); }

  function scheduleStep(t0) {
    const bar = Math.floor(step / 16) % 4, s = step % 16;
    const sixteenth = 60 / bpm() / 4;

    // kick
    if (s % 4 === 0) osc("sine", 160, t0, 0.14, 0.9, master, 45);
    // hi-hat: osminy, s intenzitou šestnáctiny
    if (s % 2 === 0 || intensity > 0.45) hat(t0, s % 4 === 2 ? 0.25 : 0.12);
    // snare-ish na 4 a 12
    if (s === 4 || s === 12) hat(t0, 0.35, 0.09);

    // basa
    if ([0, 3, 6, 8, 10, 12, 14].includes(s)) {
      const root = BASS[bar] + (s === 14 ? 12 : 0);
      osc("sawtooth", NOTE(root), t0, sixteenth * 1.6, 0.35);
    }

    // arpeggio (od mírné intenzity)
    if (s === 0) arp = CHORDS[bar].concat([CHORDS[bar][0] + 12, PENTA[Math.floor(Math.random() * PENTA.length)]]);
    if (intensity > 0.12 && s % 2 === 0) {
      const n = arp[(s / 2) % arp.length];
      osc("triangle", NOTE(n), t0, sixteenth * 1.8, 0.28);
    }
    // FEVER vrstva: rychlá melodie o oktávu výš
    if (fever) {
      const n = PENTA[(s * 3 + bar) % PENTA.length] + 12;
      osc("square", NOTE(n), t0, sixteenth * 0.9, 0.12);
    }
    step++;
  }

  function tick() {
    if (!playing) return;
    const lookahead = 0.12;
    while (nextTime < ctx.currentTime + lookahead) {
      scheduleStep(nextTime);
      nextTime += 60 / bpm() / 4;
    }
    // filtr se otevírá s intenzitou
    filter.frequency.setTargetAtTime(900 + intensity * 4500 + (fever ? 2000 : 0), ctx.currentTime, 0.2);
  }

  function start() {
    if (!on() || playing) return;
    if (cfg.url) {
      if (!fileEl) { fileEl = new Audio(cfg.url); fileEl.loop = true; }
      fileEl.volume = cfg.volume ?? 0.5;
      fileEl.play().catch(() => {});
      playing = true; return;
    }
    ensure();
    playing = true; step = 0; nextTime = ctx.currentTime + 0.05;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(cfg.volume ?? 0.5, ctx.currentTime, 0.3);
    timer = setInterval(tick, 30);
  }

  function stop(fadeSec = 0.6) {
    if (!playing) return;
    playing = false;
    if (fileEl) { fileEl.pause(); fileEl.currentTime = 0; return; }
    clearInterval(timer); timer = null;
    master.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3);
  }

  function set(i, f) {
    intensity = Math.max(0, Math.min(1, i)); fever = !!f;
    if (fileEl && playing) fileEl.playbackRate = 1 + intensity * 0.12;
  }

  function toggle() { Storage.setMusic(!Storage.music); if (!Storage.music) stop(0.2); }

  return { start, stop, set, toggle, get playing() { return playing; } };
})();
