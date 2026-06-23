# 🚀 Publicar Prodan en GitHub Pages

Con GitHub Pages vas a tener una URL pública tipo:
`https://TU_USUARIO.github.io/prodan`

Cualquiera puede entrar desde PC, tablet o celular sin instalar nada.
Vos podés actualizar el sistema subiendo cambios a GitHub y se actualiza automáticamente.

---

## PASO 1 · Crear cuenta en GitHub (si no tenés)

1. Andá a https://github.com
2. Creá una cuenta gratuita.

---

## PASO 2 · Crear el repositorio

1. Dentro de GitHub, hacé clic en **"New repository"** (botón verde).
2. Nombre del repositorio: `prodan`
3. Dejalo en **Public**.
4. NO marques "Add README".
5. Hacé clic en **Create repository**.

---

## PASO 3 · Subir los archivos

### Opción A — Desde el navegador (más fácil, sin instalar nada)

1. En la página del repositorio vacío, hacé clic en **"uploading an existing file"**.
2. Arrastrá todos los archivos y carpetas de la carpeta `prodan/`:
   - `index.html`
   - `css/` (carpeta con `style.css`)
   - `js/` (carpeta con `data.js`, `app.js`, `charts.js`)
   - `.nojekyll`
3. En el campo "Commit changes" escribí: `Primera versión de Prodan`
4. Hacé clic en **Commit changes**.

> ⚠️ Importante: subí la carpeta `css/` y `js/` como carpetas, no solo los archivos sueltos.

### Opción B — Con GitHub Desktop (más cómodo para actualizaciones futuras)

1. Descargá GitHub Desktop: https://desktop.github.com
2. Instalalo e iniciá sesión con tu cuenta.
3. Cloná el repositorio `prodan` que creaste.
4. Copiá todos los archivos de Prodan a la carpeta del repositorio.
5. En GitHub Desktop, escribí un mensaje y hacé clic en **Commit** y luego **Push**.

---

## PASO 4 · Activar GitHub Pages

1. En el repositorio, andá a **Settings** (pestaña superior).
2. En el menú izquierdo, hacé clic en **Pages**.
3. En "Branch", seleccioná **main** (o **master**) y la carpeta **/ (root)**.
4. Hacé clic en **Save**.
5. Esperá 1-2 minutos.
6. GitHub te va a mostrar la URL: `https://TU_USUARIO.github.io/prodan`

---

## PASO 5 · Compartir la URL

Mandales a los empleados la URL por WhatsApp.
Pueden guardarla como acceso directo en el celular o en el escritorio.

**Credenciales:**
- Administrador: `admin` / `prodan2024`
- Empleado de caja: `caja` / `caja123`

---

## Actualizar el sistema en el futuro

Cuando quieras actualizar la app (nuevos productos, correcciones, etc.):

### Desde el navegador:
1. Andá al repositorio en GitHub.
2. Hacé clic en el archivo que querés cambiar.
3. Hacé clic en el ícono del lápiz ✏️.
4. Editá y guardá.
5. En 1-2 minutos el cambio aparece en la URL pública.

### Con GitHub Desktop:
1. Modificá los archivos localmente.
2. Abrí GitHub Desktop, escribí un mensaje descriptivo.
3. Commit + Push.
4. Listo.

---

## ¿Los datos se comparten entre usuarios?

**Con solo GitHub Pages: NO.**
Cada persona tiene sus datos guardados en su propio navegador (localStorage).

**Con Google Sheets configurado: SÍ.**
Si configurás el Google Apps Script, cada venta se sincroniza automáticamente a Google Sheets,
y desde ahí todos pueden ver los datos.

> 💡 Recomendación: usá la app en GitHub Pages como interfaz de carga,
> y Google Sheets como base de datos compartida.

---

## Estructura de archivos en el repositorio

```
prodan/                    ← raíz del repositorio
├── index.html
├── .nojekyll              ← necesario para GitHub Pages
├── css/
│   └── style.css
└── js/
    ├── data.js
    ├── app.js
    └── charts.js
```

**Versión 2.0 · Prodan Heladería**
