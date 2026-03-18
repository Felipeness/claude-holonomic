export function createBuilderResilience() {
  return {
    name: "builder-resilience",
    async wrap<T>(operation: () => Promise<T>): Promise<T> {
      return operation()
    },
  }
}
