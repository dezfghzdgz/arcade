// Arcade pro PC (Electron). Načítá hry ze složky app/ (kopie webu), takže sólo hry jedou i bez internetu;
// online hry a účty se připojují na Supabase normálně.
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
function createWindow() {
  const win = new BrowserWindow({ width: 1100, height: 760, minWidth: 420, minHeight: 640, backgroundColor: "#160B2E", title: "Arcade", icon: path.join(__dirname, "app", "icon-512.png"), autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true } });
  win.loadFile(path.join(__dirname, "app", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith("http")) { shell.openExternal(url); return { action: "deny" }; } return { action: "allow" }; });
}
app.whenReady().then(() => { createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
