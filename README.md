# Facturito 🤖

Extensión de Chrome para el portal de facturación electrónica de El Salvador
([factura.gob.sv](https://factura.gob.sv)). Guarda los datos de tus receptores
**localmente en tu computadora** y llena la sección *Receptor* de cualquier
DTE con un clic.

Soporta los 4 tipos de documento: Comprobante de Crédito Fiscal, Factura,
Factura de Exportación y Factura de Sujeto Excluido.

## Instalación

- **Sitio web**: _(URL de Railway pendiente de publicación)_
- **Chrome Web Store**: _(enlace pendiente de publicación)_
- **Manual**: descarga el repo y carga `receptor-extension/` como extensión
  descomprimida — instrucciones en su [README](receptor-extension/README.md).

## Estructura

- [`receptor-extension/`](receptor-extension/) — la extensión (Manifest V3).
  Instrucciones de instalación y uso en su [README](receptor-extension/README.md).
- [`store/`](store/) — material para la Chrome Web Store: guía de publicación
  ([`listing.md`](store/listing.md)), screenshots, script de empaquetado y el
  ZIP listo para subir. Política de privacidad en [`PRIVACY.md`](PRIVACY.md).
- [`samples/`](samples/) — copias del `<body>` de cada formulario del portal
  (`credito-fiscal.html`, `factura.html`, `exportacion.html`,
  `sujeto-excluido.html`), usadas como referencia para los selectores de
  `content.js`. Están **anonimizadas**: todo dato del emisor fue reemplazado
  por valores de ejemplo, y los scripts del portal fueron removidos.

## Cómo contribuir

Si el portal cambia la estructura de un formulario, actualiza el perfil
correspondiente en `receptor-extension/content.js` (objeto `PROFILES`) y, de
ser posible, reemplaza el HTML de referencia con una copia nueva — solo el
`<body>`, sin scripts y sin datos personales.

## Privacidad

La extensión no envía nada a ningún servidor: los receptores viven en
`chrome.storage.local` y solo interactúa con las páginas de factura.gob.sv.
