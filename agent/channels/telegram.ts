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
          const mensaje = input?.mensaje || "Se requiere confirmacion para continuar.";
          
          text = `Solicitud de Aprobacion\n\nPropuesta:\n${mensaje}\n\nPor favor, confirme si aprueba esta solicitud.`;

          const modifiedRequest = {
            ...request,
            options: request.options?.map(opt => {
              if (opt.id === "approve") return { ...opt, label: "Aprobar" };
              if (opt.id === "deny") return { ...opt, label: "Rechazar" };
              return opt;
            })
          };

          const defaultRender = renderTelegramInputRequest(modifiedRequest, channel.state);
          replyMarkup = defaultRender.replyMarkup;
          freeformRequestId = defaultRender.freeformRequestId;
        } else {
          const defaultRender = renderTelegramInputRequest(request, channel.state);
          text = defaultRender.text;
          replyMarkup = defaultRender.replyMarkup || {
            keyboard: [
              [{ text: "📦 Auditar Stock" }, { text: "🛒 Calcular Orden Óptima" }]
            ],
            resize_keyboard: true,
            is_persistent: true
          };
          freeformRequestId = defaultRender.freeformRequestId;
        }

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
