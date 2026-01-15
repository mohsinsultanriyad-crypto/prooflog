export async function stampPhoto(file, stampText) {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  // Semi-transparent box
  const pad = Math.floor(canvas.width * 0.02);
  const fontSize = Math.max(22, Math.floor(canvas.width * 0.03));
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const lines = stampText.split("\n");
  const boxHeight = (lines.length + 1) * (fontSize + 8) + pad;
  ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);

  ctx.fillStyle = "white";
  let y = canvas.height - boxHeight + pad + fontSize;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += fontSize + 8;
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return new File([blob], "proof.jpg", { type: "image/jpeg" });
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
