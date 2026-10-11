# Dilo Fácil

**Tu voz, tu manera.**

Dilo Fácil es una aplicación web gratuita de comunicación aumentativa y alternativa (CAA). Con ella, la persona usuaria puede decir lo que necesita usando botones de frases, texto escrito y voz. Es una herramienta de comunicación. No sirve para diagnosticar ni para tratar ninguna condición médica.

- No hace falta crear una cuenta.
- No incluye publicidad ni rastreadores.
- Las frases se guardan solo en tu dispositivo.
- Funciona sin conexión después de abrirla una vez con internet.

---

## 1. ¿Qué incluye?

| Función | Dónde está |
|---|---|
| 8 categorías con frases iniciales que puedes editar | **Inicio** |
| Frases favoritas y frases usadas con frecuencia | **Inicio** (aparecen al usarlas) |
| Frase seleccionada: leer en voz alta, repetir, copiar, editar y marcar como favorita | Panel superior al pulsar una frase |
| Frases con partes que puedes cambiar: `Necesito [una pausa] porque [hay demasiado ruido].` | Al pulsar la frase aparecen casillas para editar esas partes |
| Escribir un mensaje libre, leerlo en voz alta, copiarlo, guardarlo y cambiar el tamaño del texto | **Escribir** |
| Modo rápido con 6 frases que puedes cambiar (hasta 12) | **Rápido** |
| Crear, editar, eliminar y ordenar frases. Ordenar categorías | **Mis frases** |
| Tema claro, oscuro, de bajo estímulo visual o de alto contraste. Tamaño de la letra y de los botones, botones por fila, iconos sí o no | **Ajustes** |
| Activar o desactivar la voz, elegir la voz y la velocidad | **Ajustes** |
| Exportar, importar y restaurar copias de seguridad, y borrar todos los datos | **Ajustes** |
| Instrucciones para instalar la aplicación y página de privacidad | **Ajustes** |

La aplicación no lee nada en voz alta por su cuenta. Solo habla cuando pulsas el botón 🔊.

## 2. Cómo está organizado el proyecto

```
index.html            → la página de la aplicación
css/styles.css        → colores, tamaños y temas
js/data.js            → categorías y frases iniciales
js/storage.js         → guardado local, validación, exportación e importación
js/speech.js          → voz (Web Speech API del navegador)
js/app.js             → pantallas y botones
sw.js                 → service worker para usarla sin conexión
manifest.webmanifest  → datos para instalarla como aplicación (PWA)
icons/                → iconos de instalación
tests/                → pruebas automáticas y servidor local
```

El proyecto no necesita compilarse. Los archivos se usan tal como están.

---

## 3. Abrir la aplicación en Windows (paso a paso)

### Opción A: la más sencilla (sin instalar nada)

1. Descarga el proyecto desde GitHub. Pulsa el botón verde **Code** y después **Download ZIP**.
2. Busca el archivo ZIP en tu carpeta **Descargas**. Haz clic derecho sobre él y elige **Extraer todo**.
3. Abre la carpeta que se ha creado y haz doble clic en **index.html**.
4. La aplicación se abre en tu navegador.

> Si la abres así (el archivo directamente), funciona todo menos la instalación y el modo sin conexión. Para eso necesitas la opción B o la C.

### Opción B: con un servidor local (para probar el modo sin conexión)

1. Instala **Node.js**. Ve a https://nodejs.org, descarga la versión «LTS» e instálala pulsando «Siguiente» en todas las pantallas.
2. Abre la carpeta del proyecto en el Explorador de archivos.
3. Haz clic en la barra de direcciones de la carpeta, escribe `cmd` y pulsa **Enter**. Se abrirá una ventana negra, que es la **terminal**.
4. Escribe este comando y pulsa **Enter**:
   ```
   npm start
   ```
5. Abre el navegador y ve a **http://localhost:8080**.
6. Para parar el servidor, vuelve a la ventana negra y pulsa **Ctrl + C**.

### Usarla con Visual Studio Code

