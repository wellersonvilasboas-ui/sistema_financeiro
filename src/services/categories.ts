import { supabase } from '../lib/supabase'
import type { Category } from '../types'

/**
 * Busca todas as categorias no banco de dados ordenadas por ID crescente
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id', { ascending: true })

  if (error) { if (import.meta.env.DEV) console.error('[categories.service] Erro ao buscar categorias:', error)
    throw new Error(`Falha ao carregar categorias: ${error.message}`)
  }

  return (data as Category[]) || []
}

/**
 * Cria uma nova categoria no banco de dados
 * @param name Nome da categoria
 */
export async function createCategory(name: string, type: 'despesa' | 'receita' = 'despesa'): Promise<Category> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('O nome da categoria é obrigatório e não pode conter apenas espaços.')
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: trimmedName, type }])
    .select()
    .single()

  if (error) { if (import.meta.env.DEV) console.error('[categories.service] Erro ao criar categoria:', error)
    throw new Error(`Falha ao criar categoria: ${error.message}`)
  }

  return data as Category
}

/**
 * Atualiza o nome de uma categoria existente
 * @param id ID da categoria
 * @param name Novo nome da categoria
 */
export async function updateCategory(id: number, name: string): Promise<Category> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('O nome da categoria é obrigatório e não pode conter apenas espaços.')
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ name: trimmedName })
    .eq('id', id)
    .select()
    .single()

  if (error) { if (import.meta.env.DEV) console.error('[categories.service] Erro ao atualizar categoria:', error)
    throw new Error(`Falha ao editar categoria: ${error.message}`)
  }

  return data as Category
}

/**
 * Exclui uma categoria do banco de dados.
 * Trata erros de restrição de chave estrangeira (código 23503) para lançar uma mensagem amigável.
 * @param id ID da categoria
 */
export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) { if (import.meta.env.DEV) console.error('[categories.service] Erro ao excluir categoria:', error)
    
    // Tratamento específico de erro de violação de chave estrangeira (ON DELETE RESTRICT / código 23503)
    if (error.code === '23503') {
      throw new Error(
        'Esta categoria possui transações vinculadas e não pode ser excluída. Remova ou reclassifique as transações antes de excluir.'
      )
    }

    throw new Error(`Falha ao excluir categoria: ${error.message}`)
  }
}
