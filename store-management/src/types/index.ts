export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  user_id: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  min_stock: number
  image_url: string | null
  category_id: string | null
  user_id: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface Client {
  id: string
  full_name: string
  phone: string | null
  address: string | null
  notes: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface Credit {
  id: string
  client_id: string
  description: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: 'pending' | 'partial' | 'paid'
  due_date: string | null
  user_id: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface CreditPayment {
  id: string
  credit_id: string
  amount: number
  notes: string | null
  user_id: string
  created_at: string
}

export interface Sale {
  id: string
  total: number
  notes: string | null
  payment_type: 'cash' | 'credit'
  client_id: string | null
  user_id: string
  created_at: string
  client?: Client
  sale_items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}
