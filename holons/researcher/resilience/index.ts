export function createResearcherResilience() {
  return {
    name: "researcher-resilience",
    async wrap<T>(operation: () => Promise<T>): Promise<T> {
      return operation()
    },
  }
}
