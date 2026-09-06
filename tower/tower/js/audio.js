window.Audio2 = (() => {
  let ctx, comp;
  const ensure = () => {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(ctx.destination); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const on = () => Storage.sound;
  function tone({ f = 440, f2 = null, type = "square", dur = 0.08, vol = 0.18, delay = 0 }) {
    if (!on()) return; const c = ensure(); const o = c.createOscillator(), g = c.createGain(); const t0 = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(comp); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise({ dur = 0.2, vol = 0.3, lp = 1000, delay = 0 }) {
    if (!on()) return; const c = ensure(); const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(); src.buffer = buf; const g = c.createGain(); g.gain.value = vol; const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp;
    src.connect(f).connect(g).connect(comp); src.start(c.currentTime + delay);
  }
  return {
    unlock: ensure,
    dash() { noise({ dur: 0.12, vol: 0.25, lp: 2500 }); tone({ f: 300, f2: 900, type: "sawtooth", dur: 0.1, vol: 0.12 }); },
    bump() { tone({ f: 220, f2: 90, type: "square", dur: 0.14, vol: 0.28 }); noise({ dur: 0.1, vol: 0.3, lp: 800 }); },
    stunned() { tone({ f: 500, f2: 150, type: "sawtooth", dur: 0.3, vol: 0.2 }); },
    pickup() { tone({ f: 700, type: "sine", dur: 0.08, vol: 0.18 }); tone({ f: 1050, type: "sine", dur: 0.14, vol: 0.16, delay: 0.06 }); },
    bomb() { noise({ dur: 0.5, vol: 0.5, lp: 600 }); tone({ f: 120, f2: 30, type: "sine", dur: 0.5, vol: 0.4 }); },
    countdown() { tone({ f: 660, type: "square", dur: 0.1, vol: 0.14 }); },
    go() { tone({ f: 880, type: "square", dur: 0.35, vol: 0.18 }); tone({ f: 1320, type: "square", dur: 0.3, vol: 0.1, delay: 0.05 }); },
    whistle() { tone({ f: 1500, f2: 2200, type: "sine", dur: 0.15, vol: 0.2 }); tone({ f: 2200, f2: 1500, type: "sine", dur: 0.3, vol: 0.2, delay: 0.15 }); },
    win() { [0, 0.12, 0.24, 0.36, 0.48].forEach((d, i) => tone({ f: [523, 659, 784, 1047, 1319][i], type: "square", dur: 0.25, vol: 0.14, delay: d })); },
    lose() { [0, 0.18, 0.36].forEach((d, i) => tone({ f: [392, 330, 262][i], type: "triangle", dur: 0.3, vol: 0.14, delay: d })); },
    reward() { [0, 0.1, 0.2].forEach((d, i) => tone({ f: [659, 784, 1047][i], type: "sine", dur: 0.28, vol: 0.2, delay: d })); },
    tick() { tone({ f: 900, type: "triangle", dur: 0.04, vol: 0.1 }); },
    ui() { tone({ f: 700, type: "triangle", dur: 0.05, vol: 0.1 }); },
  };
})();
