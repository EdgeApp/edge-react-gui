// @flow

import * as React from 'react'
import { Dimensions, Platform } from 'react-native'
import Modal from 'react-native-modal'

export type ModalProps<Result> = { onDone(result: Result): mixed }

type QueueEntry = {
  Component: React.ComponentType<any>,
  onDone: (result: any) => mixed,
  modalProps: Object
}

type State = {
  isHiding: boolean,
  queue: QueueEntry[]
}

/**
 * Manages a queue of modal components to show to the user.
 * There should be a single instance of this class mounted somewhere in your
 * React component tree.
 */
export class ModalProvider extends React.Component<{}, State> {
  id: string

  constructor(props: {}) {
    super(props)
    this.state = { isHiding: false, queue: [] }

    this.id = 'ModalProvider' + globalNextId++
    globalInstances[this.id] = this
  }

  componentWillUnmount() {
    delete globalInstances[this.id]
  }

  render() {
    // If the queue is empty, render nothing:
    if (this.state.queue.length === 0) return null

    const deviceWidth = Dimensions.get('window').width
    const deviceHeight =
      Platform.OS === 'ios'
        ? Dimensions.get('window').height
        : require('react-native-extra-dimensions-android').get(
            'REAL_WINDOW_HEIGHT'
          )

    const { Component, onDone, modalProps } = this.state.queue[0]
    return (
      <Modal
        avoidKeyboard
        deviceHeight={deviceHeight}
        deviceWidth={deviceWidth}
        isVisible={!this.state.isHiding}
        onBackButtonPress={() => onDone(null)}
        onBackdropPress={() => onDone(null)}
        onModalHide={this.removeFromQueue}
        useNativeDriver
        {...modalProps}
      >
        <Component onDone={onDone} />
      </Modal>
    )
  }

  // Removes a just-closed modal from the queue:
  removeFromQueue = () => {
    this.setState({ isHiding: false, queue: this.state.queue.slice(1) })
  }

  launchModal<Result>(
    Component: React.ComponentType<ModalProps<Result>>,
    modalProps: Object
  ): Promise<Result> {
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
            },
            modalProps
          }
        ]
      })
    )
  }
}

let globalNextId: number = 0
const globalInstances: { [id: string]: ModalProvider } = {}

/**
 * If there are multiple ModalProviders mounted, just pick one:
 */
function getInstance() {
  const [id] = Object.keys(globalInstances)
  if (id == null) throw new Error('No ModalProvider is mounted')

  return globalInstances[id]
}

/**
 * Pushes a modal onto the global queue.
 * @param {*} Component A modal component.
 * Receives a single prop, `onDone`, which it should call to hide itself.
 * The value passed to `onDone` becomes the returned promise result.
 */
export async function launchModal<Result>(
  Component: React.ComponentType<ModalProps<Result>>,
  modalProps: Object = {}
): Promise<Result> {
  return getInstance().launchModal(Component, modalProps)
}
