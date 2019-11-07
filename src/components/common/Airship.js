// @flow

import React, { type ComponentType, type Node, Component } from 'react'
import { StyleSheet, View } from 'react-native'

/**
 * Controls for removing a component from an airship.
 *
 * The ballast station on a real airship controls its rise and fall.
 * If an airship component would like to fade out smoothly, it can pass
 * just the ballast station part of its bridge to a wrapper component
 * that handles the animation.
 */
export type AirshipBallast = {
  // Unmounts the component:
  remove(): void,

  // Runs a callback when the result promise settles.
  // Useful for staring exit animations:
  onResult(callback: () => mixed): void
}

/**
 * Controls for managing a component inside an airship.
 */
export type AirshipBridge<T> = AirshipBallast & {
  // Use these to pass values to the outside world:
  resolve(value: T): void,
  reject(error: Error): void
}

/**
 * Renders a component to place inside the airship.
 */
type AirshipRender<T> = (bridge: AirshipBridge<T>) => Node

/**
 * The airship itself is a component you should mount after your main
 * scene or router.
 *
 * It has a static method anyone can call to display components.
 * The method returns a promise, which the component can use to pass values
 * to the outside world.
 */
type Airship = ComponentType<{}> & {
  show<T>(render: AirshipRender<T>): Promise<T>
}

/**
 * Constructs an Airship component.
 */
export function makeAirship (): Airship {
  class Airship extends Component<{}> {
    constructor (props: {}) {
      super(props)
      allAirships.push(this)
    }

    componentWillUnmount () {
      allAirships = allAirships.filter(item => item !== this)
    }

    render () {
      return allChildren.map(child => (
        <View key={child.key} pointerEvents="box-none" style={styles.hover}>
          {child.element}
        </View>
      ))
    }

    static show<T> (render: AirshipRender<T>): Promise<T> {
      const key = `airship${nextKey++}`

      function update () {
        for (const airship of allAirships) airship.forceUpdate()
      }

      let controls: AirshipBridge<T>
      const promise = new Promise((resolve, reject) => {
        controls = {
          onResult (callback) {
            promise.then(callback, callback)
          },

          remove () {
            allChildren = allChildren.filter(child => child.key !== key)
            update()
          },

          resolve,
          reject
        }
      })

      // $FlowFixMe Yes, Flow, it is initialized.
      const element = render(controls)
      allChildren.push({ key, element })
      update()

      return promise
    }
  }

  // Static state:
  let nextKey = 0
  let allChildren: Array<{ key: string, element: Node }> = []
  let allAirships: Array<Airship> = []

  return Airship
}

const styles = StyleSheet.create({
  hover: {
    // Layout:
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,

    // Children:
    flexDirection: 'row',
    justifyContent: 'center'
  }
})
