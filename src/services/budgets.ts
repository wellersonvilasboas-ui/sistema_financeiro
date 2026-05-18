import { supabase } from '../lib/supabase'
import type { Budget } from '../types'

/**
 * Busca todos os registros de limites mensais (budgets) da tabela
 */
export async function getBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('id', { ascending: true })

  if (error) { if (import.meta.env.DEV) console.error('[budgets.service] Erro ao buscar orçamentos/metas:', error)
    throw new Error(`Falha ao buscar metas: ${error.message}`)
  }

  return (data as Budget[]) || []
}

/**
 * Cria uma nova meta de limite mensal para uma categoria
 * @param budget Dados da meta (category_id e amount)
 */
export async function createBudget(budget: {
  category_id: number
  amount: number
}): Promise<Budget> {
  if (!budget.category_id || budget.category_id <= 0) {
    throw new Error('A categoria da meta é obrigatória.')
  }
  if (budget.amount <= 0) {
    throw new Error('O valor do limite mensal deve ser maior que zero.')
  }

  const { data, error } = await supabase
    .from('budgets')
    .insert([
      {
        category_id: budget.category_id,
        amount: budget.amount
      }
    ])
    .select()
    .single()

  if (error) { if (import.meta.env.DEV) console.error('[budgets.service] Erro ao criar orçamento/meta:', error)
    throw new Error(`Falha ao salvar limite: ${error.message}`)
  }

  return data as Budget
}

/**
 * Atualiza o limite mensal existente
 * @param id ID do orçamento/meta
 * @param amount Novo valor do limite
 */
export async function updateBudget(id: number, amount: number): Promise<Budget> {
  if (amount <= 0) {
    throw new Error('O valor do limite mensal deve ser maior que zero.')
  }

  const { data, error } = await supabase
    .from('budgets')
    .update({ amount })
    .eq('id', id)
    .select()
    .single()

  if (error) { if (import.meta.env.DEV) console.error('[budgets.service] Erro ao atualizar orçamento/meta:', error)
    throw new Error(`Falha ao editar limite: ${error.message}`)
  }

  return data as Budget
}
