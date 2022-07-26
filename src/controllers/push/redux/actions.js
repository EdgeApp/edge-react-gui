// @flow

import { type PushEvent } from '../types'

type AddPushEventsAction = {
  type: 'PUSH/ADD_PUSH_EVENTS',
  events: PushEvent[]
}

export const addPushEvents = (events: PushEvent[]): AddPushEventsAction => {
  return {
    type: 'PUSH/ADD_PUSH_EVENTS',
    events
  }
}

export type PushAction = AddPushEventsAction
