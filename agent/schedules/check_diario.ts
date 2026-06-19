import { defineSchedule } from "eve/schedules";
import telegram from "../channels/telegram.ts"; // Importa tu canal

export default defineSchedule({
    cron: "0 22 * * *", // Ejecutar diariamente a las 22:00 hs de tu zona horaria
    async run({ receive, waitUntil, appAuth }) {
        waitUntil(receive(telegram, {
            message: "Consulta el inventario actual usando 'consultar_stock' y genera un informe detallado del stock de todos los productos. Si detectas que algún producto está bajo el stock mínimo, inicia el proceso de reabastecimiento.",
            target: {
                chatId: "8033661633" // <-- Coloca el número que te dio @userinfobot
            },
            auth: appAuth,
        }));
    },
});
