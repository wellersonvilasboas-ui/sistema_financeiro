import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import FAB from '../components/FAB'
import { supabase } from '../lib/supabase'
import { getCategories } from '../services/categories'
import { 
  getTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction
} from '../services/transactions'
import type { TransactionWithCategory } from '../services/transactions'
import type { Category } from '../types'
import { 
  Edit2, 
  Trash2, 
  Filter, 
  Plus, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight,
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  PlusCircle
} from 'lucide-react'
import { formatCurrency, getCurrencySymbol } from '../utils/format'

export const Historico: React.FC = () => {
  // Estados de dados
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  
  // Estados de controle geral
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Utilitários de data
  const getTodayString = () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const getCurrentMonthString = () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }

  // Estados de filtros
  const [filterCategory, setFilterCategory] = useState<number>(0) // 0 = Todas
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonthString())
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos')

  // Modais de Criação
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  
  // Campos de Criação
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState<string>('')
  const [newCatId, setNewCatId] = useState<number>(0)
  const [newType, setNewType] = useState<'despesa' | 'receita'>('despesa')
  const [newDate, setNewDate] = useState(getTodayString())
  const [newSource, setNewSource] = useState<'manual' | 'whatsapp'>('manual')

  // Modais de Edição
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [selectedTx, setSelectedTx] = useState<TransactionWithCategory | null>(null)

  // Campos de Edição
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState<string>('')
  const [editCatId, setEditCatId] = useState<number>(0)
  const [editType, setEditType] = useState<'despesa' | 'receita'>('despesa')
  const [editDate, setEditDate] = useState('')
  const [editSource, setEditSource] = useState<'manual' | 'whatsapp'>('manual')

  // Modal de Exclusão
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [txToDelete, setTxToDelete] = useState<TransactionWithCategory | null>(null)

  // --- FILTRO DE CATEGORIAS POR TIPO ---
  const filteredCreateCategories = dbCategories.filter(cat => cat.type === newType)
  const filteredEditCategories = dbCategories.filter(cat => cat.type === editType)

  // Seleção automática de primeira categoria ao trocar de tipo
  useEffect(() => {
    const catsOfType = dbCategories.filter(cat => cat.type === newType)
    if (catsOfType.length > 0) {
      setNewCatId(catsOfType[0].id)
    } else {
      setNewCatId(0)
    }
  }, [newType, dbCategories])

  useEffect(() => {
    const catsOfType = dbCategories.filter(cat => cat.type === editType)
    if (catsOfType.length > 0) {
      setEditCatId(catsOfType[0].id)
    } else {
      setEditCatId(0)
    }
  }, [editType, dbCategories])

  // --- CARREGAMENTO INICIAL ---
  const loadData = async () => {
    setLoading(true)
    setDbError(null)
    try {
      // 1. Busca as categorias reais para os dropdowns
      const cats = await getCategories()
      setDbCategories(cats)

      // 2. Busca as transações com os filtros atuais
      const txs = await getTransactions({
        categoryId: filterCategory,
        month: filterMonth,
        type: filterType
      })
      setTransactions(txs)
    } catch (err: any) {
      setDbError(err.message || 'Falha ao buscar dados do Supabase.')
    } finally {
      setLoading(false)
    }
  }

  // Carrega na montagem e também quando o filterType muda automaticamente
  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('historico-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filterType])

  // Auto-close success message toast
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // --- LÓGICA DE FILTRAGEM ---
  const handleFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setDbError(null)
    try {
      const txs = await getTransactions({
        categoryId: filterCategory,
        month: filterMonth,
        type: filterType
      })
      setTransactions(txs)
    } catch (err: any) {
      setDbError(err.message || 'Falha ao aplicar filtros.')
    } finally {
      setLoading(false)
    }
  }

  // --- CRIAR TRANSAÇÃO ---
  const handleOpenCreate = () => {
    setNewDesc('')
    setNewAmount('')
    setNewType('despesa')
    // Escolhe a primeira categoria de despesa por padrão se houver
    const expenseCats = dbCategories.filter(cat => cat.type === 'despesa')
    setNewCatId(expenseCats.length > 0 ? expenseCats[0].id : 0)
    setNewDate(getTodayString())
    setNewSource('manual')
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!newDesc.trim()) {
      setCreateError('A descrição é obrigatória.')
      return
    }
    const val = parseFloat(newAmount)
    if (isNaN(val) || val <= 0) {
      setCreateError('O valor deve ser um número maior que zero.')
      return
    }
    if (newCatId <= 0) {
      setCreateError('Por favor, selecione uma categoria válida.')
      return
    }
    if (!newDate) {
      setCreateError('A data é obrigatória.')
      return
    }

    setCreateLoading(true)
    setCreateError(null)
    try {
      await createTransaction({
        description: newDesc,
        amount: val,
        category_id: newCatId,
        type: newType,
        date: newDate,
        source: newSource
      })
      setIsCreateOpen(false)
      setSuccessMessage('Transação criada com sucesso!')
      await loadData()
    } catch (err: any) {
      setCreateError(err.message || 'Falha ao salvar a transação.')
    } finally {
      setCreateLoading(false)
    }
  }

  // --- EDITAR TRANSAÇÃO ---
  const handleOpenEdit = (tx: TransactionWithCategory) => {
    setSelectedTx(tx)
    setEditDesc(tx.description)
    setEditAmount(tx.amount.toString())
    setEditCatId(tx.category_id)
    setEditType(tx.type || 'despesa')
    setEditDate(tx.date)
    setEditSource(tx.source)
    setEditError(null)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTx) return

    // Validações
    if (!editDesc.trim()) {
      setEditError('A descrição é obrigatória.')
      return
    }
    const val = parseFloat(editAmount)
    if (isNaN(val) || val <= 0) {
      setEditError('O valor deve ser um número maior que zero.')
      return
    }
    if (editCatId <= 0) {
      setEditError('Por favor, selecione uma categoria válida.')
      return
    }
    if (!editDate) {
      setEditError('A data é obrigatória.')
      return
    }

    setEditLoading(true)
    setEditError(null)
    try {
      await updateTransaction(selectedTx.id, {
        description: editDesc,
        amount: val,
        category_id: editCatId,
        type: editType,
        date: editDate,
        source: editSource
      })
      setIsEditOpen(false)
      setSuccessMessage('Transação editada com sucesso!')
      await loadData()
    } catch (err: any) {
      setEditError(err.message || 'Falha ao atualizar a transação.')
    } finally {
      setEditLoading(false)
    }
  }

  // --- EXCLUIR TRANSAÇÃO ---
  const handleOpenDelete = (tx: TransactionWithCategory) => {
    setTxToDelete(tx)
    setDbError(null)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return

    try {
      await deleteTransaction(txToDelete.id)
      setIsDeleteOpen(false)
      setTxToDelete(null)
      setSuccessMessage('Transação excluída com sucesso!')
      await loadData()
    } catch (err: any) {
      setIsDeleteOpen(false)
      setDbError(err.message || 'Falha ao excluir a transação.')
    }
  }

  // Formatação de data do banco YYYY-MM-DD para DD/MM/AAAA
  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Topbar */}
      <Topbar title="Histórico" />

      {/* Success Toast Notification */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#DCFCE7] border border-[#15803D]/20 text-[#15803D] px-4 py-3 rounded-[10px] shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Conteúdo scrollável com fundo geral #F4F5F7 */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F4F5F7] flex flex-col gap-5 md:gap-6">

        {/* Filtros no topo */}
        <section className="bg-white border border-[#E8E8EE] rounded-[14px] p-[16px_18px] shadow-sm">
          <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Campo Select Categoria + Input Mês */}
            <div className="flex flex-wrap items-center gap-3.5">
              
              {/* Select Tipo */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Tipo</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1.5 border border-[#E8E8EE] bg-white rounded-[10px] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all min-w-[110px] cursor-pointer"
                >
                  <option value="todos">Todos</option>
                  <option value="despesa">Despesas</option>
                  <option value="receita">Receitas</option>
                </select>
              </div>

              {/* Select Categoria */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Categoria</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(Number(e.target.value))}
                  className="px-3 py-1.5 border border-[#E8E8EE] bg-white rounded-[10px] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all min-w-[150px] cursor-pointer"
                >
                  <option value={0}>Todas as categorias</option>
                  {dbCategories
                    .filter(cat => filterType === 'todos' || cat.type === filterType)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              {/* Input Mês */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Mês de Referência</span>
                <div className="relative">
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="px-3 py-1.5 pl-8 border border-[#E8E8EE] bg-white rounded-[10px] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                  />
                  <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Botão Filtrar */}
              <button
                type="submit"
                className="mt-4 md:mt-0 self-end px-4 py-1.5 bg-[#EEEDFE] hover:bg-[#7F77DD] text-[#534AB7] hover:text-white rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-[#EEEDFE]/20"
              >
                <Filter className="w-3.5 h-3.5" />
                Filtrar
              </button>
            </div>

            {/* Botão + Nova transação à direita */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-[#7F77DD]/20 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Nova transação
            </button>
          </form>
        </section>

        {/* Banner de Erros Gerais do Banco de Dados */}
        {dbError && (
          <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] flex items-start gap-2.5 relative animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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

        {/* Tabela de Transações */}
        <section className="bg-white border border-[#E8E8EE] rounded-[14px] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E8EE] bg-[#F9FAFB]/50">
                  <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase w-28">Data</th>
                  <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Descrição</th>
                  <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Categoria</th>
                  <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase w-36">Valor</th>
                  <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase w-28">Origem</th>
                  <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-right w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8EE]">
                {loading ? (
                  /* Skeletons de Linhas Pulsantes */
                  [1, 2, 3, 4, 5].map((idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-4"><div className="h-4 bg-[#F4F5F7] rounded w-16" /></td>
                      <td className="p-4"><div className="h-4 bg-[#F4F5F7] rounded w-48" /></td>
                      <td className="p-4"><div className="h-4 bg-[#F4F5F7] rounded w-20" /></td>
                      <td className="p-4"><div className="h-4 bg-[#F4F5F7] rounded w-24" /></td>
                      <td className="p-4"><div className="h-4 bg-[#F4F5F7] rounded w-16" /></td>
                      <td className="p-4 text-right"><div className="h-4 bg-[#F4F5F7] rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-[#F9FAFB]/40 transition-colors"
                    >
                      <td className="p-4 text-xs font-semibold text-[#6B7280]">
                        {formatDateToDisplay(tx.date)}
                      </td>
                      <td className="p-4 text-sm font-bold text-[#111827]">
                        {tx.description}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[#EEEDFE] text-[#7F77DD] border border-[#EEEDFE]">
                          {tx.categories?.name || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-extrabold whitespace-nowrap">
                        {tx.type === 'receita' ? (
                          <span className="inline-flex items-center gap-0.5 text-[#15803D]">
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            +{formatCurrency(tx.amount)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[#EF4444]">
                            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                            -{formatCurrency(tx.amount)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={tx.source} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1.5 text-[#9CA3AF] hover:text-[#7F77DD] hover:bg-[#EEEDFE]/40 rounded-[6px] transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(tx)}
                            className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2]/40 rounded-[6px] transition-all cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  /* Linha Vazia */
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-[#9CA3AF] text-sm font-semibold">
                      📭 Nenhuma transação encontrada no banco para estes filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL 1: CRIAR TRANSAÇÃO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-[14px] shadow-2xl p-4 sm:p-6 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <PlusCircle className="w-5 h-5 text-[#7F77DD]" />
              <h3 className="text-lg font-bold text-[#111827]">Nova Transação</h3>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-5">Adicione um novo gasto ou saída de caixa no sistema.</p>
            
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              
              {/* Tipo de Transação (Segmented Control/Toggle) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Tipo de Transação</label>
                <div className="grid grid-cols-2 p-1 bg-[#F4F5F7] rounded-[12px] border border-[#E8E8EE]">
                  <button
                    type="button"
                    onClick={() => setNewType('despesa')}
                    className={`py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                      newType === 'despesa'
                        ? 'bg-white text-[#EF4444] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#111827]'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('receita')}
                    className={`py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                      newType === 'receita'
                        ? 'bg-white text-[#15803D] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#111827]'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Descrição</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Uber, Carrefour, Aluguel..."
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  autoFocus
                  disabled={createLoading}
                />
              </div>

              {/* Valor + Categoria (Duas colunas) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Valor ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                    disabled={createLoading}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Categoria</label>
                  <select
                    value={newCatId}
                    onChange={(e) => setNewCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-white focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                    disabled={createLoading}
                  >
                    {filteredCreateCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    {filteredCreateCategories.length === 0 && (
                      <option value={0}>Nenhuma categoria disponível</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Data + Origem (Duas colunas) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Data</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                    disabled={createLoading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Origem</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as 'manual' | 'whatsapp')}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-white focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                    disabled={createLoading}
                  >
                    <option value="manual">Manual</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Erros inline do formulário */}
              {createError && (
                <span className="text-[11px] font-semibold text-[#EF4444] animate-shake mt-1">
                  {createError}
                </span>
              )}

              <div className="flex justify-end gap-3 mt-3 border-t border-[#E8E8EE] pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                  className="px-4 py-2 border border-[#E8E8EE] text-[#6B7280] hover:bg-[#F4F5F7] rounded-[999px] text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-[#7F77DD]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR TRANSAÇÃO */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-[14px] shadow-2xl p-4 sm:p-6 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <Edit2 className="w-5 h-5 text-[#7F77DD]" />
              <h3 className="text-lg font-bold text-[#111827]">Editar Transação</h3>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-5">Altere os dados da transação financeira selecionada.</p>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              
              {/* Tipo de Transação (Segmented Control/Toggle) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Tipo de Transação</label>
                <div className="grid grid-cols-2 p-1 bg-[#F4F5F7] rounded-[12px] border border-[#E8E8EE]">
                  <button
                    type="button"
                    onClick={() => setEditType('despesa')}
                    className={`py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                      editType === 'despesa'
                        ? 'bg-white text-[#EF4444] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#111827]'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('receita')}
                    className={`py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                      editType === 'receita'
                        ? 'bg-white text-[#15803D] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#111827]'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Descrição</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  autoFocus
                  disabled={editLoading}
                />
              </div>

              {/* Valor + Categoria (Duas colunas) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Valor ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                    disabled={editLoading}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Categoria</label>
                  <select
                    value={editCatId}
                    onChange={(e) => setEditCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-white focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                    disabled={editLoading}
                  >
                    {filteredEditCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    {filteredEditCategories.length === 0 && (
                      <option value={0}>Nenhuma categoria disponível</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Data + Origem (Duas colunas) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Data</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                    disabled={editLoading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Origem</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as 'manual' | 'whatsapp')}
                    className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-white focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all cursor-pointer"
                    disabled={editLoading}
                  >
                    <option value="manual">Manual</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Erros inline do formulário */}
              {editError && (
                <span className="text-[11px] font-semibold text-[#EF4444] animate-shake mt-1">
                  {editError}
                </span>
              )}

              <div className="flex justify-end gap-3 mt-3 border-t border-[#E8E8EE] pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                  className="px-4 py-2 border border-[#E8E8EE] text-[#6B7280] hover:bg-[#F4F5F7] rounded-[999px] text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-[#7F77DD]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCLUIR TRANSAÇÃO (Confirmação) */}
      <Modal
        isOpen={isDeleteOpen}
        title="Excluir transação"
        message={
          <span>
            Tem certeza que deseja excluir a transação <strong>{txToDelete?.description || ''}</strong>? Esta ação não pode ser desfeita.
          </span>
        }
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Floating Action Button */}
      <FAB onClick={handleOpenCreate} />
    </div>
  )
}

export default Historico
