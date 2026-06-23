# 🍦 PRODAN · Guía de Instalación y Configuración

---

## ESTRUCTURA DE ARCHIVOS

```
prodan/
├── index.html          ← Aplicación principal (abrí este archivo)
├── css/
│   └── style.css       ← Estilos
├── js/
│   ├── data.js         ← Base de datos local + sincronización
│   ├── app.js          ← Lógica de la aplicación
│   └── charts.js       ← Gráficos
└── Code.gs             ← Google Apps Script (backend en la nube)
```

---

## PASO 1 · Usar la app localmente

1. Descomprimí la carpeta `prodan/` en cualquier lugar de tu PC.
2. Abrí **`index.html`** con Google Chrome o Edge.
3. ¡Listo! La app funciona sin internet para el registro de ventas.

**Credenciales iniciales:**
- Administrador: usuario `admin` / contraseña `prodan2024`
- Empleado de caja: usuario `caja` / contraseña `caja123`

> ⚠️ Cambiá las contraseñas desde **Configuración → Seguridad** antes de usar en producción.

---

## PASO 2 · Crear el Google Sheets

1. Andá a [sheets.google.com](https://sheets.google.com) con la cuenta de Gmail de Prodan.
2. Creá una nueva planilla y llamala **"Prodan Ventas"**.
3. Copiá el **ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```
4. Guardalo porque lo vas a necesitar en el Paso 3.

---

## PASO 3 · Configurar Google Apps Script

1. Andá a [script.google.com](https://script.google.com) con la misma cuenta.
2. Hacé clic en **"Nuevo proyecto"**.
3. Borrá todo el contenido del editor.
4. Copiá y pegá el contenido del archivo **`Code.gs`** que viene con la app.
5. En la línea 7, reemplazá el valor de `SHEET_ID`:
   ```javascript
   const SHEET_ID = 'TU_ID_DE_GOOGLE_SHEETS_ACÁ';
   ```
6. Hacé clic en el ícono de **Guardar** (o Ctrl+S).
7. Dale un nombre al proyecto, por ejemplo: **"Prodan Backend"**.

---

## PASO 4 · Crear las hojas automáticamente

1. En el editor de Apps Script, seleccioná la función **`setupSheets`** en el menú desplegable (donde dice "Seleccionar función").
2. Hacé clic en **Ejecutar**.
3. La primera vez va a pedir permisos → aceptá todo.
4. Vas a ver un mensaje de confirmación.

Esto crea automáticamente las hojas:
- ✅ Ventas
- ✅ Productos
- ✅ Medios de Pago
- ✅ Cierres de Caja
- ✅ Dashboard

---

## PASO 5 · Publicar como Web App

1. En Apps Script, hacé clic en **Implementar → Nueva implementación**.
2. Tipo de implementación: **Aplicación web**.
3. Configuración:
   - **Descripción:** Prodan API v1
   - **Ejecutar como:** Yo (tu cuenta de Gmail)
   - **Quién tiene acceso:** Cualquier persona
4. Hacé clic en **Implementar**.
5. La primera vez pedirá permisos → aceptá.
6. Copiá la **URL de implementación** (empieza con `https://script.google.com/macros/s/...`).

---

## PASO 6 · Conectar la app con Google Sheets

1. Abrí la app (`index.html`) e ingresá como administrador.
2. Andá a **Configuración** (ícono ⚙️ en el menú).
3. En **Conexión con Google Sheets**:
   - Pegá la **URL del Web App** del paso anterior.
   - Pegá el **ID de Google Sheets** del Paso 2.
4. Hacé clic en **Guardar y probar conexión**.

> 📌 Nota: Por limitaciones del navegador (CORS), puede aparecer una advertencia de conexión aunque funcione correctamente. Probá registrar una venta de prueba y verificá que aparezca en Google Sheets.

---

## USUARIOS Y ROLES

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin   | prodan2024 | Administrador · Acceso total |
| caja    | caja123    | Empleado · Solo registrar ventas y ver caja |

**El administrador puede:**
- Crear, editar y eliminar productos
- Modificar precios
- Configurar medios de pago
- Ver reportes completos
- Conectar con Google Sheets

**El empleado solo puede:**
- Registrar ventas
- Ver la caja del día

---

## USO DIARIO

### Registrar una venta
1. Seleccioná la categoría (Helados, Palitos, etc.).
2. Hacé clic en el producto.
3. Ajustá la cantidad con los botones + / −.
4. Elegí el medio de pago.
5. Hacé clic en **Registrar Venta**.

### Cerrar caja
1. Andá a **Caja del Día**.
2. Revisá el resumen de operaciones y totales por medio de pago.
3. Hacé clic en **Cerrar Caja** para registrar el cierre.

### Exportar ventas
1. Andá a **Reportes**.
2. Elegí el tipo (diario, mensual o por rango).
3. Hacé clic en **Generar**.
4. Exportá en **Excel** o **CSV**.

---

## DATOS Y ALMACENAMIENTO

- Las ventas se guardan automáticamente en el navegador (localStorage).
- **Los datos persisten aunque cierres la ventana o reinicies la PC.**
- Cada venta también se sincroniza automáticamente con Google Sheets (si está configurado).
- Los datos en el navegador son locales a esa computadora.

> 💡 Para usar en múltiples dispositivos, configurá Google Sheets correctamente. Los datos en Sheets son compartidos.

---

## AGREGAR PRODUCTOS

1. Iniciá sesión como administrador.
2. Andá a **Productos** (🍨 en el menú).
3. Hacé clic en **+ Nuevo Producto**.
4. Completá: nombre, categoría, precio, estado.
5. Guardá. El producto aparece inmediatamente en la pantalla de venta.

---

## PREGUNTAS FRECUENTES

**¿Puedo usar la app en una tablet?**
Sí. Funciona en tablets y es responsive. Abrí el archivo en Chrome o Edge.

**¿Funciona sin internet?**
Sí, el registro de ventas funciona offline. La sincronización con Google Sheets requiere conexión.

**¿Cómo hago backup de los datos?**
Exportá regularmente desde Reportes → Excel. Los datos también están en Google Sheets si configuraste la conexión.

**¿Puedo cambiar el nombre de los productos o precios?**
Sí, desde **Productos** (modo admin). Los cambios de precio aplican a futuras ventas, no a ventas históricas.

**¿Puedo tener más de un empleado?**
Por ahora hay dos usuarios predefinidos (admin y caja). Si necesitás más usuarios, podés agregar entradas en el localStorage desde la consola del navegador, o contactar para ampliar esta funcionalidad.

---

## TECNOLOGÍAS UTILIZADAS

- **Frontend:** HTML5, CSS3, JavaScript (sin frameworks)
- **Gráficos:** Chart.js (CDN)
- **Exportación Excel:** SheetJS / xlsx.js (CDN)
- **Backend:** Google Apps Script (gratuito)
- **Base de datos:** Google Sheets + localStorage del navegador
- **Costo total:** $0

---

## PRÓXIMAS FUNCIONALIDADES (roadmap)

- [ ] Control de stock / inventario
- [ ] Control de producción
- [ ] Múltiples usuarios con permisos granulares
- [ ] App móvil (PWA)
- [ ] Facturas y remitos
- [ ] Notificaciones por WhatsApp

---

**Versión 1.0 · Prodan Heladería · 2024**
