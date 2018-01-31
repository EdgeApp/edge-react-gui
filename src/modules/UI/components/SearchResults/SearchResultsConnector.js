// @flow

import {connect} from 'react-redux'

import SearchResults from './SearchResults.ui'

import {getDimensions} from '../../scenes/selectors'

const mapStateToProps = (state) => ({
  dimensions: getDimensions(state)
})

export default connect(mapStateToProps)(SearchResults)
