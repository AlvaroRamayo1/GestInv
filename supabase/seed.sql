-- Datos de prueba para simular el escenario de Relleno Inteligente

-- 1. Insertamos o actualizamos inventario ficticio
-- Usamos INSERT o si tu tabla no lo permite, reemplaza los IDs con los que ya tengas.
INSERT INTO public.inventario (id, producto, stock_actual, stock_minimo)
VALUES 
    (101, 'Laptop Pro X', 2, 5),          -- Crítico (faltan 3)
    (102, 'Monitor 4K', 4, 3),            -- No crítico, pero muy cerca del mínimo. Ideal para relleno.
    (103, 'Teclado Mecánico', 10, 10),    -- No crítico, al límite, no se rellena porque el stock es sano.
    (104, 'Ratón Inalámbrico', 1, 10)     -- Crítico (faltan 9)
ON CONFLICT (id) DO UPDATE SET 
    stock_actual = EXCLUDED.stock_actual, 
    stock_minimo = EXCLUDED.stock_minimo;

-- 2. Proveedores con montos mínimos
INSERT INTO public.proveedores (id, nombre, monto_minimo_compra, contacto)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'TechSupplier Global', 2800.00, 'ventas@techsupplier.com'),
    ('22222222-2222-2222-2222-222222222222', 'Mayorista Electro', 500.00, 'contacto@mayoristaelectro.com')
ON CONFLICT (id) DO NOTHING;

-- 3. Listas de precios cruzadas
INSERT INTO public.lista_precios (producto_id, proveedor_id, precio_unitario)
VALUES 
    -- Precios para Laptop Pro X
    (101, '11111111-1111-1111-1111-111111111111', 800.00), -- Más barato. 3 * 800 = 2400 (no llega al mínimo de 2800)
    (101, '22222222-2222-2222-2222-222222222222', 850.00), -- Más caro.

    -- Precios para Monitor 4K (Usado para relleno en TechSupplier)
    (102, '11111111-1111-1111-1111-111111111111', 250.00),
    (102, '22222222-2222-2222-2222-222222222222', 260.00),

    -- Precios para Teclado
    (103, '11111111-1111-1111-1111-111111111111', 80.00),
    (103, '22222222-2222-2222-2222-222222222222', 75.00),

    -- Precios para Ratón Inalámbrico
    (104, '11111111-1111-1111-1111-111111111111', 45.00),
    (104, '22222222-2222-2222-2222-222222222222', 40.00)  -- Más barato. 9 * 40 = 360 (No llega a 500 solos, pero TechSupplier es más caro).
ON CONFLICT ON CONSTRAINT unique_producto_proveedor DO UPDATE 
    SET precio_unitario = EXCLUDED.precio_unitario;
