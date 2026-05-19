import { supabase } from '../lib/supabase'

/**
 * Faz o upload de um arquivo de imagem para o bucket "avatars" no Supabase Storage
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Gera um nome único para o arquivo para evitar problemas de cache
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    if (import.meta.env.DEV) console.error('[profile.service] Erro no upload:', uploadError)
    throw new Error(`Falha ao fazer upload da imagem: ${uploadError.message}`)
  }

  // Gera a URL pública da imagem recém enviada
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  return data.publicUrl
}

/**
 * Atualiza o metadata do usuário logado com a nova URL do avatar
 */
export async function updateProfileAvatar(avatarUrl: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl }
  })

  if (error) {
    if (import.meta.env.DEV) console.error('[profile.service] Erro ao atualizar metadados:', error)
    throw new Error(`Falha ao salvar a foto de perfil: ${error.message}`)
  }
}

/**
 * Atualiza a senha do usuário logado no Supabase Auth
 */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    if (import.meta.env.DEV) console.error('[profile.service] Erro ao atualizar senha:', error)
    throw new Error(`Falha ao alterar a senha: ${error.message}`)
  }
}

/**
 * Busca o perfil do usuário logado (incluindo o whatsapp_number)
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Se não existir perfil, retorna null ao invés de lançar erro (para tratarmos como inserção na hora de salvar)
  if (error && error.code !== 'PGRST116') {
    if (import.meta.env.DEV) console.error('[profile.service] Erro ao buscar perfil:', error)
    throw new Error(`Falha ao buscar perfil: ${error.message}`)
  }

  return data
}

/**
 * Salva ou atualiza o número de WhatsApp do usuário no banco de dados.
 */
export async function updateWhatsAppNumber(userId: string, whatsappNumber: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      whatsapp_number: whatsappNumber,
      updated_at: new Date().toISOString()
    })

  if (error) {
    if (import.meta.env.DEV) console.error('[profile.service] Erro ao atualizar WhatsApp:', error)
    throw new Error(`Falha ao salvar número do WhatsApp: ${error.message}`)
  }
}
