// Všechny zvuky jsou generované (žádné soubory) – appka zůstává malá a nic se nemusí načítat.
window.Audio2 = (() => {
  let ctx = null, comp = null;
  const ensure = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      comp = ctx.createDynamicsCompressor();           // ať to při hodně zvucích najednou nepřebudí
      comp.threshold.value = -14; comp.ratio.value = 6;
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const on = () => Storage.sound;
  const out = () => comp;

  function tone({ f = 440, f2 = null, type = "square", dur = 0.08, vol = 0.18, delay = 0, attack = 0.005 }) {
    if (!on()) return;
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    const t0 = c.currentTime + delay;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(out());
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.25, vol = 0.3, delay = 0, hp = 0, lp = 900 }) {
    if (!on()) return;
    const c = ensure();
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    let node = src;
    if (lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; node.connect(f); node = f; }
    if (hp) { const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp; node.connect(f); node = f; }
    node.connect(g).connect(out());
    src.start(c.currentTime + delay);
  }

  return {
    unlock: ensure,
    ctx: ensure,
    // ovládání
    tap() { tone({ f: 620, f2: 900, type: "triangle", dur: 0.07, vol: 0.2 }); noise({ dur: 0.03, vol: 0.12, hp: 3000, lp: 0 }); },
    // odraz od stěny – „boing"
    bounce() { tone({ f: 330, f2: 140, type: "sine", dur: 0.11, vol: 0.32 }); noise({ dur: 0.04, vol: 0.18, lp: 1500 }); },
    // průlet překážkou
    pass() { tone({ f: 420, f2: 520, type: "triangle", dur: 0.04, vol: 0.08 }); },
    // gem – stoupá s combem
    gem(combo = 0) {
      const base = 780 + Math.min(combo, 14) * 55;
      tone({ f: base, type: "sine", dur: 0.08, vol: 0.2 });
      tone({ f: base * 1.5, type: "sine", dur: 0.14, vol: 0.18, delay: 0.05 });
    },
    // těsný průlet
    near() { tone({ f: 1400, f2: 2600, type: "sawtooth", dur: 0.1, vol: 0.14 }); tone({ f: 2600, f2: 1800, type: "square", dur: 0.08, vol: 0.06, delay: 0.08 }); },
    // FEVER – fanfára
    fever() { [0, 0.09, 0.18, 0.27, 0.36].forEach((d, i) => tone({ f: 523 * Math.pow(1.19, i), type: "square", dur: 0.16, vol: 0.14, delay: d })); noise({ dur: 0.3, vol: 0.12, hp: 4000, lp: 0, delay: 0.3 }); },
    // sebrání štítu
    shield() { tone({ f: 380, f2: 1100, type: "sine", dur: 0.28, vol: 0.2 }); tone({ f: 760, f2: 1500, type: "triangle", dur: 0.2, vol: 0.1, delay: 0.1 }); },
    // náraz do štítu – kovové cinknutí
    shieldHit() { tone({ f: 1800, f2: 900, type: "square", dur: 0.12, vol: 0.22 }); tone({ f: 2400, f2: 1200, type: "sawtooth", dur: 0.18, vol: 0.12, delay: 0.02 }); noise({ dur: 0.15, vol: 0.3, hp: 1500, lp: 0 }); },
    // smrt – rána + padající tón + tři klesající noty
    die() {
      noise({ dur: 0.45, vol: 0.55, lp: 1200 });
      tone({ f: 260, f2: 35, type: "sawtooth", dur: 0.5, vol: 0.32 });
      [0.12, 0.26, 0.42].forEach((d, i) => tone({ f: 330 / Math.pow(1.26, i), type: "square", dur: 0.16, vol: 0.14, delay: d }));
    },
    // oživení po reklamě
    revive() { [0, 0.08, 0.16, 0.24].forEach((d, i) => tone({ f: 392 * Math.pow(1.26, i), type: "triangle", dur: 0.22, vol: 0.18, delay: d })); },
    // splněná mise / denní bonus
    reward() { [0, 0.1, 0.2].forEach((d, i) => tone({ f: [659, 784, 1047][i], type: "sine", dur: 0.28, vol: 0.2, delay: d })); tone({ f: 1319, type: "sine", dur: 0.5, vol: 0.14, delay: 0.32 }); },
    // nový rekord
    record() { [0, 0.12, 0.24, 0.36, 0.48].forEach((d, i) => tone({ f: [523, 659, 784, 1047, 1319][i], type: "square", dur: 0.25, vol: 0.14, delay: d })); },
    ui() { tone({ f: 700, type: "triangle", dur: 0.05, vol: 0.1 }); },
  };
})();
