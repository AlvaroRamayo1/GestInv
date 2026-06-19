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

          // Forzamos el type a "select" para que el renderizador de Eve active los botones
          const modifiedRequest = {
            ...request,
            type: "select" as const,
            options: [
              { id: "approve", label: "Aprobar" },
              { id: "deny", label: "Rechazar" }
            ]
          };

          const defaultRender = renderTelegramInputRequest(modifiedRequest, channel.state);
          replyMarkup = defaultRender.replyMarkup;
          freeformRequestId = defaultRender.freeformRequestId;
        } else {
          const defaultRender = renderTelegramInputRequest(request, channel.state);
          text = defaultRender.text;

          if (defaultRender.replyMarkup) {
            replyMarkup = defaultRender.replyMarkup;
          } else {
            // Teclado inferior estático
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

        // Pasamos el objeto limpio; al venir del renderizador o con la estructura 
        // correcta, no te va a tirar error de tipos ni de serialización
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