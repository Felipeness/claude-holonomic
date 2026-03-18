export interface DomainLayer {
  readonly name: string
  process(input: unknown): Promise<unknown>
}

export interface ApiLayer {
  readonly name: string
  handle(request: unknown): Promise<unknown>
}

export interface InfraLayer {
  readonly name: string
  connect(): Promise<void>
  disconnect(): Promise<void>
}

export interface ResilienceLayer {
  readonly name: string
  wrap<T>(operation: () => Promise<T>): Promise<T>
}

export interface HolonLayers {
  readonly domain: DomainLayer
  readonly api?: ApiLayer
  readonly infra?: InfraLayer
  readonly resilience?: ResilienceLayer
}

export function createHolonLayers(config: HolonLayers): HolonLayers {
  return config
}
