// @flow

import React, { type ComponentType } from 'react'
import { default as Modal } from 'react-native-modal'

export type ModalProps<Result> = { onDone(result: Result): mixed }

type QueueEntry = {
  Component: ComponentType<any>,
  onDone: (result: any) => mixed
}

type State = {
  isHiding: boolean,
  queue: Array<QueueEntry>
}

/**
 * Manages a queue of modal components to show to the user.
 * There should be a single instance of this class mounted somewhere in your
 * React component tree.
 */
export class ModalManager extends React.Component<{}, State> {
  constructor (props: {}) {
    super(props)
    this.state = { isHiding: false, queue: [] }

    // Register as the global modal manager:
    if (globalModalManager != null) {
      throw new Error('The ModalManager must only be mounted once')
    }
    globalModalManager = this
  }

  render () {
    // If the queue is empty, render nothing:
    if (this.state.queue.length === 0) return null

    const { Component, onDone } = this.state.queue[0]
    return (
      <Modal
        avoidKeyboard
        onModalHide={this.removeFromQueue}
        onBackdropPress={() => onDone(null)}
        onBackButtonPress={() => onDone(null)}
        useNativeDriver
        isVisible={!this.state.isHiding}
      >
        <Component onDone={onDone} />
      </Modal>
    )
  }

  componentWillUnmount () {
    // Un-register as the global modal manager:
    globalModalManager = null
  }

  // Removes a just-closed modal from the queue:
  removeFromQueue = () => {
    this.setState({ isHiding: false, queue: this.state.queue.slice(1) })
  }

  showModal<Result> (Component: ComponentType<ModalProps<Result>>): Promise<Result> {
    return new Promise(resolve =>
      // Push the component onto the end of the queue:
      this.setState({
        queue: [
          ...this.state.queue,
          {
            Component,
            onDone: result => {
              this.setState({ isHiding: true })
              resolve(result)
            }
          }
        ]
      })
    )
  }
}

let globalModalManager: ModalManager | null = null

/**
 * Pushes a modal onto the global queue.
 * @param {*} Component A modal component.
 * Receives a single prop, `onDone`, which it should call to hide itself.
 * The value passed to `onDone` becomes the returned promise result.
 */
export async function showModal<Result> (Component: ComponentType<ModalProps<Result>>): Promise<Result> {
  if (globalModalManager == null) {
    throw new Error('The ModalManager is not mounted')
  }
  return globalModalManager.showModal(Component)
}
