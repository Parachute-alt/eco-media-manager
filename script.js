// Conversion octets → Ko
function formatSize(bytes) {
  return (bytes / 1024).toFixed(2) + ' Ko';
}

// Estimation simple : 1 Mo ≈ 0.5g CO₂ (valeur indicative)
function estimateCO2Saved(originalBytes, compressedBytes) {
  const originalMB = originalBytes / (1024 * 1024);
  const compressedMB = compressedBytes / (1024 * 1024);
  const savedMB = originalMB - compressedMB;
  const savedGrams = savedMB * 0.5;
  return savedGrams > 0 ? savedGrams.toFixed(2) + ' g' : '0 g';
}

// Compression simple avec canvas (JPEG ou WebP)
function compressImage(file, exportAsWebp, callback) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const format = exportAsWebp ? 'image/webp' : 'image/jpeg';
      const extension = exportAsWebp ? 'webp' : 'jpg';

      // Compatibilité : fallback avec toDataURL si toBlob échoue (ex. WebP sur Firefox)
      canvas.toBlob(
        function (blob) {
          if (blob) {
            callback(blob, extension);
          } else {
            // Fallback : utiliser toDataURL puis le convertir en Blob
            const dataUrl = canvas.toDataURL(format, 0.7);
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: mimeString });
            callback(fallbackBlob, extension);
          }
        },
        format,
        0.7 // qualité
      );
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

const imageInput = document.getElementById('imageInput');
const exportWebpCheckbox = document.getElementById('exportWebp');

imageInput.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const originalSize = file.size;
  document.getElementById('originalSize').textContent = formatSize(originalSize);

  const exportAsWebp = exportWebpCheckbox.checked;

  // Prévisualisation de l'image
  const previewImg = document.getElementById('previewImage');
  const readerPreview = new FileReader();
  readerPreview.onload = function (event) {
    previewImg.src = event.target.result;
    previewImg.classList.remove('hidden');
  };
  readerPreview.readAsDataURL(file);

  compressImage(file, exportAsWebp, function (compressedBlob, extension) {
    const compressedSize = compressedBlob.size;
    document.getElementById('compressedSize').textContent = formatSize(compressedSize);
    document.getElementById('co2Saved').textContent = estimateCO2Saved(originalSize, compressedSize);

    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = URL.createObjectURL(compressedBlob);
    downloadLink.download = 'compressed_' + file.name.replace(/\.[^/.]+$/, '') + '.' + extension;

    document.getElementById('output').classList.remove('hidden');
  });
});
