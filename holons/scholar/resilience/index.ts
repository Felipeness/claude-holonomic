export function createScholarResilience() {
  return {
    name: "scholar-resilience",
    async wrap<T>(operation: () => Promise<T>): Promise<T> {
      return operation()
    },
  }
}
