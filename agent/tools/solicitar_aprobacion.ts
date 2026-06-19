import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

export default defineTool({
  description: "Solicita la aprobacion del usuario para continuar con una orden de compra o una actualizacion de inventario.",
  inputSchema: z.object({
    mensaje: z.string().describe("El mensaje detallado de la propuesta de orden de compra o la accion a aprobar"),
  }),
  needsApproval: always(),
  async execute({ mensaje }) {
    return `La solicitud ha sido aprobada por el usuario: "${mensaje}"`;
  }
});
