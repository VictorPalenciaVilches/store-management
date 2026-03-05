'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Package, Users, CreditCard, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  lowStockProducts: number
  totalClients: number
  pendingCredits: number
  pendingCreditsAmount: number
  todaySales: number
  todaySalesAmount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalClients: 0,
    pendingCredits: 0,
    pendingCreditsAmount: 0,
    todaySales: 0,
    todaySalesAmount: 0,
  })
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [products, clients, credits, todaySales, lowStock, recent] = await Promise.all([
      supabase.from('products').select('id, stock, min_stock'),
      supabase.from('clients').select('id'),
      supabase.from('credits').select('id, remaining_amount').eq('status', 'pending').or('status.eq.partial'),
      supabase.from('sales').select('id, total').gte('created_at', today.toISOString()),
      supabase.from('products').select('id, name, stock, min_stock').order('stock', { ascending: true }).limit(5),
      supabase.from('sales').select('id, total, payment_type, created_at, clients(full_name)').order('created_at', { ascending: false }).limit(5),
    ])

    const lowStockCount = products.data?.filter(p => p.stock <= p.min_stock).length || 0
    const pendingAmount = credits.data?.reduce((acc, c) => acc + (c.remaining_amount || 0), 0) || 0
    const todayAmount = todaySales.data?.reduce((acc, s) => acc + (s.total || 0), 0) || 0

    setStats({
      totalProducts: products.data?.length || 0,
      lowStockProducts: lowStockCount,
      totalClients: clients.data?.length || 0,
      pendingCredits: credits.data?.length || 0,
      pendingCreditsAmount: pendingAmount,
      todaySales: todaySales.data?.length || 0,
      todaySalesAmount: todayAmount,
    })

    setLowStockItems(lowStock.data?.filter(p => p.stock <= p.min_stock) || [])
    setRecentSales(recent.data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de tu tienda</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            {stats.lowStockProducts > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {stats.lowStockProducts} bajo stock
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
          <p className="text-sm text-gray-500 mt-1">Productos</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.todaySalesAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">Ventas hoy ({stats.todaySales})</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
          <p className="text-sm text-gray-500 mt-1">Clientes</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.pendingCreditsAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">Fiados pendientes ({stats.pendingCredits})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Productos con stock bajo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-800">Productos con stock bajo</h2>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-gray-400 text-sm">Todo el inventario está bien 👍</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{product.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.stock === 0
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {product.stock === 0 ? 'Agotado' : `${product.stock} unidades`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas recientes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-gray-800">Ventas recientes</h2>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ventas registradas aún</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      {sale.clients?.full_name || 'Cliente general'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sale.payment_type === 'cash' ? '💵 Efectivo' : '📋 Fiado'}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
