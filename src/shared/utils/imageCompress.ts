// @eligi:image-compress-v1
/**
 * Compressao de imagem client-side.
 *
 * Motivo: os uploads gravam base64 cru no banco. Base64 viaja DENTRO do JSON
 * da API — sem cache de browser, sem 304, sem CDN — entao cada byte a mais e
 * rebaixado a cada resposta que inclui a coluna. Um avatar de 1,8 MB e
 * renderizado a ~40px na navbar: 900x mais bytes do que a tela consome.
 *
 * Este modulo e a fonte unica de compressao. Todo caminho de upload do
 * dashboard passa por aqui.
 *
 * Retorna `blob` E `dataUrl` de proposito:
 *   - `dataUrl` alimenta o schema atual (colunas base64);
 *   - `blob` alimenta o upload direto pro bucket (fatia 1), sem reescrita.
 *
 * Efeito colateral desejado: re-encodar em canvas descarta o EXIF, removendo
 * geolocalizacao e metadados do aparelho das fotos tiradas dentro da loja.
 */

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

export interface ImageCompressPreset {
  /** Maior lado da imagem de saida, em pixels CSS. */
  readonly maxEdge: number;
  /** Qualidade do encoder, 0..1. Ignorado em formatos sem perda. */
  readonly quality: number;
  /** Formato preferido de saida. */
  readonly mimeType: 'image/webp';
}

/**
 * Alvos por tipo de asset. Avatar a 40px e banner a 1600px nao podem
 * compartilhar o mesmo numero.
 */
export const IMAGE_PRESETS = {
  /** Avatar de profissional — renderizado <= 96px, com folga pra retina. */
  avatar: { maxEdge: 256, quality: 0.8, mimeType: 'image/webp' },
  /** Logo do estabelecimento — aparece no link publico e na navbar. */
  logo: { maxEdge: 512, quality: 0.85, mimeType: 'image/webp' },
  /** Foto de produto — card heroi da vitrine (96px) e detalhe no dashboard. */
  product: { maxEdge: 800, quality: 0.8, mimeType: 'image/webp' }, // @eligi:product-preset-800
  /** Banner / anuncio — ocupa largura total da tela. */
  banner: { maxEdge: 1600, quality: 0.8, mimeType: 'image/webp' },
} as const satisfies Record<string, ImageCompressPreset>;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;

/* ------------------------------------------------------------------ */
/* Contratos                                                           */
/* ------------------------------------------------------------------ */

export interface CompressedImage {
  /** Binario comprimido — usar no upload direto pro bucket. */
  readonly blob: Blob;
  /** Data URL base64 — usar enquanto o schema guardar base64. */
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
  readonly mimeType: string;
  /** Bytes do arquivo original escolhido pelo usuario. */
  readonly originalBytes: number;
  /** Bytes do binario comprimido. */
  readonly bytes: number;
}

export type ImageCompressErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'FILE_TOO_LARGE'
  | 'DECODE_FAILED'
  | 'ENCODE_FAILED'
  | 'CANVAS_UNAVAILABLE';

export class ImageCompressError extends Error {
  readonly code: ImageCompressErrorCode;

  constructor(code: ImageCompressErrorCode, message: string) {
    super(message);
    this.name = 'ImageCompressError';
    this.code = code;
  }
}

/* ------------------------------------------------------------------ */
/* Limites de entrada                                                  */
/* ------------------------------------------------------------------ */

const ACCEPTED_INPUT_TYPES: readonly string[] = [
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
];

/**
 * Teto do arquivo de ENTRADA. Rejeitar antes de decodificar evita estourar a
 * memoria do celular: uma imagem de 8000x6000 ocupa ~192 MB descomprimida no
 * canvas, independente do peso do arquivo.
 */
// @eligi:max-input-mb
/** Teto do arquivo de entrada em MB. Exportado pra UI exibir o mesmo
 *  numero que a validacao aplica — evita texto de ajuda mentindo. */
export const MAX_INPUT_MB = 25;

const MAX_INPUT_BYTES = MAX_INPUT_MB * 1024 * 1024;

/**
 * Teto de pixels da imagem DECODIFICADA (~40 megapixels). Protege contra
 * decompression bomb: arquivo pequeno que expande pra centenas de MB em RAM.
 */
const MAX_INPUT_PIXELS = 40_000_000;

/** Atributo `accept` pronto pro <input type="file">. */
export const IMAGE_ACCEPT_ATTR = ACCEPTED_INPUT_TYPES.join(',');

/* ------------------------------------------------------------------ */
/* Suporte a WebP                                                      */
/* ------------------------------------------------------------------ */

let webpSupport: boolean | null = null;

/**
 * Detecta suporte a encode WebP uma unica vez. Em 2026 e praticamente
 * universal; o fallback existe pra nao quebrar navegador antigo.
 */
function supportsWebpEncode(): boolean {
  if (webpSupport !== null) return webpSupport;
  if (typeof document === 'undefined') {
    webpSupport = false;
    return webpSupport;
  }
  try {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    webpSupport = probe.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

/* ------------------------------------------------------------------ */
/* Decodificacao                                                       */
/* ------------------------------------------------------------------ */

interface DecodedSource {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly release: () => void;
}

/**
 * Decodifica via createImageBitmap quando disponivel, com
 * `imageOrientation: 'from-image'` — sem isso, foto de celular com rotacao no
 * EXIF entra deitada, e o canvas descarta o EXIF, tornando o defeito
 * permanente.
 */
async function decodeWithBitmap(file: Blob): Promise<DecodedSource | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  } catch {
    return null;
  }
}

