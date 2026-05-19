import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 1. Verificar sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    // 2. Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] Usuário acessou pelo link de recuperação de senha.')
        localStorage.setItem('password_recovery_mode', 'true')
        window.location.href = '/configuracoes'
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 3. Sincronizar moeda preferida quando o usuário logar
  useEffect(() => {
    if (user?.id) {
      import('../services/profile').then(({ getProfile }) => {
        getProfile(user.id).then(profile => {
          if (profile?.preferred_currency) {
            import('../utils/format').then(({ setCurrency }) => {
              setCurrency(profile.preferred_currency as 'BRL' | 'USD')
            })
          }
        }).catch(err => {
          console.error('[AuthContext] Falha ao carregar perfil para sincronizar moeda:', err)
        })
      })
    }
  }, [user?.id])

  const handleLogout = async () => {
    try {
      setLoading(true)
      await signOut()
      setUser(null)
    } catch (err: any) {
      console.error('[AuthContext] Erro ao deslogar:', err)
      setError(err.message || 'Erro ao deslogar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
