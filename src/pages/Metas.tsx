import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import ProgressBar from '../components/ProgressBar'
import { getGastoPorCategoria } from '../services/dashboard'
import type { GastoCategoria } from '../services/dashboard'
import { getBudgets, createBudget, updateBudget } from '../services/budgets'
import type { Budget } from '../types'
import { 
  Target, 
  Edit3, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Tv, 
  ShoppingCart, 
  Fuel, 
  Heart, 
  BookOpen, 
  Home, 
  HelpCircle
} from 'lucide-react'

// Mapeamento dinâmico de ícones
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

export const Metas: React.FC = () => {
  // Estados de dados
  const [gastosCat, setGastosCat] = useState<GastoCategoria[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])

  // Controle de Mês
  const [currentDate, setCurrentDate] = useState(new Date())

  // Estados de controle geral
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Estados do Modal de Limites
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Dados do modal ativo
  const [selectedCategory, setSelectedCategory] = useState<{id: number, name: string} | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [limitAmount, setLimitAmount] = useState<string>('')

  // Nomes de meses pt-BR
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesFormatado = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  // Carrega os dados baseado no mês selecionado
  const loadData = async () => {
    setLoading(true)
    setDbError(null)
    try {
      const year = currentDate.getFullYear()
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0')
      const mesParam = `${year}-${monthStr}`

      const [gastos, budgs] = await Promise.all([
        getGastoPorCategoria(mesParam),
        getBudgets()
      ])
      
      // Organiza por ordem alfabética
      const sorted = gastos.sort((a, b) => a.category_name.localeCompare(b.category_name))
      setGastosCat(sorted)
      setBudgets(budgs)
    } catch (err: any) {
      setDbError(err.message || 'Falha ao carregar metas do Supabase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentDate])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const nova = new Date(prev)
      nova.setMonth(nova.getMonth() - 1)
      return nova
    })
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const nova = new Date(prev)
      nova.setMonth(nova.getMonth() + 1)
      return nova
    })
  }

  const handleOpenLimitModal = (cat: GastoCategoria) => {
    const activeBudget = budgets.find(b => b.category_id === cat.category_id)
    setSelectedCategory({ id: cat.category_id, name: cat.category_name })
    setModalError(null)
    if (activeBudget) {
      setSelectedBudget(activeBudget)
      setLimitAmount(activeBudget.amount.toString())
    } else {
      setSelectedBudget(null)
      setLimitAmount('')
    }
    setIsModalOpen(true)
  }

  const handleLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    const amountVal = parseFloat(limitAmount.replace(',', '.'))
    if (isNaN(amountVal) || amountVal <= 0) {
      setModalError('O valor do limite mensal deve ser maior que zero.')
      return
    }

    setModalLoading(true)
    setModalError(null)
    try {
      if (selectedBudget) {
        await updateBudget(selectedBudget.id, amountVal)
        setSuccessMessage(`Limite de ${selectedCategory.name} atualizado com sucesso!`)
      } else {
        await createBudget({
          category_id: selectedCategory.id,
          amount: amountVal
        })
        setSuccessMessage(`Limite de ${selectedCategory.name} definido com sucesso!`)
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err: any) {
      setModalError(err.message || 'Falha ao salvar o limite mensal.')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Topbar */}
      <Topbar title="Metas" />

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#DCFCE7] border border-[#15803D]/20 text-[#15803D] px-4 py-3 rounded-[10px] shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-[#F4F5F7] flex flex-col gap-6">
        
        {/* Cabeçalho de Controle de Mês */}
        <div className="flex justify-end">
          <div className="flex items-center bg-white border border-[#E8E8EE] rounded-[10px] p-1 shadow-sm">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F7] rounded-[6px] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 flex items-center justify-center min-w-[120px]">
              <span className="text-sm font-bold text-[#111827] capitalize whitespace-nowrap">
                {mesFormatado}
              </span>
            </div>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F7] rounded-[6px] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {dbError && (
          <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] flex items-start gap-2.5 relative animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 pr-6 leading-relaxed">{dbError}</div>
            <button 
              onClick={() => setDbError(null)}
              className="absolute top-3 right-3 text-[#EF4444] hover:opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            /* Skeletons */
            [1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white border border-[#E8E8EE] rounded-[14px] p-6 shadow-sm flex flex-col gap-4 animate-pulse h-[170px]">
                <div className="flex justify-between items-center pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F4F5F7] rounded-[10px]" />
                    <div className="h-4 bg-[#F4F5F7] rounded w-24" />
                  </div>
                  <div className="h-4 bg-[#F4F5F7] rounded w-4" />
                </div>
                <div className="h-8 bg-[#F4F5F7] rounded w-full" />
                <div className="h-2 bg-[#F4F5F7] rounded w-full mt-2" />
              </div>
            ))
          ) : gastosCat.length > 0 ? (
            gastosCat.map((cat) => {
              const limite = cat.limite || 0
              const percent = limite === 0 ? 0 : Math.min(Math.round((cat.gasto / limite) * 100), 100)
              const restante = limite - cat.gasto
              const hasLimite = cat.limite !== null
              const Icon = getCategoryIcon(cat.category_name)

              return (
                <div 
                  key={cat.category_id} 
                  className="bg-white border border-[#E8E8EE] rounded-[14px] p-6 shadow-sm flex flex-col hover:shadow-md transition-all duration-200 group"
                >
                  {/* Topo do Card: Ícone + Nome + Lápis */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#EEEDFE] text-[#7F77DD] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[15px] font-bold text-[#111827]">{cat.category_name}</span>
                    </div>
                    <button
                      onClick={() => handleOpenLimitModal(cat)}
                      className="text-[#9CA3AF] hover:text-[#7F77DD] transition-colors cursor-pointer p-1"
                      title={hasLimite ? "Editar Limite" : "Definir Limite"}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Informações Numéricas */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#9CA3AF]">Gasto atual</span>
                    <span className="text-[11px] font-semibold text-[#9CA3AF]">Limite</span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-extrabold text-[#111827]">
                      R$ {cat.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-bold text-[#9CA3AF]">
                      R$ {limite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Detalhes de Progresso */}
                  <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                    <span className="text-[#9CA3AF]">{percent}% consumido</span>
                    {hasLimite ? (
                      <span className={restante >= 0 ? 'text-[#9CA3AF]' : 'text-[#EF4444]'}>
                        {restante >= 0 
                          ? `R$ ${restante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restantes`
                          : `R$ ${Math.abs(restante).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} excedidos`
                        }
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] italic">Sem limite</span>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  <ProgressBar value={percent} />
                </div>
              )
            })
          ) : (
            <div className="col-span-full bg-white border border-[#E8E8EE] rounded-[14px] p-12 text-center text-[#9CA3AF] text-sm font-semibold shadow-sm">
              📭 Nenhuma categoria encontrada no sistema. Crie categorias nas Configurações para poder definir limites!
            </div>
          )}
        </section>
      </main>

      {/* MODAL ÚNICO: DEFINIR / EDITAR LIMITE */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-sm bg-white border border-[#E8E8EE] rounded-[14px] shadow-2xl p-6 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-5 h-5 text-[#7F77DD]" />
              <h3 className="text-lg font-bold text-[#111827]">
                {selectedBudget ? 'Editar Limite Mensal' : 'Definir Limite Mensal'}
              </h3>
            </div>
            
            <div className="flex flex-col gap-0.5 mb-4">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Categoria selecionada</span>
              <span className="text-sm font-bold text-[#534AB7]">{selectedCategory.name}</span>
            </div>

            <form onSubmit={handleLimitSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Limite mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="Ex: 500,00"
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  autoFocus
                  disabled={modalLoading}
                />
              </div>

              {modalError && (
                <span className="text-[11px] font-semibold text-[#EF4444] animate-shake mt-0.5">
                  {modalError}
                </span>
              )}

              <div className="flex justify-end gap-3 mt-3 border-t border-[#E8E8EE] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                  className="px-4 py-1.5 border border-[#E8E8EE] text-[#6B7280] hover:bg-[#F4F5F7] rounded-[999px] text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-[#7F77DD]/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Metas
