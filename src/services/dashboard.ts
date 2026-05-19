import { supabase } from '../lib/supabase'
import { getCategories } from './categories'
import { getBudgets } from './budgets'
import { getTransactions } from './transactions'
import type { TransactionWithCategory } from './transactions'
import type { Category } from '../types'

export interface GastoCategoria {
  category_id: number
  category_name: string
  gasto: number
  limite: number | null
}

export interface PeriodoComparacao {
  atual: number
  anterior: number
}

/**
 * Soma total de transactions do mês informado (formato YYYY-MM)
 */
export async function getTotalGasto(mes: string): Promise<number> {
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    throw new Error('Formato de mês inválido. Use YYYY-MM.')
  }

  const [year, monthStr] = mes.split('-')
  const y = parseInt(year, 10)
  const m = parseInt(monthStr, 10)
  
  const lastDay = new Date(y, m, 0).getDate()
  const startDate = `${year}-${monthStr}-01`
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'despesa')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar total gasto:', error)
    throw new Error(`Falha ao calcular gastos: ${error.message}`)
  }

  const total = (data || []).reduce((acc, row) => acc + Number(row.amount), 0)
  return total
}

/**
 * Soma total de todos os limites de budgets definidos
 */
export async function getTotalOrcado(): Promise<number> {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')

  if (error) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar total orçado:', error)
    throw new Error(`Falha ao calcular orçamento total: ${error.message}`)
  }

  const total = (data || []).reduce((acc, row) => acc + Number(row.amount), 0)
  return total
}

/**
 * Total gasto agrupado por categoria no mês informado (formato YYYY-MM)
 */
export async function getGastoPorCategoria(mes: string): Promise<GastoCategoria[]> {
  // Buscamos categorias, orçamentos e transações daquele mês de forma concorrente
  const [categories, budgets, transactions] = await Promise.all([
    getCategories(),
    getBudgets(),
    getTransactions({ month: mes })
  ])

  // Filtramos para apenas despesas
  const despesaCategories = categories.filter(c => c.type === 'despesa')
  const despesaTransactions = transactions.filter(t => t.type === 'despesa')

  // Agrupamos os gastos no Javascript
  const gastosMap: Record<number, number> = {}
  despesaTransactions.forEach((tx) => {
    const cid = tx.category_id
    gastosMap[cid] = (gastosMap[cid] || 0) + Number(tx.amount)
  })

  // Mapeamos a resposta para conter todas as categorias cadastradas no sistema
  const result: GastoCategoria[] = despesaCategories.map((cat) => {
    const budget = budgets.find((b) => b.category_id === cat.id)
    return {
      category_id: cat.id,
      category_name: cat.name,
      gasto: gastosMap[cat.id] || 0,
      limite: budget ? Number(budget.amount) : null
    }
  })

  return result
}

/**
 * Busca as 5 transações mais recentes (com join em categories)
 */
export async function getUltimasTransacoes(): Promise<TransactionWithCategory[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .limit(5)

  if (error) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar últimas transações:', error)
    throw new Error(`Falha ao obter transações recentes: ${error.message}`)
  }

  return (data as TransactionWithCategory[]) || []
}

/**
 * Auxiliar para formatar datas no padrão YYYY-MM-DD
 */
