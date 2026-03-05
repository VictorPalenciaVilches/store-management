'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, daysSince } from '@/lib/utils'
import { Bell, AlertTriangle, Phone } from 'lucide-react'


export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()


  useEffect(() => { fetchReminders() }, [])


  const fetchReminders = async () => {
    const { data } = await supabase
      .from('credits')
      .select('*, client:clients(full_name, phone)')
      .neq('status', 'paid')
      .order('created_at', { ascending: true })
    setReminders(data || [])
    setLoading(false)
  }


  const getUrgency = (days: number) => {
    if (days >= 30) return { label: 'Urgente', class: 'bg-red-100 text-red-600 border-red-200', border: 'border-red-200' }
    if (days >= 15) return { label: 'Atención', class: 'bg-amber-100 text-amber-600 border-amber-200', border: 'border-amber-200' }
    return { label: 'Normal', class: 'bg-blue-100 text-blue-600 border-blue-200', border: 'border-blue-200' }
  }


  const urgent = reminders.filter(r => daysSince(r.created_at) >= 30)
  const attention = reminders.filter(r => daysSince(r.created_at) >= 15 && daysSince(r.created_at) < 30)
  const normal = reminders.filter(r => daysSince(r.created_at) < 15)


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Recordatorios de cobro</h1>
        <p className="text-gray-500 text-sm mt-1">Clientes con fiados pendientes ordenados por antigüedad</p>
      </div>


      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{urgent.length}</p>
          <p className="text-sm text-red-500 mt-1">Urgentes (+30 días)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{attention.length}</p>
          <p className="text-sm text-amber-500 mt-1">Atención (15-30 días)</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{normal.length}</p>
          <p className="text-sm text-blue-500 mt-1">Recientes (-15 días)</p>
        </div>
      </div>


      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Bell className="w-12 h-12 mb-2 opacity-30" />
          <p className="text-sm">No hay cobros pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders
            .sort((a, b) => daysSince(b.created_at) - daysSince(a.created_at))
            .map((reminder) => {
              const days = daysSince(reminder.created_at)
              const urgency = getUrgency(days)
              return (
                <div key={reminder.id} className={`bg-white rounded-xl p-6 shadow-sm border ${urgency.border}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {days >= 30 && <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                      <div>
                        <h3 className="font-semibold text-gray-800">{reminder.client?.full_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>
                        {reminder.client?.phone && (
                          <a href={`tel:${reminder.client.phone}`}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1">
                            <Phone className="w-3 h-3" /> {reminder.client.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgency.class}`}>
                        {urgency.label}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">{days} días sin pagar</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="w-full bg-gray-100 rounded-full h-2 mr-4">
                      <div className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${Math.min((reminder.paid_amount / reminder.total_amount) * 100, 100)}%` }}>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-red-500 whitespace-nowrap">
                      {formatCurrency(reminder.remaining_amount)}
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
