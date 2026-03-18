export function createBrainResilience() {
  return {
    name: "brain-resilience",
    async wrap<T>(operation: () => Promise<T>): Promise<T> {
      return operation()
    },
  }
}
