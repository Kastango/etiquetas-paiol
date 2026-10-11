/// <reference lib="webworker" />
import { pipeline, RawImage, type ProgressInfo } from "@huggingface/transformers";

/*
 * Background removal with ormbg (Apache-2.0, an IS-Net network), run entirely in the browser.
 * The model downloads once from Hugging Face and the browser keeps it in its cache.
 */
const MODEL = "onnx-community/ormbg-ONNX";
type Segment = (image: RawImage) => Promise<RawImage>;
let segmenter: Promise<Segment> | null = null;

const progress_callback = (info: ProgressInfo) => {
  if (info.status === "progress_total") postMessage({ type: "progress", loaded: info.loaded, total: info.total });
};

async function load(gpu: boolean): Promise<Segment> {
  const options = gpu
    ? { device: "webgpu" as const, dtype: "fp16" as const, progress_callback }
    : { device: "wasm" as const, dtype: "q8" as const, progress_callback };
  const run = await pipeline("background-removal", MODEL, options);
  return image => run(image) as Promise<RawImage>;
}

async function hasWebGPU() {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  return !!(await gpu?.requestAdapter().catch(() => null));
}

/** Half-precision models sometimes return a mask that is all on or all off. */
function degenerate(image: RawImage) {
  let low = 0, high = 0;
  for (let i = 3; i < image.data.length; i += 4) {
    if (image.data[i] < 16) low++;
    else if (image.data[i] > 239) high++;
  }
  const pixels = image.data.length / 4;
  return low > pixels * 0.995 || high > pixels * 0.995;
}

self.onmessage = async (event: MessageEvent<{ id: number; image: Blob }>) => {
  const { id, image } = event.data;
  try {
    const input = await RawImage.fromBlob(image);
    const gpu = await hasWebGPU();
    segmenter ??= load(gpu);
    let result = await (await segmenter)(input);
    if (gpu && degenerate(result)) {
      segmenter = load(false);
      result = await (await segmenter)(input);
    }
    postMessage({ type: "done", id, image: await result.toBlob("image/png") });
  } catch (error) {
    segmenter = null;
    postMessage({ type: "error", id, message: error instanceof Error ? error.message : String(error) });
  }
};
