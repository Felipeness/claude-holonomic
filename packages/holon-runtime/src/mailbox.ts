export interface Message<T = unknown> {
  readonly id: string
  readonly type: string
  readonly payload: T
  readonly timestamp: Date
  readonly replyTo?: string
}

export class Mailbox<T = unknown> {
  private queue: Message<T>[] = []
  private waiters: Array<(msg: Message<T>) => void> = []

  send(msg: Message<T>): void {
    const waiter = this.waiters.shift()
    if (waiter) {
      waiter(msg)
      return
    }
    this.queue.push(msg)
  }

  receive(): Promise<Message<T>> {
    const msg = this.queue.shift()
    if (msg) return Promise.resolve(msg)

    return new Promise<Message<T>>((resolve) => {
      this.waiters.push(resolve)
    })
  }

  tryReceive(): Message<T> | undefined {
    return this.queue.shift()
  }

  peek(): Message<T> | undefined {
    return this.queue[0]
  }

  size(): number {
    return this.queue.length
  }

  clear(): void {
    this.queue = []
    this.waiters = []
  }
}
