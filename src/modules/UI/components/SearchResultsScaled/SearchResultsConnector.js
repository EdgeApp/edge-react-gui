// @flow

import { connect } from 'react-redux'

import type { State } from '../../../ReduxTypes.js'
import SearchResults from './SearchResults.ui'

const mapStateToProps = (state: State) => ({
  dimensions: state.ui.scenes.dimensions
})

export default connect(
  mapStateToProps,
  {}
)(SearchResults)
