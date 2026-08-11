// src/features/fiscal/download.ts
// Arquivos da API via axios (nunca window.open com URL montada): herda a
// baseURL do apiClient e manda o cookie. URL na mão abriria 401 numa aba
// em branco e dependeria de env no client.
import api from '@/shared/lib/apiClient'

/** Força download de um arquivo (XML — documento de guarda). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await api.get<Blob>(path, { responseType: 'blob' })
  saveBlob(res.data, filename)
}

/** Baixa um PDF e devolve o Blob — quem chama decide o que fazer. */
export async function fetchPdf(path: string): Promise<Blob> {
  const res = await api.get<Blob>(path, { responseType: 'blob' })
  return new Blob([res.data], { type: 'application/pdf' })
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Compartilhamento nativo (Web Share API nível 2 — arquivos).
 * No celular abre o menu do sistema, com WhatsApp incluso. No desktop
 * quase nunca existe; o chamador cai para download.
 */
export function canShareFiles(blob: Blob, filename: string): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  try {
    return navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })
  } catch {
    return false
  }
}

export async function shareBlob(blob: Blob, filename: string, title: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type })
  await navigator.share({ files: [file], title })
}

/**
 * Abre um PDF em aba nova. Usado onde um modal não cabe (painel lateral).
 *
 * ⚠️ A aba é aberta ANTES do await: navegador bloqueia window.open que
 * acontece depois de um await (perde o gesto do usuário). Se ainda assim
 * for bloqueado, cai para download.
 */
export async function openPdf(path: string, filename = 'comprovante.pdf'): Promise<void> {
  const tab = window.open('', '_blank', 'noopener')
  try {
    const blob = await fetchPdf(path)
    const url = URL.createObjectURL(blob)
    if (tab) {
      tab.location.href = url
    } else {
      saveBlob(blob, filename)
    }
    // ⚠️ não revogar de imediato: a aba ainda está carregando o blob
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}
