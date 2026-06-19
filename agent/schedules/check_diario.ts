import { defineSchedule } from "eve/schedules";

export default defineSchedule({
    cron: "0 9 * * *", // Ejecutar diariamente a las 9:00 AM
    markdown: "Consulta el inventario actual usando 'consultar_stock' y genera un informe detallado del stock de todos los productos. Si detectas que algún producto está bajo el stock mínimo, inicia el proceso de reabastecimiento.",
});
