/**
 * AI Vision Proctoring Detection Module
 * 
 * Modular engine for analyzing video frames from the candidate's webcam feed.
 * Uses TensorFlow.js + COCO-SSD object detection to scan for "cell phone" /
 * secondary mobile devices above the confidence threshold.
 * 
 * Modular interface:
 *  - loadProctoringModel(): Loads and warms up the AI model.
 *  - detectProctoringViolations(videoElement, options): Evaluates current video frame and returns detections.
 *  - startProctoringLoop(videoElement, callbacks, options): Manages the periodic inspection loop (default every 3.5s).
 */

let cocoModel = null;
let isModelLoading = false;

export async function loadProctoringModel() {
  if (cocoModel) return cocoModel;
  if (isModelLoading) {
    while (isModelLoading) {
      await new Promise(r => setTimeout(r, 200));
    }
    return cocoModel;
  }

  isModelLoading = true;
  try {
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
    cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    console.log('🤖 AI Vision Proctoring Model initialized (COCO-SSD).');
    return cocoModel;
  } catch (err) {
    console.warn('AI Vision Proctoring: Primary model load fallback notice:', err.message);
    cocoModel = {
      isFallback: true,
      detect: async () => []
    };
    return cocoModel;
  } finally {
    isModelLoading = false;
  }
}

export async function detectProctoringViolations(videoElement, options = {}) {
  const { confidenceThreshold = 0.60, targetClasses = ['cell phone', 'phone'] } = options;
  if (!videoElement || videoElement.readyState < 2) {
    return { detected: false, items: [] };
  }

  try {
    const model = await loadProctoringModel();
    if (!model || model.isFallback) return { detected: false, items: [] };

    const predictions = await model.detect(videoElement);
    const violations = predictions.filter(pred => {
      const className = (pred.class || '').toLowerCase();
      const isTarget = targetClasses.some(tc => className.includes(tc));
      const isConfident = (pred.score || 0) >= confidenceThreshold;
      return isTarget && isConfident;
    });

    return {
      detected: violations.length > 0,
      items: violations.map(v => ({
        class: v.class,
        score: Math.round((v.score || 0) * 100),
        bbox: v.bbox
      }))
    };
  } catch (err) {
    console.warn('Proctor frame evaluation error:', err.message);
    return { detected: false, items: [] };
  }
}

/**
 * Start periodic inspection loop on the live video stream.
 * Returns an unbind / stop function.
 */
export function startProctoringLoop(videoElement, callbacks = {}, options = {}) {
  const { intervalMs = 3500, confidenceThreshold = 0.60 } = options;
  const { onDetection, onError } = callbacks;

  let isRunning = true;
  let timerId = null;

  async function checkFrame() {
    if (!isRunning) return;
    try {
      if (videoElement && videoElement.videoWidth > 0 && !videoElement.paused) {
        const result = await detectProctoringViolations(videoElement, { confidenceThreshold });
        if (result.detected && onDetection) {
          onDetection(result.items);
        }
      }
    } catch (e) {
      if (onError) onError(e);
    }

    if (isRunning) {
      timerId = setTimeout(checkFrame, intervalMs);
    }
  }

  // Pre-load model in background and start loop
  loadProctoringModel()
    .then(() => {
      if (isRunning) {
        timerId = setTimeout(checkFrame, 2000);
      }
    })
    .catch(() => {});

  return () => {
    isRunning = false;
    if (timerId) clearTimeout(timerId);
  };
}
