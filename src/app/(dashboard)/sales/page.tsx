'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X, ShoppingCart, Trash2 } from 'lucide-react'
import { Product, Client } from '@/types'

interface CartItem {
  product: Product
  quantity: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: s }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('sales').select('*, client:clients(full_name), sale_items(*)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').gt('stock', 0).order('name'),
      supabase.from('clients').select('*').order('full_name'),
    ])
    setSales(s || [])
    setProducts(p || [])
    setClients(c || [])
    setLoading(false)
  }

  const addToCart = () => {
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    const qty = parseInt(quantity)
    if (qty <= 0 || qty > product.stock) return
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id
        ? { ...item, quantity: item.quantity + qty } : item))
    } else {
      setCart([...cart, { product, quantity: qty }])
    }
    setSelectedProduct('')
    setQuantity('1')
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)

  const handleSubmit = async () => {
    if (cart.length === 0) return
    if (paymentType === 'credit' && !clientId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sale } = await supabase.from('sales').insert({
      total,
      notes: notes || null,
      payment_type: paymentType,
      client_id: clientId || null,
      user_id: user.id,
    }).select().single()

    if (!sale) return

    await supabase.from('sale_items').insert(
      cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }))
    )

    for (const item of cart) {
      await supabase.from('products').update({
        stock: item.product.stock - item.quantity
      }).eq('id', item.product.id)
    }

    if (paymentType === 'credit' && clientId) {
      await supabase.from('credits').insert({
        client_id: clientId,
        description: `Venta del ${new Date().toLocaleDateString('es-CO')}`,
        total_amount: total,
        paid_amount: 0,
        status: 'pending',
        user_id: user.id,
      })
    }

    setShowModal(false)
    setCart([])
    setPaymentType('cash')
    setClientId('')
    setNotes('')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta venta?')) return
    await supabase.from('sale_items').delete().eq('sale_id', id)
    await supabase.from('sales').delete().eq('id', id)
    fetchData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-gray-500 text-sm mt-1">{sales.length} ventas registradas</p>
        </div>
        <button onClick={() => { setShowModal(true); setCart([]) }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva venta
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-xl border border-gray-100">
          <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
          <p className="text-sm">No hay ventas registradas</p>
        </div>
      ) : (
        <>
          <div className="lg:hidden divide-y divide-gray-100 bg-white rounded-xl border border-gray-100">
            {sales.map((sale) => (
              <div key={sale.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{sale.client?.full_name || 'Cliente general'}</p>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(sale.total)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{formatDate(sale.created_at)}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      sale.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {sale.payment_type === 'cash' ? 'Efectivo' : 'Fiado'}
                    </span>
                    <button onClick={() => handleDelete(sale.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Productos</th>
                <th className="px-6 py-3 text-left">Pago</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sale.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{sale.client?.full_name || 'Cliente general'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.sale_items?.length || 0} items</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      sale.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {sale.payment_type === 'cash' ? 'Efectivo' : 'Fiado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(sale.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          </>
        )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Nueva venta</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)} (stock: {p.stock})</option>
                  ))}
                </select>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  min="1" className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={addToCart}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
                  Agregar
                </button>
              </div>

              {cart.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Cant.</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Subtotal</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.map((item) => (
                        <tr key={item.product.id}>
                          <td className="px-4 py-2">{item.product.name}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2 font-medium">{formatCurrency(item.product.price * item.quantity)}</td>
                          <td className="px-4 py-2">
                            <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total:</span>
                    <span className="font-bold text-emerald-600 text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de pago</label>
                <div className="flex gap-3">
                  <button onClick={() => setPaymentType('cash')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      paymentType === 'cash' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-300 text-gray-600'
                    }`}>
                    Efectivo
                  </button>
                  <button onClick={() => setPaymentType('credit')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      paymentType === 'credit' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600'
                    }`}>
                    Fiado
                  </button>
                </div>
              </div>

              {paymentType === 'credit' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Cliente *</label>
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Seleccionar cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notas</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de la venta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={cart.length === 0}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  Registrar venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
