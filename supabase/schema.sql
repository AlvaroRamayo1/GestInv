-- Script para crear el esquema de Proveedores y Lista de Precios

-- Tabla Proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    monto_minimo_compra NUMERIC NOT NULL DEFAULT 0,
    contacto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar RLS en proveedores
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo en proveedores
CREATE POLICY "Permitir select a todos en proveedores" ON public.proveedores FOR SELECT USING (true);
CREATE POLICY "Permitir insert a todos en proveedores" ON public.proveedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update a todos en proveedores" ON public.proveedores FOR UPDATE USING (true);
CREATE POLICY "Permitir delete a todos en proveedores" ON public.proveedores FOR DELETE USING (true);

-- Tabla Lista de Precios
CREATE TABLE IF NOT EXISTS public.lista_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id BIGINT NOT NULL, -- Corregido a BIGINT para coincidir con inventario
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
    precio_unitario NUMERIC NOT NULL CHECK (precio_unitario >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT fk_producto FOREIGN KEY (producto_id) REFERENCES public.inventario(id) ON DELETE CASCADE,
    CONSTRAINT unique_producto_proveedor UNIQUE (producto_id, proveedor_id)
);

-- Habilitar RLS en lista_precios
ALTER TABLE public.lista_precios ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo en lista_precios
CREATE POLICY "Permitir select a todos en lista_precios" ON public.lista_precios FOR SELECT USING (true);
CREATE POLICY "Permitir insert a todos en lista_precios" ON public.lista_precios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update a todos en lista_precios" ON public.lista_precios FOR UPDATE USING (true);
CREATE POLICY "Permitir delete a todos en lista_precios" ON public.lista_precios FOR DELETE USING (true);
