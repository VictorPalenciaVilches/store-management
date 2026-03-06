# Gestión Granero - Sistema de Gestión para Tiendas

Sistema web completo para la gestión de inventario, ventas, clientes y fiados desarrollado con Next.js 16, TypeScript y Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-3.3-3ECF8E?style=flat&logo=supabase)

##  Características

### Autenticación
- Inicio de sesión y registro de usuarios
- Protección de rutas con middleware
- Sesiones seguras con Supabase Auth

### Inventario
- CRUD completo de productos
- Alertas automáticas de stock bajo
- Carga de imágenes con Next.js Image
- Categorización de productos

### Gestión de Clientes
- Registro y edición de clientes
- Información de contacto (teléfono, dirección)
- Historial de fiados por cliente

### Sistema de Ventas
- Carrito de compras interactivo
- Soporte para pagos en efectivo o fiado
- Actualización automática de inventario
- Registro detallado de cada venta

### Fiados (Créditos)
- Control de fiados por cliente
- Sistema de abonos con seguimiento
- Barra de progreso de pago
- Estados: Pendiente, Parcial, Pagado

### Reportes
- Gráficos de ventas por período
- Productos más vendidos
- Totales de ventas y fiados pendientes
- Filtros: Diario, Semanal, Mensual, Anual

### Recordatorios
- Lista de cobros pendientes ordenada por antigüedad
- Indicadores de urgencia (Urgente, Atención, Normal)
- Acceso rápido para llamar a clientes

##  Tecnologías

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Estilos**: TailwindCSS 3.4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Gráficos**: Recharts
- **Iconos**: Lucide React

##  Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

##  Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd store-management
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

> **Nota:** Estas credenciales son de tu proyecto de Supabase. Si necesitas usar otro proyecto, obtén las credenciales en Supabase Dashboard → Settings → API.

4. **Ejecutar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

##  Estructura de la Base de Datos

### Tablas Principales

```sql
-- Perfiles de usuarios
profiles (id, full_name, email, avatar_url)

-- Categorías de productos
categories (id, name, description, user_id)

-- Productos
products (id, name, description, price, stock, min_stock, image_url, category_id, user_id)

-- Clientes
clients (id, full_name, phone, address, notes, user_id)

-- Fiados
credits (id, client_id, description, total_amount, paid_amount, remaining_amount, status, due_date, user_id)

-- Abonos a fiados
credit_payments (id, credit_id, amount, notes, user_id)

-- Ventas
sales (id, total, notes, payment_type, client_id, user_id)

-- Ítems de venta
sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
```

##  Diseño Responsivo

La aplicación está optimizada para:
-  Teléfonos móviles
-  Tablets
-  Computadoras de escritorio

##  Seguridad

- Row Level Security (RLS) en todas las tablas
- Políticas de acceso por usuario
- Middleware de protección de rutas
- Autenticación requerida para acceso

##  Licencia

Este proyecto fue desarrollado como prueba técnica.


