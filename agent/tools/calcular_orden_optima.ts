import { createClient } from '@supabase/supabase-js';
import { defineTool } from "eve/tools";
import { z } from "zod";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default defineTool({
    description: "Calcula la orden de compra óptima. Soporta ignorar productos específicos y ajustarse a un presupuesto máximo.",
    inputSchema: z.object({
        productos_excluidos: z.array(z.string()).optional().describe("Lista de nombres de productos a excluir de la orden (porque el usuario los rechazó o no los quiere)."),
        presupuesto_maximo: z.number().optional().describe("Monto máximo en dólares/pesos que el usuario está dispuesto a gastar. Si la orden lo supera, se omitirán los productos menos urgentes.")
    }),
    async execute({ productos_excluidos, presupuesto_maximo }) {
        try {
            let [{ data: invData, error: errInv }, { data: provData, error: errProv }, { data: preciosData, error: errPrec }] = await Promise.all([
                supabase.from('inventario').select('*'),
                supabase.from('proveedores').select('*'),
                supabase.from('lista_precios').select('*')
            ]);

            if (errInv || errProv || errPrec) return { exito: false, mensaje: `Error consultando base de datos.` };
            if (!invData || !provData || !preciosData) return { exito: false, mensaje: "Faltan datos." };

            // Filtrar productos excluidos
            if (productos_excluidos && productos_excluidos.length > 0) {
                const excluidosLower = productos_excluidos.map(p => p.toLowerCase());
                invData = invData.filter(p => !excluidosLower.includes(p.producto.toLowerCase()));
            }

            let criticos = invData.filter(p => p.stock_actual < p.stock_minimo);
            const proveedoresMap = new Map(provData.map(p => [p.id, p]));
            const inventarioMap = new Map(invData.map(p => [p.id, p]));
            
            const getPreciosProducto = (prodId: string) => {
                return preciosData
                    .filter(p => p.producto_id === prodId)
                    .sort((a, b) => a.precio_unitario - b.precio_unitario);
            };

            let presupuestoCumplido = false;
            let iteracionesPresupuesto = 0;
            let resultadoFinal: any[] = [];
            let advertenciaPresupuesto = false;
            let productosSacrificados: string[] = [];

            // Bucle Exterior: Límite de Presupuesto
            while (!presupuestoCumplido && iteracionesPresupuesto < 20) {
                iteracionesPresupuesto++;
                
                if (criticos.length === 0) {
                    break;
                }

                const intentoPorProducto: Record<string, number> = {};
                criticos.forEach(c => intentoPorProducto[c.id] = 0);

                let solucionEncontrada = false;
                let iteraciones = 0;
                let ordenes: Record<string, any> = {};

                // Bucle Interior: Satisfacer mínimos por proveedor
                while (!solucionEncontrada && iteraciones < 10) {
                    iteraciones++;
                    ordenes = {};
                    
                    for (const c of criticos) {
                        const preciosDisponibles = getPreciosProducto(c.id);
                        const intento = intentoPorProducto[c.id];
                        
                        if (intento < preciosDisponibles.length) {
                            const precioElegido = preciosDisponibles[intento];
                            const provId = precioElegido.proveedor_id;
                            
                            if (!ordenes[provId]) {
                                ordenes[provId] = { proveedor: proveedoresMap.get(provId), productos: [], total: 0, estrategia: 'Normal', cumple_minimo: true };
                            }
                            
                            const cantidadNecesaria = c.stock_minimo - c.stock_actual;
                            const subtotal = cantidadNecesaria * precioElegido.precio_unitario;
                            
                            ordenes[provId].productos.push({
                                producto_id: c.id, nombre: c.producto, cantidad: cantidadNecesaria, precio_unitario: precioElegido.precio_unitario, subtotal: subtotal, es_relleno: false
                            });
                            ordenes[provId].total += subtotal;
                        }
                    }

                    let todosCumplen = true;
                    
                    for (const provId in ordenes) {
                        const orden = ordenes[provId];
                        const montoMinimo = Number(orden.proveedor.monto_minimo_compra);

                        if (orden.total < montoMinimo) {
                            const productosDelProveedor = preciosData.filter(p => p.proveedor_id === provId);
                            const posiblesRellenos = productosDelProveedor.filter(p => {
                                const inv = inventarioMap.get(p.producto_id);
                                if (!inv) return false;
                                const yaEnOrden = orden.productos.some((op: any) => op.producto_id === p.producto_id);
                                return !yaEnOrden && inv.stock_actual >= inv.stock_minimo && inv.stock_actual <= (inv.stock_minimo * 1.5);
                            });

                            posiblesRellenos.sort((a, b) => {
                                const invA = inventarioMap.get(a.producto_id);
                                const invB = inventarioMap.get(b.producto_id);
                                if(!invA || !invB) return 0;
                                return (invA.stock_actual / invA.stock_minimo) - (invB.stock_actual / invB.stock_minimo);
                            });

                            for (const pr of posiblesRellenos) {
                                if (orden.total >= montoMinimo) break;
                                const inv = inventarioMap.get(pr.producto_id);
                                if(!inv) continue;
                                const cantidadParaRellenar = Math.ceil((inv.stock_minimo * 1.5) - inv.stock_actual);
                                const cantidadSugerida = cantidadParaRellenar > 0 ? cantidadParaRellenar : 1;
                                const subtotalRelleno = cantidadSugerida * pr.precio_unitario;
                                
                                orden.productos.push({
                                    producto_id: pr.producto_id, nombre: inv.producto, cantidad: cantidadSugerida, precio_unitario: pr.precio_unitario, subtotal: subtotalRelleno, es_relleno: true
                                });
                                orden.total += subtotalRelleno;
                                orden.estrategia = 'Relleno Inteligente';
                            }

                            if (orden.total < montoMinimo) {
                                todosCumplen = false;
                                orden.cumple_minimo = false;
                                const criticosEnOrden = orden.productos.filter((p: any) => !p.es_relleno);
                                for (const c of criticosEnOrden) {
                                    intentoPorProducto[c.producto_id]++;
                                }
                                break; 
                            }
                        }
                    }

                    if (todosCumplen) {
                        solucionEncontrada = true;
                        resultadoFinal = Object.values(ordenes);
                    } else if (iteraciones === 9) {
                        resultadoFinal = Object.values(ordenes);
                    }
                }

                // Evaluar Presupuesto Global
                let granTotal = resultadoFinal.reduce((sum, ord) => sum + ord.total, 0);
                
                if (presupuesto_maximo && granTotal > presupuesto_maximo) {
                    advertenciaPresupuesto = true;
                    // Sacrificar el menos urgente (mayor ratio stock_actual/stock_minimo)
                    criticos.sort((a, b) => (b.stock_actual / b.stock_minimo) - (a.stock_actual / a.stock_minimo));
                    const sacrificado = criticos.shift(); 
                    if (sacrificado) {
                        productosSacrificados.push(sacrificado.producto);
                    }
                } else {
                    presupuestoCumplido = true;
                }
            }

            if (resultadoFinal.length === 0 && productosSacrificados.length > 0) {
                 return {
                     exito: true,
                     mensaje: `El presupuesto máximo de $${presupuesto_maximo} no es suficiente para comprar ninguno de los productos cumpliendo los mínimos exigidos por los proveedores.`,
                     ordenes: [],
                     gran_total: 0
                 };
            }

            if (resultadoFinal.length === 0) {
                return { exito: true, mensaje: "Inventario verificado. No hay productos críticos o todos fueron excluidos.", ordenes: [] };
            }
            
            return {
                exito: true,
                mensaje: advertenciaPresupuesto ? "Órdenes ajustadas para respetar el límite de presupuesto." : "Órdenes óptimas calculadas correctamente.",
                ordenes: resultadoFinal,
                gran_total: resultadoFinal.reduce((sum, ord) => sum + ord.total, 0),
                productos_sacrificados_por_presupuesto: productosSacrificados.length > 0 ? productosSacrificados : undefined
            };

        } catch (error) {
            return { exito: false, mensaje: `Error inesperado: ${error}` };
        }
    }
});
