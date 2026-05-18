import { supabase } from './supabase'

export async function signIn(email?: string, password?: string) {
  const finalEmail = email || import.meta.env.VITE_DEV_EMAIL
  const finalPassword = password || import.meta.env.VITE_DEV_PASSWORD

  if (!finalEmail || !finalPassword) {
    throw new Error('E-mail ou senha não informados.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: finalEmail,
    password: finalPassword,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}
