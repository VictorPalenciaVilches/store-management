'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ShoppingCart, CreditCard } from 'lucide-react'

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [salesData, setSalesData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchReports() }, [period])

  const fetchReports = async () => {
    setLoading(true)
    const now = new Date()
    let startDate = new Date()

    if (period === 'daily') startDate.setDate(now.getDate() - 7)
    else if (period === 'weekly') startDate.setDate(now.getDate() - 28)
    else if (period === 'monthly') startDate.setMonth(now.getMonth() - 6)
    else startDate.setFullYear(now.getFullYear() - 1)

    const [{ data: sales }, { data: items }, { data: credits }] = await Promise.all([
      supabase.from('sales').select('total, created_at, payment_type').gte('created_at', startDate.toISOString().split('T')[0]),
      supabase.from('sale_items').select('product_name, quantity, subtotal'),
      supabase.from('credits').select('remaining_amount').neq('status', 'paid'),
    ])

    const total = sales?.reduce((acc, s) => acc + s.total, 0) || 0
    setTotalSales(total)
    setTotalCredits(credits?.reduce((acc, c) => acc + c.remaining_amount, 0) || 0)

    const grouped: Record<string, number> = {}
    sales?.forEach(sale => {
      const date = new Date(sale.created_at)
      let key = ''
      if (period === 'daily') key = date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
      else if (period === 'weekly') key = `Sem ${Math.ceil(date.getDate() / 7)}`
      else if (period === 'monthly') key = date.toLocaleDateString('es-CO', { month: 'short' })
      else key = date.getFullYear().toString()
      grouped[key] = (grouped[key] || 0) + sale.total
    })
    setSalesData(Object.entries(grouped).map(([name, total]) => ({ name, total })))

    const productMap: Record<string, { name: string, quantity: number, total: number }> = {}
    items?.forEach(item => {
      if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, quantity: 0, total: 0 }
      productMap[item.product_name].quantity += item.quantity
      productMap[item.product_name].total += item.subtotal
    })
    setTopProducts(Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 5))
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Estadísticas de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-50 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
            <p className="text-sm text-gray-500">Total ventas</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSales)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 p-2 rounded-lg"><ShoppingCart className="w-5 h-5 text-blue-500" /></div>
            <p className="text-sm text-gray-500">Ventas registradas</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{salesData.reduce((a, b) => a + 1, 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-50 p-2 rounded-lg"><CreditCard className="w-5 h-5 text-red-500" /></div>
            <p className="text-sm text-gray-500">Fiados pendientes</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalCredits)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}>
            {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensual' : 'Anual'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Ventas por período</h2>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Productos más vendidos</h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No hay datos aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{index + 1}. {product.name}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(product.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(product.total / topProducts[0].total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