1. Abre Visual Studio Code y elige **Archivo → Abrir carpeta…**. Selecciona la carpeta del proyecto.
2. Abre la terminal con **Ver → Terminal** y escribe `npm start`.

---

## 4. Ejecutar las pruebas automáticas

Solo necesitas hacerlo una vez:

```
npm install
npx playwright install chromium
```

Después, cada vez que quieras comprobar la aplicación:

```
npm test
```

Verás una lista de pruebas. Cada una aparece con **OK** si funciona o con **FALLO** si hay un problema.

---

## 5. Publicarla gratis en GitHub Pages

1. Sube los archivos a tu repositorio de GitHub.
2. En GitHub, entra en **Settings → Pages**.
3. En **Source**, elige **Deploy from a branch**. Después elige la rama (por ejemplo `main`) y la carpeta `/ (root)`, y pulsa **Save**.
4. Espera uno o dos minutos. GitHub te mostrará la dirección, por ejemplo: `https://TU-USUARIO.github.io/DILO-F-CIL/`.
5. Abre esa dirección en el móvil o en el ordenador para usarla o instalarla.

Cuando publiques cambios, sube el número de `CACHE` en `sw.js` (por ejemplo `dilofacil-v2`). Así los dispositivos recibirán la versión nueva.

---

## 6. Privacidad y seguridad

- Los datos se guardan en el `localStorage` del navegador. **No se sincronizan** entre dispositivos.
- Si borras los datos del navegador o usas el modo privado, **puedes perder tus frases**. Exporta copias de seguridad de vez en cuando.
- Cualquier texto escrito se muestra siempre como texto. Nunca se interpreta como HTML ni se ejecuta como código. Una política de seguridad (CSP) bloquea los scripts externos.
- Al importar, solo se aceptan archivos de 1 MB como máximo. Antes de reemplazar tus datos, la aplicación comprueba el archivo y te pide confirmación.
- Algunas voces del navegador marcadas como «en línea» pueden enviar el texto al servicio del fabricante del navegador para crear el sonido. Si quieres evitarlo, elige en Ajustes una voz sin esa marca.

## 7. Limitaciones conocidas (dicho con honestidad)

- **Voz**: depende del navegador y del sistema operativo. Algunos dispositivos no tienen voces en español instaladas. Otros solo tienen voces que funcionan con internet. Firefox para Android y algunos navegadores no tienen síntesis de voz. En ese caso, la aplicación te avisa y puedes seguir usando el texto.
- **Instalación (PWA)**: Chrome y Edge permiten instalarla en Android, Windows y macOS. En iPhone y iPad se instala desde Safari con «Añadir a pantalla de inicio». Firefox de escritorio no permite instalar aplicaciones web.
- **Sin conexión**: solo funciona si la aplicación se ha abierto antes con internet desde una dirección web, como GitHub Pages o `localhost`. Si abres el archivo `index.html` directamente, no funciona sin conexión.
- **Iconos**: son emojis del sistema, así que su aspecto cambia según el dispositivo. Si lo prefieres, puedes desactivarlos y ver solo texto.
- **Copiar**: en algunos navegadores antiguos, puede que tengas que copiar el texto a mano.
- La aplicación solo está en español. Los datos están preparados para añadir más idiomas, pictogramas y perfiles, pero esas funciones **todavía no existen**.

## 8. Preparado para el futuro (aún no implementado)

- **Idiomas**: se podría crear otro archivo de datos con la misma estructura que `js/data.js`.
- **Pictogramas**: cada frase tiene un campo `icon`. Más adelante se podría añadir un campo `image` para usar paquetes de pictogramas con licencia adecuada.
- **Perfiles y sincronización**: el formato JSON tiene un campo `version` para poder hacer cambios sin perder los datos.
- **Inteligencia artificial**: no se incluye. Si algún día se añade, solo actuará con tu permiso y nunca decidirá por ti qué debes comunicar.
- **Modelo de negocio**: las funciones esenciales serán siempre gratuitas. Esta versión no incluye pagos.

## Licencia

MIT.
