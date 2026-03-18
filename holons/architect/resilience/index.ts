export function createArchitectResilience() {
  return {
    name: "architect-resilience",
    async wrap<T>(operation: () => Promise<T>): Promise<T> {
      return operation()
    },
  }
}
