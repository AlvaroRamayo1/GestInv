import { createClient } from '@supabase/supabase-js';
import { defineTool } from "eve/tools";
import { z } from "zod";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default defineTool({
    description: "Agrega un nuevo proveedor a la base de datos.",
    inputSchema: z.object({
        nombre: z.string().describe("El nombre del proveedor."),
        monto_minimo_compra: z.number().describe("El monto mínimo de compra exigido por el proveedor. Si no se especifica, se asume 0."),
        contacto: z.string().optional().describe("Información de contacto del proveedor (teléfono, email, etc.).")
    }),
    async execute({ nombre, monto_minimo_compra, contacto }) {
        try {
            const { data, error } = await supabase
                .from('proveedores')
                .insert([
                    { nombre, monto_minimo_compra, contacto }
                ])
                .select();

            if (error) {
                return { exito: false, mensaje: `Error al agregar el proveedor a la base de datos: ${error.message}` };
            }

            return { 
                exito: true, 
                mensaje: `El proveedor ${nombre} fue agregado exitosamente.`,
                proveedor: data[0]
            };
        } catch (error) {
            return { exito: false, mensaje: `Error inesperado: ${error}` };
        }
    }
});
