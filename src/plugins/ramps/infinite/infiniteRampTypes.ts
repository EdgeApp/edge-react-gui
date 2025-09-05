import { asObject, asString } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import type { NavigationBase } from '../../../types/routerTypes'
import type { OpenWebViewOptions } from '../../../util/webViewUtils'
import type { Workflow } from '../utils/workflows'
import type { InfiniteApi } from './infiniteApiTypes'
import type { InfinitePluginState } from './infiniteRampPlugin'

// Workflow status type
export type WorkflowStatus =
  | 'idle'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'ignored'

// Individual workflow state
export interface WorkflowState {
  status: WorkflowStatus
  sceneShown?: boolean
}

// Workflow state for fetchQuote scope
export interface FetchQuoteWorkflowState {
  auth: WorkflowState
  kyc: WorkflowState
  tos: WorkflowState
  bankAccount: WorkflowState
}

// Workflow utils for Infinite plugin
export interface InfiniteWorkflowUtils {
  account: EdgeAccount
  infiniteApi: InfiniteApi
  navigation: NavigationBase // Navigation prop type
  openWebView: (options: OpenWebViewOptions) => Promise<void>
  pluginId: string
  state: InfinitePluginState
  workflowState: FetchQuoteWorkflowState
}

// Type alias for Infinite workflows
export type InfiniteWorkflow = Workflow<InfiniteWorkflowUtils>

// Init options cleaner for infinite ramp plugin
export const asInitOptions = asObject({
  apiUrl: asString,
  orgId: asString
})
