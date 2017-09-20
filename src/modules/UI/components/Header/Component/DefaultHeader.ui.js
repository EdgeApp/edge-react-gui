import React, {Component} from 'react'
import {Title} from 'native-base'

import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'

export default class DefaultHeader extends Component {
  _renderTitle = () => {
    const scene = this.props.routes.scene
    const children = scene.children
    const sceneIndex = scene.index
    const title = children
      ? this.props.routes.scene.children[sceneIndex].title
      : null

    return title || sprintf(strings.enUS['title_Header'])
  }

  render () {
    console.log('Allen: Title '+ this._renderTitle().replace(/ /g, '_'))
    return <Title>
      {sprintf('%s', strings.enUS['title_' + this._renderTitle().replace(/ /g, '_')])}
    </Title>
  }
}
