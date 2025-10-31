import type { PostHog } from 'posthog-react-native'

declare global {
  // Expose the analytics instance on the global scope for app-wide use
  // The PostHog instance is initialized at runtime
  // See src/util/tracking.ts for initialization
  var posthog: PostHog | undefined
}
