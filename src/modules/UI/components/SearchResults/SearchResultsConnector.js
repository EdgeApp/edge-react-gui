// @flow

import {connect} from 'react-redux'

import SearchResults from './SearchResults.ui'
import type {State} from '../../../ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  dimensions: state.ui.scenes.dimensions
})

export default connect(mapStateToProps)(SearchResults)
