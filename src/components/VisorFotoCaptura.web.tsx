/**
 * Visor web: portal fixed al <body> (el Modal de RN-web a menudo no cubre o no recibe toques).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  uri: string | null;
  titulo?: string;
  onCerrar: () => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

function dataUriABlobUrl(dataUri: string): string | null {
  try {
    const coma = dataUri.indexOf(",");
    if (coma < 0) return null;
    const header = dataUri.slice(0, coma);
    const b64 = dataUri.slice(coma + 1);
    const mime = /data:([^;]+)/i.exec(header)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch {
    return null;
  }
}

export default function VisorFotoCaptura({ uri, titulo, onCerrar }: Props) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    setZoom(MIN_ZOOM);
    if (blobRef.current) {
      try {
        URL.revokeObjectURL(blobRef.current);
      } catch {
        /* ignore */
      }
      blobRef.current = null;
    }
    if (!uri) {
      setDisplayUri(null);
      return;
    }
    if (uri.startsWith("data:image/")) {
      const blob = dataUriABlobUrl(uri);
      blobRef.current = blob;
      setDisplayUri(blob || uri);
    } else {
      setDisplayUri(uri);
    }
    return () => {
      if (blobRef.current) {
        try {
          URL.revokeObjectURL(blobRef.current);
        } catch {
          /* ignore */
        }
        blobRef.current = null;
      }
    };
  }, [uri]);

  useEffect(() => {
    if (!uri) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
      if (e.key === "-") setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [uri, onCerrar]);

  const imgStyle = useMemo(() => {
    // A 1× la foto llena el área útil (casi pantalla completa); el zoom escala desde ahí.
    const w = window.innerWidth * 0.98 * zoom;
    const h = window.innerHeight * 0.82 * zoom;
    return {
      width: `${w}px`,
      height: `${h}px`,
      maxWidth: "none" as const,
      objectFit: "contain" as const,
      display: "block" as const,
      background: "#000",
      userSelect: "none" as const,
    };
  }, [zoom]);

  if (!uri || typeof document === "undefined") return null;

  function ajustar(delta: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 10) / 10)));
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visor de foto de captura"
      data-testid="visor-foto-captura"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        background: "rgba(0,0,0,0.97)",
        display: "flex",
        flexDirection: "column",
        padding: "12px 0 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px 8px",
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {titulo?.trim() || "Foto de la captura"}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar visor de foto"
          style={{
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.14)",
            color: "#9ad4e8",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Cerrar
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 240,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
        }}
        onWheel={(e) => {
          e.preventDefault();
          ajustar(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
        }}
      >
        {displayUri ? (
          <img
            src={displayUri}
            alt={titulo || "Foto de la captura"}
            draggable={false}
            style={imgStyle}
          />
        ) : (
          <div style={{ color: "#aaa" }}>Cargando foto…</div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 8,
        }}
      >
        <button
          type="button"
          aria-label="Alejar foto"
          onClick={() => ajustar(-ZOOM_STEP)}
          style={btnZoom}
        >
          −
        </button>
        <span style={{ color: "#fff", fontWeight: 700, minWidth: 56, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Acercar foto"
          onClick={() => ajustar(ZOOM_STEP)}
          style={btnZoom}
        >
          +
        </button>
        <button type="button" aria-label="Restablecer zoom" onClick={() => setZoom(MIN_ZOOM)} style={btnZoom}>
          1×
        </button>
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", marginTop: 8 }}>
        Rueda del ratón o botones +/− · Escape para cerrar
      </div>
    </div>,
    document.body,
  );
}

const btnZoom: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 24,
  border: "none",
  background: "rgba(255,255,255,0.18)",
  color: "#fff",
  fontSize: 28,
  fontWeight: 300,
  cursor: "pointer",
  lineHeight: "48px",
  padding: 0,
};
