declare module '@brigad/react-native-adservices' {
  /**
   * Get the attribution token from Apple's AdServices framework
   * @returns Promise that resolves to the attribution token or null if not available
   */
  export function getAttributionToken(): Promise<string | null>
}
