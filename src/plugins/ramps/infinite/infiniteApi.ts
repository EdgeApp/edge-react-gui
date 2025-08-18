// Stub API client for infinite ramp plugin
// TODO: Implement actual API methods when API documentation is available

export interface InfiniteApiConfig {
  apiKey: string
  apiUrl: string
  orgId: string
}

// Stub implementations - will be replaced with actual API calls
export const infiniteApi = {
  getSupportedRegions: async (
    _config: InfiniteApiConfig
  ): Promise<string[]> => {
    // TODO: Implement API call
    return []
  },

  getSupportedCryptos: async (_config: InfiniteApiConfig): Promise<any[]> => {
    // TODO: Implement API call
    return []
  },

  getSupportedFiats: async (_config: InfiniteApiConfig): Promise<string[]> => {
    // TODO: Implement API call
    return []
  },

  getQuote: async (_config: InfiniteApiConfig, _params: any): Promise<any> => {
    // TODO: Implement API call
    return null
  },

  createOrder: async (
    _config: InfiniteApiConfig,
    _params: any
  ): Promise<any> => {
    // TODO: Implement API call
    return null
  }
}
