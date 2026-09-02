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
    }
    * { -webkit-tap-highlight-color: transparent; }
    #root input, #root textarea, #root button {
      font-family: inherit;
    }
  `;
  document.head.appendChild(style);
}
