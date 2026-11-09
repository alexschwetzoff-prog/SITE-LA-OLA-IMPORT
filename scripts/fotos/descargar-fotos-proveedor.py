"""Descarga en serie las fotos de docs/fotos-proveedor/lista-descargas.csv (fase 4.3), con una pausa corta entre
peticiones y sin reintentos agresivos (un solo reintento, tras cinco segundos, y solo si falla la conexión).

Cada foto se guarda en assets/productos/originales-proveedor/<producto>/<nombre original> (originales: no se tocan;
los scripts de fotos los leen desde ahí) y el resultado de cada dirección queda en
docs/fotos-proveedor/informe-descarga.csv (estado HTTP, bytes, ancho × alto en píxeles). Las direcciones ya
anotadas en el informe no se vuelven a pedir: se puede relanzar para completar.

Fase 4.4 (--hd): las mismas fotos de la carpeta «hd» del proveedor (2000 px; la dirección cambia «large» por «hd»),
que van a assets/productos/originales-proveedor-hd/ (carpeta ignorada por git: los originales hd no se suben al
repositorio, solo las versiones procesadas) con su informe en docs/fotos-proveedor/informe-descarga-hd.csv.

Uso: python -I -X utf8 scripts/fotos/descargar-fotos-proveedor.py [--hd] [pausa_segundos]
Requisitos: Pillow (para medir las fotos).
"""
import csv
import io
import os
import sys
import time
import urllib.error
import urllib.request

from PIL import Image

LISTA = "docs/fotos-proveedor/lista-descargas.csv"
INFORME = "docs/fotos-proveedor/informe-descarga.csv"
DESTINO = "assets/productos/originales-proveedor"
INFORME_HD = "docs/fotos-proveedor/informe-descarga-hd.csv"
DESTINO_HD = "assets/productos/originales-proveedor-hd"
CAMPOS = ["producto", "modelo", "color_codigo", "color_nombre", "vista", "url", "estado", "bytes", "ancho", "alto", "archivo"]
AGENTE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def pedir(url):
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE, "Accept": "image/*,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.status, resp.read()


def url_hd(url):
    """La misma foto en la carpeta «hd» del proveedor (…/views/hd/… y …/model/hd/…)."""
    return url.replace("/large/", "/hd/")


def main():
    args = [a for a in sys.argv[1:]]
    hd = "--hd" in args
    args = [a for a in args if a != "--hd"]
    pausa = float(args[0]) if args else 0.6
    informe, destino = (INFORME_HD, DESTINO_HD) if hd else (INFORME, DESTINO)
    filas = list(csv.DictReader(open(LISTA, encoding="utf-8")))
    if hd:
        filas = [{**f, "url": url_hd(f["url"])} for f in filas]
    hechas = set()
    if os.path.exists(informe):
        hechas = {r["url"] for r in csv.DictReader(open(informe, encoding="utf-8"))}
    nuevo = not hechas
    os.makedirs(os.path.dirname(informe), exist_ok=True)
    salida = open(informe, "a", encoding="utf-8", newline="")
    w = csv.DictWriter(salida, fieldnames=CAMPOS)
    if nuevo:
        w.writeheader()
    inicio = time.time()
    n_ok = n_err = 0
    for i, fila in enumerate(filas, 1):
        url = fila["url"]
        if url in hechas:
            continue
        nombre = url.rsplit("/", 1)[-1]
        carpeta = os.path.join(destino, fila["producto"])
        os.makedirs(carpeta, exist_ok=True)
        estado, datos = "", b""
        for intento in (1, 2):
            try:
                estado, datos = pedir(url)
                break
            except urllib.error.HTTPError as e:
                estado = e.code
                break
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
                estado = f"error: {e}"
                if intento == 1:
                    time.sleep(5.0)
        ancho = alto = archivo = ""
        if estado == 200 and datos:
            try:
                ancho, alto = Image.open(io.BytesIO(datos)).size
                with open(os.path.join(carpeta, nombre), "wb") as f:
                    f.write(datos)
                archivo = f"{fila['producto']}/{nombre}"
                n_ok += 1
            except Exception as e:  # la respuesta no es una imagen
                estado = f"200 pero no es imagen: {e}"
                n_err += 1
        else:
            n_err += 1
        w.writerow({**fila, "estado": estado, "bytes": len(datos) if estado == 200 else "", "ancho": ancho, "alto": alto, "archivo": archivo})
        salida.flush()
        print(f"[{i}/{len(filas)}] {fila['producto']} {fila['color_codigo']} {fila['vista']}: {estado} {ancho}x{alto}", flush=True)
        time.sleep(pausa)
    print(f"hecho: {n_ok} descargadas, {n_err} con error, {time.time() - inicio:.0f} s")


if __name__ == "__main__":
    main()
