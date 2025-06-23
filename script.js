
// Charge une librairie externe pour la compression
// On utilisera browser-image-compression via CDN dans le HTML si besoin (ici pas nécessaire pour le prototype de base)

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

// Compression simple avec canvas (pas la plus efficace, mais native)
function compressImage(file, callback) {
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

      canvas.toBlob(
        function (blob) {
          callback(blob);
        },
        'image/jpeg',
        0.7 // qualité
      );
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById('imageInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const originalSize = file.size;
  document.getElementById('originalSize').textContent = formatSize(originalSize);

  compressImage(file, function (compressedBlob) {
    const compressedSize = compressedBlob.size;
    document.getElementById('compressedSize').textContent = formatSize(compressedSize);
    document.getElementById('co2Saved').textContent = estimateCO2Saved(originalSize, compressedSize);

    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = URL.createObjectURL(compressedBlob);
    downloadLink.download = 'compressed_' + file.name;

    document.getElementById('output').classList.remove('hidden');
  });
});
