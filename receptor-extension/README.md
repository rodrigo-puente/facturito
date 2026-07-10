# Facturito 🤖

Extensión de Chrome que guarda receptores **localmente en tu computadora**
(`chrome.storage.local`, nada sale de tu máquina) y llena con un clic la
sección *Receptor* de los formularios de DTE de factura.gob.sv.

Soporta los 4 tipos de documento:

- Comprobante de Crédito Fiscal (CCF)
- Factura (FAC)
- Factura de Exportación (EXP)
- Factura de Sujeto Excluido (FSE)

Un mismo cliente sirve para todos: al capturar se guarda todo lo que el
formulario tenga, y al llenar se aplica solo lo que el formulario abierto
acepte (el mensaje indica cuántos campos se llenaron y cuáles quedaron sin
datos). El badge en cada tarjeta (CCF/FAC/EXP/FSE) indica dónde se capturó.

## Instalación

1. Abre `chrome://extensions` en Chrome.
2. Activa **Modo de desarrollador** (esquina superior derecha).
3. Clic en **Cargar descomprimida** y selecciona esta carpeta
   (`receptor-extension`).

## Uso

### Guardar un receptor

1. Abre el formulario de DTE y llena la sección *Receptor* una vez a mano
   (incluyendo departamento/municipio/distrito y actividad económica).
2. Clic en el icono de la extensión → **⬇ Capturar**.
3. Ponle un alias y guarda.

Después de capturado puedes ajustar cualquier campo con el botón ✎.

### Llenar el formulario

Con cualquier formulario de DTE abierto, clic en el icono de la extensión y
luego clic sobre el receptor. La extensión detecta qué tipo de formulario es,
llena los campos que apliquen, selecciona departamento → municipio → distrito
en cascada (espera a que carguen las opciones) y busca la actividad económica
o el país en el buscador del sitio. En Factura, elige primero el tipo de
documento y espera a que aparezca el campo del número.

Si un receptor capturado en CCF se usa en Factura, el NIT se usa como
documento (tipo NIT). Para Exportación conviene capturar desde ese mismo
formulario, porque tiene campos propios (país, tipo de persona, actividad en
texto libre).

### Respaldo

**Exportar** descarga un `receptores-dte.json`; **Importar** lo vuelve a
cargar (útil para respaldar o pasar a otra computadora).

## Notas

- Los selectores están basados en los HTML guardados de los 4 formularios
  (`credito-fiscal.html`, `factura.html`, `exportacion.html`,
  `sujeto-excluido.html`, en `samples/`). Si el portal cambia su
  estructura, se ajustan los perfiles en `content.js`.
- Si la página estaba abierta antes de instalar la extensión y no responde,
  recarga la pestaña (la extensión también intenta inyectarse sola).
