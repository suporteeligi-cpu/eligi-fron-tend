// src/features/products/utils/imageUpload.ts
// @eligi:image-upload-facade-v2
//
// Fachada sobre `@/shared/utils/uploadImage`.
//
// Historico: este arquivo tinha implementacao propria de resize em canvas
// (fatia 0a consolidou no imageCompress); agora delega tambem o upload.
// A assinatura publica (`readImageAsBase64`, `UploadResult`, `UploadError`)
// permanece IDENTICA — o unico call-site nao muda.
//
// O campo continua chamando `base64` por compatibilidade, mas hoje carrega a
// URL do bucket. A coluna Product.imageUrl e' polimorfica: aceita os dois, e o
// <img src> do dashboard e da vitrine publica renderiza qualquer um.

import {
  uploadImage,
  ImageUploadError,
  uploadImageMessage,
} from '@/shared/utils/uploadImage'

export type UploadError =
  | { kind: 'too_large';    message: string }
  | { kind: 'invalid_type'; message: string }
  | { kind: 'read_error';   message: string }

export interface UploadResult {
  /** URL do bucket (ou data URL, se o storage falhou). */
  base64:      string
  approxBytes: number
}

/**
 * Traduz o erro tipado para o formato que o call-site ja espera.
 *
 * Divida conhecida: este contrato lanca OBJETO LITERAL, nao `Error` — quebra
 * `instanceof` e nao gera stack trace. Preservado de proposito; mudar o formato
 * exigiria tocar o consumidor, o que e' patch separado.
 */
function toUploadError(error: unknown): UploadError {
  const message = uploadImageMessage(error)

  if (error instanceof ImageUploadError) {
    switch (error.code) {
      case 'UNSUPPORTED_TYPE':
        return { kind: 'invalid_type', message }
      case 'FILE_TOO_LARGE':
        return { kind: 'too_large', message }
      default:
        return { kind: 'read_error', message }
    }
  }

  return { kind: 'read_error', message }
}

export async function readImageAsBase64(file: File): Promise<UploadResult> {
  try {
    const result = await uploadImage(file, 'product')
    return { base64: result.value, approxBytes: result.bytes }
  } catch (error) {
    throw toUploadError(error)
  }
}
