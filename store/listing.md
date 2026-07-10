# Chrome Web Store — textos y pasos para publicar Facturito

Todo lo de este archivo se pega en el
[Developer Console](https://chrome.google.com/webstore/devconsole).

## Pasos (una sola vez)

1. Crear cuenta de desarrollador con tu cuenta de Google y pagar la cuota
   única de **$5**: https://chrome.google.com/webstore/devconsole
2. Verificar el correo de contacto del publisher (pestaña *Account*).
3. *New item* → subir `store/facturito-1.0.0.zip`.
4. Pegar los textos de abajo en *Store listing*, subir los screenshots de
   `store/screenshots/`.
5. Completar *Privacy practices* con las respuestas de abajo y poner la URL
   pública de `PRIVACY.md` (el archivo en GitHub).
6. Elegir visibilidad: **Public** (buscable) o **Unlisted** (solo con el
   enlace) y *Submit for review*. La revisión típica tarda 1–3 días.

Para versiones siguientes: subir un ZIP nuevo con `"version"` incrementada en
`manifest.json`.

## Store listing

**Nombre**: Facturito

**Resumen (short description)**:

> Guarda receptores localmente y llena la sección Receptor de los DTE de
> factura.gob.sv con un clic.

**Descripción detallada**:

> Facturito guarda los datos de tus clientes (receptores) localmente en tu
> computadora y llena con un clic la sección Receptor de los formularios de
> DTE del portal de facturación electrónica de El Salvador (factura.gob.sv).
>
> Soporta los 4 tipos de documento:
> • Comprobante de Crédito Fiscal
> • Factura
> • Factura de Exportación
> • Factura de Sujeto Excluido
>
> Cómo funciona:
> 1. Llena la sección Receptor una vez a mano y pulsa "Capturar".
> 2. La próxima vez, abre el popup y haz clic en el receptor: Facturito
>    detecta qué formulario está abierto, llena los campos que apliquen,
>    selecciona departamento → municipio → distrito en cascada y busca la
>    actividad económica o el país automáticamente.
>
> Privacidad: tus datos nunca salen de tu computadora. No hay servidores, ni
> analítica, ni rastreo. Puedes exportar e importar tus receptores como
> respaldo en JSON.
>
> Proyecto de código abierto.

**Categoría**: Productivity (Herramientas / Workflow)

**Idioma**: Español

## Privacy practices

**Single purpose description**:

> Llenar la sección Receptor de los formularios de DTE de factura.gob.sv con
> datos de clientes guardados localmente por el usuario.

**Justificación de permisos**:

- `storage` — Guardar los receptores que el usuario captura, localmente en
  `chrome.storage.local`. Es la función central de la extensión.
- `activeTab` — Leer y llenar la sección Receptor del formulario de DTE en la
  pestaña activa cuando el usuario lo pide desde el popup.
- `scripting` — Reinyectar el content script cuando la página del portal se
  abrió antes de instalar/actualizar la extensión, para no obligar al usuario
  a recargar.
- Host permissions (`factura.gob.sv`, `*.factura.gob.sv`, `*.mh.gob.sv`) —
  La extensión solo funciona en el portal de facturación electrónica de
  Hacienda de El Salvador; no interactúa con ningún otro sitio.

**Formulario de uso de datos** (Data usage):

- ¿Recolecta "Personally identifiable information"? **Sí** (nombres, IDs
  fiscales, correos, teléfonos y direcciones de los clientes del usuario) —
  marcada como almacenada localmente, **no transmitida**.
- Las tres certificaciones: ✔ no se venden datos a terceros, ✔ no se usan ni
  transfieren para fines ajenos al propósito único, ✔ no se usan para
  crédito/préstamos.
- Privacy policy URL: la página `privacidad.html` del sitio en Railway
  (`https://<dominio-railway>/privacidad.html`) o la URL pública de
  `PRIVACY.md` en GitHub — ambas valen.

## Assets

- Icono del listing: `receptor-extension/icons/icon128.png` (se toma del ZIP).
- Screenshots (1280×800): `store/screenshots/01-lista.png`,
  `store/screenshots/02-editor.png`.
- Promo tile 440×280: opcional; se puede agregar después.
