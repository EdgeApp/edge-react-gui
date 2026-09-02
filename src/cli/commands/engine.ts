import { printJson } from '../client/output'
import { command } from '../command'

command(
  'engine-status',
  {
    usage: 'engine-status',
    help: 'Show engine pid, uptime, session count, and idle shutdown info'
  },
  async ctx => {
    printJson(await ctx.client.get('/engine/status'))
  }
)

command(
  'engine-config',
  {
    usage: 'engine-config',
    help: 'Show engine appId, servers, testMode, and loaded plugins'
  },
  async ctx => {
    printJson(await ctx.client.get('/engine/config'))
  }
)

command(
  'engine-stop',
  {
    usage: 'engine-stop',
    help: 'Gracefully shut down the engine daemon'
  },
  async ctx => {
    printJson(await ctx.client.post('/engine/stop'))
  }
)
