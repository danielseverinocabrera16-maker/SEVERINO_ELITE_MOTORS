import os
import base64
import json

CARPETA_ASSETS = 'assets'
ARCHIVO_SALIDA = 'pdf_thumbnails.js'

def generar_pdf_thumbnails():
    thumbnails = {}
    if not os.path.exists(CARPETA_ASSETS):
        print(f"Error: No se encontró la carpeta '{CARPETA_ASSETS}'.")
        return

    extensiones = ('.png', '.jpg', '.jpeg', '.webp')
    print("Convirtiendo imágenes a Base64...")
    for nombre_archivo in os.listdir(CARPETA_ASSETS):
        if nombre_archivo.lower().endswith(extensiones):
            ruta_completa = os.path.join(CARPETA_ASSETS, nombre_archivo)
            tipo_mime = 'image/png' if nombre_archivo.lower().endswith('.png') else 'image/jpeg'
                
            with open(ruta_completa, 'rb') as img_file:
                codificado = base64.b64encode(img_file.read()).decode('utf-8')
                clave = f"assets/{nombre_archivo}"
                thumbnails[clave] = f"data:{tipo_mime};base64,{codificado}"
                
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as js_file:
        js_file.write("window.PDF_THUMBNAILS = ")
        json.dump(thumbnails, js_file, ensure_ascii=False)
        js_file.write(";\n")
    print(f"¡Blindaje de PDF listo! Se procesaron {len(thumbnails)} imágenes en '{ARCHIVO_SALIDA}'.")

if __name__ == '__main__':
    generar_pdf_thumbnails()