// src/features/fiscal/download.ts
// Baixa/abre arquivos da API via axios (nunca window.open com URL montada):
// herda a baseURL do apiClient e manda o cookie (withCredentials). URL na
// mão abriria 401 numa aba em branco e dependeria de env no client.
import api from '@/shared/lib/apiClient'

/** Força download de um arquivo (XML da nota — documento de guarda). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await api.get<Blob>(path, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Abre um PDF em aba nova (comprovante — feito pra ver e compartilhar).
 * ⚠️ A aba é aberta ANTES do await: navegador bloqueia window.open que
 * acontece depois de um await (perde o gesto do usuário).
 */
export async function openPdf(path: string): Promise<void> {
  const tab = window.open('', '_blank', 'noopener')
  try {
    const res = await api.get<Blob>(path, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    if (tab) {
      tab.location.href = url
    } else {
      // popup bloqueado → cai pro download
      const a = document.createElement('a')
      a.href = url
      a.download = 'comprovante.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}
