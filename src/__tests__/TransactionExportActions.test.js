// @flow
/* globals test expect */

import { type EdgeTransaction } from 'edge-core-js'

import { exportTransactionsToCSVInner, exportTransactionsToQBOInner } from '../actions/TransactionExportActions.js'

const edgeTxs: EdgeTransaction[] = [
  {
    txid: 'txid1',
    date: 1524476980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '123000000',
    networkFee: '1000',
    ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
    signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
    parentNetworkFee: '10002',
    metadata: {
      name: 'Crazy Person',
      category: 'Income: Mo Money',
      notes: 'Hell yeah! Thanks for the fish <<&&>>',
      amountFiat: 12000.45
    }
  },
  {
    txid: 'txid2',
    date: 1524486980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    parentNetworkFee: '20001',
    metadata: {
      name: 'Crazy Person 2',
      category: 'Expense: Less Money',
      notes: 'Hell yeah! Here\'s a fish"',
      amountFiat: 36001.45
    }
  }
]

test('export CSV matches reference data', function () {
  const out = exportTransactionsToCSVInner(edgeTxs, 'BTC', 'USD', '100')
  expect(out).toEqual(
    `"CURRENCY_CODE","DATE","TIME","PAYEE_PAYER_NAME","AMT_BTC","DENOMINATION","USD","CATEGORY","NOTES","AMT_NETWORK_FEES_BTC","TXID","OUR_RECEIVE_ADDRESSES","VER"\r\n"BTC","2018-04-23","09:49","Crazy Person","1230000","","12000.45","Income: Mo Money","Hell yeah! Thanks for the fish <<&&>>","10","txid1","receiveaddress1,receiveaddress2",1\r\n"BTC","2018-04-23","12:36","Crazy Person 2","-3210000","","36001.45","Expense: Less Money","Hell yeah! Here's a fish""","20","txid2","receiveaddress3,receiveaddress4",1\r\n`
  )
})

test('export QBO matches reference data', function () {
  const out = exportTransactionsToQBOInner(edgeTxs, 'BTC', 'USD', '100', 1524578071304)
  expect(out).toEqual(
    'OFXHEADER:100\n' +
      'DATA:OFXSGML\n' +
      'VERSION:102\n' +
      'SECURITY:NONE\n' +
      'ENCODING:USASCII\n' +
      'CHARSET:1252\n' +
      'COMPRESSION:NONE\n' +
      'OLDFILEUID:NONE\n' +
      'NEWFILEUID:NONE\n' +
      '\n' +
      '<OFX>\n' +
      '<SIGNONMSGSRSV1>\n' +
      '<SONRS>\n' +
      '<STATUS>\n' +
      '<CODE>0\n' +
      '<SEVERITY>INFO\n' +
      '</STATUS>\n' +
      '<DTSERVER>20180424135431.000\n' +
      '<LANGUAGE>ENG\n' +
      '<INTU.BID>3000\n' +
      '</SONRS>\n' +
      '</SIGNONMSGSRSV1>\n' +
      '<BANKMSGSRSV1>\n' +
      '<STMTTRNRS>\n' +
      '<TRNUID>20180424135431.000\n' +
      '<STATUS>\n' +
      '<CODE>0\n' +
      '<SEVERITY>INFO\n' +
      '<MESSAGE>OK\n' +
      '</STATUS>\n' +
      '<STMTRS>\n' +
      '<CURDEF>USD\n' +
      '<BANKACCTFROM>\n' +
      '<BANKID>999999999\n' +
      '<ACCTID>999999999999\n' +
      '<ACCTTYPE>CHECKING\n' +
      '</BANKACCTFROM>\n' +
      '<BANKTRANLIST>\n' +
      '<DTSTART>20180424135431.000\n' +
      '<DTEND>20180424135431.000\n' +
      '<STMTTRN>\n' +
      '<TRNTYPE>CREDIT\n' +
      '<DTPOSTED>20180423094940.000\n' +
      '<TRNAMT>1230000\n' +
      '<FITID>txid1\n' +
      '<NAME>Crazy Person\n' +
      '<MEMO>// Rate=0.00975646 USD=12000.45 category="Income: Mo Money" memo="Hell yeah! Thanks for the fish &lt;&lt;&amp;&amp;&gt;&gt;"\n' +
      '<CURRENCY>\n' +
      '<CURRATE>0.00975646\n' +
      '<CURSYM>USD\n' +
      '</CURRENCY>\n' +
      '</STMTTRN>\n' +
      '<STMTTRN>\n' +
      '<TRNTYPE>DEBIT\n' +
      '<DTPOSTED>20180423123620.000\n' +
      '<TRNAMT>-3210000\n' +
      '<FITID>txid2\n' +
      '<NAME>Crazy Person 2\n' +
      '<MEMO>// Rate=0.0112154 USD=36001.45 category="Expense: Less Money" memo="Hell yeah! Here\'s a fish""\n' +
      '<CURRENCY>\n' +
      '<CURRATE>0.0112154\n' +
      '<CURSYM>USD\n' +
      '</CURRENCY>\n' +
      '</STMTTRN>\n' +
      '</BANKTRANLIST>\n' +
      '<LEDGERBAL>\n' +
      '<BALAMT>0.00\n' +
      '<DTASOF>20180424135431.000\n' +
      '</LEDGERBAL>\n' +
      '<AVAILBAL>\n' +
      '<BALAMT>0.00\n' +
      '<DTASOF>20180424135431.000\n' +
      '</AVAILBAL>\n' +
      '</STMTRS>\n' +
      '</STMTTRNRS>\n' +
      '</BANKMSGSRSV1>\n' +
      '</OFX>\n'
  )
})