function formatarData(data: Date): string {
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Retorna os totais de dois períodos para comparação
 * @param periodo Tipo de comparação ('semana' | 'mes' | 'ano')
 */
export async function getComparacao(
  periodo: 'semana' | 'mes' | 'ano'
): Promise<PeriodoComparacao> {
  const hoje = new Date()

  if (periodo === 'semana') {
    // Semana Atual: de hoje - 6 dias até hoje inclusive (7 dias)
    const atualFimStr = formatarData(hoje)
    const atualInicio = new Date()
    atualInicio.setDate(hoje.getDate() - 6)
    const atualInicioStr = formatarData(atualInicio)

    // Semana Anterior: de hoje - 13 dias até hoje - 7 dias inclusive (7 dias)
    const anteriorFim = new Date()
    anteriorFim.setDate(hoje.getDate() - 7)
    const anteriorFimStr = formatarData(anteriorFim)

    const anteriorInicio = new Date()
    anteriorInicio.setDate(hoje.getDate() - 13)
    const anteriorInicioStr = formatarData(anteriorInicio)

    const [resAtual, resAnterior] = await Promise.all([
      supabase.from('transactions').select('amount').gte('date', atualInicioStr).lte('date', atualFimStr),
      supabase.from('transactions').select('amount').gte('date', anteriorInicioStr).lte('date', anteriorFimStr)
    ])

    if (resAtual.error || resAnterior.error) {
      const err = resAtual.error || resAnterior.error
      throw new Error(`Erro na comparação semanal: ${err?.message}`)
    }

    return {
      atual: (resAtual.data || []).reduce((acc, row) => acc + Number(row.amount), 0),
      anterior: (resAnterior.data || []).reduce((acc, row) => acc + Number(row.amount), 0)
    }
  }

  if (periodo === 'mes') {
    // Mês Atual
    const y = hoje.getFullYear()
    const m = hoje.getMonth() + 1
    const mesAtualStr = `${y}-${String(m).padStart(2, '0')}`

    // Mês Anterior
    let yAnt = y
    let mAnt = m - 1
    if (mAnt === 0) {
      mAnt = 12
      yAnt = y - 1
    }
    const mesAnteriorStr = `${yAnt}-${String(mAnt).padStart(2, '0')}`

    const [atual, anterior] = await Promise.all([
      getTotalGasto(mesAtualStr),
      getTotalGasto(mesAnteriorStr)
    ])

    return { atual, anterior }
  }

  if (periodo === 'ano') {
    // Ano Atual: de YYYY-01-01 a YYYY-12-31
    const y = hoje.getFullYear()
    const anoAtualInicio = `${y}-01-01`
    const anoAtualFim = `${y}-12-31`

    // Ano Anterior: de (YYYY-1)-01-01 a (YYYY-1)-12-31
    const anoAnteriorInicio = `${y - 1}-01-01`
    const anoAnteriorFim = `${y - 1}-12-31`

    const [resAtual, resAnterior] = await Promise.all([
      supabase.from('transactions').select('amount').gte('date', anoAtualInicio).lte('date', anoAtualFim),
      supabase.from('transactions').select('amount').gte('date', anoAnteriorInicio).lte('date', anoAnteriorFim)
    ])

    if (resAtual.error || resAnterior.error) {
      const err = resAtual.error || resAnterior.error
      throw new Error(`Erro na comparação anual: ${err?.message}`)
    }

    return {
      atual: (resAtual.data || []).reduce((acc, row) => acc + Number(row.amount), 0),
      anterior: (resAnterior.data || []).reduce((acc, row) => acc + Number(row.amount), 0)
    }
  }

  throw new Error('Tipo de período para comparação inválido.')
}

/**
 * Soma total de transações no intervalo especificado (apenas despesas)
 */
export async function getTotalGastoRange(startDate: string, endDate: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'despesa')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar total gasto no intervalo:', error)
    throw new Error(`Falha ao calcular gastos: ${error.message}`)
  }

  const total = (data || []).reduce((acc, row) => acc + Number(row.amount), 0)
  return total
}

/**
 * Soma total de transações no intervalo especificado (apenas receitas)
 */
export async function getTotalReceitaRange(startDate: string, endDate: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'receita')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar total receita no intervalo:', error)
    throw new Error(`Falha ao calcular receitas: ${error.message}`)
  }

  const total = (data || []).reduce((acc, row) => acc + Number(row.amount), 0)
  return total
}

/**
 * Total gasto agrupado por categoria no intervalo de datas especificado (apenas despesas)
 */
export async function getGastoPorCategoriaRange(startDate: string, endDate: string): Promise<GastoCategoria[]> {
  // Buscamos categorias (somente do tipo despesa), orçamentos e transações do intervalo concorrentemente
  const [
    { data: categoriesData, error: catError },
    budgets,
    { data: transactions, error: txError }
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('type', 'despesa')
      .order('id', { ascending: true }),
    getBudgets(),
    supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('type', 'despesa')
      .gte('date', startDate)
      .lte('date', endDate)
  ])

  if (catError) {
    if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar categorias de despesa:', catError)
    throw new Error(`Falha ao carregar categorias: ${catError.message}`)
  }

  if (txError) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar transações por categoria no intervalo:', txError)
    throw new Error(`Falha ao calcular gastos por categoria: ${txError.message}`)
  }

  const categories = (categoriesData as Category[]) || []

  // Agrupamos os gastos no Javascript
  const gastosMap: Record<number, number> = {}
  ;(transactions || []).forEach((tx) => {
    const cid = tx.category_id
    gastosMap[cid] = (gastosMap[cid] || 0) + Number(tx.amount)
  })

  // Mapeamos a resposta para conter todas as categorias de despesa cadastradas no sistema
  const result: GastoCategoria[] = categories.map((cat) => {
    const budget = budgets.find((b) => b.category_id === cat.id)
    return {
      category_id: cat.id,
      category_name: cat.name,
      gasto: gastosMap[cat.id] || 0,
      limite: budget ? Number(budget.amount) : null
    }
  })

  return result
}

