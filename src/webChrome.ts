import { Platform } from "react-native";

const BASE_WEB = "/pesca-castellon";

/** Meta + iconos para «Añadir a pantalla de inicio» (iPhone / Android). */
function inyectarMetaPwa() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pesca-pwa-meta")) return;

  const mark = document.createElement("meta");
  mark.id = "pesca-pwa-meta";
  mark.name = "pesca-pwa";
  mark.content = "1";
  document.head.appendChild(mark);

  const links: { rel: string; href: string; sizes?: string }[] = [
    { rel: "apple-touch-icon", href: `${BASE_WEB}/apple-touch-icon.png`, sizes: "180x180" },
    { rel: "manifest", href: `${BASE_WEB}/manifest.webmanifest` },
  ];
  for (const l of links) {
    if (document.querySelector(`link[rel="${l.rel}"][href="${l.href}"]`)) continue;
    const el = document.createElement("link");
    el.rel = l.rel;
    el.href = l.href;
    if (l.sizes) el.setAttribute("sizes", l.sizes);
    document.head.appendChild(el);
  }

  const metas: { name: string; content: string }[] = [
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "apple-mobile-web-app-title", content: "Vámonos" },
  ];
  for (const m of metas) {
    if (document.querySelector(`meta[name="${m.name}"]`)) continue;
    const el = document.createElement("meta");
    el.name = m.name;
    el.content = m.content;
    document.head.appendChild(el);
  }
}

/** Tipografía y pulido global solo en navegador. */
export function aplicarEstilosWeb() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  inyectarMetaPwa();
  if (document.getElementById("pesca-web-chrome")) return;

  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700;800&display=swap";
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
    .pesca-display {
      font-family: "Fraunces", "Source Sans 3", Georgia, serif;
      font-optical-sizing: auto;
    }
    .pesca-brand {
      font-family: "Syne", "Source Sans 3", system-ui, sans-serif;
      font-optical-sizing: auto;
    }
    .pesca-pin--selected {
      transform: scale(1.18);
      filter: drop-shadow(0 2px 4px rgba(91,45,142,0.45));
    }
    .leaflet-container {
      font-family: "Source Sans 3", system-ui, sans-serif;
    }
    .leaflet-popup-content {
      font-size: 13px;
      line-height: 1.35;
    }
    * { -webkit-tap-highlight-color: transparent; }
    #root input, #root textarea, #root button {
      font-family: inherit;
    }
    /* Barra de tabs: scroll + liquid-glass */
    #barra-tabs-scroll, #barra-tabs-scroll * {
      scrollbar-width: thin;
      scrollbar-color: rgba(22,74,54,0.55) rgba(255,255,255,0.25);
    }
    #barra-tabs-scroll div[style*="overflow"],
    #barra-tabs-scroll [style*="overflow"] {
      overflow-x: auto !important;
      overflow-y: hidden !important;
      -webkit-overflow-scrolling: touch;
    }
    #barra-tabs-scroll::-webkit-scrollbar,
    #barra-tabs-scroll *::-webkit-scrollbar {
      height: 7px;
    }
    #barra-tabs-scroll::-webkit-scrollbar-thumb,
    #barra-tabs-scroll *::-webkit-scrollbar-thumb {
      background: rgba(22,74,54,0.45);
      border-radius: 8px;
    }
    #barra-tabs-scroll {
      -webkit-backdrop-filter: blur(22px) saturate(180%) !important;
      backdrop-filter: blur(22px) saturate(180%) !important;
    }
  `;
  document.head.appendChild(style);
}
