import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signIn, sendPasswordReset } from '../lib/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recovery States
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoverySuccess, setRecoverySuccess] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error('[Login] Erro ao autenticar:', err)
      setError(err.message || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryEmail) {
      setRecoveryError('Por favor, preencha o e-mail.')
      return
    }

    setRecoveryLoading(true)
    setRecoveryError(null)
    setRecoverySuccess(false)

    try {
      await sendPasswordReset(recoveryEmail)
      setRecoverySuccess(true)
    } catch (err: any) {
      console.error('[Login] Erro ao enviar redefinição:', err)
      setRecoveryError(err.message || 'Erro ao enviar e-mail de recuperação.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-[400px] bg-white border border-[#E8E8EE] rounded-[14px] shadow-sm p-8 transition-all">
        {/* Logo F em box roxo */}
        <div className="w-12 h-12 bg-[#7F77DD] rounded-[10px] flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-lg shadow-[#7F77DD]/20 mb-4 animate-bounce">
          F
        </div>

        {!isRecoveryMode ? (
          <>
            {/* Título e Subtítulo */}
            <h2 className="text-lg font-bold text-[#111827] text-center mb-1">
              Sistema Financeiro
            </h2>
            <p className="text-[13px] text-[#9CA3AF] text-center mb-6">
              Faça login para continuar
            </p>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* E-mail */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-[#111827]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  required
                />
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-[#111827]">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true)
                      setError(null)
                    }}
                    className="text-xs font-semibold text-[#7F77DD] hover:text-[#534AB7] transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#111827] cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-[#7F77DD] hover:bg-[#534AB7] text-white font-semibold text-sm rounded-[999px] flex items-center justify-center gap-2 shadow-sm shadow-[#7F77DD]/20 hover:shadow-md hover:shadow-[#7F77DD]/20 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              {/* Mensagem de Erro */}
              {error && (
                <div className="mt-2 p-3 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] text-center animate-shake">
                  {error}
                </div>
              )}
            </form>
          </>
        ) : (
          <>
            {/* Título e Subtítulo Recuperação */}
            <h2 className="text-lg font-bold text-[#111827] text-center mb-1">
              Recuperar Senha
            </h2>
            <p className="text-[13px] text-[#9CA3AF] text-center mb-6">
              Digite seu e-mail para receber o link de redefinição
            </p>

            {/* Formulário de Recuperação */}
            <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="recovery-email" className="text-xs font-semibold text-[#111827]">
                  E-mail cadastrado
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E8EE] rounded-[10px] text-sm text-[#111827] bg-[#F4F5F7]/30 placeholder-[#9CA3AF] focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  required
                />
              </div>

              {/* Botão Enviar */}
              <button
                type="submit"
                disabled={recoveryLoading}
                className="w-full mt-2 py-2.5 bg-[#7F77DD] hover:bg-[#534AB7] text-white font-semibold text-sm rounded-[999px] flex items-center justify-center gap-2 shadow-sm shadow-[#7F77DD]/20 hover:shadow-md hover:shadow-[#7F77DD]/20 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {recoveryLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando link...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </button>

              {/* Mensagem de Erro do Envio */}
              {recoveryError && (
                <div className="mt-2 p-3 bg-[#FEE2E2] border border-[#FCA5A5]/40 rounded-[10px] text-xs font-medium text-[#EF4444] text-center">
                  {recoveryError}
                </div>
              )}

              {/* Mensagem de Sucesso */}
              {recoverySuccess && (
                <div className="mt-2 p-3 bg-[#DCFCE7] border border-[#34D399]/40 rounded-[10px] text-xs font-medium text-[#15803D] text-center">
                  E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.
                </div>
              )}

              {/* Voltar para o Login */}
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(false)
                  setRecoverySuccess(false)
                  setRecoveryError(null)
                  setRecoveryEmail('')
                }}
                className="text-xs font-semibold text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer text-center mt-2"
              >
                Voltar para o Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default Login
