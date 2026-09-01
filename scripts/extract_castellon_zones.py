"""
extract_castellon_zones.py

Descarga el dataset OFICIAL de Zonas de Pesca Controlada de la GVA,
se queda solo con los cotos de Castellón, simplifica la geometría para
que sea manejable en un móvil, la reproyecta a WGS84 (lat/lng estándar)
y exporta un GeoJSON listo para meter en la app.

CÓMO USARLO (en tu ordenador, no en la app):
    pip install geopandas shapely pyproj requests
    python extract_castellon_zones.py

Salida: castellon_zonas_oficiales.geojson
Cópialo dentro de: pesca-castellon/src/data/castellon_zonas_oficiales.geojson
y la app lo usará automáticamente en cuanto lo detecte (ver geoService.ts).

NOTA SOBRE EL FILTRO POR PROVINCIA:
El campo "matricula" del dataset parece seguir el patrón de prefijo de
provincia + guion + número (ej. "A-001" para un coto de Alicante, según
comprobé). Es MUY PROBABLE que Castellón use el prefijo "CS-", pero no
he podido confirmarlo con un coto real de Castellón porque el servidor
WFS no me dejó filtrar desde el chat. Este script filtra por ese prefijo
y TAMBIÉN por un cuadro delimitador (bounding box) aproximado de la
provincia como red de seguridad — revisa el resultado y ajusta el
prefijo en la variable PREFIJO_MATRICULA si hiciera falta.
"""

import json
import geopandas as gpd
from shapely.geometry import box

# --- Configuración ---
WFS_URL = (
    "https://terramapas.icv.gva.es/0504_CazaPesca"
    "?request=GetFeature&service=WFS&version=2.0.0"
    "&typename=Pesca.ZonasControladas&outputformat=json"
)

PREFIJO_MATRICULA = "CS-"  # Ajusta si no es el prefijo correcto para Castellón

# Bounding box aproximado de la provincia de Castellón en EPSG:25830 (UTM 30N)
# (red de seguridad además del filtro por matrícula)
BBOX_CASTELLON_25830 = (700000, 4390000, 830000, 4520000)

# Tolerancia de simplificación en metros (más alto = menos vértices, forma más basta)
TOLERANCIA_SIMPLIFICACION_M = 25

OUTPUT_PATH = "castellon_zonas_oficiales.geojson"


def main():
    print(f"Descargando dataset completo desde:\n  {WFS_URL}\n(puede tardar, el archivo es grande)")
    gdf = gpd.read_file(WFS_URL)
    print(f"Total de zonas en la Comunitat Valenciana: {len(gdf)}")

    # Filtro 1: por prefijo de matrícula
    if "matricula" in gdf.columns:
        filtro_matricula = gdf["matricula"].astype(str).str.startswith(PREFIJO_MATRICULA)
    else:
        print("⚠️ La columna 'matricula' no existe con ese nombre; revisa gdf.columns")
        filtro_matricula = gdf.index >= 0  # no filtra nada, deja pasar todo

    # Filtro 2: bounding box de seguridad (por si el prefijo falla)
    minx, miny, maxx, maxy = BBOX_CASTELLON_25830
    bbox_geom = box(minx, miny, maxx, maxy)
    filtro_bbox = gdf.geometry.intersects(bbox_geom)

    castellon = gdf[filtro_matricula | filtro_bbox].copy()
    print(f"Zonas candidatas a Castellón (matrícula O bbox): {len(castellon)}")

    if len(castellon) == 0:
        print("No se ha encontrado ninguna zona. Revisa PREFIJO_MATRICULA y el BBOX.")
        return

    # Simplificar geometría (reduce vértices, más ligero para el móvil)
    castellon["geometry"] = castellon.geometry.simplify(
        TOLERANCIA_SIMPLIFICACION_M, preserve_topology=True
    )

    # Reproyectar de EPSG:25830 (UTM30N) a EPSG:4326 (lat/lng estándar)
    castellon = castellon.to_crs(epsg=4326)

    # Quedarnos solo con columnas útiles para la app
    columnas_utiles = [
        c
        for c in ["matricula", "denominacion", "adjudicatario", "vocacion", "masa", "area_ha", "longitud_km", "geometry"]
        if c in castellon.columns
    ]
    castellon = castellon[columnas_utiles]

    castellon.to_file(OUTPUT_PATH, driver="GeoJSON")
    print(f"\n✅ Exportado: {OUTPUT_PATH}")
    print("Cópialo a: pesca-castellon/src/data/castellon_zonas_oficiales.geojson")
    print("\nRevisa manualmente los nombres (columna 'denominacion') para confirmar")
    print("que son todos de Castellón y no se ha colado ningún coto vecino.")


if __name__ == "__main__":
    main()
