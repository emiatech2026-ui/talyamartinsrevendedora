/**
 * Client service to communicate with Gemini server endpoints for photo scanning:
 * - Boleto extraction (OCR / AI)
 * - Product photo recognition (OCR / Multimodal AI)
 */

export interface ParsedBoletoResult {
  brand: string;
  amount: number;
  dueDate: string;
  barcode?: string;
  cycle?: string;
  notes?: string;
}

export interface ParsedProductItem {
  name: string;
  brand: string;
  category: string;
  catalogPrice: number;
  quantity: number;
  code?: string;
  validity?: string;
  batch?: string;
  notes?: string;
}

export interface ParsedProductsResult {
  products: ParsedProductItem[];
}

/**
 * Resizes an image file to max width/height to make uploading fast and reliable
 */
export async function resizeImageForUpload(file: File, maxDimension = 1600): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            base64: readerEvent.target?.result as string,
            mimeType: file.type || 'image/jpeg'
          });
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: dataUrl,
          mimeType: 'image/jpeg'
        });
      };
      img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Sends a boleto image to server Gemini endpoint to extract data
 */
export async function scanBoletoPhoto(file: File, knownBrands: string[] = []): Promise<ParsedBoletoResult> {
  const { base64, mimeType } = await resizeImageForUpload(file);

  const res = await fetch('/api/gemini/parse-boleto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType,
      brands: knownBrands,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `Erro no servidor (${res.status})`);
  }

  const result = await res.json();
  if (!result.success || !result.data) {
    throw new Error('Não foi possível extrair os dados do boleto na imagem.');
  }

  return result.data as ParsedBoletoResult;
}

/**
 * Sends a photo of one or more products to server Gemini endpoint
 */
export async function scanProductsPhoto(file: File, configuredBrands: string[] = []): Promise<ParsedProductsResult> {
  const { base64, mimeType } = await resizeImageForUpload(file);

  const res = await fetch('/api/gemini/parse-products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType,
      configuredBrands,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `Erro no servidor (${res.status})`);
  }

  const result = await res.json();
  if (!result.success || !result.data || !Array.isArray(result.data.products)) {
    throw new Error('Nenhum produto reconhecido na foto.');
  }

  return result.data as ParsedProductsResult;
}
