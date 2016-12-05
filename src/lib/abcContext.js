import abc from 'airbitz-core-js'

const abcContext = abc.makeABCContext('3ad0717b3eb31f745aba7bd9d51e7fd1b2926431', 'account:repo:react-gui', null, function (error, context) {
  if (error) {
    console.log(error)
  } else {
    console.log('no Error!')
  }
})

export default abcContext