/**
 * Busca todas as transações dentro do intervalo de datas especificado
 */
export async function getTransactionsRange(startDate: string, endDate: string): Promise<TransactionWithCategory[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('id', { ascending: false })

  if (error) { if (import.meta.env.DEV) console.error('[dashboard.service] Erro ao buscar transações no intervalo:', error)
    throw new Error(`Falha ao obter transações: ${error.message}`)
  }

  return (data as TransactionWithCategory[]) || []
}

/**
 * Retorna os totais de dois intervalos com base na opção selecionada para comparação
 */
export async function getComparacaoRange(
  periodo: 'este_mes_vs_mes_passado' | 'esta_semana_vs_semana_passada' | 'este_ano_vs_ano_passado' | 'ultimos_7_dias_vs_7_anteriores' | 'ultimos_14_dias_vs_14_anteriores'
): Promise<PeriodoComparacao> {
  const hoje = new Date()
  let atualInicio = ''
  let atualFim = ''
  let anteriorInicio = ''
  let anteriorFim = ''

  if (periodo === 'ultimos_7_dias_vs_7_anteriores') {
    atualFim = formatarData(hoje)
    const aIni = new Date()
    aIni.setDate(hoje.getDate() - 6)
    atualInicio = formatarData(aIni)

    const antFim = new Date()
    antFim.setDate(hoje.getDate() - 7)
    anteriorFim = formatarData(antFim)

    const antIni = new Date()
    antIni.setDate(hoje.getDate() - 13)
    anteriorInicio = formatarData(antIni)
  } 
  else if (periodo === 'ultimos_14_dias_vs_14_anteriores') {
    atualFim = formatarData(hoje)
    const aIni = new Date()
    aIni.setDate(hoje.getDate() - 13)
    atualInicio = formatarData(aIni)

    const antFim = new Date()
    antFim.setDate(hoje.getDate() - 14)
    anteriorFim = formatarData(antFim)

    const antIni = new Date()
    antIni.setDate(hoje.getDate() - 27)
    anteriorInicio = formatarData(antIni)
  }
  else if (periodo === 'esta_semana_vs_semana_passada') {
    // Segunda-feira desta semana
    const day = hoje.getDay()
    const diff = hoje.getDate() - day + (day === 0 ? -6 : 1)
    const segAtual = new Date(hoje)
    segAtual.setDate(diff)
    atualInicio = formatarData(segAtual)
    
    // Domingo desta semana
    const domAtual = new Date(segAtual)
    domAtual.setDate(segAtual.getDate() + 6)
    atualFim = formatarData(domAtual)

    // Segunda-feira da semana passada
    const segAnt = new Date(segAtual)
    segAnt.setDate(segAtual.getDate() - 7)
    anteriorInicio = formatarData(segAnt)

    // Domingo da semana passada
    const domAnt = new Date(segAnt)
    domAnt.setDate(segAnt.getDate() + 6)
    anteriorFim = formatarData(domAnt)
  }
  else if (periodo === 'este_mes_vs_mes_passado') {
    const y = hoje.getFullYear()
    const m = hoje.getMonth() + 1
    const lastDayAtual = new Date(y, m, 0).getDate()
    atualInicio = `${y}-${String(m).padStart(2, '0')}-01`
    atualFim = `${y}-${String(m).padStart(2, '0')}-${String(lastDayAtual).padStart(2, '0')}`

    let yAnt = y
    let mAnt = m - 1
    if (mAnt === 0) {
      mAnt = 12
      yAnt = y - 1
    }
    const lastDayAnt = new Date(yAnt, mAnt, 0).getDate()
    anteriorInicio = `${yAnt}-${String(mAnt).padStart(2, '0')}-01`
    anteriorFim = `${yAnt}-${String(mAnt).padStart(2, '0')}-${String(lastDayAnt).padStart(2, '0')}`
  }
  else if (periodo === 'este_ano_vs_ano_passado') {
    const y = hoje.getFullYear()
    atualInicio = `${y}-01-01`
    atualFim = `${y}-12-31`

    anteriorInicio = `${y - 1}-01-01`
    anteriorFim = `${y - 1}-12-31`
  }

  const [atualVal, anteriorVal] = await Promise.all([
    getTotalGastoRange(atualInicio, atualFim),
    getTotalGastoRange(anteriorInicio, anteriorFim)
  ])

  return {
    atual: atualVal,
    anterior: anteriorVal
  }
}

