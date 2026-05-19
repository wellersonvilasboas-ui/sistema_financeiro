import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import FAB from '../components/FAB'
import { useNavigate } from 'react-router-dom'
import {
  getTotalOrcado,
  getTotalGastoRange,
  getTotalReceitaRange,
  getGastoPorCategoriaRange,
  getTransactionsRange,
  getComparacaoRange
} from '../services/dashboard'
import type { GastoCategoria } from '../services/dashboard'
import type { TransactionWithCategory } from '../services/transactions'
import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Tv,
  ShoppingCart,
  Fuel,
  Heart,
  BookOpen,
  Home,
  HelpCircle,
  X,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, getCurrencySymbol } from '../utils/format'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts'

export type PeriodoFiltro = 'hoje' | 'ontem' | '7_dias' | '14_dias' | 'este_mes' | 'mes_passado' | 'personalizado'

export type TipoComparacao =
  | 'este_mes_vs_mes_passado'
  | 'esta_semana_vs_semana_passada'
  | 'este_ano_vs_ano_passado'
  | 'ultimos_7_dias_vs_7_anteriores'
  | 'ultimos_14_dias_vs_14_anteriores'

const formatarDataLocal = (data: Date): string => {
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const obterDatasPorPeriodo = (
  periodo: PeriodoFiltro,
  personalizadoInicio?: string,
  personalizadoFim?: string
) => {
  const hoje = new Date()
  let startDate = ''
  let endDate = ''

  switch (periodo) {
    case 'hoje':
      startDate = formatarDataLocal(hoje)
      endDate = formatarDataLocal(hoje)
      break
    case 'ontem': {
      const ontem = new Date()
      ontem.setDate(hoje.getDate() - 1)
      startDate = formatarDataLocal(ontem)
      endDate = formatarDataLocal(ontem)
      break
    }
    case '7_dias': {
      const inicio = new Date()
      inicio.setDate(hoje.getDate() - 6)
      startDate = formatarDataLocal(inicio)
      endDate = formatarDataLocal(hoje)
      break
    }
    case '14_dias': {
      const inicio = new Date()
      inicio.setDate(hoje.getDate() - 13)
      startDate = formatarDataLocal(inicio)
      endDate = formatarDataLocal(hoje)
      break
    }
    case 'este_mes': {
      const y = hoje.getFullYear()
      const m = hoje.getMonth() + 1
      const lastDay = new Date(y, m, 0).getDate()
      startDate = `${y}-${String(m).padStart(2, '0')}-01`
      endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      break
    }
    case 'mes_passado': {
      const y = hoje.getFullYear()
      const m = hoje.getMonth() + 1
      let yAnt = y
      let mAnt = m - 1
      if (mAnt === 0) {
        mAnt = 12
        yAnt = y - 1
      }
      const lastDay = new Date(yAnt, mAnt, 0).getDate()
      startDate = `${yAnt}-${String(mAnt).padStart(2, '0')}-01`
      endDate = `${yAnt}-${String(mAnt).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      break
    }
    case 'personalizado':
      startDate = personalizadoInicio || formatarDataLocal(hoje)
      endDate = personalizadoFim || formatarDataLocal(hoje)
      break
  }

  return { startDate, endDate }
}

const gerarDiasDoPeriodo = (inicio: string, fim: string) => {
  const dates = []
  const current = new Date(`${inicio}T12:00:00Z`)
  const end = new Date(`${fim}T12:00:00Z`)
  while (current <= end) {
    const yyyy = current.getUTCFullYear()
    const mm = String(current.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(current.getUTCDate()).padStart(2, '0')
    dates.push(`${yyyy}-${mm}-${dd}`)
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const hojeStr = formatarDataLocal(new Date())

  // Estados de Filtros e Calendário
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodoFiltro>('este_mes')
  const [filtroComparativo, setFiltroComparativo] = useState<TipoComparacao>('este_mes_vs_mes_passado')
  const [personalizadoInicio, setPersonalizadoInicio] = useState<string>(hojeStr)
  const [personalizadoFim, setPersonalizadoFim] = useState<string>(hojeStr)

  // Estados de dados do Dashboard
  const [totalGastoMes, setTotalGastoMes] = useState<number>(0)
  const [totalReceitaMes, setTotalReceitaMes] = useState<number>(0)
  const [gastosCategorias, setGastosCategorias] = useState<GastoCategoria[]>([])
  const [ultimasTransactions, setUltimasTransactions] = useState<TransactionWithCategory[]>([])


  // Estados de controle de carregamento e erros
  const [loading, setLoading] = useState<boolean>(true)
  const [dbError, setDbError] = useState<string | null>(null)

  // Mapeamento dinâmico de ícones e cores conforme o nome da categoria
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('lazer')) return Tv
    if (name.includes('alimentação') || name.includes('refeições') || name.includes('mercado')) return ShoppingCart
    if (name.includes('transporte') || name.includes('combustível')) return Fuel
    if (name.includes('saúde') || name.includes('médico')) return Heart
    if (name.includes('educação') || name.includes('curso')) return BookOpen
    if (name.includes('moradia') || name.includes('aluguel')) return Home
    if (name.includes('salário') || name.includes('comissão') || name.includes('comissões')) return DollarSign
    if (name.includes('venda') || name.includes('serviço')) return ShoppingCart
    if (name.includes('investimento')) return ArrowUpRight
    return HelpCircle
  }

  const getCategoryIconBg = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('lazer')) return 'bg-red-50 text-red-600'
    if (name.includes('alimentação') || name.includes('refeições') || name.includes('mercado')) return 'bg-indigo-50 text-indigo-600'
    if (name.includes('transporte') || name.includes('combustível')) return 'bg-amber-50 text-amber-600'
    if (name.includes('saúde') || name.includes('médico')) return 'bg-emerald-50 text-emerald-600'
    if (name.includes('educação') || name.includes('curso')) return 'bg-blue-50 text-blue-600'
    if (name.includes('moradia') || name.includes('aluguel')) return 'bg-purple-50 text-purple-600'
    if (name.includes('salário') || name.includes('comissão') || name.includes('venda') || name.includes('serviço') || name.includes('investimento')) {
      return 'bg-emerald-50 text-emerald-600'
    }
    return 'bg-slate-50 text-slate-600'
  }

  // Formatação de data
  const formatTxDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const loadDashboardData = async (start: string, end: string, compType: TipoComparacao) => {
    setLoading(true)
    setDbError(null)

    try {
      const [
        gasto,
        receita,
        _orcado,
        gastosCat,
        txs
      ] = await Promise.all([
        getTotalGastoRange(start, end),
        getTotalReceitaRange(start, end),
        getTotalOrcado(),
        getGastoPorCategoriaRange(start, end),
        getTransactionsRange(start, end),
        getComparacaoRange(compType)
      ])

      setTotalGastoMes(gasto)
      setTotalReceitaMes(receita)
      setGastosCategorias(gastosCat)
      setUltimasTransactions(txs)
    } catch (err: any) {
      console.error('[Dashboard] Erro de carregamento:', err)
      setDbError(err.message || 'Falha ao conectar e buscar métricas do Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroPeriodoChange = (newPeriod: PeriodoFiltro) => {
    setFiltroPeriodo(newPeriod)

    // Mapeamento automático de comparativo com base no filtro de período
    if (newPeriod === '7_dias') {
      setFiltroComparativo('ultimos_7_dias_vs_7_anteriores')
    } else if (newPeriod === '14_dias') {
      setFiltroComparativo('ultimos_14_dias_vs_14_anteriores')
    } else if (newPeriod === 'este_mes') {
      setFiltroComparativo('este_mes_vs_mes_passado')
    } else if (newPeriod === 'hoje' || newPeriod === 'ontem') {
      setFiltroComparativo('esta_semana_vs_semana_passada')
    } else if (newPeriod === 'mes_passado') {
      setFiltroComparativo('este_mes_vs_mes_passado')
    }
  }

  const handleAplicarPersonalizado = (e: React.FormEvent) => {
    e.preventDefault()
    if (personalizadoInicio && personalizadoFim) {
      loadDashboardData(personalizadoInicio, personalizadoFim, filtroComparativo)
    }
  }

  useEffect(() => {
    if (filtroPeriodo !== 'personalizado') {
      const { startDate, endDate } = obterDatasPorPeriodo(filtroPeriodo)
      loadDashboardData(startDate, endDate, filtroComparativo)
    } else {
      if (personalizadoInicio && personalizadoFim) {
        loadDashboardData(personalizadoInicio, personalizadoFim, filtroComparativo)
      } else {
        const { startDate, endDate } = obterDatasPorPeriodo('personalizado', hojeStr, hojeStr)
        loadDashboardData(startDate, endDate, filtroComparativo)
      }
    }
  }, [filtroPeriodo, filtroComparativo])




  // 2. Saldo disponível (orçado total - gasto no período)
  const saldoDisponivel = totalReceitaMes - totalGastoMes

  // 3. Maior gasto
  let maiorGastoCat: GastoCategoria | null = null
  if (gastosCategorias.length > 0) {
    maiorGastoCat = gastosCategorias.reduce((prev, current) => (prev.gasto > current.gasto) ? prev : current)
    if (maiorGastoCat.gasto === 0) maiorGastoCat = null
  }

  // Curated premium color palette for charts
  const chartColorsPalette = [
    '#7F77DD', // Roxo/Violeta principal
    '#10B981', // Verde Esmeralda
    '#0EA5E9', // Sky Blue
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1'  // Indigo
  ]

  // 4. Gráfico de barras horizontais por categoria
  const barChartData = gastosCategorias
    .filter(gc => gc.gasto > 0)
    .sort((a, b) => b.gasto - a.gasto) // Maior para menor
    .map((gc, index) => {
      const barColor = chartColorsPalette[index % chartColorsPalette.length]
      return {
        name: gc.category_name,
        value: gc.gasto,
        color: barColor
      }
    })

  // 5. Progresso das metas: categorias com limite cadastrado
  const activeGoals = gastosCategorias
    .filter((gc) => gc.limite !== null)
    .map((gc) => {
      const limite = gc.limite as number
      const percent = limite === 0 ? 0 : Math.round((gc.gasto / limite) * 100)
      const restante = limite - gc.gasto
      return {
        name: gc.category_name,
        percent,
        gasto: gc.gasto,
        limite: limite,
        restante: restante,
        text: `${formatCurrency(gc.gasto)} / ${formatCurrency(limite)}`
      }
    })
    .sort((a, b) => b.percent - a.percent)

  // 6. Evolução dos Gastos no período (LineChart)
  // Obter inicio e fim real do período selecionado
  const { startDate, endDate } = filtroPeriodo === 'personalizado'
    ? { startDate: personalizadoInicio, endDate: personalizadoFim }
    : obterDatasPorPeriodo(filtroPeriodo)

  const diasPeriodo = gerarDiasDoPeriodo(startDate, endDate)

  const evolutionData = diasPeriodo.map(dia => {
    const txsDoDia = ultimasTransactions.filter(tx => tx.date === dia && tx.type === 'despesa')
    const totalDia = txsDoDia.reduce((acc, tx) => acc + Number(tx.amount), 0)

    // Categorias daquele dia
    const catMap: Record<string, number> = {}
    txsDoDia.forEach(tx => {
      const cName = tx.categories?.name || 'Sem categoria'
      catMap[cName] = (catMap[cName] || 0) + Number(tx.amount)
    })

    const [, m, d] = dia.split('-')
    return {
      dateId: dia,
      dateDisplay: `${d}/${m}`,
      total: totalDia,
      categoriesInfo: Object.entries(catMap).map(([name, val]) => ({ name, val }))
    }
  })

  // Tooltip customizado para o LineChart
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-[#E8E8EE] rounded-[8px] p-3 shadow-sm text-xs font-medium text-[#111827]">
          <p className="font-bold text-sm mb-1">{data.dateDisplay}</p>
          <div className="flex flex-col gap-1 mb-2">
            {data.categoriesInfo.map((cat: any, idx: number) => (
              <div key={idx} className="flex justify-between gap-4 text-[#6B7280]">
                <span>{cat.name}:</span>
                <span className="font-semibold text-[#111827]">{formatCurrency(cat.val)}</span>
              </div>
            ))}
            {data.categoriesInfo.length === 0 && (
              <span className="text-[#9CA3AF]">Nenhum gasto neste dia</span>
            )}
          </div>
          <div className="border-t border-[#E8E8EE] pt-1 flex justify-between gap-4 font-bold text-[#7F77DD]">
            <span>Total:</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Topbar */}
      <Topbar title="Dashboard" />

      {/* Conteúdo scrollável com fundo geral #F4F5F7 */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F4F5F7] flex flex-col gap-5 md:gap-6">

        {/* Banner de Erros do Banco */}
        {dbError && (
          <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] flex items-start gap-2.5 relative animate-in fade-in duration-200">
            <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 pr-6 leading-relaxed">
              {dbError}
            </div>
            <button
              onClick={() => setDbError(null)}
              className="absolute top-3 right-3 text-[#EF4444] hover:opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filtro de Período no Topo do Dashboard */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E8E8EE] rounded-[14px] p-4 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Filtro de Período</h2>
            <p className="text-[11px] text-[#9CA3AF] font-semibold">Defina o intervalo de datas para recalcular os dados</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroPeriodo}
              onChange={(e) => handleFiltroPeriodoChange(e.target.value as PeriodoFiltro)}
              className="px-3 py-1.5 bg-[#F4F5F7] border border-[#E8E8EE] rounded-[8px] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#7F77DD] cursor-pointer"
            >
              <option value="este_mes">Este mês</option>
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="7_dias">Últimos 7 dias</option>
              <option value="14_dias">Últimos 14 dias</option>
              <option value="mes_passado">Mês passado</option>
              <option value="personalizado">Personalizado</option>
            </select>

            {filtroPeriodo === 'personalizado' && (
              <form onSubmit={handleAplicarPersonalizado} className="flex items-center gap-2 animate-in fade-in duration-200">
                <input
                  type="date"
                  value={personalizadoInicio}
                  max={hojeStr}
                  onChange={(e) => setPersonalizadoInicio(e.target.value)}
                  className="px-2 py-1 bg-[#F4F5F7] border border-[#E8E8EE] rounded-[6px] text-xs font-semibold text-[#111827] focus:outline-none"
                  required
                />
                <span className="text-[10px] text-[#9CA3AF] font-bold">até</span>
                <input
                  type="date"
                  value={personalizadoFim}
                  max={hojeStr}
                  onChange={(e) => setPersonalizadoFim(e.target.value)}
                  className="px-2 py-1 bg-[#F4F5F7] border border-[#E8E8EE] rounded-[6px] text-xs font-semibold text-[#111827] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#7F77DD] hover:bg-[#534AB7] text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
            )}
          </div>
        </section>

        {loading ? (
          /* Estado de Carregamento Premium (Skeletons) */
          <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-white border border-[#E8E8EE] rounded-[14px] p-5 h-24 animate-pulse flex flex-col gap-3">
                  <div className="h-4 bg-[#F4F5F7] rounded w-20" />
                  <div className="h-6 bg-[#F4F5F7] rounded w-32" />
                </div>
              ))}
            </div>
            <div className="h-40 bg-white border border-[#E8E8EE] rounded-[14px] animate-pulse" />
            <div className="h-72 bg-white border border-[#E8E8EE] rounded-[14px] animate-pulse" />
            <div className="h-72 bg-white border border-[#E8E8EE] rounded-[14px] animate-pulse" />
          </div>
        ) : (
          <>
            {/* LINHA 1: 3 cards de métricas baseados no banco */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Card 1: Total Receitas */}
              <div className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 group">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    Total Receitas
                  </span>
                  <span className="text-[22px] font-extrabold text-[#15803D] leading-none">
                    {formatCurrency(totalReceitaMes)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#9CA3AF] mt-0.5">
                    recebido no período
                  </span>
                </div>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-[#DCFCE7] text-[#15803D]">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Total Despesas */}
              <div className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 group">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    Total Despesas
                  </span>
                  <span className="text-[22px] font-extrabold text-[#7F77DD] leading-none">
                    {formatCurrency(totalGastoMes)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#9CA3AF] mt-0.5">
                    gasto no período
                  </span>
                </div>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-[#EEEDFE] text-[#7F77DD]">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Saldo Disponível */}
              <div className={`border rounded-[14px] p-[16px_18px] shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 group ${
                saldoDisponivel >= 0
                  ? 'bg-white border-[#E8E8EE]'
                  : 'bg-[#FEE2E2] border-[#FCA5A5]'
              }`}>
                <div className="flex flex-col gap-1.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    saldoDisponivel >= 0 ? 'text-[#9CA3AF]' : 'text-[#EF4444]'
                  }`}>
                    Saldo Disponível
                  </span>
                  <span className={`text-[22px] font-extrabold leading-none ${
                    saldoDisponivel >= 0 ? 'text-[#111827]' : 'text-[#EF4444]'
                  }`}>
                    {saldoDisponivel < 0 ? '-' : ''}{formatCurrency(Math.abs(saldoDisponivel))}
                  </span>
                  <span className={`text-[11px] font-semibold mt-0.5 ${
                    saldoDisponivel >= 0 ? 'text-[#9CA3AF]' : 'text-[#EF4444]'
                  }`}>
                    {saldoDisponivel >= 0 ? 'saldo azul positivo' : 'saldo vermelho (déficit)'}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                  saldoDisponivel >= 0 ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#EF4444] text-white shadow-sm'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </section>

            {/* Evolução de gastos no período (Gráfico 1) */}
            <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm w-full flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  Como seus gastos evoluíram
                </h3>
                <p className="text-[11px] text-[#9CA3AF] font-semibold">
                  Total gasto por dia — passe o mouse para ver o detalhe por categoria
                </p>
              </div>

              {ultimasTransactions.length > 0 ? (
                <div className="h-[260px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={evolutionData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis
                        dataKey="dateDisplay"
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={15}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${getCurrencySymbol()} ${val}`}
                      />
                      <Tooltip content={<CustomLineTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#7F77DD"
                        strokeWidth={3}
                        dot={{ fill: '#7F77DD', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, fill: '#534AB7', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-[#9CA3AF] text-xs font-semibold bg-[#F4F5F7]/30 border border-[#E8E8EE] border-dashed rounded-[10px]">
                  📊 Nenhum gasto registrado neste período.
                </div>
              )}
            </section>

            {/* Progresso das Metas (Gráfico 2) */}
            <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm w-full flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  Quanto você usou de cada meta
                </h3>
                <p className="text-[11px] text-[#9CA3AF] font-semibold">
                  Veja o quanto já consumiu do limite que você definiu por categoria
                </p>
              </div>

              <div className="flex flex-col gap-4 pr-1 scrollbar-thin">
                {activeGoals.length > 0 ? (
                  activeGoals.map((goal, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#111827]">{goal.name}</span>
                        <div className="flex gap-2 text-[#9CA3AF] font-medium">
                          <span>{goal.text}</span>
                        </div>
                      </div>
                      <ProgressBar value={goal.percent} />
                      <div className="flex items-center justify-between text-[10px] font-bold mt-0.5">
                        <span className="text-[#9CA3AF]">
                          {goal.percent}% consumida
                        </span>
                        <span className={goal.restante >= 0 ? 'text-[#15803D]' : 'text-[#EF4444]'}>
                          {goal.restante >= 0 ? `${formatCurrency(goal.restante)} restante` : `${formatCurrency(Math.abs(goal.restante))} excedido`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 text-center text-xs font-semibold text-[#9CA3AF] bg-[#F4F5F7]/30 border border-[#E8E8EE] border-dashed rounded-[10px]">
                    🎯 Nenhuma meta configurada ainda.
                  </div>
                )}
              </div>
            </section>

            {/* Gráficos de Categorias (Lado a Lado no Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 w-full">
              
              {/* Gastos por Categoria (Gráfico 3 Horizontal) */}
              <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Onde seu dinheiro foi
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] font-semibold">
                    Categorias ordenadas do maior para o menor gasto no período
                  </p>
                </div>

                {barChartData.length > 0 ? (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={true} vertical={false} />
                        <XAxis
                          type="number"
                          stroke="#9CA3AF"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${getCurrencySymbol()} ${val}`}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#111827"
                          fontSize={11}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={false}
                          width={95}
                        />
                        <Tooltip
                          cursor={{ fill: '#F9FAFB' }}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E8E8EE',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#111827',
                            fontWeight: 'bold'
                          }}
                          formatter={(val) => [`${formatCurrency(Number(val))}`, 'Gasto']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[#9CA3AF] text-xs font-semibold bg-[#F4F5F7]/30 border border-[#E8E8EE] border-dashed rounded-[10px]">
                    📊 Nenhum gasto registrado neste período.
                  </div>
                )}
              </section>

              {/* [NOVO] Gráfico de Pizza de Distribuição Financeira */}
              <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Distribuição dos Gastos (%)
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] font-semibold">
                    Proporção de cada categoria em relação aos gastos totais
                  </p>
                </div>

                {barChartData.length > 0 ? (
                  <div className="h-[260px] w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="h-[200px] w-full sm:w-[50%]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={barChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {barChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              borderColor: '#E8E8EE',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#111827',
                              fontWeight: 'bold'
                            }}
                            formatter={(value, name) => {
                              const totalGastoVal = barChartData.reduce((acc, curr) => acc + curr.value, 0)
                              const percent = totalGastoVal > 0 ? ((Number(value) / totalGastoVal) * 100).toFixed(1) : '0'
                              return [`${formatCurrency(Number(value))} (${percent}%)`, name]
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legenda Customizada com Cores e Porcentagens para visual Premium */}
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto w-full sm:w-[50%] pr-1 scrollbar-thin text-xs">
                      {barChartData.map((entry, index) => {
                        const totalGastoVal = barChartData.reduce((acc, curr) => acc + curr.value, 0)
                        const percent = totalGastoVal > 0 ? ((entry.value / totalGastoVal) * 100).toFixed(0) : '0'
                        return (
                          <div key={index} className="flex items-center justify-between font-semibold">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="text-[#374151] truncate">{entry.name}</span>
                            </div>
                            <span className="text-[#111827] pl-2 shrink-0">{percent}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[#9CA3AF] text-xs font-semibold bg-[#F4F5F7]/30 border border-[#E8E8EE] border-dashed rounded-[10px]">
                    🍕 Nenhum gasto registrado neste período.
                  </div>
                )}
              </section>

            </div>

            {/* Transações (Largura Total e lista todos do período) */}
            <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm w-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Suas transações
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] font-semibold">
                    Todos os lançamentos do período selecionado
                  </p>
                </div>

                <button
                  onClick={() => navigate('/historico')}
                  className="text-xs font-bold text-[#7F77DD] hover:text-[#534AB7] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Ver histórico completo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {ultimasTransactions.length > 0 ? (
                <div className="flex flex-col divide-y divide-[#E8E8EE]">
                  {ultimasTransactions.map((tx) => {
                    const TxIcon = getCategoryIcon(tx.categories?.name || '')
                    const iconStyle = getCategoryIconBg(tx.categories?.name || '')

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F9FAFB]/50 px-1 rounded-[8px] transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Ícone customizado dinâmico */}
                          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${iconStyle}`}>
                            <TxIcon className="w-4.5 h-4.5" />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#111827]">
                              {tx.description}
                            </span>
                            <span className="text-[12px] text-[#9CA3AF] font-medium">
                              {tx.categories?.name || 'Sem categoria'} • {formatTxDate(tx.date)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Badge de Origem */}
                          <Badge variant={tx.source} />

                          {/* Valor dependendo do tipo */}
                          {tx.type === 'receita' ? (
                            <span className="text-sm font-bold text-[#15803D] flex items-center gap-0.5">
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                              +{formatCurrency(tx.amount)}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-[#EF4444] flex items-center gap-0.5">
                              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                              -{formatCurrency(tx.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-[#9CA3AF] text-sm font-semibold border border-[#E8E8EE] border-dashed rounded-[10px] bg-[#F4F5F7]/30">
                  📭 Nenhuma transação registrada neste período.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Floating Action Button - Redireciona para adicionar no histórico */}
      <FAB onClick={() => navigate('/historico')} />
    </div>
  )
}

// Icones auxiliares do JSX
const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default Dashboard
