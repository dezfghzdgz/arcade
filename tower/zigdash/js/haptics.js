// Vibrace. Na Androidu funguje i na webu (navigator.vibrate), v Capacitoru přes plugin @capacitor/haptics (iOS).
window.Haptic = (() => {
  const cap = window.Capacitor;
  const H = cap && cap.Plugins && cap.Plugins.Haptics;
  const on = () => Storage.vibrate;
  const vib = (pattern, style) => {
    if (!on()) return;
    if (H) { try { style === "notify" ? H.notification({ type: "SUCCESS" }) : H.impact({ style }); } catch {} return; }
    if (navigator.vibrate) navigator.vibrate(pattern);
  };
  return {
    bounce() { vib(8, "LIGHT"); },
    near() { vib(20, "MEDIUM"); },
    fever() { vib([20, 30, 20], "MEDIUM"); },
    die() { vib([40, 30, 80], "HEAVY"); },
    reward() { vib([15, 40, 15], "notify"); },
  };
})();
