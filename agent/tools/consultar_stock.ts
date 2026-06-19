import { createClient } from '@supabase/supabase-js'
import { defineTool } from "eve/tools";
import { z } from "zod";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default defineTool({
    description: "Consulta el inventario completo, incluyendo stock actual y mínimo de cada producto",
    inputSchema: z.object({}),
    async execute() {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('id, producto, stock_actual, stock_minimo');

            if (error) {
                return `Error consultando stock: ${error.message}`
            }

            if (!data || data.length === 0) {
                return 'No se encontraron productos en el inventario.'
            }

            return data;

        } catch (error) {
            return `Error inesperado al consultar stock: ${error}`
        }
    }
});