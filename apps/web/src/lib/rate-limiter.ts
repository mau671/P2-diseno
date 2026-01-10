type RateLimitedRequest<T> = () => Promise<T>;

class RateLimiter {
  private queue: Array<() => void> = [];
  private tokens = 2; // 2 tokens = 2 requests/second
  private lastRefill = Date.now();
  private refillInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startRefillMechanism();
  }

  private startRefillMechanism() {
    if (this.refillInterval) clearInterval(this.refillInterval);
    this.refillInterval = setInterval(() => {
      this.refillTokens();
      this.processQueue();
    }, 250); // Check every 250ms to refill tokens and process queue
  }

  private refillTokens() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    this.tokens = Math.min(2, this.tokens + elapsed * 2); // 2 tokens per second
    this.lastRefill = now;
  }

  async execute<T>(request: RateLimitedRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      this.queue.push(task);
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0 || this.tokens <= 0) {
      return;
    }

    // Process one request at a time to ensure token consumption is accurate
    const task = this.queue.shift();
    if (task) {
      this.tokens--;
      task();
      // Immediately try to process the next one if tokens are available
      this.processQueue();
    }
  }
}

export const rateLimiter = new RateLimiter();

