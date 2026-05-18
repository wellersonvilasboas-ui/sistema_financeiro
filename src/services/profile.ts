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
