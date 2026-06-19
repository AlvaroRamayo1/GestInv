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

          const defaultRender = renderTelegramInputRequest(request, channel.state);
          freeformRequestId = defaultRender.freeformRequestId;

          // Blindamos el Inline Keyboard duplicando los campos críticos (camelCase y snake_case)
          replyMarkup = {
            inline_keyboard: [
              [
                { text: "👍 Aprobar", callback_data: "approve", callbackData: "approve" },
                { text: "👎 Rechazar", callback_data: "deny", callbackData: "deny" }
              ]
            ],
            inlineKeyboard: [
              [
                { text: "👍 Aprobar", callback_data: "approve", callbackData: "approve" },
                { text: "👎 Rechazar", callback_data: "deny", callbackData: "deny" }
              ]
            ]
          };
        } else {
          const defaultRender = renderTelegramInputRequest(request, channel.state);
          text = defaultRender.text;

          const hasInline = (defaultRender.replyMarkup as any)?.inline_keyboard || (defaultRender.replyMarkup as any)?.inlineKeyboard;

          if (hasInline) {
            replyMarkup = defaultRender.replyMarkup;
          } else {
            // Blindamos el teclado inferior persistente
            replyMarkup = {
              keyboard: [
                [{ text: "📦 Auditar Stock" }, { text: "🛒 Calcular Orden Óptima" }]
              ],
              resize_keyboard: true,
              resizeKeyboard: true,
              one_time_keyboard: false,
              oneTimeKeyboard: false
            };
          }

          freeformRequestId = defaultRender.freeformRequestId;
        }

        // Enviamos el payload duplicando la raíz del markup para evitar rechazos del SDK
        const result = await channel.telegram.post({
          text,
          reply_markup: replyMarkup,
          replyMarkup: replyMarkup
        } as any);

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