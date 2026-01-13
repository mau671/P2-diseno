const RATE_LIMIT_DELAY = 500;
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_TOTAL_WAIT = 20000;

let lastRequestTime = 0;

export async function jikanFetch<T>(
  fetchFn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  retryDelayIndex: number = 0
): Promise<T> {
  await rateLimit();

  try {
    return await executeRequest(fetchFn);
  } catch (error) {
    if (!isRetryableError(error) || retries <= 0) {
      throw error;
    }

    const delay = RETRY_DELAYS[retryDelayIndex] ?? 16000;
    const estimatedTotalDelay = calculateTotalWait(retryDelayIndex, retries);

    if (estimatedTotalDelay > MAX_TOTAL_WAIT) {
      throw new Error('Max retry time exceeded (20s)');
    }

    await sleep(delay);
    return jikanFetch(fetchFn, retries - 1, retryDelayIndex + 1);
  }
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await sleep(RATE_LIMIT_DELAY - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();
}

async function executeRequest<T>(fn: () => Promise<T>): Promise<T> {
  const response = await fn();

  if (response && typeof response === 'object' && 'status' in response) {
    const errorResponse = response as { status: number; type?: string; messages?: { error?: string } };
    if (errorResponse.status >= 400) {
      const error = new Error(errorResponse.messages?.error || `HTTP Error: ${errorResponse.status}`) as Error & { status: number };
      error.status = errorResponse.status;
      throw error;
    }
  }

  return response;
}

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateTotalWait(currentIndex: number, remainingRetries: number): number {
  let total = 0;
  for (let i = currentIndex; i < RETRY_DELAYS.length && remainingRetries > 0; i++) {
    total += RETRY_DELAYS[i];
    remainingRetries--;
  }
  return total;
}

export function pickTitle(a: { title: string; title_english?: string | null }) {
  return (a.title_english || a.title || "").trim();
}

export function pickImage(a: any) {
  return (
    a?.images?.webp?.image_url ??
    a?.images?.jpg?.image_url ??
    a?.images?.webp?.large_image_url ??
    a?.images?.jpg?.large_image_url ??
    null
  );
}
