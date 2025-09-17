export async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt >= retries) throw error;
      const wait = delayMs * Math.pow(2, attempt - 1);
      await new Promise(res => setTimeout(res, wait));
    }
  }
}
