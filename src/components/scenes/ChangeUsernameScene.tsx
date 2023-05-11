import * as React from 'react'

import { useSelector } from '../../types/reactRedux'
import { SceneWrapper } from '../common/SceneWrapper'
import { MainButton } from '../themed/MainButton'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

interface Props {}

export function ChangeUsernameScene(props: Props) {
  const account = useSelector(state => state.core.account)

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handlePress = async () => {
    await account.changeUsername({
      username,
      password: password === '' ? undefined : password
    })
  }

  return (
    <SceneWrapper>
      <OutlinedTextInput label="username" value={username} onChangeText={setUsername} />
      <OutlinedTextInput label="password" value={password} onChangeText={setPassword} autoFocus={false} />
      <MainButton label="submit" onPress={handlePress} />
    </SceneWrapper>
  )
}
