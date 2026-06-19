import { telegramChannel, renderTelegramInputRequest, registerTelegramFreeformPrompt } from "eve/channels/telegram";

export default telegramChannel({
  botUsername: "gestinvbot",
  events: {
    "input.requested": async (event, channel) => {
      for (const request of event.requests) {
        let text: string;
        let replyMarkup: any;
        let freeformRequestId: string | undefined;

        if (request.action?.toolName === "solicitar_aprobacion") {
          const input = request.action.input as { mensaje?: string };
          const mensaje = input?.mensaje || "Se requiere confirmación para continuar.";

          text = `Solicitud de Aprobación\n\nPropuesta:\n${mensaje}\n\nPor favor, confirme si aprueba esta solicitud.`;

          // Obtenemos el ID de la petición interna de Eve
          const defaultRender = renderTelegramInputRequest(request, channel.state);
          freeformRequestId = defaultRender.freeformRequestId;

          // Construimos el inline_keyboard nativo de Telegram como objeto puro
          replyMarkup = {
            inline_keyboard: [
              [
                { text: "👍 Aprobar", callback_data: "approve" },
                { text: "👎 Rechazar", callback_data: "deny" }
              ]
            ]
          };
        } else {
          const defaultRender = renderTelegramInputRequest(request, channel.state);
          text = defaultRender.text;

          if ((defaultRender.replyMarkup as any)?.inline_keyboard) {
            replyMarkup = defaultRender.replyMarkup;
          } else {
            // Teclado inferior/físico nativo de Telegram como objeto puro
            replyMarkup = {
              keyboard: [
                [{ text: "📦 Auditar Stock" }, { text: "🛒 Calcular Orden Óptima" }]
              ],
              resize_keyboard: true,
              one_time_keyboard: false
            };
          }

          freeformRequestId = defaultRender.freeformRequestId;
        }

        // Enviamos el objeto sin serializar manualmente; el SDK se encarga por debajo
        const result = await channel.telegram.post({
          text,
          reply_markup: replyMarkup
        });

        if (freeformRequestId && result.id) {
          registerTelegramFreeformPrompt(channel.state, {
            messageId: String(result.id),
            requestId: freeformRequestId
          });
        }
      }
    }
  }
});