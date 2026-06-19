import { createClient } from "@supabase/supabase-js";
import { defineTool } from "eve/tools";
import { z } from "zod";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default defineTool({
    description: "Actualiza el stock actual de un producto en el inventario por su ID",
    inputSchema: z.object({
        productId: z.number().describe("El ID del producto a actualizar"),
        nuevaCantidad: z.number().describe("La nueva cantidad de stock para el producto")
    }),
    async execute({ productId, nuevaCantidad }) {
        const { data, error } = await supabase
            .from('inventario')
            .update({ stock_actual: nuevaCantidad })
            .eq('id', productId)
            .select()

        if (error) {
            return `No se pudo actualizar el stock: ${error.message}`;
        }

        return `Stock actualizado correctamente. Nuevo stock: ${nuevaCantidad}`;
    }
});