// src/features/products/utils/imageUpload.ts
//
// Converte File de imagem em base64. Aplica resize (canvas) pra reduzir tamanho:
// imagens >800px no maior lado são redimensionadas pra 800px máximo.
// Qualidade JPEG: 0.85.
//
// Isso evita explosão de tamanho do banco com base64 de fotos grandes.

const MAX_DIMENSION  = 800
const JPEG_QUALITY   = 0.85
const MAX_FILE_BYTES = 5 * 1024 * 1024   // 5MB de input

export type UploadError =
  | { kind: 'too_large';   message: string }
  | { kind: 'invalid_type'; message: string }
  | { kind: 'read_error';   message: string }

export interface UploadResult {
  base64:        string  // "data:image/jpeg;base64,..."
  approxBytes:   number
}

export async function readImageAsBase64(file: File): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    throw { kind: 'invalid_type', message: 'Selecione uma imagem (JPG, PNG ou WEBP)' } as UploadError
  }
  if (file.size > MAX_FILE_BYTES) {
    throw {
      kind: 'too_large',
      message: `Imagem muito grande. Máximo ${MAX_FILE_BYTES / 1024 / 1024}MB`,
    } as UploadError
  }

  // Lê como dataURL pra ter access ao bitmap
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  // Calcula novas dimensões mantendo proporção
  let { width, height } = img
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round(height * (MAX_DIMENSION / width))
      width = MAX_DIMENSION
    } else {
      width = Math.round(width * (MAX_DIMENSION / height))
      height = MAX_DIMENSION
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw { kind: 'read_error', message: 'Erro ao processar imagem' } as UploadError
  }

  // Fundo branco (pra PNG transparent virar branco no JPEG)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // Sempre exporta JPEG pra economizar tamanho
  const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  const approxBytes = Math.ceil((base64.length - 'data:image/jpeg;base64,'.length) * 3 / 4)

  return { base64, approxBytes }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject({ kind: 'read_error', message: 'Erro ao ler imagem' } as UploadError)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject({ kind: 'read_error', message: 'Imagem corrompida' } as UploadError)
    img.src = src
  })
}
