// @flow

import * as React from 'react'

import { Tile } from '../../themed/Tile.js'

type Items = Array<{ label: string, value: string }>

type Props = {
  items:? Items
}

export const InfoTiles = ({ items }: Props) => {
  if (!items || items.length === 0) return null

  return (<>{items.map<React.Element<any>>(({ label, value }) => <Tile key={label} type="static" title={label} body={value} />)}</>)
}
