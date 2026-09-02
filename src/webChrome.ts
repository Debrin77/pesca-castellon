import { Platform } from "react-native";

/** Tipografía y pulido global solo en navegador. */
export function aplicarEstilosWeb() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById("pesca-web-chrome")) return;

  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap";
  document.head.appendChild(font);

  const style = document.createElement("style");
  style.id = "pesca-web-chrome";
  style.textContent = `
    html, body, #root {
      font-family: "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif;
      background: #eef2ee;
      font-size: 16px;
      line-height: 1.45;
      color: #122018;
    }
    * { -webkit-tap-highlight-color: transparent; }
    #root input, #root textarea, #root button {
      font-family: inherit;
    }
    /* Barra de tabs: forzar scroll horizontal visible en web */
    #barra-tabs-scroll, #barra-tabs-scroll * {
      scrollbar-width: thin;
      scrollbar-color: #164a36 #e4efe8;
    }
    #barra-tabs-scroll div[style*="overflow"],
    #barra-tabs-scroll [style*="overflow"] {
      overflow-x: auto !important;
      overflow-y: hidden !important;
      -webkit-overflow-scrolling: touch;
    }
    #barra-tabs-scroll::-webkit-scrollbar,
    #barra-tabs-scroll *::-webkit-scrollbar {
      height: 8px;
    }
    #barra-tabs-scroll::-webkit-scrollbar-thumb,
    #barra-tabs-scroll *::-webkit-scrollbar-thumb {
      background: #164a36;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(style);
}
