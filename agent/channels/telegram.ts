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

          const modifiedRequest = {
            ...request,
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

          if ((defaultRender.replyMarkup as any)?.inline_keyboard) {
            replyMarkup = defaultRender.replyMarkup;
          } else {
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

        const result = await channel.telegram.post({
          text,
          reply_markup: (replyMarkup ? JSON.stringify(replyMarkup) : undefined) as any
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