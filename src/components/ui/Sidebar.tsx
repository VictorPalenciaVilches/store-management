'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Users, CreditCard,
  ShoppingCart, BarChart3, Bell, ShoppingBasket, LogOut, Menu, X
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventario', icon: Package },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/credits', label: 'Fiados', icon: CreditCard },
  { href: '/sales', label: 'Ventas', icon: ShoppingCart },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/reminders', label: 'Recordatorios', icon: Bell },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-700">
        <div className="bg-emerald-500 p-2 rounded-lg">
          <ShoppingBasket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm">Gestión Granero</h1>
          <p className="text-gray-400 text-xs">Sistema de tienda</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-emerald-500 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <ShoppingBasket className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">Gestión Granero</span>
        </div>
        <button onClick={() => setMobileOpen(true)}>
          <Menu className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        'lg:hidden fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </aside>

      <aside className="hidden lg:flex w-64 min-h-screen bg-gray-900 text-white flex-col">
        <NavContent />
      </aside>
    </>
  )
}
