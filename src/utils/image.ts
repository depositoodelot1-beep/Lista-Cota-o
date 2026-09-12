/**
 * Utilitário para compactação e redimensionamento robusto de fotos capturadas pelo celular.
 * Reduz a imagem proporcionalmente para caber em maxDimension (ex: 800px)
 * e comprime em formato JPEG leve. Inclui fallback automático para garantir
 * que a imagem sempre apareça, mesmo em caso de falha no canvas ou memória.
 */
export async function compressProductImage(
  file: File,
  maxDimension = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      // Fallback: se o leitor falhar, tenta retornar string vazia ou criar object URL
      try {
        const objectUrl = URL.createObjectURL(file);
        resolve(objectUrl);
      } catch {
        resolve('');
      }
    };

    reader.onload = () => {
      const base64String = reader.result as string;
      if (!base64String) {
        resolve('');
        return;
      }

      const img = new Image();
      
      img.onerror = () => {
        // Se a imagem falhar ao carregar no objeto Image, retorna o base64 original do FileReader
        resolve(base64String);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

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
            resolve(base64String);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl || base64String);
        } catch (err) {
          console.warn('Erro ao processar canvas da imagem, usando original:', err);
          resolve(base64String);
        }
      };

      img.src = base64String;
    };

    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Erro ao ler arquivo como DataURL:', err);
      try {
        resolve(URL.createObjectURL(file));
      } catch {
        resolve('');
      }
    }
  });
}
