/**
 * Promise-based latch barrier primitive for high-precision simultaneous query dispatch.
 * Coordinates multiple concurrent sessions so that their database operations are dispatched
 * at the exact same millisecond.
 */
export class Barrier {
  private count: number = 0;
  private readonly target: number;
  private resolveAll!: () => void;
  private rejectAll!: (reason?: any) => void;
  private promise: Promise<void>;
  private released: boolean = false;

  constructor(target: number) {
    if (target <= 0) {
      throw new Error(`Barrier target must be greater than 0, received ${target}`);
    }
    this.target = target;
    this.promise = new Promise<void>((resolve, reject) => {
      this.resolveAll = resolve;
      this.rejectAll = reject;
    });
  }

  /**
   * Waits until all `target` participants have invoked `wait()`, then unblocks all simultaneously.
   * If `timeoutMs` is provided and expires before target is reached, rejects with an Error.
   */
  async wait(timeoutMs?: number): Promise<void> {
    if (this.released) return;

    this.count++;
    if (this.count >= this.target) {
      this.released = true;
      this.resolveAll();
      return;
    }

    if (timeoutMs && timeoutMs > 0) {
      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<void>((_, reject) => {
        timer = setTimeout(() => {
          if (!this.released) {
            reject(
              new Error(
                `Barrier timed out after ${timeoutMs}ms (arrived: ${this.count}/${this.target})`
              )
            );
          }
        }, timeoutMs);
      });

      try {
        await Promise.race([this.promise, timeoutPromise]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    } else {
      await this.promise;
    }
  }

  /**
   * Returns current count of arrived participants.
   */
  get arrivedCount(): number {
    return this.count;
  }

  /**
   * Returns whether barrier has tripped.
   */
  get isReleased(): boolean {
    return this.released;
  }
}
