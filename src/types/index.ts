export interface Category {
  id: number
  name: string
  type: 'despesa' | 'receita'
  created_at: string
}

export interface Transaction {
  id: number
  description: string
  amount: number
  category_id: number
  type: 'despesa' | 'receita'
  date: string
  source: 'manual' | 'whatsapp'
  created_at: string
}

export interface Budget {
  id: number
  category_id: number
  amount: number
  created_at: string
}

export interface Profile {
  id: string
  avatar_url: string | null
  updated_at: string
}
