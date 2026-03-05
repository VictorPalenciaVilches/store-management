'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, daysSince } from '@/lib/utils'
import { Plus, X, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Credit, Client } from '@/types'

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all')
  const [form, setForm] = useState({ client_id: '', description: '', total_amount: '', due_date: '' })
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: creds }, { data: cls }] = await Promise.all([
      supabase.from('credits').select('*, client:clients(*)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('full_name'),
    ])
    setCredits(creds || [])
    setClients(cls || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.client_id || !form.description || !form.total_amount) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('credits').insert({
      client_id: form.client_id,
      description: form.description,
      total_amount: parseFloat(form.total_amount),
      paid_amount: 0,
      due_date: form.due_date || null,
      status: 'pending',
      user_id: user.id,
    })
    setShowModal(false)
    setForm({ client_id: '', description: '', total_amount: '', due_date: '' })
    fetchData()
  }

  const handlePayment = async () => {
    if (!selectedCredit || !paymentAmount) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const amount = parseFloat(paymentAmount)
    const newPaid = selectedCredit.paid_amount + amount
    const newStatus = newPaid >= selectedCredit.total_amount ? 'paid' : 'partial'
    await Promise.all([
      supabase.from('credit_payments').insert({
        credit_id: selectedCredit.id,
        amount,
        notes: paymentNotes || null,
        user_id: user.id,
      }),
      supabase.from('credits').update({
        paid_amount: newPaid,
        status: newStatus,
      }).eq('id', selectedCredit.id),
    ])
    setShowPaymentModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    setSelectedCredit(null)
    fetchData()
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', class: 'bg-red-100 text-red-600', icon: AlertCircle }
      case 'partial': return { label: 'Abonado', class: 'bg-amber-100 text-amber-600', icon: Clock }
      case 'paid': return { label: 'Pagado', class: 'bg-emerald-100 text-emerald-600', icon: CheckCircle }
      default: return { label: status, class: 'bg-gray-100 text-gray-600', icon: Clock }
    }
  }

  const filtered = credits.filter(c => filter === 'all' ? true : c.status === filter)
  const totalPending = credits.filter(c => c.status !== 'paid').reduce((acc, c) => acc + c.remaining_amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fiados</h1>
          <p className="text-gray-500 text-sm mt-1">Total pendiente: <span className="font-semibold text-red-500">{formatCurrency(totalPending)}</span></p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo fiado
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'partial', 'paid'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'partial' ? 'Abonados' : 'Pagados'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-xl border border-gray-100">
          <CreditCard className="w-12 h-12 mb-2 opacity-30" />
          <p className="text-sm">No hay fiados registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((credit) => {
            const status = getStatusInfo(credit.status)
            const StatusIcon = status.icon
            const progress = (credit.paid_amount / credit.total_amount) * 100
            return (
              <div key={credit.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{credit.client?.full_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{credit.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Hace {daysSince(credit.created_at)} días</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${status.class}`}>
                    <StatusIcon className="w-3 h-3" /> {status.label}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progreso de pago</span>
                    <span className="font-medium">{formatCurrency(credit.paid_amount)} / {formatCurrency(credit.total_amount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-red-500">Debe: {formatCurrency(credit.remaining_amount)}</p>
                  {credit.status !== 'paid' && (
                    <button
                      onClick={() => { setSelectedCredit(credit); setShowPaymentModal(true) }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Registrar abono
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Nuevo fiado</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cliente </label>
                <select value={form.client_id} onChange={(e) => setForm({...form, client_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción </label>
                <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="¿Qué llevó fiado?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Monto total </label>
                <input type="number" value={form.total_amount} onChange={(e) => setForm({...form, total_amount: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha límite de pago</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
                  registrar fiado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Registrar abono</h2>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{selectedCredit.client?.full_name}</span></p>
              <p className="text-sm text-gray-600 mt-1">Deuda restante: <span className="font-medium text-red-500">{formatCurrency(selectedCredit.remaining_amount)}</span></p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Monto del abono *</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notas</label>
                <input type="text" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observaciones del abono..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handlePayment}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
                  Registrar abono
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
