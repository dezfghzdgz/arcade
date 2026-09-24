window.DU_CONFIG = { supabaseUrl: "https://ofozkelnipwozpukbdfg.supabase.co", supabaseAnonKey: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4", webUrl: "" };
// net.js potřebuje Storage.device
window.Storage = (() => { let d = null; try { d = localStorage.getItem("du_device"); } catch {} if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : "d" + Math.random().toString(36).slice(2) + Date.now()); try { localStorage.setItem("du_device", d); } catch {} } return { device: d }; })();
