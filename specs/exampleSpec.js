import { fastLogin } from './helpers.js'

export default function (spec) {
  spec.describe('Logging in', function () {
    spec.it('Login', async function () {
      const login = await spec.findComponent('Login.Login')
      await fastLogin(login)
    })
  })
}
