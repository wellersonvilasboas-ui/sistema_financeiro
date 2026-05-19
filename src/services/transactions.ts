import { supabase } from '../lib/supabase'
import type { Transaction } from '../types'

export interface TransactionWithCategory extends Transaction {
  categories?: {
    id: number
    name: string
    created_at: string
  } | null
}

/**
 * Busca transações com join na tabela de categorias, aplicando filtros opcionais de mês e categoria
 * @param filters Filtros opcionais de busca (month no formato YYYY-MM, categoryId)
 */
export async function getTransactions(filters?: {
  categoryId?: number
  month?: string
  type?: 'despesa' | 'receita' | 'todos'
}): Promise<TransactionWithCategory[]> {
  let query = supabase
    .from('transactions')
    .select('*, categories(*)')
    .order('date', { ascending: false })
    .order('id', { ascending: false }) // Desempate por ID para manter ordem consistente

  if (filters) {
    // Filtro por Categoria
    if (filters.categoryId && filters.categoryId > 0) {
      query = query.eq('category_id', filters.categoryId)
    }

    // Filtro por Tipo (Receita / Despesa)
    if (filters.type && filters.type !== 'todos') {
      query = query.eq('type', filters.type)
    }

    // Filtro por Mês (calcula os limites do mês)
    if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
      const [year, monthStr] = filters.month.split('-')
      const y = parseInt(year, 10)
      const m = parseInt(monthStr, 10)
      
      const lastDay = new Date(y, m, 0).getDate()
      const startDate = `${year}-${monthStr}-01`
      const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

      query = query.gte('date', startDate).lte('date', endDate)
    }
  }

  const { data, error } = await query

  if (error) { if (import.meta.env.DEV) console.error('[transactions.service] Erro ao buscar transações:', error)
    throw new Error(`Falha ao buscar transações: ${error.message}`)
  }

  return (data as TransactionWithCategory[]) || []
}

/**
 * Cria uma nova transação no banco de dados
 * @param transaction Dados da transação (exceto ID e data de criação)
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> {
  // Validações básicas antes de enviar ao banco
  if (!transaction.description.trim()) {
    throw new Error('A descrição da transação é obrigatória.')
  }
  if (transaction.amount <= 0) {
    throw new Error('O valor da transação deve ser estritamente maior que zero.')
  }
  if (!transaction.category_id || transaction.category_id <= 0) {
    throw new Error('A categoria da transação é obrigatória.')
  }
  if (!transaction.date) {
    throw new Error('A data da transação é obrigatória.')
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        description: transaction.description.trim(),
        amount: transaction.amount,
        category_id: transaction.category_id,
        type: transaction.type || 'despesa',
        date: transaction.date,
        source: transaction.source || 'manual'
      }
    ])
    .select()
    .single()

  if (error) { if (import.meta.env.DEV) console.error('[transactions.service] Erro ao criar transação:', error)
    throw new Error(`Falha ao salvar transação: ${error.message}`)
  }

  return data as Transaction
}

/**
 * Atualiza os dados de uma transação existente
 * @param id ID da transação
 * @param transaction Dados parciais para atualização
 */
export async function updateTransaction(
  id: number,
  transaction: Partial<Omit<Transaction, 'id' | 'created_at'>>
): Promise<Transaction> {
  // Validações básicas se os campos estiverem presentes
  if (transaction.description !== undefined && !transaction.description.trim()) {
    throw new Error('A descrição da transação é obrigatória.')
  }
  if (transaction.amount !== undefined && transaction.amount <= 0) {
    throw new Error('O valor da transação deve ser estritamente maior que zero.')
  }
  if (transaction.category_id !== undefined && (!transaction.category_id || transaction.category_id <= 0)) {
    throw new Error('A categoria da transação é obrigatória.')
  }
  if (transaction.date !== undefined && !transaction.date) {
    throw new Error('A data da transação é obrigatória.')
  }

  const updateData: any = {}
  if (transaction.description !== undefined) updateData.description = transaction.description.trim()
  if (transaction.amount !== undefined) updateData.amount = transaction.amount
  if (transaction.category_id !== undefined) updateData.category_id = transaction.category_id
  if (transaction.type !== undefined) updateData.type = transaction.type
  if (transaction.date !== undefined) updateData.date = transaction.date
  if (transaction.source !== undefined) updateData.source = transaction.source

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) { if (import.meta.env.DEV) console.error('[transactions.service] Erro ao atualizar transação:', error)
    throw new Error(`Falha ao editar transação: ${error.message}`)
  }

  return data as Transaction
}

/**
 * Exclui uma transação do banco de dados
 * @param id ID da transação
 */
export async function deleteTransaction(id: number): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) { if (import.meta.env.DEV) console.error('[transactions.service] Erro ao excluir transação:', error)
    throw new Error(`Falha ao excluir transação: ${error.message}`)
  }
}
