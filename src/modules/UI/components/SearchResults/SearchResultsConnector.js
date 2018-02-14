import { connect } from 'react-redux'

import SearchResults from './SearchResults.ui'

const mapStateToProps = state => ({
  dimensions: state.ui.scenes.dimensions
})

export default connect(mapStateToProps)(SearchResults)