/** Fallback via <img> + object URL. Nao corrige orientacao EXIF. */
function decodeWithImageElement(file: Blob): Promise<DecodedSource> {
  return new Promise<DecodedSource>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(objectUrl),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new ImageCompressError(
          'DECODE_FAILED',
          'Nao foi possivel ler a imagem. Tente outro arquivo.',
        ),
      );
    };

    img.decoding = 'async';
    img.src = objectUrl;
  });
}

async function decode(file: Blob): Promise<DecodedSource> {
  const viaBitmap = await decodeWithBitmap(file);
  if (viaBitmap) return viaBitmap;
  return decodeWithImageElement(file);
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new ImageCompressError(
      'CANVAS_UNAVAILABLE',
      'Compressao de imagem so funciona no browser.',
    );
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageCompressError(
      'CANVAS_UNAVAILABLE',
      'O navegador nao disponibilizou o contexto 2D.',
    );
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

/**
 * Redimensiona reduzindo pela metade em etapas.
 *
 * Um unico drawImage de 4000px pra 256px amostra pixels salteados e produz
 * serrilhado grosseiro. Reduzir por halving mantem a media dos pixels
 * descartados a cada passo — a diferenca de nitidez no avatar e visivel a olho
 * nu.
 */
function drawScaled(
  decoded: DecodedSource,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  let canvas = createCanvas(decoded.width, decoded.height);
  get2d(canvas).drawImage(decoded.source, 0, 0, decoded.width, decoded.height);

  let currentWidth = decoded.width;
  let currentHeight = decoded.height;

  while (currentWidth > targetWidth * 2 && currentHeight > targetHeight * 2) {
    const nextWidth = Math.max(targetWidth, Math.round(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.round(currentHeight / 2));

    const next = createCanvas(nextWidth, nextHeight);
    get2d(next).drawImage(canvas, 0, 0, nextWidth, nextHeight);

    canvas = next;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
    const final = createCanvas(targetWidth, targetHeight);
    get2d(final).drawImage(canvas, 0, 0, targetWidth, targetHeight);
    canvas = final;
  }

  return canvas;
}

function toBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(
          new ImageCompressError(
            'ENCODE_FAILED',
            'Nao foi possivel gerar a imagem comprimida.',
          ),
        );
      },
      mimeType,
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const { result } = reader;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(
        new ImageCompressError(
          'ENCODE_FAILED',
          'Nao foi possivel converter a imagem.',
        ),
      );
    };
    reader.onerror = () => {
      reject(
        new ImageCompressError(
          'ENCODE_FAILED',
          'Nao foi possivel converter a imagem.',
        ),
      );
    };
    reader.readAsDataURL(blob);
  });
}

/* ------------------------------------------------------------------ */
/* API publica                                                         */
/* ------------------------------------------------------------------ */

/**
 * Comprime uma imagem escolhida pelo usuario.
 *
 * @param file   Arquivo vindo do <input type="file"> ou de um drop.
 * @param preset Nome do preset em IMAGE_PRESETS.
 * @throws ImageCompressError com `code` para tratamento na UI.
 */
export async function compressImage(
  file: File,
  preset: ImagePresetName,
): Promise<CompressedImage> {
  const config = IMAGE_PRESETS[preset];

  if (file.type && !ACCEPTED_INPUT_TYPES.includes(file.type)) {
    throw new ImageCompressError(
      'UNSUPPORTED_TYPE',
      'Formato nao suportado. Use JPG, PNG ou WebP.',
    );
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageCompressError(
      'FILE_TOO_LARGE',
      `Imagem muito grande (maximo ${Math.round(MAX_INPUT_BYTES / 1024 / 1024)} MB).`,
    );
  }

  const decoded = await decode(file);

  try {
    if (decoded.width < 1 || decoded.height < 1) {
      throw new ImageCompressError('DECODE_FAILED', 'Imagem invalida.');
    }

    if (decoded.width * decoded.height > MAX_INPUT_PIXELS) {
      throw new ImageCompressError(
        'FILE_TOO_LARGE',
        'Imagem com resolucao alta demais. Reduza antes de enviar.',
      );
    }

    const scale = Math.min(1, config.maxEdge / Math.max(decoded.width, decoded.height));
    const targetWidth = Math.max(1, Math.round(decoded.width * scale));
    const targetHeight = Math.max(1, Math.round(decoded.height * scale));

    const useWebp = supportsWebpEncode();
    const mimeType = useWebp ? config.mimeType : 'image/jpeg';

    const canvas = drawScaled(decoded, targetWidth, targetHeight);

    // JPEG nao tem canal alpha: sem fundo, area transparente vira preto.
    // Logo em PNG com fundo transparente e o caso real disso.
    if (!useWebp) {
      const ctx = get2d(canvas);
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.globalCompositeOperation = 'source-over';
    }

    const blob = await toBlob(canvas, mimeType, config.quality);
    const dataUrl = await blobToDataUrl(blob);

    return {
      blob,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      mimeType,
      originalBytes: file.size,
      bytes: blob.size,
    };
  } finally {
    decoded.release();
  }
}

/**
 * Mensagem pronta pra UI a partir de um erro desconhecido.
 * Evita vazar stack trace num toast.
 */
export function imageCompressMessage(error: unknown): string {
  if (error instanceof ImageCompressError) return error.message;
  return 'Nao foi possivel processar a imagem. Tente novamente.';
}
