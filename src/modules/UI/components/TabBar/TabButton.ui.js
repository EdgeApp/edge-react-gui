import React from 'react'
import {Button, Icon, Text} from 'native-base'

const Tab = ({displayName, iconName, isActive, onPress}) => (
    <Button isActive={isActive} onPress={onPress} badgeValue={2} badgeValueStyle={{color: '#FFF'}}>
      <Icon isActive={isActive} name={iconName} />
      <Text style={{fontSize: 8}} >{displayName}</Text>
    </Button>
  )

export default Tab
