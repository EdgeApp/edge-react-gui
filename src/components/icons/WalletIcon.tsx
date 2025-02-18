import * as React from 'react'

import compromisedIcon from '../../assets/images/compromisedIcon.png'
import { useSelector } from '../../types/reactRedux'
import { CryptoIcon, CryptoIconProps } from './CryptoIcon'

interface WalletIconProps extends CryptoIconProps {
  walletId: string
}

export const WalletIcon = (props: WalletIconProps) => {
  const compromised = useSelector(state => {
    const { modalShown = 0 } = state.ui?.settings?.securityCheckedWallets?.[props.walletId] ?? {}
    return modalShown > 0
  })

  if (compromised) {
    return <CryptoIcon {...props} secondaryCurrencyIconProp={compromisedIcon} />
  } else {
    return <CryptoIcon {...props} />
  }
}
