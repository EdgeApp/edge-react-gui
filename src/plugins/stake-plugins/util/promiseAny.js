// @flow
export function promiseAny(promises: Promise<any>[]): Promise<any> {
  return new Promise((resolve, reject) => {
    let pending = promises.length
    for (const promise of promises) {
      promise.then(
        value => {
          resolve(value)
        },
        error => {
          return --pending || reject(error)
        }
      )
    }
  })
}
