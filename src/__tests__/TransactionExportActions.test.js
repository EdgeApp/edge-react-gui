// @flow
/* globals test expect */

import { exportTransactions, makeOfxDate } from '../actions/TransactionExportActions.js'
import { transactions, wallets } from './fixtures.json'

test('export CSV matches reference data', function () {
  expect(exportTransactions('csv', wallets.BTC, transactions.edgeTxs, transactions.options)).toEqual(
    `"CURRENCY_CODE","DATE","TIME","PAYEE_PAYER_NAME","AMT_ASSET","DENOMINATION","iso:USD","CATEGORY","NOTES","AMT_NETWORK_FEES_ASSET","TXID","OUR_RECEIVE_ADDRESSES","VER","DEVICE_DESCRIPTION"\r\n"BTC","2018-04-23","09:49","Crazy Person","1230000","bits","12000.45","Income: Mo Money","Hell yeah! Thanks for the fish <<&&>>","10","txid1","receiveaddress1,receiveaddress2",1,"iphone12"\r\n"BTC","2018-04-23","12:36","Crazy Person 2","-3209980","bits","-36001.20","Transfer: Airbitz","Hell yeah! Here's a fish","0","txid2","receiveaddress3,receiveaddress4",1,"iphone12"\r\n"BTC","2018-04-23","12:36","Crazy Person 2","-20","bits","-0.22","Transfer: Airbitz","Hell yeah! Here's a fish","20","txid2-fee","receiveaddress3,receiveaddress4",1,"iphone12"\r\n`
  )
})

test('export QBO matches reference data', function () {
  const now = makeOfxDate(Date.now() / 1000)
  expect(exportTransactions('qbo', wallets.BTC, transactions.edgeTxs, transactions.options)).toEqual(
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
      '<DTSERVER>' +
      now +
      '\n' +
      '<LANGUAGE>ENG\n' +
      '<INTU.BID>3000\n' +
      '</SONRS>\n' +
      '</SIGNONMSGSRSV1>\n' +
      '<BANKMSGSRSV1>\n' +
      '<STMTTRNRS>\n' +
      '<TRNUID>' +
      now +
      '\n' +
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
      '<DTSTART>' +
      now +
      '\n' +
      '<DTEND>' +
      now +
      '\n' +
      '<STMTTRN>\n' +
      '<TRNTYPE>CREDIT\n' +
      '<DTPOSTED>20180423094940.000\n' +
      '<TRNAMT>1230000\n' +
      '<FITID>txid1\n' +
      '<NAME>Crazy Person\n' +
      '<MEMO>// Rate=0.00975646 iso:USD=12000.45 category="Income: Mo Money" memo="Hell yeah! Thanks for the fish &lt;&lt;&amp;&amp;&gt;&gt;"\n' +
      '<CURRENCY>\n' +
      '<CURRATE>0.00975646\n' +
      '<CURSYM>iso:USD\n' +
      '</CURRENCY>\n' +
      '</STMTTRN>\n' +
      '<STMTTRN>\n' +
      '<TRNTYPE>DEBIT\n' +
      '<DTPOSTED>20180423123620.000\n' +
      '<TRNAMT>-3209980\n' +
      '<FITID>txid2\n' +
      '<NAME>Crazy Person 2\n' +
      '<MEMO>// Rate=0.0112154 iso:USD=-36001.20 category="Transfer: Airbitz" memo="Hell yeah! Here\'s a fish"\n' +
      '<CURRENCY>\n' +
      '<CURRATE>0.0112154\n' +
      '<CURSYM>iso:USD\n' +
      '</CURRENCY>\n' +
      '</STMTTRN>\n' +
      '<STMTTRN>\n' +
      '<TRNTYPE>DEBIT\n' +
      '<DTPOSTED>20180423123620.000\n' +
      '<TRNAMT>-20\n' +
      '<FITID>txid2-fee\n' +
      '<NAME>Crazy Person 2\n' +
      '<MEMO>// Rate=0.0112154 iso:USD=-0.22 category="Transfer: Airbitz" memo="Hell yeah! Here\'s a fish"\n' +
      '<CURRENCY>\n' +
      '<CURRATE>0.0112154\n' +
      '<CURSYM>iso:USD\n' +
      '</CURRENCY>\n' +
      '</STMTTRN>\n' +
      '</BANKTRANLIST>\n' +
      '<LEDGERBAL>\n' +
      '<BALAMT>0.00\n' +
      '<DTASOF>' +
      now +
      '\n' +
      '</LEDGERBAL>\n' +
      '<AVAILBAL>\n' +
      '<BALAMT>0.00\n' +
      '<DTASOF>' +
      now +
      '\n' +
      '</AVAILBAL>\n' +
      '</STMTRS>\n' +
      '</STMTTRNRS>\n' +
      '</BANKMSGSRSV1>\n' +
      '</OFX>\n'
  )
})
