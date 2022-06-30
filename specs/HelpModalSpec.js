import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Help Modal', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(25000)
      await help.navigate('MenuTab', 'walletList')

      // help modal
      await help.navigate('MainUi', 'HelpModal')
      await help.navigate('HelpModal', 'KnowledgeBaseModal')
      await help.closeModal('KnowledgeBaseModal')
      await help.navigate('HelpModal', 'SupportTicketModal')
      await help.closeModal('SupportTicketModal')
      await help.navigate('HelpModal', 'EdgeSiteModal')
      await help.closeModal('EdgeSiteModal')
      await help.closeModal('HelpModal')
    })
  })
}
