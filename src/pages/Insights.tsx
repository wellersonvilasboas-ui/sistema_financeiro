import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import {
  getTotalGastoRange,
  getTotalReceitaRange,
  getGastoPorCategoriaRange
} from '../services/dashboard'
import { formatCurrency, getCurrencySymbol } from '../utils/format'
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Tv,
  ShoppingCart,
  Fuel,
  Heart,
  BookOpen,
  Home,
  HelpCircle
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface CategoriaComparativa {
  id: number
  name: string
  atual: number
  anterior: number
  diferenca: number
  percentual: number
  economizou: boolean
}

interface SmartTip {
  title: string
  description: string
  type: 'success' | 'warning' | 'info' | 'tip'
  icon: any
}

export const Insights: React.FC = () => {
  // Controle de Carregamento
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dados comparativos mensais
  const [mesAtualStr, setMesAtualStr] = useState('')
  const [mesPassadoStr, setMesPassadoStr] = useState('')
  
  const [totalDespesasAtual, setTotalDespesasAtual] = useState(0)
  const [totalDespesasAnterior, setTotalDespesasAnterior] = useState(0)

  // Comparativos por categorias
  const [comparativoCats, setComparativoCats] = useState<CategoriaComparativa[]>([])
  
  // Dicas Inteligentes
  const [smartTips, setSmartTips] = useState<SmartTip[]>([])

  // Cores dinâmicas por categoria
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('lazer')) return Tv
    if (name.includes('alimentação') || name.includes('refeições') || name.includes('mercado')) return ShoppingCart
    if (name.includes('transporte') || name.includes('combustível')) return Fuel
    if (name.includes('saúde') || name.includes('médico')) return Heart
    if (name.includes('educação') || name.includes('curso')) return BookOpen
    if (name.includes('moradia') || name.includes('aluguel')) return Home
    return HelpCircle
  }

  // Obter limites de datas para o mês atual e o anterior
  const obterDatasComparativas = () => {
    const hoje = new Date()
    
    // Mês Atual
    const yAtual = hoje.getFullYear()
    const mAtual = hoje.getMonth() + 1
    const lastDayAtual = new Date(yAtual, mAtual, 0).getDate()
    const startAtual = `${yAtual}-${String(mAtual).padStart(2, '0')}-01`
    const endAtual = `${yAtual}-${String(mAtual).padStart(2, '0')}-${String(lastDayAtual).padStart(2, '0')}`

    // Mês Passado
    let yAnt = yAtual
    let mAnt = mAtual - 1
    if (mAnt === 0) {
      mAnt = 12
      yAnt = yAtual - 1
    }
    const lastDayAnt = new Date(yAnt, mAnt, 0).getDate()
    const startAnt = `${yAnt}-${String(mAnt).padStart(2, '0')}-01`
    const endAnt = `${yAnt}-${String(mAnt).padStart(2, '0')}-${String(lastDayAnt).padStart(2, '0')}`

    // Nomes dos meses para exibição
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    return {
      startAtual,
      endAtual,
      startAnt,
      endAnt,
      labelAtual: `${monthNames[mAtual - 1]}`,
      labelAnterior: `${monthNames[mAnt - 1]}`
    }
  }

  const loadInsightsData = async () => {
    setLoading(true)
    setError(null)

    try {
      const dates = obterDatasComparativas()
      setMesAtualStr(dates.labelAtual)
      setMesPassadoStr(dates.labelAnterior)

      // Requisições paralelas robustas do Supabase
      const [
        despesasAtual,
        despesasAnterior,
        receitasAtual,
        categoriasAtual,
        categoriasAnterior
      ] = await Promise.all([
        getTotalGastoRange(dates.startAtual, dates.endAtual),
        getTotalGastoRange(dates.startAnt, dates.endAnt),
        getTotalReceitaRange(dates.startAtual, dates.endAtual),
        getGastoPorCategoriaRange(dates.startAtual, dates.endAtual),
        getGastoPorCategoriaRange(dates.startAnt, dates.endAnt)
      ])

      setTotalDespesasAtual(despesasAtual)
      setTotalDespesasAnterior(despesasAnterior)

      // Unificar categorias e calcular side-by-side
      const compMap: CategoriaComparativa[] = categoriasAtual.map((cAtual) => {
        const cAnterior = categoriasAnterior.find(c => c.category_id === cAtual.category_id)
        const valAtual = cAtual.gasto
        const valAnterior = cAnterior ? cAnterior.gasto : 0
        const diff = valAtual - valAnterior
        
        let pct = 0
        if (valAnterior > 0) {
          pct = Math.round((Math.abs(diff) / valAnterior) * 100)
        } else if (valAtual > 0) {
          pct = 100
        }

        return {
          id: cAtual.category_id,
          name: cAtual.category_name,
          atual: valAtual,
          anterior: valAnterior,
          diferenca: diff,
          percentual: pct,
          economizou: diff < 0
        }
      })

      // Ordenar por maior economia primeiro
      const compOrdenado = compMap.sort((a, b) => a.diferenca - b.diferenca)
      setComparativoCats(compOrdenado)

      // Geração de Conselhos Inteligentes Dinâmicos baseados no comportamento do usuário
      const tips: SmartTip[] = []

      // Dica 1: Economia Geral
      const diffTotal = despesasAtual - despesasAnterior
      if (diffTotal < 0) {
        const economiaPercent = despesasAnterior > 0 ? Math.round((Math.abs(diffTotal) / despesasAnterior) * 100) : 0
        tips.push({
          title: 'Parabéns! Excelente Progresso',
          description: `Suas despesas totais caíram ${economiaPercent}% em relação ao mês anterior. Você economizou exatamente ${formatCurrency(Math.abs(diffTotal))}! Continue com essa disciplina financeira.`,
          type: 'success',
          icon: CheckCircle2
        })
      } else if (diffTotal > 0) {
        const aumentoPercent = despesasAnterior > 0 ? Math.round((diffTotal / despesasAnterior) * 100) : 0
        tips.push({
          title: 'Atenção aos Gastos Totais',
          description: `Seus gastos este mês subiram ${aumentoPercent}% (${formatCurrency(diffTotal)} a mais) comparado ao mês passado. Identifique compras supérfluas para retornar ao equilíbrio.`,
          type: 'warning',
          icon: AlertTriangle
        })
      }

      // Dica 2: Alerta de Saldo Negativo ou Saúde Financeira
      const saldo = receitasAtual - despesasAtual
      if (saldo < 0) {
        tips.push({
          title: 'Alerta de Orçamento Negativo',
          description: `Você gastou ${formatCurrency(Math.abs(saldo))} a mais do que sua receita total registrada este mês. Recomendamos congelar despesas não essenciais imediatamente.`,
          type: 'warning',
          icon: AlertTriangle
        })
      } else if (saldo > 0 && despesasAtual > 0) {
        const poupancaTaxa = Math.round((saldo / receitasAtual) * 100)
        if (poupancaTaxa >= 20) {
          tips.push({
            title: 'Excelente Taxa de Poupança',
            description: `Você guardou ${poupancaTaxa}% do seu salário (${formatCurrency(saldo)}). Esta é uma taxa de poupança digna de investidores experientes!`,
            type: 'success',
            icon: Sparkles
          })
        }
      }

      // Dica 3: Gargalo de Categoria (Maior Gasto)
      const maiorGasto = [...categoriasAtual].sort((a, b) => b.gasto - a.gasto)[0]
      if (maiorGasto && maiorGasto.gasto > 0) {
        let conselhoGargalo = 'Tente renegociar contratos ou planejar limites menores para essa área.'
        const lowerName = maiorGasto.category_name.toLowerCase()
        if (lowerName.includes('alimentação') || lowerName.includes('mercado') || lowerName.includes('refeições')) {
          conselhoGargalo = 'Experimente planejar um menu semanal de refeições em casa e comprar itens essenciais no atacado para reduzir custos em até 20%.'
        } else if (lowerName.includes('transporte') || lowerName.includes('combustível')) {
          conselhoGargalo = 'Considere otimizar trajetos diários, intercalar com transporte público ou adotar caronas para aliviar o peso dos combustíveis.'
        } else if (lowerName.includes('lazer')) {
          conselhoGargalo = 'Que tal explorar atividades culturais e parques gratuitos no final de semana para desfrutar sem comprometer o bolso?'
        }

        tips.push({
          title: `Gargalo Identificado: ${maiorGasto.category_name}`,
          description: `A categoria de ${maiorGasto.category_name} é sua maior fonte de despesa, consumindo ${formatCurrency(maiorGasto.gasto)} este mês. ${conselhoGargalo}`,
          type: 'tip',
          icon: Lightbulb
        })
      }

      // Dica 4: Limites de Metas Excedidos
      const metasExcedidas = categoriasAtual.filter(c => c.limite !== null && c.gasto > c.limite)
      if (metasExcedidas.length > 0) {
        const nomesExcedidos = metasExcedidas.map(c => c.category_name).join(', ')
        tips.push({
          title: `Metas Ultrapassadas (${metasExcedidas.length})`,
          description: `Você ultrapassou a sua meta de gastos em: ${nomesExcedidos}. Para o próximo mês, tente ajustar notificações ou criar avisos adicionais para reter o fluxo de saídas.`,
          type: 'warning',
          icon: AlertTriangle
        })
      }

      // Dica Clássica Universal: Regra 50/30/20
      tips.push({
        title: 'Regra Clássica 50/30/20',
        description: 'Tente destinar 50% dos seus ganhos para Necessidades Básicas, 30% para Desejos e Lazer, e guarde/invista no mínimo 20% para a sua liberdade financeira.',
        type: 'info',
        icon: Sparkles
      })

      setSmartTips(tips)

    } catch (err: any) {
      console.error('[Insights] Erro ao carregar:', err)
      setError(err.message || 'Falha ao buscar dados comparativos do Supabase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInsightsData()
  }, [])

  // Métricas do Top Card
  const economiaGeralNominal = totalDespesasAnterior - totalDespesasAtual
  const economiaGeralPercent = totalDespesasAnterior > 0 
    ? Math.round((Math.abs(economiaGeralNominal) / totalDespesasAnterior) * 100) 
    : 0
  const economizouGeral = economiaGeralNominal >= 0

  // Média Diária
  const diaDoMes = new Date().getDate()
  const mediaDiariaAtual = totalDespesasAtual / diaDoMes
  const mediaDiariaAnterior = totalDespesasAnterior / 30

  // Dados para o Gráfico de Recharts (Lado a Lado)
  const chartData = [...comparativoCats]
    .filter(c => c.atual > 0 || c.anterior > 0)
    .map(c => ({
      name: c.name,
      [mesAtualStr]: c.atual,
      [mesPassadoStr]: c.anterior
    }))

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Topbar */}
      <Topbar title="Comparativos e Economia" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F4F5F7] flex flex-col gap-6">
        
        {error && (
          <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[14px] text-xs font-semibold text-[#EF4444] flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          /* Skeletons de Carregamento Ultra Premium */
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(idx => (
                <div key={idx} className="bg-white border border-[#E8E8EE] rounded-[14px] p-6 h-[110px]" />
              ))}
            </div>
            <div className="bg-white border border-[#E8E8EE] rounded-[14px] h-[300px]" />
            <div className="bg-white border border-[#E8E8EE] rounded-[14px] h-[250px]" />
          </div>
        ) : (
          <>
            {/* 1. CARDS DE MÉTRICAS SUPERIORES COMPARATIVAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Comparativo Nominal de Economia */}
              <div className="bg-white border border-[#E8E8EE] rounded-[14px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">Economia Geral</span>
                  <div className={`p-1.5 rounded-[8px] ${economizouGeral ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                    {economizouGeral ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#111827]">
                    {formatCurrency(Math.abs(economiaGeralNominal))}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#9CA3AF] mt-1">
                    {economizouGeral 
                      ? `Você gastou a menos em relação a ${mesPassadoStr}`
                      : `Você gastou a mais em relação a ${mesPassadoStr}`
                    }
                  </p>
                </div>
              </div>

              {/* Card 2: Mudança Percentual */}
              <div className="bg-white border border-[#E8E8EE] rounded-[14px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">Mudança de Gastos</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${economizouGeral ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                    {economizouGeral ? '-' : '+'}{economiaGeralPercent}%
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#111827]">
                    {economizouGeral ? 'Redução' : 'Aumento'}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#9CA3AF] mt-1">
                    Taxa total de variação de saídas
                  </p>
                </div>
              </div>

              {/* Card 3: Velocidade de Gastos (Média Diária) */}
              <div className="bg-white border border-[#E8E8EE] rounded-[14px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">Média de Despesa Diária</span>
                  <div className="p-1.5 rounded-[8px] bg-[#EEEDFE] text-[#7F77DD]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#111827]">
                    {formatCurrency(mediaDiariaAtual)}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#9CA3AF] mt-1">
                    vs {formatCurrency(mediaDiariaAnterior)}/dia no mês passado
                  </p>
                </div>
              </div>
            </div>

            {/* 2. GRÁFICO COMPARATIVO COMPLETO LADO A LADO */}
            <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-[#7F77DD]" />
                  Comparativo Gráfico: {mesAtualStr} vs {mesPassadoStr}
                </h3>
                <p className="text-[11px] text-[#9CA3AF] font-semibold">
                  Acompanhe visualmente onde você economizou ou investiu mais recursos
                </p>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      barGap={5}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF" 
                        fontSize={10} 
                        fontWeight={600}
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => `${getCurrencySymbol()} ${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E8E8EE',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#111827',
                          fontWeight: 'bold'
                        }}
                        formatter={(val) => [`${formatCurrency(Number(val))}`]}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle" 
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey={mesAtualStr} fill="#7F77DD" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={mesPassadoStr} fill="#D1D5DB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#9CA3AF] text-xs font-semibold bg-[#F4F5F7]/30 border border-[#E8E8EE] border-dashed rounded-[10px]">
                  📊 Nenhuma despesa para exibir no gráfico neste período.
                </div>
              )}
            </section>

            {/* 3. GRID: TABELA DE CATEGORIAS + CONSELHOS FINANCEIROS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Tabela de Variação de Categorias */}
              <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-5 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Análise Lado a Lado por Categoria
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] font-semibold">
                    Categorias ordenadas pela maior economia realizada
                  </p>
                </div>

                <div className="flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {comparativoCats.map((cat) => {
                    const CatIcon = getCategoryIcon(cat.name)
                    const showBadge = cat.atual > 0 || cat.anterior > 0

                    return (
                      <div key={cat.id} className="flex items-center justify-between py-2 border-b border-[#F4F5F7] last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[8px] bg-[#F4F5F7] text-[#6B7280] flex items-center justify-center shrink-0">
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#111827]">{cat.name}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-semibold">
                              {formatCurrency(cat.atual)} atual vs {formatCurrency(cat.anterior)} anterior
                            </span>
                          </div>
                        </div>

                        {showBadge && (
                          <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold shrink-0 ${
                            cat.economizou
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : cat.diferenca === 0
                                ? 'bg-[#F4F5F7] text-[#6B7280]'
                                : 'bg-[#FEE2E2] text-[#EF4444]'
                          }`}>
                            {cat.economizou 
                              ? `-${cat.percentual}% economizado`
                              : cat.diferenca === 0
                                ? 'Sem alteração'
                                : `+${cat.percentual}% gasto`
                            }
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Dicas de Inteligência e Economia */}
              <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-5 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-[#A855F7]" />
                    Conselhos de Economia e Dicas
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] font-semibold">
                    Dicas geradas dinamicamente com base nos seus dados do Supabase
                  </p>
                </div>

                <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {smartTips.map((tip, index) => {
                    const TipIcon = tip.icon
                    const styleMap = {
                      success: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]/50',
                      warning: 'bg-[#FEE2E2] text-[#EF4444] border-[#FCA5A5]/50',
                      info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]/50',
                      tip: 'bg-[#FAF5FF] text-[#701A75] border-[#E9D5FF]/50'
                    }

                    return (
                      <div
                        key={index}
                        className={`flex gap-3.5 p-4 rounded-[12px] border text-xs font-semibold leading-relaxed ${styleMap[tip.type]}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <TipIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="font-extrabold uppercase tracking-wide text-[10px]">
                            {tip.title}
                          </h4>
                          <p className="opacity-90 font-medium">{tip.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Insights
