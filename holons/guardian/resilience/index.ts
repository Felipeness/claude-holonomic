export function createGuardianResilience() {
  return {
    name: "guardian-resilience",
    async wrap<T>(operation: () => Promise<T>): Promise<T> {
      return operation()
    },
  }
}
