// src/features/products/utils/imageUpload.ts
// @eligi:image-upload-facade-v1
//
// Fachada sobre `@/shared/utils/imageCompress`.
//
// Este arquivo tinha a propria implementacao de resize em canvas. Existiam
// TRES no repo (aqui, no ImageCropper e nenhuma no AvatarPicker — que por isso
// gravava o arquivo cru). A logica agora e' unica; este modulo so traduz
// contrato.
//
// A assinatura publica (`readImageAsBase64`, `UploadResult`, `UploadError`)
// permanece IDENTICA de proposito: nenhum call-site precisa mudar.
//
// Diferencas de comportamento, todas favoraveis:
//   - saida em WebP (~30-40% menor que o JPEG anterior no mesmo tamanho);
//   - 800px continua sendo o maior lado — dimensao inalterada;
//   - downscale em etapas (menos serrilhado);
//   - orientacao EXIF respeitada; metadados descartados;
//   - `approxBytes` vira exato (blob.size) em vez de estimado pelo tamanho da
//     string, que dependia do prefixo 'data:image/jpeg;base64,' hardcoded.

import {
  compressImage,
  ImageCompressError,
  imageCompressMessage,
} from '@/shared/utils/imageCompress'

export type UploadError =
  | { kind: 'too_large';    message: string }
  | { kind: 'invalid_type'; message: string }
  | { kind: 'read_error';   message: string }

export interface UploadResult {
  base64:      string  // "data:image/webp;base64,..."
  approxBytes: number
}

/**
 * Traduz o erro tipado do compressor para o formato que os call-sites ja
 * esperam.
 *
 * Nota de divida: o contrato original lanca OBJETO LITERAL, nao `Error`. Isso
 * quebra `instanceof` e nao gera stack trace. Preservado aqui de proposito —
 * mudar o formato exigiria tocar todos os consumidores, o que e' patch
 * separado.
 */
function toUploadError(error: unknown): UploadError {
  const message = imageCompressMessage(error)

  if (error instanceof ImageCompressError) {
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
    const result = await compressImage(file, 'product')
    return { base64: result.dataUrl, approxBytes: result.bytes }
  } catch (error) {
    throw toUploadError(error)
  }
}
