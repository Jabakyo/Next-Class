// Simple file locking mechanism
class FileLock {
  private locks = new Map<string, Promise<void>>()

  async lock(filePath: string): Promise<() => Promise<void>> {
    // Wait for any existing lock on this file
    if (this.locks.has(filePath)) {
      await this.locks.get(filePath)
    }

    // Create a new lock
    let releaseLock: () => void
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve
    })

    this.locks.set(filePath, lockPromise)

    // Return release function
    return async () => {
      releaseLock!()
      this.locks.delete(filePath)
    }
  }
}

export const lockfile = new FileLock()