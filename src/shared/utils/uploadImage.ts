// @eligi:upload-image-v1
/**
 * Envio de imagem: comprime no browser, sobe pro bucket, devolve a URL publica.
 *
 * Fonte unica do caminho de upload. Antes da extracao o AvatarPicker fazia isso
 * inline; produto, logo e announcement estavam a caminho de replicar. Quatro
 * copias da mesma logica e' o cenario que produziu tres compressores neste repo
 * — corrigido na fatia 0a e nao repetido aqui.
 *
 * A URL vem PRONTA do back (API_PUBLIC_URL + key). Monta-la no front a partir
 * de NEXT_PUBLIC_API_URL gravaria 'localhost:3333' no banco quando o save sai
 * de uma maquina de desenvolvimento.
 */

import api from '@/shared/lib/apiClient'
import {
  compressImage,
  imageCompressMessage,
  ImageCompressError,
  type ImagePresetName,
} from '@/shared/utils/imageCompress'

export interface UploadedImage {
  /** URL publica do bucket, ou o data URL quando o upload caiu no fallback. */
  value: string
  /** Data URL comprimido — serve pra preview otimista. */
  dataUrl: string
  /** false = o storage falhou e o valor e' base64 (comportamento legado). */
  stored: boolean
  bytes: number
}

export class ImageUploadError extends Error {
  readonly code: string

  constructor(message: string, code = 'UPLOAD_FAILED') {
    super(message)
    this.name = 'ImageUploadError'
    this.code = code
  }
}

/**
 * @param file    arquivo escolhido pelo usuario
 * @param preset  'avatar' | 'logo' | 'product' | 'banner'
 * @param onPreview  chamado assim que a compressao termina, antes da rede —
 *                   a imagem aparece na hora em vez de esperar o upload
 * @throws ImageUploadError quando a COMPRESSAO falha (arquivo invalido etc).
 *         Falha de rede NAO lanca: degrada pro base64.
 */
export async function uploadImage(
  file: File,
  preset: ImagePresetName,
  onPreview?: (dataUrl: string) => void,
): Promise<UploadedImage> {
  let dataUrl: string
  let bytes: number

  try {
    const compressed = await compressImage(file, preset)
    dataUrl = compressed.dataUrl
    bytes = compressed.bytes
  } catch (error) {
    const code = error instanceof ImageCompressError ? error.code : 'COMPRESS_FAILED'
    throw new ImageUploadError(imageCompressMessage(error), code)
  }

  onPreview?.(dataUrl)

  try {
    const { data } = await api.post<{ url: string }>('/uploads', {
      dataUrl,
      kind: preset,
    })
    return { value: data.url, dataUrl, stored: true, bytes }
  } catch {
    // Storage indisponivel nao pode impedir o cadastro. Degrada pro
    // comportamento anterior (base64 na coluna), que funciona hoje.
    // As colunas de imagem sao polimorficas por design — base64, 'color:' e URL
    // convivem, e o backfill varre por LIKE 'data:%'.
    return { value: dataUrl, dataUrl, stored: false, bytes }
  }
}

/**
 * Sobe um binario JA processado, sem recomprimir.
 *
 * @eligi:upload-blob
 * Usado pelo ImageCropper: ele entrega no tamanho final (512x512, 1200x675,
 * 800x800) e passar pelo compressImage redimensionaria de novo, brigando com o
 * enquadramento que o usuario acabou de ajustar.
 *
 * Mesmo contrato de falha do uploadImage: erro de rede NAO lanca, devolve o
 * dataUrl (comportamento legado) pra nao travar o cadastro.
 */
export async function uploadBlob(
  blob: Blob,
  kind: ImagePresetName,
  dataUrl: string,
): Promise<UploadedImage> {
  try {
    const { data } = await api.post<{ url: string }>('/uploads', {
      dataUrl,
      kind,
    })
    return { value: data.url, dataUrl, stored: true, bytes: blob.size }
  } catch {
    return { value: dataUrl, dataUrl, stored: false, bytes: blob.size }
  }
}

/** Mensagem pronta pra UI a partir de um erro desconhecido. */
export function uploadImageMessage(error: unknown): string {
  if (error instanceof ImageUploadError) return error.message
  return imageCompressMessage(error)
}
