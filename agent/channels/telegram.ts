import { telegramChannel, renderTelegramInputRequest, registerTelegramFreeformPrompt } from "eve/channels/telegram";

export default telegramChannel({
  botUsername: "gestinvbot",
  events: {
    "message.completed": async (event, channel, ctx) => {
      // Extraemos el ID del chat
      const chatId = (channel.state as any)?.chatId || (event as any).chatId;
      const text = event.message;

      // Si no hay texto, no enviamos nada
      if (!text) return;

      const replyMarkup = {
        keyboard: [
          [{ text: "📦 Auditar Stock" }, { text: "🛒 Calcular Orden Óptima" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      };

      let resultId: string | undefined;

      if (process.env.TELEGRAM_BOT_TOKEN && chatId) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: text,
              reply_markup: replyMarkup
            })
          });

          const data = await response.json();
          if (data.ok) {
            resultId = String(data.result.message_id);
          }
        } catch (error) {
          console.error("Error en el bypass de Telegram Fetch en message.completed:", error);
        }
      }

      if (!resultId) {
        await channel.telegram.post({ text, reply_markup: replyMarkup } as any);
      }
    },
    "input.requested": async (event, channel) => {
      for (const request of event.requests) {
        let text: string;
        let replyMarkup: any = null;
        let freeformRequestId: string | undefined;

        // Extraemos el ID del chat de forma totalmente segura desde cualquier capa del contexto
        const chatId = (channel.state as any)?.chatId || (event as any).chatId || (event as any).message?.chat?.id;

        if (request.action?.toolName === "solicitar_aprobacion") {
          const input = request.action.input as { mensaje?: string };
          const mensaje = input?.mensaje || "Se requiere confirmación para continuar.";

          text = `Solicitud de Aprobación\n\nPropuesta:\n${mensaje}\n\nPor favor, confirme si aprueba esta solicitud.`;

          const defaultRender = renderTelegramInputRequest(request, channel.state);
          freeformRequestId = defaultRender.freeformRequestId;

          // Inline Keyboard nativo estructurado perfectamente para la API de Telegram
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
            // Teclado inferior físico nativo estructurado perfectamente
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

        let resultId: string | undefined;

        // BYPASS: Enviamos directo a Telegram vía HTTPS usando el token de tu entorno
        if (process.env.TELEGRAM_BOT_TOKEN && chatId) {
          try {
            const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: text,
                reply_markup: replyMarkup
              })
            });

            const data = await response.json();
            if (data.ok) {
              resultId = String(data.result.message_id);
            }
          } catch (error) {
            console.error("Error en el bypass de Telegram Fetch:", error);
          }
        }

        // Fallback de seguridad: Si no hay token en el .env, usa el método por defecto
        if (!resultId) {
          const result = await channel.telegram.post({ text, reply_markup: replyMarkup } as any);
          resultId = result?.id ? String(result.id) : undefined;
        }

        // Le registramos el ID del mensaje enviado a Eve para que sepa procesar el botón cuando lo clickeen
        if (freeformRequestId && resultId) {
          registerTelegramFreeformPrompt(channel.state, {
            messageId: resultId,
            requestId: freeformRequestId
          });
        }
      }
    }
  }
});