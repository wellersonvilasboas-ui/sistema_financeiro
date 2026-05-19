import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import FAB from '../components/FAB'
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../services/categories'
import type { Category } from '../types'
import { Edit2, Trash2, Plus, FolderOpen, Loader2, AlertCircle, CheckCircle2, X, Camera, UserCircle, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { uploadAvatar, updateProfileAvatar, updatePassword, getProfile, updateWhatsAppNumber } from '../services/profile'

export const Configuracoes: React.FC = () => {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Avatar Logic
  const [avatarLoading, setAvatarLoading] = useState(false)
  const currentAvatarUrl = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'

  // Password Logic
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Recovery Mode Banner Logic
  const [isFromRecovery, setIsFromRecovery] = useState(false)

  // WhatsApp Logic
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    const trimmedPassword = password.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setPasswordError('Todos os campos de senha são obrigatórios.')
      return
    }

    if (trimmedPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.')
      return
    }

    setPasswordLoading(true)
    try {
      await updatePassword(trimmedPassword)
      setSuccessMessage('Senha alterada com sucesso!')
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Falha ao alterar a senha.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWhatsappError(null)

    const trimmedNumber = whatsappNumber.trim()
    // Validation is optional, but it's good to ensure it's not empty if they submit.
    // However, if they want to remove it, they can submit an empty string.

    setWhatsappLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado.')
      await updateWhatsAppNumber(user.id, trimmedNumber || null)
      setSuccessMessage('Número do WhatsApp atualizado com sucesso!')
    } catch (err: any) {
      setWhatsappError(err.message || 'Falha ao salvar o número do WhatsApp.')
    } finally {
      setWhatsappLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    if (!file.type.startsWith('image/')) {
      setDbError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, etc).')
      return
    }

    setAvatarLoading(true)
    setDbError(null)
    try {
      if (!user) throw new Error('Usuário não autenticado.')
      const publicUrl = await uploadAvatar(file, user.id)
      await updateProfileAvatar(publicUrl)
      
      setSuccessMessage('Foto de perfil atualizada! (Pode levar alguns segundos para carregar).')
      
      // Force reload to update Topbar global context smoothly
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setDbError(err.message || 'Falha ao fazer upload da foto de perfil.')
    } finally {
      setAvatarLoading(false)
    }
  }

  // Modais de Criação
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategoryType, setNewCategoryType] = useState<'despesa' | 'receita'>('despesa')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  // Abas de categorias
  const [activeCategoryTab, setActiveCategoryTab] = useState<'despesa' | 'receita'>('despesa')

  // Modais de Edição
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Modal de Exclusão
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState<Category | null>(null)

  // Busca inicial das categorias
  const loadCategories = async () => {
    setLoading(true)
    setDbError(null)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err: any) {
      setDbError(err.message || 'Falha ao conectar com o Supabase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    
    // Carrega o Perfil (WhatsApp)
    if (user?.id) {
      getProfile(user.id).then(profile => {
        if (profile?.whatsapp_number) {
          setWhatsappNumber(profile.whatsapp_number)
        }
      }).catch(err => {
        console.error('Failed to load profile:', err)
      })
    }

    const fromRecovery = localStorage.getItem('password_recovery_mode')
    if (fromRecovery) {
      setIsFromRecovery(true)
      localStorage.removeItem('password_recovery_mode')
    }
  }, [user?.id])

  // Auto-close success message toast
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // --- CRIAR CATEGORIA ---
  const handleOpenCreate = () => {
    setNewName('')
    setNewCategoryType(activeCategoryTab)
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) {
      setCreateError('O nome da categoria é obrigatório.')
      return
    }

    setCreateLoading(true)
    setCreateError(null)
    try {
      await createCategory(trimmed, newCategoryType)
      setIsCreateOpen(false)
      setSuccessMessage('Categoria criada com sucesso!')
      await loadCategories()
    } catch (err: any) {
      setCreateError(err.message || 'Falha ao salvar categoria.')
    } finally {
      setCreateLoading(false)
    }
  }

  // --- EDITAR CATEGORIA ---
  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category)
    setEditName(category.name)
    setEditError(null)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed) {
      setEditError('O nome da categoria é obrigatório.')
      return
    }

    if (!selectedCategory) return

    setEditLoading(true)
    setEditError(null)
    try {
      await updateCategory(selectedCategory.id, trimmed)
      setIsEditOpen(false)
      setSuccessMessage('Categoria atualizada com sucesso!')
      await loadCategories()
    } catch (err: any) {
      setEditError(err.message || 'Falha ao atualizar categoria.')
    } finally {
      setEditLoading(false)
    }
  }

  // --- EXCLUIR CATEGORIA ---
  const handleOpenDelete = (category: Category) => {
    setSelectedCategoryForDelete(category)
    setDbError(null) // limpa erros anteriores
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCategoryForDelete) return

    try {
      await deleteCategory(selectedCategoryForDelete.id)
      setIsDeleteOpen(false)
      setSelectedCategoryForDelete(null)
      setSuccessMessage('Categoria excluída com sucesso!')
      await loadCategories()
    } catch (err: any) {
      setIsDeleteOpen(false)
      setDbError(err.message || 'Falha ao excluir categoria.')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Topbar */}
      <Topbar title="Configurações" />

      {/* Success Toast Notification */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#DCFCE7] border border-[#15803D]/20 text-[#15803D] px-4 py-3 rounded-[10px] shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Conteúdo scrollável com fundo geral #F4F5F7 */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F4F5F7] flex flex-col gap-5 md:gap-6">
        
        {/* Banner de Recuperação de Senha */}
        {isFromRecovery && (
          <div className="p-4 bg-[#EEEDFE] border border-[#7F77DD]/30 rounded-[14px] text-xs font-medium text-[#534AB7] flex items-start gap-3.5 relative animate-in slide-in-from-top duration-300 shadow-sm shadow-[#7F77DD]/10">
            <Lock className="w-5 h-5 text-[#7F77DD] shrink-0 mt-0.5" />
            <div className="flex-1 pr-6 leading-relaxed">
              <strong className="text-sm font-bold text-[#1E1B4B] block mb-1">Link de recuperação acessado com sucesso!</strong>
              Você entrou usando o link de recuperação de e-mail. Por segurança, digite a sua nova senha abaixo na seção <strong>"Segurança e Senha"</strong> para redefinir o acesso à sua conta.
            </div>
            <button 
              type="button"
              onClick={() => setIsFromRecovery(false)}
              className="absolute top-3.5 right-3.5 text-[#7F77DD] hover:text-[#534AB7] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bloco de Perfil da Conta */}
        <section className="bg-white border border-[#E8E8EE] rounded-[14px] shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E8E8EE]">
            <div className="w-10 h-10 rounded-[10px] bg-[#EEEDFE] text-[#7F77DD] flex items-center justify-center">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Perfil da Conta</h2>
              <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
                Personalize sua foto de perfil que aparece no topo do sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <img 
                src={currentAvatarUrl} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full object-cover border-4 border-[#F4F5F7] shadow-sm transition-opacity group-hover:opacity-75"
              />
              {avatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7F77DD]" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-[#111827]">{user?.email}</span>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                  disabled={avatarLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button 
                  disabled={avatarLoading}
                  className="px-4 py-1.5 bg-[#F4F5F7] hover:bg-[#E8E8EE] border border-[#E8E8EE] text-[#111827] rounded-[999px] text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Camera className="w-3.5 h-3.5 text-[#6B7280]" />
                  {avatarLoading ? 'Enviando...' : 'Alterar foto'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco de Segurança e Senha */}
        <section className="bg-white border border-[#E8E8EE] rounded-[14px] shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E8E8EE]">
            <div className="w-10 h-10 rounded-[10px] bg-[#EEEDFE] text-[#7F77DD] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Segurança e Senha</h2>
              <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
                Mantenha sua conta segura alterando sua senha regularmente.
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] flex items-start gap-2.5 relative animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 pr-6 leading-relaxed">
                {passwordError}
              </div>
              <button 
                type="button"
                onClick={() => setPasswordError(null)}
                className="absolute top-3 right-3 text-[#EF4444] hover:opacity-80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                disabled={passwordLoading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                placeholder="Confirme sua nova senha"
                className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                disabled={passwordLoading}
              />
            </div>

            <div className="flex justify-start mt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-[#7F77DD]/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Alterar senha
              </button>
            </div>
          </form>
        </section>

        {/* Bloco de Integração WhatsApp */}
        <section className="bg-white border border-[#E8E8EE] rounded-[14px] shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E8E8EE]">
            <div className="w-10 h-10 rounded-[10px] bg-[#EEEDFE] text-[#7F77DD] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Integração com WhatsApp</h2>
              <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
                Cadastre o seu número de WhatsApp para que o robô consiga salvar os seus gastos corretamente (Use formato DDI+DDD+Num).
              </p>
            </div>
          </div>

          {whatsappError && (
            <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] flex items-start gap-2.5 relative animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 pr-6 leading-relaxed">
                {whatsappError}
              </div>
              <button 
                type="button"
                onClick={() => setWhatsappError(null)}
                className="absolute top-3 right-3 text-[#EF4444] hover:opacity-80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111827]">Número do WhatsApp</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value)
                  if (whatsappError) setWhatsappError(null)
                }}
                placeholder="Ex: 5511999999999"
                className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                disabled={whatsappLoading}
              />
            </div>

            <div className="flex justify-start mt-2">
              <button
                type="submit"
                disabled={whatsappLoading}
                className="px-5 py-2 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-[#7F77DD]/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {whatsappLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar Número
              </button>
            </div>
          </form>
        </section>

        {/* Bloco de Configurações de Categorias */}
        <section className="bg-white border border-[#E8E8EE] rounded-[14px] shadow-sm p-6 flex flex-col gap-5">
          
          {/* Cabeçalho da seção */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E8EE]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111827]">Gerenciamento de Categorias</h2>
                <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
                  Configure e crie classificações para organizar seus lançamentos financeiros no Supabase.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-[#7F77DD]/20 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Nova categoria
            </button>
          </div>

          {/* Abas/Tabs para Despesas e Receitas */}
          <div className="flex border-b border-[#E8E8EE] gap-6">
            <button
              onClick={() => setActiveCategoryTab('despesa')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeCategoryTab === 'despesa'
                  ? 'border-[#7F77DD] text-[#7F77DD]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              Categorias de Despesas
            </button>
            <button
              onClick={() => setActiveCategoryTab('receita')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeCategoryTab === 'receita'
                  ? 'border-[#7F77DD] text-[#7F77DD]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              Categorias de Receitas
            </button>
          </div>

          {/* Banner de Erros Gerais (ex: Falha de conexão ou violação de chave estrangeira) */}
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

          {/* Tabela de Categorias ou Estados de Carregamento */}
          {loading ? (
            /* Loading Skeletons Pulsantes */
            <div className="flex flex-col gap-3 py-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-[#E8E8EE]">
                  <div className="h-6 w-12 bg-[#F4F5F7] rounded-[6px]" />
                  <div className="h-6 w-48 bg-[#F4F5F7] rounded-[6px] flex-1 mx-6" />
                  <div className="h-6 w-16 bg-[#F4F5F7] rounded-[6px]" />
                </div>
              ))}
            </div>
          ) : (() => {
            const filteredCategories = categories.filter(cat => cat.type === activeCategoryTab)
            return filteredCategories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E8EE] bg-[#F9FAFB]/30">
                      <th className="p-3.5 text-xs font-bold text-[#9CA3AF] uppercase w-24">ID</th>
                      <th className="p-3.5 text-xs font-bold text-[#9CA3AF] uppercase">Nome da Categoria</th>
                      <th className="p-3.5 text-xs font-bold text-[#9CA3AF] uppercase text-right w-32">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8EE]">
                    {filteredCategories.map((cat) => (
                      <tr 
                        key={cat.id} 
                        className="hover:bg-[#F9FAFB]/40 transition-colors"
                      >
                        {/* ID destacado com badge cinza */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-bold font-mono bg-[#F4F5F7] text-[#6B7280] border border-[#E8E8EE]">
                            #{cat.id.toString().padStart(2, '0')}
                          </span>
                        </td>
                        <td className="p-3.5 text-sm font-bold text-[#111827]">
                          {cat.name}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 text-[#9CA3AF] hover:text-[#7F77DD] hover:bg-[#EEEDFE]/40 rounded-[6px] transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(cat)}
                              className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2]/40 rounded-[6px] transition-all cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Estado Vazio */
              <div className="py-16 border border-dashed border-[#E8E8EE] rounded-[14px] flex flex-col items-center justify-center text-[#9CA3AF] gap-3 bg-[#F9FAFB]/20">
                <span className="text-3xl">📭</span>
                <p className="text-sm font-medium">Nenhuma categoria encontrada para esta aba.</p>
              </div>
            )
          })()}
        </section>
      </main>

      {/* MODAL 1: CRIAR CATEGORIA */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-[14px] shadow-2xl p-4 sm:p-6 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#111827] mb-3">Nova Categoria</h3>
            <p className="text-xs text-[#9CA3AF] mb-5">Adicione uma classificação para categorizar suas transações.</p>
            
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              
              {/* Tipo de Categoria (Segmented Control/Toggle) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Tipo de Categoria</label>
                <div className="grid grid-cols-2 p-1 bg-[#F4F5F7] rounded-[12px] border border-[#E8E8EE]">
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('despesa')}
                    className={`py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                      newCategoryType === 'despesa'
                        ? 'bg-white text-[#EF4444] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#111827]'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('receita')}
                    className={`py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                      newCategoryType === 'receita'
                        ? 'bg-white text-[#15803D] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#111827]'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Nome da categoria</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    if (e.target.value.trim()) setCreateError(null)
                  }}
                  placeholder="Ex: Alimentação, Transporte, Lazer..."
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  autoFocus
                  disabled={createLoading}
                />
                {createError && (
                  <span className="text-[11px] font-semibold text-[#EF4444] animate-shake mt-0.5">
                    {createError}
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-2 border-t border-[#E8E8EE] pt-4">
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
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CATEGORIA */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-[14px] shadow-2xl p-4 sm:p-6 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#111827] mb-3">Editar Categoria</h3>
            <p className="text-xs text-[#9CA3AF] mb-5">Altere o nome da classificação cadastrada.</p>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111827]">Nome da categoria</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value)
                    if (e.target.value.trim()) setEditError(null)
                  }}
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  autoFocus
                  disabled={editLoading}
                />
                {editError && (
                  <span className="text-[11px] font-semibold text-[#EF4444] animate-shake mt-0.5">
                    {editError}
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-2 border-t border-[#E8E8EE] pt-4">
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

      {/* MODAL 3: EXCLUIR CATEGORIA (Confirmação) */}
      <Modal
        isOpen={isDeleteOpen}
        title="Excluir categoria"
        message={
          <span>
            Tem certeza que deseja excluir a categoria <strong>{selectedCategoryForDelete?.name || ''}</strong>? Esta ação não pode ser desfeita.
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

export default Configuracoes
