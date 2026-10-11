/** Product photo cut-outs for the offer generator. Browser only. */

let worker: Worker | null = null;
let nextId = 0;

async function canvasFrom(blob: Blob, maxSide = Infinity) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

const png = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error("PNG vazio"))), "image/png"));

/**
 * Cleans the model's mask for a product photo: keeps only the largest object (stray text and crumbs
 * go), makes everything enclosed by it opaque (light nuts on a white table come out half see-through),
 * and keeps a soft two-pixel fringe on its outline for smooth edges.
 */
async function refine(blob: Blob) {
  const canvas = await canvasFrom(blob);
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.getImageData(0, 0, width, height);
  const alpha = (i: number) => image.data[i * 4 + 3];
  const size = width * height;

  // Largest connected region of solid pixels.
  const label = new Int32Array(size).fill(-1);
  const stack = new Int32Array(size);
  let largest = -1, largestSize = 0;
  for (let start = 0, region = 0; start < size; start++) {
    if (label[start] !== -1 || alpha(start) <= 128) continue;
    let top = 0, count = 0;
    stack[top++] = start;
    label[start] = region;
    while (top) {
      const i = stack[--top];
      count++;
      const x = i % width;
      for (const j of [i - width, i + width, x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1]) {
        if (j >= 0 && j < size && label[j] === -1 && alpha(j) > 128) { label[j] = region; stack[top++] = j; }
      }
    }
    if (count > largestSize) { largest = region; largestSize = count; }
    region++;
  }
  if (largest < 0) throw new Error("O recorte não encontrou o produto.");

  // Everything the largest region does not enclose is outside: flood from the borders around it.
  const outside = new Uint8Array(size);
  let top = 0;
  for (let i = 0; i < size; i++) {
    const x = i % width, y = (i / width) | 0;
    if ((x === 0 || y === 0 || x === width - 1 || y === height - 1) && label[i] !== largest) { outside[i] = 1; stack[top++] = i; }
  }
  while (top) {
    const i = stack[--top];
    const x = i % width;
    for (const j of [i - width, i + width, x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1]) {
      if (j >= 0 && j < size && !outside[j] && label[j] !== largest) { outside[j] = 1; stack[top++] = j; }
    }
  }

  // Inside: opaque. Outside but within two pixels of the object: the model's own soft edge. Beyond: clear.
  const near = (i: number) => {
    const x = i % width;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const j = i + dy * width + dx;
      if (x + dx >= 0 && x + dx < width && j >= 0 && j < size && !outside[j]) return true;
    }
    return false;
  };
  for (let i = 0; i < size; i++) {
    image.data[i * 4 + 3] = !outside[i] ? 255 : alpha(i) > 8 && near(i) ? alpha(i) : 0;
  }
  ctx.putImageData(image, 0, 0);
  return png(canvas);
}

/** Crops transparent margins, ignoring the nearly invisible pixels soft edges leave. */
export async function trim(blob: Blob) {
  const canvas = await canvasFrom(blob);
  const { width, height } = canvas;
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, width, height);
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 24) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0) throw new Error("Não sobrou nada da foto depois do recorte.");
  const cropped = document.createElement("canvas");
  cropped.width = right - left + 1;
  cropped.height = bottom - top + 1;
  cropped.getContext("2d")!.drawImage(canvas, -left, -top);
  return png(cropped);
}

/**
 * Removes the background of a photo and trims it. Calls onProgress with 0–1 while the model
 * downloads (only the first time; afterwards it comes from the browser cache).
 */
export async function removeBackground(file: Blob, onProgress?: (fraction: number) => void) {
  // The model works at 1024 px; larger photos only make the mask slower to apply.
  const input = await png(await canvasFrom(file, 1600));
  worker ??= new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  const id = ++nextId;
  const cutout = await new Promise<Blob>((resolve, reject) => {
    const listen = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "progress") {
        if (message.total) onProgress?.(message.loaded / message.total);
        return;
      }
      if (message.id !== id) return;
      worker!.removeEventListener("message", listen);
      if (message.type === "done") resolve(message.image);
      else reject(new Error(message.message));
    };
    worker!.addEventListener("message", listen);
    worker!.postMessage({ id, image: input });
  });
  return trim(await refine(cutout));
}
