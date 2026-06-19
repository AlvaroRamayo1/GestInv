# Procedimiento de Reabastecimiento

Si al usar la herramienta 'consultar_stock' identificadas algún producto cuyo 'stock_actual' sea menor al 'stock_minimo', entonces debes:

1. Calcular la diferencia faltante utilizando 'consultar_stock' para analizar que productos requieren atencion.
2. Si un producto necesita stock, genera una propuesta.
3. Bajo ninguna circunstancia uses la herramienta 'actualizar_stock' hasta que el usuario haya aprobado explicitamente la orden de compra en el chat.