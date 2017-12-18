import React, {Component} from 'react'
import {Title} from 'native-base'

import s from '../../../../../locales/strings'
import {sprintf} from 'sprintf-js'

export default class DefaultHeader extends Component {
  _renderTitle = () => {
    const scene = this.props.routes.scene
    const children = scene.children
    const sceneIndex = scene.index
    const title = children
      ? this.props.routes.scene.children[sceneIndex].title
      : null

    return title || s.strings.title_Header
  }

  render () {
    return <Title>
      {sprintf('%s', s.strings['title_' + this._renderTitle().replace(/ /g, '_')])}
    </Title>
  }
}
