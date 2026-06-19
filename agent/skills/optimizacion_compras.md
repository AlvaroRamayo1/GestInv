# Playbook: Optimización de Compras y Relleno Inteligente

## Propósito
Enseñar a EVE cómo interpretar el resultado de la herramienta `calcular_orden_optima` y cómo redactar un mensaje claro y estructurado para solicitar la aprobación del usuario antes de crear una orden de compra definitiva.

## Instrucciones

1. **Interpretación del JSON**:
   Cuando ejecutes `calcular_orden_optima`, recibirás un arreglo de órdenes agrupadas por proveedor. Cada orden contiene:
   - Detalles del proveedor, lista de productos críticos requeridos, relleno inteligente y total.
   - A nivel global, podrías recibir `productos_sacrificados_por_presupuesto` (un array) si el presupuesto no alcanzó para todo.
   - También el `gran_total` de todas las órdenes sumadas.

2. **Estructura del Mensaje de Aprobación**:
   Antes de llamar a `solicitar_aprobacion`, redacta un resumen ejecutivo siguiendo este formato:

   ```
   🛒 **Propuesta de Compra: [Nombre Proveedor]**
   Estrategia: [Normal | Relleno Inteligente]
   
   📦 **Productos Críticos:**
   - [Cantidad]x [Nombre Producto] ($[Precio Unitario] c/u) -> $[Subtotal]
   
   *(Si aplica relleno inteligente incluye esta sección)*
   ➕ **Relleno Inteligente (Para alcanzar mínimo de $[Monto Mínimo]):**
   - [Cantidad]x [Nombre Producto] ($[Precio Unitario] c/u) -> $[Subtotal]
   
   💰 **Total Orden:** $[Total]
   ```

3. **Restricciones Globales (Presupuesto y Exclusión)**:
   - Si el JSON incluye `productos_sacrificados_por_presupuesto`, agrega al final de tu mensaje una sección de advertencia:
     `⚠️ **Aviso de Presupuesto:** Para no exceder tu límite, tuve que omitir la compra de los siguientes productos: [Lista de productos].`
   - Si el presupuesto era tan bajo que ninguna orden se pudo armar, infórmalo directamente sin armar la tabla.
   
4. **Invocación de `solicitar_aprobacion`**:
   Usa el mensaje formateado arriba como el payload a enviar en la herramienta. **NUNCA** procedas a la acción final sin que el humano haya aprobado explícitamente este resumen. Si el humano lo rechaza, pregunta qué desea cambiar (excluir un producto, subir el presupuesto) y vuelve a ejecutar la herramienta matemática.
