function checkShiftTokenAvailability (arg) {
  const st = new SupportedTokens()
  if (st.holderObject[arg]) {
    return true
  }
  return false
}
class SupportedTokens {
  constructor () {
    this.array = this.getTotalArray()
    this.holderObject = {}
    for (let i = 0; i< this.array.length; i++) {
      const pair = this.array[i].pair
      const tempArray = pair.split('_')
      if (!this.holderObject[tempArray[0]]) {
        this.holderObject[tempArray[0]] = tempArray[0]
      }
      if (!this.holderObject[tempArray[1]]) {
        this.holderObject[tempArray[1]] = tempArray[1]
      }
    }
  }

  getTotalArray () {
    return [
      {
        'rate': '2.50063557',
        'limit': 3.18897592,
        'pair': 'BCH_DASH',
        'maxLimit': 3.18897592,
        'min': 0.00157534,
        'minerFee': 0.002
      },
      {
        'rate': '0.39088017',
        'limit': 8.07730915,
        'pair': 'DASH_BCH',
        'maxLimit': 8.07730915,
        'min': 0.00100883,
        'minerFee': 0.0002
      },
      {
        'rate': '17.29160301',
        'limit': 3.18897592,
        'pair': 'BCH_LTC',
        'maxLimit': 3.18897592,
        'min': 0.00011443,
        'minerFee': 0.001
      },
      {
        'rate': '0.05678415',
        'limit': 55.60107237,
        'pair': 'LTC_BCH',
        'maxLimit': 55.60107237,
        'min': 0.00696891,
        'minerFee': 0.0002
      },
      {
        'rate': '9.00574046',
        'limit': 3.18897592,
        'pair': 'BCH_XMR',
        'maxLimit': 3.18897592,
        'min': 0.0043824,
        'minerFee': 0.02
      },
      {
        'rate': '0.10862873',
        'limit': 29.03540039,
        'pair': 'XMR_BCH',
        'maxLimit': 29.03540039,
        'min': 0.00362952,
        'minerFee': 0.0002
      },
      {
        'rate': '6122.87428571',
        'limit': 3.18897592,
        'pair': 'BCH_XRP',
        'maxLimit': 3.18897592,
        'min': 0.00016096,
        'minerFee': 0.5
      },
      {
        'rate': '0.00015975',
        'limit': 19763.5957728,
        'pair': 'XRP_BCH',
        'maxLimit': 19763.5957728,
        'min': 2.46765714,
        'minerFee': 0.0002
      },
      {
        'rate': '4.50160906',
        'limit': 3.18897592,
        'pair': 'BCH_ZEC',
        'maxLimit': 3.18897592,
        'min': 0.0000438,
        'minerFee': 0.0001
      },
      {
        'rate': '0.21734246',
        'limit': 14.52665992,
        'pair': 'ZEC_BCH',
        'maxLimit': 14.52665992,
        'min': 0.00181425,
        'minerFee': 0.0002
      },
      {
        'rate': '3.26704305',
        'limit': 3.18897592,
        'pair': 'BCH_ETH',
        'maxLimit': 3.18897592,
        'min': 0.00060552,
        'minerFee': 0.001
      },
      {
        'rate': '0.30048894',
        'limit': 10.50707549,
        'pair': 'ETH_BCH',
        'maxLimit': 10.50707549,
        'min': 0.00131669,
        'minerFee': 0.0002
      },
      {
        'rate': '54.85510238',
        'limit': 3.18897592,
        'pair': 'BCH_ETC',
        'maxLimit': 3.18897592,
        'min': 0.00036837,
        'minerFee': 0.01
      },
      {
        'rate': '0.01826176',
        'limit': 172.71490928,
        'pair': 'ETC_BCH',
        'maxLimit': 172.71490928,
        'min': 0.02210785,
        'minerFee': 0.0002
      },
      {
        'rate': '546.38785014',
        'limit': 3.18897592,
        'pair': 'BCH_EOS',
        'maxLimit': 3.18897592,
        'min': 0.00014365,
        'minerFee': 0.04
      },
      {
        'rate': '0.00178220',
        'limit': 1771.54389282,
        'pair': 'EOS_BCH',
        'maxLimit': 1771.54389282,
        'min': 0.22020669,
        'minerFee': 0.0002
      },
      {
        'rate': '165.72440286',
        'limit': 3.18897592,
        'pair': 'BCH_OMG',
        'maxLimit': 3.18897592,
        'min': 0.00011848,
        'minerFee': 0.01
      },
      {
        'rate': '0.00587974',
        'limit': 536.97270564,
        'pair': 'OMG_BCH',
        'maxLimit': 536.97270564,
        'min': 0.06689179,
        'minerFee': 0.0002
      },
      {
        'rate': '0.16088739',
        'limit': 3.18897592,
        'pair': 'BCH_BTC',
        'maxLimit': 3.18897592,
        'min': 0.01539978,
        'minerFee': 0.00125
      },
      {
        'rate': '6.11987187',
        'limit': 0.51642276,
        'pair': 'BTC_BCH',
        'maxLimit': 0.51642276,
        'min': 0.00006478,
        'minerFee': 0.0002
      },
      {
        'rate': '4582.59680182',
        'limit': 3.18897592,
        'pair': 'BCH_BLK',
        'maxLimit': 3.18897592,
        'min': 0.00000422,
        'minerFee': 0.01
      },
      {
        'rate': '0.00020932',
        'limit': 15060.44794975,
        'pair': 'BLK_BCH',
        'maxLimit': 15060.44794975,
        'min': 1.84968589,
        'minerFee': 0.0002
      },
      {
        'rate': '201.96667924',
        'limit': 3.18897592,
        'pair': 'BCH_CLAM',
        'maxLimit': 3.18897592,
        'min': 0.0000095,
        'minerFee': 0.001
      },
      {
        'rate': '0.00470667',
        'limit': 669.79165287,
        'pair': 'CLAM_BCH',
        'maxLimit': 669.79165287,
        'min': 0.08147925,
        'minerFee': 0.0002
      },
      {
        'rate': '132697.11570247',
        'limit': 3.18897592,
        'pair': 'BCH_DGB',
        'maxLimit': 3.18897592,
        'min': 1.5e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000732',
        'limit': 430352.30016419,
        'pair': 'DGB_BCH',
        'maxLimit': 430352.30016419,
        'min': 53.5338843,
        'minerFee': 0.0002
      },
      {
        'rate': '764588.14285714',
        'limit': 3.18897592,
        'pair': 'BCH_DOGE',
        'maxLimit': 3.18897592,
        'min': 0.00000493,
        'minerFee': 2
      },
      {
        'rate': '0.00000122',
        'limit': 2582113.80098513,
        'pair': 'DOGE_BCH',
        'maxLimit': 2582113.80098513,
        'min': 308.45714286,
        'minerFee': 0.0002
      },
      {
        'rate': '65.00731194',
        'limit': 3.18897592,
        'pair': 'BCH_FCT',
        'maxLimit': 3.18897592,
        'min': 0.00298801,
        'minerFee': 0.1
      },
      {
        'rate': '0.01480560',
        'limit': 212.92535168,
        'pair': 'FCT_BCH',
        'maxLimit': 212.92535168,
        'min': 0.02622584,
        'minerFee': 0.0002
      },
      {
        'rate': '249.58792516',
        'limit': 3.18897592,
        'pair': 'BCH_MONA',
        'maxLimit': 3.18897592,
        'min': 0.00155742,
        'minerFee': 0.2
      },
      {
        'rate': '0.00385851',
        'limit': 817.02120016,
        'pair': 'MONA_BCH',
        'maxLimit': 817.02120016,
        'min': 0.10074185,
        'minerFee': 0.0002
      },
      {
        'rate': '7893.97787610',
        'limit': 3.18897592,
        'pair': 'BCH_NXT',
        'maxLimit': 3.18897592,
        'min': 0.00024824,
        'minerFee': 1
      },
      {
        'rate': '0.00012306',
        'limit': 25628.92110159,
        'pair': 'NXT_BCH',
        'maxLimit': 25628.92110159,
        'min': 3.18466077,
        'minerFee': 0.0002
      },
      {
        'rate': '5526.25826446',
        'limit': 3.18897592,
        'pair': 'BCH_POT',
        'maxLimit': 3.18897592,
        'min': 0.00000357,
        'minerFee': 0.01
      },
      {
        'rate': '0.00017711',
        'limit': 17807.6813861,
        'pair': 'POT_BCH',
        'maxLimit': 17807.6813861,
        'min': 2.23057851,
        'minerFee': 0.0002
      },
      {
        'rate': '1146303.85714285',
        'limit': 3.18897592,
        'pair': 'BCH_RDD',
        'maxLimit': 3.18897592,
        'min': 1e-8,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000073',
        'limit': 4303523.00164188,
        'pair': 'RDD_BCH',
        'maxLimit': 4303523.00164188,
        'min': 462.68571429,
        'minerFee': 0.0002
      },
      {
        'rate': '21426.24032042',
        'limit': 3.18897592,
        'pair': 'BCH_START',
        'maxLimit': 3.18897592,
        'min': 0.0000016,
        'minerFee': 0.02
      },
      {
        'rate': '0.00003967',
        'limit': 79449.65541493,
        'pair': 'START_BCH',
        'maxLimit': 79449.65541493,
        'min': 8.64833111,
        'minerFee': 0.0002
      },
      {
        'rate': '2713.59658610',
        'limit': 0.69570266,
        'pair': 'BCH_VRC',
        'maxLimit': 3.18897592,
        'min': 1.4e-7,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00034362',
        'limit': 9174.32510565,
        'pair': 'VRC_BCH',
        'maxLimit': 9174.32510565,
        'min': 1.09474396,
        'minerFee': 0.0002
      },
      {
        'rate': '288.43015815',
        'limit': 3.18897592,
        'pair': 'BCH_VTC',
        'maxLimit': 3.18897592,
        'min': 0.0001365,
        'minerFee': 0.02
      },
      {
        'rate': '0.00338346',
        'limit': 932.20470089,
        'pair': 'VTC_BCH',
        'maxLimit': 932.20470089,
        'min': 0.11641984,
        'minerFee': 0.0002
      },
      {
        'rate': '15936.69712015',
        'limit': 3.18897592,
        'pair': 'BCH_VOX',
        'maxLimit': 3.18897592,
        'min': 0.0000012,
        'minerFee': 0.01
      },
      {
        'rate': '0.00005945',
        'limit': 20936.54867898,
        'pair': 'VOX_BCH',
        'maxLimit': 20936.54867898,
        'min': 6.432572,
        'minerFee': 0.0002
      },
      {
        'rate': '243155.36363636',
        'limit': 3.18897592,
        'pair': 'BCH_SC',
        'maxLimit': 3.18897592,
        'min': 0.00008008,
        'minerFee': 10
      },
      {
        'rate': '0.00000396',
        'limit': 794496.55414927,
        'pair': 'SC_BCH',
        'maxLimit': 794496.55414927,
        'min': 98.14545455,
        'minerFee': 0.0002
      },
      {
        'rate': '5351.20173391',
        'limit': 3.18897592,
        'pair': 'BCH_LBC',
        'maxLimit': 3.18897592,
        'min': 0.00000729,
        'minerFee': 0.02
      },
      {
        'rate': '0.00018063',
        'limit': 17452.61102389,
        'pair': 'LBC_BCH',
        'maxLimit': 17452.61102389,
        'min': 2.15991997,
        'minerFee': 0.0002
      },
      {
        'rate': '273.41307755',
        'limit': 3.18897592,
        'pair': 'BCH_WAVES',
        'maxLimit': 3.18897592,
        'min': 0.00000718,
        'minerFee': 0.001
      },
      {
        'rate': '0.00355744',
        'limit': 886.16713604,
        'pair': 'WAVES_BCH',
        'maxLimit': 886.16713604,
        'min': 0.11035846,
        'minerFee': 0.0002
      },
      {
        'rate': '713.95382151',
        'limit': 3.18897592,
        'pair': 'BCH_GAME',
        'maxLimit': 3.18897592,
        'min': 0.00053909,
        'minerFee': 0.2
      },
      {
        'rate': '0.00133627',
        'limit': 2360.35815255,
        'pair': 'GAME_BCH',
        'maxLimit': 2360.35815255,
        'min': 0.2881751,
        'minerFee': 0.0002
      },
      {
        'rate': '504.48756719',
        'limit': 3.18897592,
        'pair': 'BCH_KMD',
        'maxLimit': 3.18897592,
        'min': 0.00000782,
        'minerFee': 0.002
      },
      {
        'rate': '0.00193816',
        'limit': 1626.52837857,
        'pair': 'KMD_BCH',
        'maxLimit': 1626.52837857,
        'min': 0.20362768,
        'minerFee': 0.0002
      },
      {
        'rate': '9894.11467324',
        'limit': 3.18897592,
        'pair': 'BCH_SNGLS',
        'maxLimit': 3.18897592,
        'min': 0.0005895,
        'minerFee': 3
      },
      {
        'rate': '0.00009736',
        'limit': 32377.60252019,
        'pair': 'SNGLS_BCH',
        'maxLimit': 32377.60252019,
        'min': 3.99358816,
        'minerFee': 0.0002
      },
      {
        'rate': '4316.22338709',
        'limit': 3.18897592,
        'pair': 'BCH_GNT',
        'maxLimit': 3.18897592,
        'min': 0.00000451,
        'minerFee': 0.01
      },
      {
        'rate': '0.00022347',
        'limit': 14113.76770148,
        'pair': 'GNT_BCH',
        'maxLimit': 14113.76770148,
        'min': 1.74129032,
        'minerFee': 0.0002
      },
      {
        'rate': '863.92409560',
        'limit': 3.18897592,
        'pair': 'BCH_SWT',
        'maxLimit': 3.18897592,
        'min': 0.00021137,
        'minerFee': 0.1
      },
      {
        'rate': '0.00104734',
        'limit': 3009.98286529,
        'pair': 'SWT_BCH',
        'maxLimit': 3009.98286529,
        'min': 0.34870801,
        'minerFee': 0.0002
      },
      {
        'rate': '2658.75646123',
        'limit': 3.18897592,
        'pair': 'BCH_WINGS',
        'maxLimit': 3.18897592,
        'min': 0.00000724,
        'minerFee': 0.01
      },
      {
        'rate': '0.00035888',
        'limit': 8784.19391388,
        'pair': 'WINGS_BCH',
        'maxLimit': 8784.19391388,
        'min': 1.07316103,
        'minerFee': 0.0002
      },
      {
        'rate': '3590.21342281',
        'limit': 3.18897592,
        'pair': 'BCH_TRST',
        'maxLimit': 3.18897592,
        'min': 0.00000524,
        'minerFee': 0.01
      },
      {
        'rate': '0.00025974',
        'limit': 12136.84512801,
        'pair': 'TRST_BCH',
        'maxLimit': 12136.84512801,
        'min': 1.44912752,
        'minerFee': 0.0002
      },
      {
        'rate': '2438.94437689',
        'limit': 3.18897592,
        'pair': 'BCH_RLC',
        'maxLimit': 3.18897592,
        'min': 0.00000776,
        'minerFee': 0.01
      },
      {
        'rate': '0.00038427',
        'limit': 8203.69754086,
        'pair': 'RLC_BCH',
        'maxLimit': 8203.69754086,
        'min': 0.98443769,
        'minerFee': 0.0002
      },
      {
        'rate': '6983.57441253',
        'limit': 1.45065089,
        'pair': 'BCH_GUP',
        'maxLimit': 1.45065089,
        'min': 0.00000274,
        'minerFee': 0.01
      },
      {
        'rate': '0.00013551',
        'limit': 6670.4980368,
        'pair': 'GUP_BCH',
        'maxLimit': 6670.4980368,
        'min': 2.81879896,
        'minerFee': 0.0002
      },
      {
        'rate': '685.82282051',
        'limit': 3.18897592,
        'pair': 'BCH_ANT',
        'maxLimit': 3.18897592,
        'min': 0.00002834,
        'minerFee': 0.01
      },
      {
        'rate': '0.00140402',
        'limit': 2245.31634868,
        'pair': 'ANT_BCH',
        'maxLimit': 2245.31634868,
        'min': 0.27682051,
        'minerFee': 0.0002
      },
      {
        'rate': '27.52702229',
        'limit': 3.18897592,
        'pair': 'BCH_DCR',
        'maxLimit': 3.18897592,
        'min': 0.00214365,
        'minerFee': 0.03
      },
      {
        'rate': '0.03540593',
        'limit': 89.03840693,
        'pair': 'DCR_BCH',
        'maxLimit': 89.03840693,
        'min': 0.01111081,
        'minerFee': 0.0002
      },
      {
        'rate': '8280.83281733',
        'limit': 3.18897592,
        'pair': 'BCH_BAT',
        'maxLimit': 3.18897592,
        'min': 0.00000236,
        'minerFee': 0.01
      },
      {
        'rate': '0.00011677',
        'limit': 26995.43963393,
        'pair': 'BAT_BCH',
        'maxLimit': 26995.43963393,
        'min': 3.34241486,
        'minerFee': 0.0002
      },
      {
        'rate': '553.38806896',
        'limit': 3.18897592,
        'pair': 'BCH_BNT',
        'maxLimit': 3.18897592,
        'min': 0.00003358,
        'minerFee': 0.01
      },
      {
        'rate': '0.00166395',
        'limit': 1894.57319025,
        'pair': 'BNT_BCH',
        'maxLimit': 1894.57319025,
        'min': 0.22336552,
        'minerFee': 0.0002
      },
      {
        'rate': '39625.31851851',
        'limit': 3.18897592,
        'pair': 'BCH_SNT',
        'maxLimit': 3.18897592,
        'min': 0.00014414,
        'minerFee': 3
      },
      {
        'rate': '0.00002380',
        'limit': 132416.09235821,
        'pair': 'SNT_BCH',
        'maxLimit': 132416.09235821,
        'min': 15.99407407,
        'minerFee': 0.0002
      },
      {
        'rate': '99.85784420',
        'limit': 3.18897592,
        'pair': 'BCH_NMR',
        'maxLimit': 3.18897592,
        'min': 0.00007392,
        'minerFee': 0.004
      },
      {
        'rate': '0.00915670',
        'limit': 344.28184013,
        'pair': 'NMR_BCH',
        'maxLimit': 344.28184013,
        'min': 0.04030589,
        'minerFee': 0.0002
      },
      {
        'rate': '1727.66218107',
        'limit': 3.18897592,
        'pair': 'BCH_EDG',
        'maxLimit': 3.18897592,
        'min': 0.00033633,
        'minerFee': 0.3
      },
      {
        'rate': '0.00055550',
        'limit': 5674.97538678,
        'pair': 'EDG_BCH',
        'maxLimit': 5674.97538678,
        'min': 0.69734094,
        'minerFee': 0.0002
      },
      {
        'rate': '4351.47885032',
        'limit': 3.18897592,
        'pair': 'BCH_CVC',
        'maxLimit': 3.18897592,
        'min': 0.0000444,
        'minerFee': 0.1
      },
      {
        'rate': '0.00022011',
        'limit': 14329.15538837,
        'pair': 'CVC_BCH',
        'maxLimit': 14329.15538837,
        'min': 1.75639913,
        'minerFee': 0.0002
      },
      {
        'rate': '275.98503843',
        'limit': 2.50683873,
        'pair': 'BCH_MTL',
        'maxLimit': 2.50683873,
        'min': 0.00007048,
        'minerFee': 0.01
      },
      {
        'rate': '0.00349249',
        'limit': 902.64762672,
        'pair': 'MTL_BCH',
        'maxLimit': 902.64762672,
        'min': 0.11139658,
        'minerFee': 0.0002
      },
      {
        'rate': '64193.01599999',
        'limit': 3.18897592,
        'pair': 'BCH_FUN',
        'maxLimit': 3.18897592,
        'min': 3e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00001483',
        'limit': 212519.65440207,
        'pair': 'FUN_BCH',
        'maxLimit': 212519.65440207,
        'min': 25.9104,
        'minerFee': 0.0002
      },
      {
        'rate': '32751.53877551',
        'limit': 3.18897592,
        'pair': 'BCH_DNT',
        'maxLimit': 3.18897592,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00002869',
        'limit': 109877.18302064,
        'pair': 'DNT_BCH',
        'maxLimit': 109877.18302064,
        'min': 13.21959184,
        'minerFee': 0.0002
      },
      {
        'rate': '3514.72930354',
        'limit': 3.18897592,
        'pair': 'BCH_1ST',
        'maxLimit': 3.18897592,
        'min': 0.00000549,
        'minerFee': 0.01
      },
      {
        'rate': '0.00027201',
        'limit': 11589.37971717,
        'pair': '1ST_BCH',
        'maxLimit': 11589.37971717,
        'min': 1.41865966,
        'minerFee': 0.0002
      },
      {
        'rate': '358.31593283',
        'limit': 1.5950382,
        'pair': 'BCH_SALT',
        'maxLimit': 1.5950382,
        'min': 0.00026936,
        'minerFee': 0.05
      },
      {
        'rate': '0.00266936',
        'limit': 590.6981482,
        'pair': 'SALT_BCH',
        'maxLimit': 590.6981482,
        'min': 0.14462803,
        'minerFee': 0.0002
      },
      {
        'rate': '6723.76507537',
        'limit': 3.18897592,
        'pair': 'BCH_XEM',
        'maxLimit': 3.18897592,
        'min': 0.00117137,
        'minerFee': 4
      },
      {
        'rate': '0.00014510',
        'limit': 21725.82079079,
        'pair': 'XEM_BCH',
        'maxLimit': 21725.82079079,
        'min': 2.71256281,
        'minerFee': 0.0002
      },
      {
        'rate': '10400.68308489',
        'limit': 3.18897592,
        'pair': 'BCH_RCN',
        'maxLimit': 3.18897592,
        'min': 0.00036959,
        'minerFee': 2
      },
      {
        'rate': '0.00009156',
        'limit': 34428.18401314,
        'pair': 'RCN_BCH',
        'maxLimit': 34428.18401314,
        'min': 4.19805574,
        'minerFee': 0.0002
      },
      {
        'rate': '764.58814285',
        'limit': 3.18897592,
        'pair': 'BCH_NMC',
        'maxLimit': 3.18897592,
        'min': 0.00001179,
        'minerFee': 0.005
      },
      {
        'rate': '0.00116892',
        'limit': 496.85281567,
        'pair': 'NMC_BCH',
        'maxLimit': 496.85281567,
        'min': 0.30845714,
        'minerFee': 0.0002
      },
      {
        'rate': '53.60515140',
        'limit': 3.18897592,
        'pair': 'BCH_REP',
        'maxLimit': 3.18897592,
        'min': 0.0003578,
        'minerFee': 0.01
      },
      {
        'rate': '0.01773798',
        'limit': 177.81499661,
        'pair': 'REP_BCH',
        'maxLimit': 177.81499661,
        'min': 0.02162588,
        'minerFee': 0.0002
      },
      {
        'rate': '13.11249171',
        'limit': 3.18897592,
        'pair': 'BCH_GNO',
        'maxLimit': 3.18897592,
        'min': 0.00148222,
        'minerFee': 0.01
      },
      {
        'rate': '0.07348124',
        'limit': 42.92359291,
        'pair': 'GNO_BCH',
        'maxLimit': 42.92359291,
        'min': 0.00528996,
        'minerFee': 0.0002
      },
      {
        'rate': '6591.27709359',
        'limit': 3.18897592,
        'pair': 'BCH_ZRX',
        'maxLimit': 3.18897592,
        'min': 0.00000147,
        'minerFee': 0.005
      },
      {
        'rate': '0.00014597',
        'limit': 21607.64687017,
        'pair': 'ZRX_BCH',
        'maxLimit': 21607.64687017,
        'min': 2.6591133,
        'minerFee': 0.0002
      },
      {
        'rate': '6.82684104',
        'limit': 8.07730915,
        'pair': 'DASH_LTC',
        'maxLimit': 8.07730915,
        'min': 0.0002893,
        'minerFee': 0.001
      },
      {
        'rate': '0.14342289',
        'limit': 55.60107237,
        'pair': 'LTC_DASH',
        'maxLimit': 55.60107237,
        'min': 0.02751372,
        'minerFee': 0.002
      },
      {
        'rate': '3.55552683',
        'limit': 8.07730915,
        'pair': 'DASH_XMR',
        'maxLimit': 8.07730915,
        'min': 0.01108003,
        'minerFee': 0.02
      },
      {
        'rate': '0.27436934',
        'limit': 29.0454202,
        'pair': 'XMR_DASH',
        'maxLimit': 29.0454202,
        'min': 0.01432958,
        'minerFee': 0.002
      },
      {
        'rate': '2417.35190476',
        'limit': 8.07730915,
        'pair': 'DASH_XRP',
        'maxLimit': 8.07730915,
        'min': 0.00040695,
        'minerFee': 0.5
      },
      {
        'rate': '0.00040349',
        'limit': 19763.5957728,
        'pair': 'XRP_DASH',
        'maxLimit': 19763.5957728,
        'min': 9.74247619,
        'minerFee': 0.002
      },
      {
        'rate': '1.77726550',
        'limit': 8.07730915,
        'pair': 'DASH_ZEC',
        'maxLimit': 8.07730915,
        'min': 0.00011073,
        'minerFee': 0.0001
      },
      {
        'rate': '0.54895390',
        'limit': 14.52665992,
        'pair': 'ZEC_DASH',
        'maxLimit': 14.52665992,
        'min': 0.00716278,
        'minerFee': 0.002
      },
      {
        'rate': '1.28985054',
        'limit': 8.07730915,
        'pair': 'DASH_ETH',
        'maxLimit': 8.07730915,
        'min': 0.00153094,
        'minerFee': 0.001
      },
      {
        'rate': '0.75896158',
        'limit': 10.50707549,
        'pair': 'ETH_DASH',
        'maxLimit': 10.50707549,
        'min': 0.00519839,
        'minerFee': 0.002
      },
      {
        'rate': '21.65716296',
        'limit': 8.07730915,
        'pair': 'DASH_ETC',
        'maxLimit': 8.07730915,
        'min': 0.00093134,
        'minerFee': 0.01
      },
      {
        'rate': '0.04612470',
        'limit': 172.77451137,
        'pair': 'ETC_DASH',
        'maxLimit': 172.77451137,
        'min': 0.08728328,
        'minerFee': 0.002
      },
      {
        'rate': '215.71759416',
        'limit': 8.07730915,
        'pair': 'DASH_EOS',
        'maxLimit': 8.07730915,
        'min': 0.0003632,
        'minerFee': 0.04
      },
      {
        'rate': '0.00450142',
        'limit': 1771.5438959,
        'pair': 'EOS_DASH',
        'maxLimit': 1771.5438959,
        'min': 0.86939081,
        'minerFee': 0.002
      },
      {
        'rate': '65.42910767',
        'limit': 8.07730915,
        'pair': 'DASH_OMG',
        'maxLimit': 8.07730915,
        'min': 0.00029956,
        'minerFee': 0.01
      },
      {
        'rate': '0.01485078',
        'limit': 536.9727058,
        'pair': 'OMG_DASH',
        'maxLimit': 536.9727058,
        'min': 0.26409327,
        'minerFee': 0.002
      },
      {
        'rate': '0.06351942',
        'limit': 8.07730915,
        'pair': 'DASH_BTC',
        'maxLimit': 8.07730915,
        'min': 0.0389353,
        'minerFee': 0.00125
      },
      {
        'rate': '15.45731538',
        'limit': 0.51660097,
        'pair': 'BTC_DASH',
        'maxLimit': 0.51660097,
        'min': 0.00025574,
        'minerFee': 0.002
      },
      {
        'rate': '1809.24000571',
        'limit': 8.07730915,
        'pair': 'DASH_BLK',
        'maxLimit': 8.07730915,
        'min': 0.00001068,
        'minerFee': 0.01
      },
      {
        'rate': '0.00052869',
        'limit': 15065.64508335,
        'pair': 'BLK_DASH',
        'maxLimit': 15065.64508335,
        'min': 7.30268418,
        'minerFee': 0.002
      },
      {
        'rate': '79.73780188',
        'limit': 8.07730915,
        'pair': 'DASH_CLAM',
        'maxLimit': 8.07730915,
        'min': 0.00002402,
        'minerFee': 0.001
      },
      {
        'rate': '0.01188787',
        'limit': 670.0227909,
        'pair': 'CLAM_DASH',
        'maxLimit': 670.0227909,
        'min': 0.32168553,
        'minerFee': 0.002
      },
      {
        'rate': '52389.71280991',
        'limit': 8.07730915,
        'pair': 'DASH_DGB',
        'maxLimit': 8.07730915,
        'min': 3.7e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00001851',
        'limit': 430500.81020252,
        'pair': 'DGB_DASH',
        'maxLimit': 430500.81020252,
        'min': 211.3553719,
        'minerFee': 0.002
      },
      {
        'rate': '301864.53571428',
        'limit': 8.07730915,
        'pair': 'DASH_DOGE',
        'maxLimit': 8.07730915,
        'min': 0.00001246,
        'minerFee': 2
      },
      {
        'rate': '0.00000308',
        'limit': 2583004.86121515,
        'pair': 'DOGE_DASH',
        'maxLimit': 2583004.86121515,
        'min': 1217.80952381,
        'minerFee': 0.002
      },
      {
        'rate': '25.66532351',
        'limit': 8.07730915,
        'pair': 'DASH_FCT',
        'maxLimit': 8.07730915,
        'min': 0.0075546,
        'minerFee': 0.1
      },
      {
        'rate': '0.03739527',
        'limit': 212.99882997,
        'pair': 'FCT_DASH',
        'maxLimit': 212.99882997,
        'min': 0.1035414,
        'minerFee': 0.002
      },
      {
        'rate': '98.53898971',
        'limit': 8.07730915,
        'pair': 'DASH_MONA',
        'maxLimit': 8.07730915,
        'min': 0.00393764,
        'minerFee': 0.2
      },
      {
        'rate': '0.00974564',
        'limit': 817.30314556,
        'pair': 'MONA_DASH',
        'maxLimit': 817.30314556,
        'min': 0.39773558,
        'minerFee': 0.002
      },
      {
        'rate': '3116.59550147',
        'limit': 8.07730915,
        'pair': 'DASH_NXT',
        'maxLimit': 8.07730915,
        'min': 0.00062764,
        'minerFee': 1
      },
      {
        'rate': '0.00031083',
        'limit': 25637.76504322,
        'pair': 'NXT_DASH',
        'maxLimit': 25637.76504322,
        'min': 12.57325467,
        'minerFee': 0.002
      },
      {
        'rate': '2181.80389118',
        'limit': 8.07730915,
        'pair': 'DASH_POT',
        'maxLimit': 8.07730915,
        'min': 0.00000903,
        'minerFee': 0.01
      },
      {
        'rate': '0.00044735',
        'limit': 17813.82662907,
        'pair': 'POT_DASH',
        'maxLimit': 17813.82662907,
        'min': 8.80647383,
        'minerFee': 0.002
      },
      {
        'rate': '452568.46428571',
        'limit': 8.07730915,
        'pair': 'DASH_RDD',
        'maxLimit': 8.07730915,
        'min': 4e-8,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000185',
        'limit': 4305000.68880011,
        'pair': 'RDD_DASH',
        'maxLimit': 4305000.68880011,
        'min': 1826.71428571,
        'minerFee': 0.002
      },
      {
        'rate': '8459.22363150',
        'limit': 8.07730915,
        'pair': 'DASH_START',
        'maxLimit': 8.07730915,
        'min': 0.00000405,
        'minerFee': 0.02
      },
      {
        'rate': '0.00010021',
        'limit': 79477.06633617,
        'pair': 'START_DASH',
        'maxLimit': 79477.06633617,
        'min': 34.14419226,
        'minerFee': 0.002
      },
      {
        'rate': '1071.34616359',
        'limit': 1.7621348,
        'pair': 'DASH_VRC',
        'maxLimit': 8.07730915,
        'min': 3.5e-7,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00086790',
        'limit': 9177.49104318,
        'pair': 'VRC_DASH',
        'maxLimit': 9177.49104318,
        'min': 4.3221227,
        'minerFee': 0.002
      },
      {
        'rate': '113.87416427',
        'limit': 8.07730915,
        'pair': 'DASH_VTC',
        'maxLimit': 8.07730915,
        'min': 0.00034511,
        'minerFee': 0.02
      },
      {
        'rate': '0.00854578',
        'limit': 932.52639437,
        'pair': 'VTC_DASH',
        'maxLimit': 932.52639437,
        'min': 0.45963336,
        'minerFee': 0.002
      },
      {
        'rate': '6291.91509433',
        'limit': 8.07730915,
        'pair': 'DASH_VOX',
        'maxLimit': 8.07730915,
        'min': 0.00000303,
        'minerFee': 0.01
      },
      {
        'rate': '0.00015017',
        'limit': 20936.54867898,
        'pair': 'VOX_DASH',
        'maxLimit': 20936.54867898,
        'min': 25.39622642,
        'minerFee': 0.002
      },
      {
        'rate': '95999.37121212',
        'limit': 8.07730915,
        'pair': 'DASH_SC',
        'maxLimit': 8.07730915,
        'min': 0.00020246,
        'minerFee': 10
      },
      {
        'rate': '0.00001002',
        'limit': 794770.72652774,
        'pair': 'SC_DASH',
        'maxLimit': 794770.72652774,
        'min': 387.48484848,
        'minerFee': 0.002
      },
      {
        'rate': '2112.69039679',
        'limit': 8.07730915,
        'pair': 'DASH_LBC',
        'maxLimit': 8.07730915,
        'min': 0.00001843,
        'minerFee': 0.02
      },
      {
        'rate': '0.00045622',
        'limit': 17458.63373582,
        'pair': 'LBC_DASH',
        'maxLimit': 17458.63373582,
        'min': 8.52750917,
        'minerFee': 0.002
      },
      {
        'rate': '107.94531995',
        'limit': 8.07730915,
        'pair': 'DASH_WAVES',
        'maxLimit': 8.07730915,
        'min': 0.00001815,
        'minerFee': 0.001
      },
      {
        'rate': '0.00898521',
        'limit': 886.47294297,
        'pair': 'WAVES_DASH',
        'maxLimit': 886.47294297,
        'min': 0.4357026,
        'minerFee': 0.002
      },
      {
        'rate': '281.87376545',
        'limit': 8.07730915,
        'pair': 'DASH_GAME',
        'maxLimit': 8.07730915,
        'min': 0.00136298,
        'minerFee': 0.2
      },
      {
        'rate': '0.00337509',
        'limit': 2361.17268725,
        'pair': 'GAME_DASH',
        'maxLimit': 2361.17268725,
        'min': 1.13773467,
        'minerFee': 0.002
      },
      {
        'rate': '199.17508094',
        'limit': 8.07730915,
        'pair': 'DASH_KMD',
        'maxLimit': 8.07730915,
        'min': 0.00001978,
        'minerFee': 0.002
      },
      {
        'rate': '0.00489533',
        'limit': 1627.08967371,
        'pair': 'KMD_DASH',
        'maxLimit': 1627.08967371,
        'min': 0.80393575,
        'minerFee': 0.002
      },
      {
        'rate': '3906.26294697',
        'limit': 8.07730915,
        'pair': 'DASH_SNGLS',
        'maxLimit': 8.07730915,
        'min': 0.00149044,
        'minerFee': 3
      },
      {
        'rate': '0.00024592',
        'limit': 32388.7751647,
        'pair': 'SNGLS_DASH',
        'maxLimit': 32388.7751647,
        'min': 15.76695438,
        'minerFee': 0.002
      },
      {
        'rate': '1704.07399193',
        'limit': 8.07730915,
        'pair': 'DASH_GNT',
        'maxLimit': 8.07730915,
        'min': 0.0000114,
        'minerFee': 0.01
      },
      {
        'rate': '0.00056444',
        'limit': 14118.6382138,
        'pair': 'GNT_DASH',
        'maxLimit': 14118.6382138,
        'min': 6.87473118,
        'minerFee': 0.002
      },
      {
        'rate': '341.08303725',
        'limit': 8.07730915,
        'pair': 'DASH_SWT',
        'maxLimit': 8.07730915,
        'min': 0.00053441,
        'minerFee': 0.1
      },
      {
        'rate': '0.00264533',
        'limit': 3011.02157862,
        'pair': 'SWT_DASH',
        'maxLimit': 3011.02157862,
        'min': 1.37672265,
        'minerFee': 0.002
      },
      {
        'rate': '1049.69491385',
        'limit': 8.07730915,
        'pair': 'DASH_WINGS',
        'maxLimit': 8.07730915,
        'min': 0.00001831,
        'minerFee': 0.01
      },
      {
        'rate': '0.00090644',
        'limit': 8787.22524652,
        'pair': 'WINGS_DASH',
        'maxLimit': 8787.22524652,
        'min': 4.23691186,
        'minerFee': 0.002
      },
      {
        'rate': '1417.44038031',
        'limit': 8.07730915,
        'pair': 'DASH_TRST',
        'maxLimit': 8.07730915,
        'min': 0.00001325,
        'minerFee': 0.01
      },
      {
        'rate': '0.00065605',
        'limit': 12141.03335152,
        'pair': 'TRST_DASH',
        'maxLimit': 12141.03335152,
        'min': 5.7212528,
        'minerFee': 0.002
      },
      {
        'rate': '962.91162613',
        'limit': 8.07730915,
        'pair': 'DASH_RLC',
        'maxLimit': 8.07730915,
        'min': 0.00001961,
        'minerFee': 0.01
      },
      {
        'rate': '0.00097058',
        'limit': 8206.52851665,
        'pair': 'RLC_DASH',
        'maxLimit': 8206.52851665,
        'min': 3.88662614,
        'minerFee': 0.002
      },
      {
        'rate': '2757.16209747',
        'limit': 3.67433181,
        'pair': 'DASH_GUP',
        'maxLimit': 3.67433181,
        'min': 0.00000691,
        'minerFee': 0.01
      },
      {
        'rate': '0.00034228',
        'limit': 6670.4980368,
        'pair': 'GUP_DASH',
        'maxLimit': 6670.4980368,
        'min': 11.12880766,
        'minerFee': 0.002
      },
      {
        'rate': '270.76745726',
        'limit': 8.07730915,
        'pair': 'DASH_ANT',
        'maxLimit': 8.07730915,
        'min': 0.00007164,
        'minerFee': 0.01
      },
      {
        'rate': '0.00354622',
        'limit': 2246.09118367,
        'pair': 'ANT_DASH',
        'maxLimit': 2246.09118367,
        'min': 1.09290598,
        'minerFee': 0.002
      },
      {
        'rate': '10.86785334',
        'limit': 8.07730915,
        'pair': 'DASH_DCR',
        'maxLimit': 8.07730915,
        'min': 0.00541979,
        'minerFee': 0.03
      },
      {
        'rate': '0.08942660',
        'limit': 89.06913315,
        'pair': 'DCR_DASH',
        'maxLimit': 89.06913315,
        'min': 0.04386621,
        'minerFee': 0.002
      },
      {
        'rate': '3269.32843137',
        'limit': 8.07730915,
        'pair': 'DASH_BAT',
        'maxLimit': 8.07730915,
        'min': 0.00000596,
        'minerFee': 0.01
      },
      {
        'rate': '0.00029495',
        'limit': 27004.75547533,
        'pair': 'BAT_DASH',
        'maxLimit': 27004.75547533,
        'min': 13.19607843,
        'minerFee': 0.002
      },
      {
        'rate': '218.48132758',
        'limit': 8.07730915,
        'pair': 'DASH_BNT',
        'maxLimit': 8.07730915,
        'min': 0.0000849,
        'minerFee': 0.01
      },
      {
        'rate': '0.00420274',
        'limit': 1895.22698531,
        'pair': 'BNT_DASH',
        'maxLimit': 1895.22698531,
        'min': 0.88186207,
        'minerFee': 0.002
      },
      {
        'rate': '15644.34197530',
        'limit': 8.07730915,
        'pair': 'DASH_SNT',
        'maxLimit': 8.07730915,
        'min': 0.00036443,
        'minerFee': 3
      },
      {
        'rate': '0.00006013',
        'limit': 132461.78775462,
        'pair': 'SNT_DASH',
        'maxLimit': 132461.78775462,
        'min': 63.14567901,
        'minerFee': 0.002
      },
      {
        'rate': '39.42454779',
        'limit': 8.07730915,
        'pair': 'DASH_NMR',
        'maxLimit': 8.07730915,
        'min': 0.00018689,
        'minerFee': 0.004
      },
      {
        'rate': '0.02312757',
        'limit': 344.40064816,
        'pair': 'NMR_DASH',
        'maxLimit': 344.40064816,
        'min': 0.15913036,
        'minerFee': 0.002
      },
      {
        'rate': '682.09263645',
        'limit': 8.07730915,
        'pair': 'DASH_EDG',
        'maxLimit': 8.07730915,
        'min': 0.00085035,
        'minerFee': 0.3
      },
      {
        'rate': '0.00140307',
        'limit': 5676.93376091,
        'pair': 'EDG_DASH',
        'maxLimit': 5676.93376091,
        'min': 2.75314889,
        'minerFee': 0.002
      },
      {
        'rate': '1717.99308568',
        'limit': 8.07730915,
        'pair': 'DASH_CVC',
        'maxLimit': 8.07730915,
        'min': 0.00011226,
        'minerFee': 0.1
      },
      {
        'rate': '0.00055595',
        'limit': 14334.10006435,
        'pair': 'CVC_DASH',
        'maxLimit': 14334.10006435,
        'min': 6.93438178,
        'minerFee': 0.002
      },
      {
        'rate': '108.96074739',
        'limit': 6.34953411,
        'pair': 'DASH_MTL',
        'maxLimit': 6.34953411,
        'min': 0.00017821,
        'minerFee': 0.01
      },
      {
        'rate': '0.00882116',
        'limit': 902.95912056,
        'pair': 'MTL_DASH',
        'maxLimit': 902.95912056,
        'min': 0.4398012,
        'minerFee': 0.002
      },
      {
        'rate': '25343.83400000',
        'limit': 8.07730915,
        'pair': 'DASH_FUN',
        'maxLimit': 8.07730915,
        'min': 7.6e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00003746',
        'limit': 212592.98817303,
        'pair': 'FUN_DASH',
        'maxLimit': 212592.98817303,
        'min': 102.296,
        'minerFee': 0.002
      },
      {
        'rate': '12930.52755102',
        'limit': 8.07730915,
        'pair': 'DASH_DNT',
        'maxLimit': 8.07730915,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00007246',
        'limit': 109915.10047724,
        'pair': 'DNT_DASH',
        'maxLimit': 109915.10047724,
        'min': 52.19183673,
        'minerFee': 0.002
      },
      {
        'rate': '1387.63874288',
        'limit': 8.07730915,
        'pair': 'DASH_1ST',
        'maxLimit': 8.07730915,
        'min': 0.00001388,
        'minerFee': 0.01
      },
      {
        'rate': '0.00068704',
        'limit': 11593.37908983,
        'pair': '1ST_DASH',
        'maxLimit': 11593.37908983,
        'min': 5.60096364,
        'minerFee': 0.002
      },
      {
        'rate': '141.46553764',
        'limit': 4.04004827,
        'pair': 'DASH_SALT',
        'maxLimit': 4.04004827,
        'min': 0.00068103,
        'minerFee': 0.05
      },
      {
        'rate': '0.00674214',
        'limit': 590.6981482,
        'pair': 'SALT_DASH',
        'maxLimit': 590.6981482,
        'min': 0.57100116,
        'minerFee': 0.002
      },
      {
        'rate': '2654.58762562',
        'limit': 8.07730915,
        'pair': 'DASH_XEM',
        'maxLimit': 8.07730915,
        'min': 0.00296157,
        'minerFee': 4
      },
      {
        'rate': '0.00036649',
        'limit': 21733.31814232,
        'pair': 'XEM_DASH',
        'maxLimit': 21733.31814232,
        'min': 10.70938023,
        'minerFee': 0.002
      },
      {
        'rate': '4106.25955930',
        'limit': 8.07730915,
        'pair': 'DASH_RCN',
        'maxLimit': 8.07730915,
        'min': 0.00093445,
        'minerFee': 2
      },
      {
        'rate': '0.00023127',
        'limit': 34440.0648162,
        'pair': 'RCN_DASH',
        'maxLimit': 34440.0648162,
        'min': 16.57420609,
        'minerFee': 0.002
      },
      {
        'rate': '301.86453571',
        'limit': 8.07730915,
        'pair': 'DASH_NMC',
        'maxLimit': 8.07730915,
        'min': 0.00002981,
        'minerFee': 0.005
      },
      {
        'rate': '0.00295241',
        'limit': 496.85281567,
        'pair': 'NMC_DASH',
        'maxLimit': 496.85281567,
        'min': 1.21780952,
        'minerFee': 0.002
      },
      {
        'rate': '21.16367392',
        'limit': 8.07730915,
        'pair': 'DASH_REP',
        'maxLimit': 8.07730915,
        'min': 0.00090463,
        'minerFee': 0.01
      },
      {
        'rate': '0.04480175',
        'limit': 177.87635866,
        'pair': 'REP_DASH',
        'maxLimit': 177.87635866,
        'min': 0.08538043,
        'minerFee': 0.002
      },
      {
        'rate': '5.17689982',
        'limit': 8.07730915,
        'pair': 'DASH_GNO',
        'maxLimit': 8.07730915,
        'min': 0.00374751,
        'minerFee': 0.01
      },
      {
        'rate': '0.18559545',
        'limit': 42.93840538,
        'pair': 'GNO_DASH',
        'maxLimit': 42.93840538,
        'min': 0.02088512,
        'minerFee': 0.002
      },
      {
        'rate': '2602.28048029',
        'limit': 8.07730915,
        'pair': 'DASH_ZRX',
        'maxLimit': 8.07730915,
        'min': 0.00000372,
        'minerFee': 0.005
      },
      {
        'rate': '0.00036868',
        'limit': 21615.10344113,
        'pair': 'ZRX_DASH',
        'maxLimit': 21615.10344113,
        'min': 10.49835796,
        'minerFee': 0.002
      },
      {
        'rate': '0.51652042',
        'limit': 55.60107237,
        'pair': 'LTC_XMR',
        'maxLimit': 55.60107237,
        'min': 0.07653995,
        'minerFee': 0.02
      },
      {
        'rate': '1.89723391',
        'limit': 29.03540039,
        'pair': 'XMR_LTC',
        'maxLimit': 29.03540039,
        'min': 0.00104085,
        'minerFee': 0.001
      },
      {
        'rate': '351.17485714',
        'limit': 55.60107237,
        'pair': 'LTC_XRP',
        'maxLimit': 55.60107237,
        'min': 0.00281119,
        'minerFee': 0.5
      },
      {
        'rate': '0.00279010',
        'limit': 19763.5957728,
        'pair': 'XRP_LTC',
        'maxLimit': 19763.5957728,
        'min': 0.70765714,
        'minerFee': 0.001
      },
      {
        'rate': '0.25818787',
        'limit': 55.60107237,
        'pair': 'LTC_ZEC',
        'maxLimit': 55.60107237,
        'min': 0.00076493,
        'minerFee': 0.0001
      },
      {
        'rate': '3.79595212',
        'limit': 14.52665992,
        'pair': 'ZEC_LTC',
        'maxLimit': 14.52665992,
        'min': 0.00052028,
        'minerFee': 0.001
      },
      {
        'rate': '0.18737986',
        'limit': 55.60107237,
        'pair': 'LTC_ETH',
        'maxLimit': 55.60107237,
        'min': 0.01057558,
        'minerFee': 0.001
      },
      {
        'rate': '5.24813071',
        'limit': 10.50707549,
        'pair': 'ETH_LTC',
        'maxLimit': 10.50707549,
        'min': 0.00037759,
        'minerFee': 0.001
      },
      {
        'rate': '3.14619112',
        'limit': 55.60107237,
        'pair': 'LTC_ETC',
        'maxLimit': 55.60107237,
        'min': 0.00643363,
        'minerFee': 0.01
      },
      {
        'rate': '0.31894725',
        'limit': 172.71490928,
        'pair': 'ETC_LTC',
        'maxLimit': 172.71490928,
        'min': 0.00633993,
        'minerFee': 0.001
      },
      {
        'rate': '31.33784335',
        'limit': 55.60107237,
        'pair': 'LTC_EOS',
        'maxLimit': 55.60107237,
        'min': 0.00250896,
        'minerFee': 0.04
      },
      {
        'rate': '0.03112680',
        'limit': 1771.54389282,
        'pair': 'EOS_LTC',
        'maxLimit': 1771.54389282,
        'min': 0.06314931,
        'minerFee': 0.001
      },
      {
        'rate': '9.50505282',
        'limit': 55.60107237,
        'pair': 'LTC_OMG',
        'maxLimit': 55.60107237,
        'min': 0.00206935,
        'minerFee': 0.01
      },
      {
        'rate': '0.10269144',
        'limit': 536.97270564,
        'pair': 'OMG_LTC',
        'maxLimit': 536.97270564,
        'min': 0.01918275,
        'minerFee': 0.001
      },
      {
        'rate': '0.00922762',
        'limit': 55.60107237,
        'pair': 'LTC_BTC',
        'maxLimit': 55.60107237,
        'min': 0.26896181,
        'minerFee': 0.00125
      },
      {
        'rate': '106.88542227',
        'limit': 0.51642276,
        'pair': 'BTC_LTC',
        'maxLimit': 0.51642276,
        'min': 0.00001858,
        'minerFee': 0.001
      },
      {
        'rate': '262.83289548',
        'limit': 55.60107237,
        'pair': 'LTC_BLK',
        'maxLimit': 55.60107237,
        'min': 0.00007378,
        'minerFee': 0.01
      },
      {
        'rate': '0.00365587',
        'limit': 15060.44794975,
        'pair': 'BLK_LTC',
        'maxLimit': 15060.44794975,
        'min': 0.53043975,
        'minerFee': 0.001
      },
      {
        'rate': '11.58371320',
        'limit': 55.60107237,
        'pair': 'LTC_CLAM',
        'maxLimit': 55.60107237,
        'min': 0.0001659,
        'minerFee': 0.001
      },
      {
        'rate': '0.08220342',
        'limit': 669.79165287,
        'pair': 'CLAM_LTC',
        'maxLimit': 669.79165287,
        'min': 0.02336604,
        'minerFee': 0.001
      },
      {
        'rate': '7610.78677685',
        'limit': 55.60107237,
        'pair': 'LTC_DGB',
        'maxLimit': 55.60107237,
        'min': 0.00000258,
        'minerFee': 0.01
      },
      {
        'rate': '0.00012800',
        'limit': 430352.30016419,
        'pair': 'DGB_LTC',
        'maxLimit': 430352.30016419,
        'min': 15.35206612,
        'minerFee': 0.001
      },
      {
        'rate': '43852.62857142',
        'limit': 55.60107237,
        'pair': 'LTC_DOGE',
        'maxLimit': 55.60107237,
        'min': 0.00008607,
        'minerFee': 2
      },
      {
        'rate': '0.00002133',
        'limit': 2582113.80098513,
        'pair': 'DOGE_LTC',
        'maxLimit': 2582113.80098513,
        'min': 88.45714286,
        'minerFee': 0.001
      },
      {
        'rate': '3.72846679',
        'limit': 55.60107237,
        'pair': 'LTC_FCT',
        'maxLimit': 55.60107237,
        'min': 0.05218655,
        'minerFee': 0.1
      },
      {
        'rate': '0.25858436',
        'limit': 212.92535168,
        'pair': 'FCT_LTC',
        'maxLimit': 212.92535168,
        'min': 0.00752086,
        'minerFee': 0.001
      },
      {
        'rate': '14.31500956',
        'limit': 55.60107237,
        'pair': 'LTC_MONA',
        'maxLimit': 55.60107237,
        'min': 0.02720086,
        'minerFee': 0.2
      },
      {
        'rate': '0.06739013',
        'limit': 817.02120016,
        'pair': 'MONA_LTC',
        'maxLimit': 817.02120016,
        'min': 0.02889003,
        'minerFee': 0.001
      },
      {
        'rate': '452.75575221',
        'limit': 55.60107237,
        'pair': 'LTC_NXT',
        'maxLimit': 55.60107237,
        'min': 0.00433566,
        'minerFee': 1
      },
      {
        'rate': '0.00214940',
        'limit': 25628.92110159,
        'pair': 'NXT_LTC',
        'maxLimit': 25628.92110159,
        'min': 0.91327434,
        'minerFee': 0.001
      },
      {
        'rate': '316.95619834',
        'limit': 55.60107237,
        'pair': 'LTC_POT',
        'maxLimit': 55.60107237,
        'min': 0.0000624,
        'minerFee': 0.01
      },
      {
        'rate': '0.00309343',
        'limit': 17807.6813861,
        'pair': 'POT_LTC',
        'maxLimit': 17807.6813861,
        'min': 0.63966942,
        'minerFee': 0.001
      },
      {
        'rate': '65745.77142857',
        'limit': 55.60107237,
        'pair': 'LTC_RDD',
        'maxLimit': 55.60107237,
        'min': 2.6e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00001279',
        'limit': 4303523.00164188,
        'pair': 'RDD_LTC',
        'maxLimit': 4303523.00164188,
        'min': 132.68571429,
        'minerFee': 0.001
      },
      {
        'rate': '1228.89292389',
        'limit': 55.60107237,
        'pair': 'LTC_START',
        'maxLimit': 55.60107237,
        'min': 0.00002797,
        'minerFee': 0.02
      },
      {
        'rate': '0.00069300',
        'limit': 79449.65541493,
        'pair': 'START_LTC',
        'maxLimit': 79449.65541493,
        'min': 2.48010681,
        'minerFee': 0.001
      },
      {
        'rate': '155.63718100',
        'limit': 12.1298545,
        'pair': 'LTC_VRC',
        'maxLimit': 55.60107237,
        'min': 0.00000242,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00600144',
        'limit': 9174.32510565,
        'pair': 'VRC_LTC',
        'maxLimit': 9174.32510565,
        'min': 0.31394288,
        'minerFee': 0.001
      },
      {
        'rate': '16.54278936',
        'limit': 55.60107237,
        'pair': 'LTC_VTC',
        'maxLimit': 55.60107237,
        'min': 0.00238399,
        'minerFee': 0.02
      },
      {
        'rate': '0.05909318',
        'limit': 932.20470089,
        'pair': 'VTC_LTC',
        'maxLimit': 932.20470089,
        'min': 0.03338605,
        'minerFee': 0.001
      },
      {
        'rate': '914.04250248',
        'limit': 55.60107237,
        'pair': 'LTC_VOX',
        'maxLimit': 55.60107237,
        'min': 0.00002096,
        'minerFee': 0.01
      },
      {
        'rate': '0.00103844',
        'limit': 20936.54867898,
        'pair': 'VOX_LTC',
        'maxLimit': 20936.54867898,
        'min': 1.84468719,
        'minerFee': 0.001
      },
      {
        'rate': '13946.07272727',
        'limit': 55.60107237,
        'pair': 'LTC_SC',
        'maxLimit': 55.60107237,
        'min': 0.0013986,
        'minerFee': 10
      },
      {
        'rate': '0.00006930',
        'limit': 794496.55414927,
        'pair': 'SC_LTC',
        'maxLimit': 794496.55414927,
        'min': 28.14545455,
        'minerFee': 0.001
      },
      {
        'rate': '306.91590530',
        'limit': 55.60107237,
        'pair': 'LTC_LBC',
        'maxLimit': 55.60107237,
        'min': 0.00012734,
        'minerFee': 0.02
      },
      {
        'rate': '0.00315478',
        'limit': 17452.61102389,
        'pair': 'LBC_LTC',
        'maxLimit': 17452.61102389,
        'min': 0.61940647,
        'minerFee': 0.001
      },
      {
        'rate': '15.68149107',
        'limit': 55.60107237,
        'pair': 'LTC_WAVES',
        'maxLimit': 55.60107237,
        'min': 0.00012539,
        'minerFee': 0.001
      },
      {
        'rate': '0.06213180',
        'limit': 886.16713604,
        'pair': 'WAVES_LTC',
        'maxLimit': 886.16713604,
        'min': 0.03164781,
        'minerFee': 0.001
      },
      {
        'rate': '40.94851855',
        'limit': 55.60107237,
        'pair': 'LTC_GAME',
        'maxLimit': 55.60107237,
        'min': 0.00941538,
        'minerFee': 0.2
      },
      {
        'rate': '0.02333838',
        'limit': 2360.35815255,
        'pair': 'GAME_LTC',
        'maxLimit': 2360.35815255,
        'min': 0.0826408,
        'minerFee': 0.001
      },
      {
        'rate': '28.93467039',
        'limit': 55.60107237,
        'pair': 'LTC_KMD',
        'maxLimit': 55.60107237,
        'min': 0.00013663,
        'minerFee': 0.002
      },
      {
        'rate': '0.03385072',
        'limit': 1626.52837857,
        'pair': 'KMD_LTC',
        'maxLimit': 1626.52837857,
        'min': 0.05839489,
        'minerFee': 0.001
      },
      {
        'rate': '567.47274969',
        'limit': 55.60107237,
        'pair': 'LTC_SNGLS',
        'maxLimit': 55.60107237,
        'min': 0.01029586,
        'minerFee': 3
      },
      {
        'rate': '0.00170053',
        'limit': 32377.60252019,
        'pair': 'SNGLS_LTC',
        'maxLimit': 32377.60252019,
        'min': 1.14525277,
        'minerFee': 0.001
      },
      {
        'rate': '247.55516129',
        'limit': 55.60107237,
        'pair': 'LTC_GNT',
        'maxLimit': 55.60107237,
        'min': 0.00007873,
        'minerFee': 0.01
      },
      {
        'rate': '0.00390306',
        'limit': 14113.76770148,
        'pair': 'GNT_LTC',
        'maxLimit': 14113.76770148,
        'min': 0.49935484,
        'minerFee': 0.001
      },
      {
        'rate': '49.54999999',
        'limit': 55.60107237,
        'pair': 'LTC_SWT',
        'maxLimit': 55.60107237,
        'min': 0.00369166,
        'minerFee': 0.1
      },
      {
        'rate': '0.01829218',
        'limit': 3009.98286529,
        'pair': 'SWT_LTC',
        'maxLimit': 3009.98286529,
        'min': 0.1,
        'minerFee': 0.001
      },
      {
        'rate': '152.49184890',
        'limit': 55.60107237,
        'pair': 'LTC_WINGS',
        'maxLimit': 55.60107237,
        'min': 0.0001265,
        'minerFee': 0.01
      },
      {
        'rate': '0.00626798',
        'limit': 8784.19391388,
        'pair': 'WINGS_LTC',
        'maxLimit': 8784.19391388,
        'min': 0.30775348,
        'minerFee': 0.001
      },
      {
        'rate': '205.91516778',
        'limit': 55.60107237,
        'pair': 'LTC_TRST',
        'maxLimit': 55.60107237,
        'min': 0.00009155,
        'minerFee': 0.01
      },
      {
        'rate': '0.00453653',
        'limit': 12136.84512801,
        'pair': 'TRST_LTC',
        'maxLimit': 12136.84512801,
        'min': 0.41557047,
        'minerFee': 0.001
      },
      {
        'rate': '139.88462006',
        'limit': 55.60107237,
        'pair': 'LTC_RLC',
        'maxLimit': 55.60107237,
        'min': 0.00013545,
        'minerFee': 0.01
      },
      {
        'rate': '0.00671150',
        'limit': 8203.69754086,
        'pair': 'RLC_LTC',
        'maxLimit': 8203.69754086,
        'min': 0.28231003,
        'minerFee': 0.001
      },
      {
        'rate': '400.53994778',
        'limit': 25.29267919,
        'pair': 'LTC_GUP',
        'maxLimit': 25.29267919,
        'min': 0.00004777,
        'minerFee': 0.01
      },
      {
        'rate': '0.00236688',
        'limit': 6670.4980368,
        'pair': 'GUP_LTC',
        'maxLimit': 6670.4980368,
        'min': 0.80835509,
        'minerFee': 0.001
      },
      {
        'rate': '39.33507692',
        'limit': 55.60107237,
        'pair': 'LTC_ANT',
        'maxLimit': 55.60107237,
        'min': 0.00049489,
        'minerFee': 0.01
      },
      {
        'rate': '0.02452178',
        'limit': 2245.31634868,
        'pair': 'ANT_LTC',
        'maxLimit': 2245.31634868,
        'min': 0.07938462,
        'minerFee': 0.001
      },
      {
        'rate': '1.57880068',
        'limit': 55.60107237,
        'pair': 'LTC_DCR',
        'maxLimit': 55.60107237,
        'min': 0.03743948,
        'minerFee': 0.03
      },
      {
        'rate': '0.61837547',
        'limit': 89.03840693,
        'pair': 'DCR_LTC',
        'maxLimit': 89.03840693,
        'min': 0.00318628,
        'minerFee': 0.001
      },
      {
        'rate': '474.94365325',
        'limit': 55.60107237,
        'pair': 'LTC_BAT',
        'maxLimit': 55.60107237,
        'min': 0.00004116,
        'minerFee': 0.01
      },
      {
        'rate': '0.00203957',
        'limit': 26995.43963393,
        'pair': 'BAT_LTC',
        'maxLimit': 26995.43963393,
        'min': 0.95851393,
        'minerFee': 0.001
      },
      {
        'rate': '31.73933793',
        'limit': 55.60107237,
        'pair': 'LTC_BNT',
        'maxLimit': 55.60107237,
        'min': 0.00058651,
        'minerFee': 0.01
      },
      {
        'rate': '0.02906151',
        'limit': 1894.57319025,
        'pair': 'BNT_LTC',
        'maxLimit': 1894.57319025,
        'min': 0.06405517,
        'minerFee': 0.001
      },
      {
        'rate': '2272.69333333',
        'limit': 55.60107237,
        'pair': 'LTC_SNT',
        'maxLimit': 55.60107237,
        'min': 0.00251748,
        'minerFee': 3
      },
      {
        'rate': '0.00041580',
        'limit': 132416.09235821,
        'pair': 'SNT_LTC',
        'maxLimit': 132416.09235821,
        'min': 4.58666667,
        'minerFee': 0.001
      },
      {
        'rate': '5.72730429',
        'limit': 55.60107237,
        'pair': 'LTC_NMR',
        'maxLimit': 55.60107237,
        'min': 0.00129102,
        'minerFee': 0.004
      },
      {
        'rate': '0.15992469',
        'limit': 344.28184013,
        'pair': 'NMR_LTC',
        'maxLimit': 344.28184013,
        'min': 0.01155864,
        'minerFee': 0.001
      },
      {
        'rate': '99.08933146',
        'limit': 55.60107237,
        'pair': 'LTC_EDG',
        'maxLimit': 55.60107237,
        'min': 0.00587413,
        'minerFee': 0.3
      },
      {
        'rate': '0.00970209',
        'limit': 5674.97538678,
        'pair': 'EDG_LTC',
        'maxLimit': 5674.97538678,
        'min': 0.19997847,
        'minerFee': 0.001
      },
      {
        'rate': '249.57722342',
        'limit': 55.60107237,
        'pair': 'LTC_CVC',
        'maxLimit': 55.60107237,
        'min': 0.00077547,
        'minerFee': 0.1
      },
      {
        'rate': '0.00384439',
        'limit': 14329.15538837,
        'pair': 'CVC_LTC',
        'maxLimit': 14329.15538837,
        'min': 0.50368764,
        'minerFee': 0.001
      },
      {
        'rate': '15.82900479',
        'limit': 43.70773722,
        'pair': 'LTC_MTL',
        'maxLimit': 43.70773722,
        'min': 0.00123103,
        'minerFee': 0.01
      },
      {
        'rate': '0.06099740',
        'limit': 902.64762672,
        'pair': 'MTL_LTC',
        'maxLimit': 902.64762672,
        'min': 0.03194552,
        'minerFee': 0.001
      },
      {
        'rate': '3681.76319999',
        'limit': 55.60107237,
        'pair': 'LTC_FUN',
        'maxLimit': 55.60107237,
        'min': 0.00000523,
        'minerFee': 0.01
      },
      {
        'rate': '0.00025907',
        'limit': 212519.65440207,
        'pair': 'FUN_LTC',
        'maxLimit': 212519.65440207,
        'min': 7.4304,
        'minerFee': 0.001
      },
      {
        'rate': '1878.45061224',
        'limit': 55.60107237,
        'pair': 'LTC_DNT',
        'maxLimit': 55.60107237,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00050109',
        'limit': 109877.18302064,
        'pair': 'DNT_LTC',
        'maxLimit': 109877.18302064,
        'min': 3.79102041,
        'minerFee': 0.001
      },
      {
        'rate': '201.58580814',
        'limit': 55.60107237,
        'pair': 'LTC_1ST',
        'maxLimit': 55.60107237,
        'min': 0.00009588,
        'minerFee': 0.01
      },
      {
        'rate': '0.00475082',
        'limit': 11589.37971717,
        'pair': '1ST_LTC',
        'maxLimit': 11589.37971717,
        'min': 0.40683311,
        'minerFee': 0.001
      },
      {
        'rate': '20.55105831',
        'limit': 27.81012986,
        'pair': 'LTC_SALT',
        'maxLimit': 27.81012986,
        'min': 0.00470446,
        'minerFee': 0.05
      },
      {
        'rate': '0.04662124',
        'limit': 590.6981482,
        'pair': 'SALT_LTC',
        'maxLimit': 590.6981482,
        'min': 0.0414754,
        'minerFee': 0.001
      },
      {
        'rate': '385.63869346',
        'limit': 55.60107237,
        'pair': 'LTC_XEM',
        'maxLimit': 55.60107237,
        'min': 0.02045831,
        'minerFee': 4
      },
      {
        'rate': '0.00253427',
        'limit': 21725.82079079,
        'pair': 'XEM_LTC',
        'maxLimit': 21725.82079079,
        'min': 0.77788945,
        'minerFee': 0.001
      },
      {
        'rate': '596.52676604',
        'limit': 55.60107237,
        'pair': 'LTC_RCN',
        'maxLimit': 55.60107237,
        'min': 0.00645508,
        'minerFee': 2
      },
      {
        'rate': '0.00159924',
        'limit': 34428.18401314,
        'pair': 'RCN_LTC',
        'maxLimit': 34428.18401314,
        'min': 1.20388853,
        'minerFee': 0.001
      },
      {
        'rate': '43.85262857',
        'limit': 55.60107237,
        'pair': 'LTC_NMC',
        'maxLimit': 55.60107237,
        'min': 0.00020591,
        'minerFee': 0.005
      },
      {
        'rate': '0.02041561',
        'limit': 496.85281567,
        'pair': 'NMC_LTC',
        'maxLimit': 496.85281567,
        'min': 0.08845714,
        'minerFee': 0.001
      },
      {
        'rate': '3.07450071',
        'limit': 55.60107237,
        'pair': 'LTC_REP',
        'maxLimit': 55.60107237,
        'min': 0.0062491,
        'minerFee': 0.01
      },
      {
        'rate': '0.30979921',
        'limit': 177.81499661,
        'pair': 'REP_LTC',
        'maxLimit': 177.81499661,
        'min': 0.00620172,
        'minerFee': 0.001
      },
      {
        'rate': '0.75206139',
        'limit': 55.60107237,
        'pair': 'LTC_GNO',
        'maxLimit': 55.60107237,
        'min': 0.02588749,
        'minerFee': 0.01
      },
      {
        'rate': '1.28337221',
        'limit': 42.92359291,
        'pair': 'GNO_LTC',
        'maxLimit': 42.92359291,
        'min': 0.00151702,
        'minerFee': 0.001
      },
      {
        'rate': '378.03990147',
        'limit': 55.60107237,
        'pair': 'LTC_ZRX',
        'maxLimit': 55.60107237,
        'min': 0.00002571,
        'minerFee': 0.005
      },
      {
        'rate': '0.00254941',
        'limit': 21607.64687017,
        'pair': 'ZRX_LTC',
        'maxLimit': 21607.64687017,
        'min': 0.76256158,
        'minerFee': 0.001
      },
      {
        'rate': '671.80149542',
        'limit': 29.03540039,
        'pair': 'XMR_XRP',
        'maxLimit': 29.03540039,
        'min': 0.00146411,
        'minerFee': 0.5
      },
      {
        'rate': '0.00145313',
        'limit': 19763.5957728,
        'pair': 'XRP_XMR',
        'maxLimit': 19763.5957728,
        'min': 27.10243048,
        'minerFee': 0.02
      },
      {
        'rate': '0.49391634',
        'limit': 29.03540039,
        'pair': 'XMR_ZEC',
        'maxLimit': 29.03540039,
        'min': 0.00039839,
        'minerFee': 0.0001
      },
      {
        'rate': '1.97699193',
        'limit': 14.52665992,
        'pair': 'ZEC_XMR',
        'maxLimit': 14.52665992,
        'min': 0.01992603,
        'minerFee': 0.02
      },
      {
        'rate': '0.35845981',
        'limit': 29.03540039,
        'pair': 'XMR_ETH',
        'maxLimit': 29.03540039,
        'min': 0.00550793,
        'minerFee': 0.001
      },
      {
        'rate': '2.73330951',
        'limit': 10.50707549,
        'pair': 'ETH_XMR',
        'maxLimit': 10.50707549,
        'min': 0.01446131,
        'minerFee': 0.02
      },
      {
        'rate': '6.01869940',
        'limit': 29.03540039,
        'pair': 'XMR_ETC',
        'maxLimit': 29.03540039,
        'min': 0.00335074,
        'minerFee': 0.01
      },
      {
        'rate': '0.16611277',
        'limit': 172.71490928,
        'pair': 'ETC_XMR',
        'maxLimit': 172.71490928,
        'min': 0.24281188,
        'minerFee': 0.02
      },
      {
        'rate': '59.94965071',
        'limit': 29.03540039,
        'pair': 'XMR_EOS',
        'maxLimit': 29.03540039,
        'min': 0.00130671,
        'minerFee': 0.04
      },
      {
        'rate': '0.01621133',
        'limit': 1771.54389282,
        'pair': 'EOS_XMR',
        'maxLimit': 1771.54389282,
        'min': 2.41854365,
        'minerFee': 0.02
      },
      {
        'rate': '18.18324638',
        'limit': 29.0454202,
        'pair': 'XMR_OMG',
        'maxLimit': 29.0454202,
        'min': 0.00107775,
        'minerFee': 0.01
      },
      {
        'rate': '0.05348333',
        'limit': 536.97270564,
        'pair': 'OMG_XMR',
        'maxLimit': 536.97270564,
        'min': 0.73467662,
        'minerFee': 0.02
      },
      {
        'rate': '0.01765257',
        'limit': 29.0454202,
        'pair': 'XMR_BTC',
        'maxLimit': 29.0454202,
        'min': 0.14007957,
        'minerFee': 0.00125
      },
      {
        'rate': '55.66761920',
        'limit': 0.51642276,
        'pair': 'BTC_XMR',
        'maxLimit': 0.51642276,
        'min': 0.00071144,
        'minerFee': 0.02
      },
      {
        'rate': '502.80155054',
        'limit': 29.0454202,
        'pair': 'XMR_BLK',
        'maxLimit': 29.0454202,
        'min': 0.00003843,
        'minerFee': 0.01
      },
      {
        'rate': '0.00190403',
        'limit': 15060.44794975,
        'pair': 'BLK_XMR',
        'maxLimit': 15060.44794975,
        'min': 20.31521416,
        'minerFee': 0.02
      },
      {
        'rate': '22.15975255',
        'limit': 29.0454202,
        'pair': 'XMR_CLAM',
        'maxLimit': 29.0454202,
        'min': 0.0000864,
        'minerFee': 0.001
      },
      {
        'rate': '0.04281284',
        'limit': 669.79165287,
        'pair': 'CLAM_XMR',
        'maxLimit': 669.79165287,
        'min': 0.89489157,
        'minerFee': 0.02
      },
      {
        'rate': '14559.50684710',
        'limit': 29.0454202,
        'pair': 'XMR_DGB',
        'maxLimit': 29.0454202,
        'min': 0.00000134,
        'minerFee': 0.01
      },
      {
        'rate': '0.00006666',
        'limit': 430352.30016419,
        'pair': 'DGB_XMR',
        'maxLimit': 430352.30016419,
        'min': 587.96595041,
        'minerFee': 0.02
      },
      {
        'rate': '83890.49183333',
        'limit': 29.0454202,
        'pair': 'XMR_DOGE',
        'maxLimit': 29.0454202,
        'min': 0.00004483,
        'minerFee': 2
      },
      {
        'rate': '0.00001111',
        'limit': 2582113.80098513,
        'pair': 'DOGE_XMR',
        'maxLimit': 2582113.80098513,
        'min': 3387.80380952,
        'minerFee': 0.02
      },
      {
        'rate': '7.13259213',
        'limit': 29.0454202,
        'pair': 'XMR_FCT',
        'maxLimit': 29.0454202,
        'min': 0.02717958,
        'minerFee': 0.1
      },
      {
        'rate': '0.13467482',
        'limit': 212.92535168,
        'pair': 'FCT_XMR',
        'maxLimit': 212.92535168,
        'min': 0.28804007,
        'minerFee': 0.02
      },
      {
        'rate': '27.38473428',
        'limit': 29.0454202,
        'pair': 'XMR_MONA',
        'maxLimit': 29.0454202,
        'min': 0.01416664,
        'minerFee': 0.2
      },
      {
        'rate': '0.03509784',
        'limit': 817.02120016,
        'pair': 'MONA_XMR',
        'maxLimit': 817.02120016,
        'min': 1.10645391,
        'minerFee': 0.02
      },
      {
        'rate': '866.12602187',
        'limit': 29.0454202,
        'pair': 'XMR_NXT',
        'maxLimit': 29.0454202,
        'min': 0.00225808,
        'minerFee': 1
      },
      {
        'rate': '0.00111944',
        'limit': 25628.92110159,
        'pair': 'NXT_XMR',
        'maxLimit': 25628.92110159,
        'min': 34.97732547,
        'minerFee': 0.02
      },
      {
        'rate': '606.33988636',
        'limit': 29.0454202,
        'pair': 'XMR_POT',
        'maxLimit': 29.0454202,
        'min': 0.0000325,
        'minerFee': 0.01
      },
      {
        'rate': '0.00161111',
        'limit': 17807.6813861,
        'pair': 'POT_XMR',
        'maxLimit': 17807.6813861,
        'min': 24.49858127,
        'minerFee': 0.02
      },
      {
        'rate': '125772.21642857',
        'limit': 29.0454202,
        'pair': 'XMR_RDD',
        'maxLimit': 29.0454202,
        'min': 1.3e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000666',
        'limit': 4303523.00164188,
        'pair': 'RDD_XMR',
        'maxLimit': 4303523.00164188,
        'min': 5081.70571429,
        'minerFee': 0.02
      },
      {
        'rate': '2350.88255006',
        'limit': 29.0454202,
        'pair': 'XMR_START',
        'maxLimit': 29.0454202,
        'min': 0.00001457,
        'minerFee': 0.02
      },
      {
        'rate': '0.00036092',
        'limit': 79449.65541493,
        'pair': 'START_XMR',
        'maxLimit': 79449.65541493,
        'min': 94.98515354,
        'minerFee': 0.02
      },
      {
        'rate': '297.73539437',
        'limit': 6.33432355,
        'pair': 'XMR_VRC',
        'maxLimit': 29.0454202,
        'min': 0.00000126,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00312564',
        'limit': 9174.32510565,
        'pair': 'VRC_XMR',
        'maxLimit': 9174.32510565,
        'min': 12.02364036,
        'minerFee': 0.02
      },
      {
        'rate': '31.64649586',
        'limit': 29.0454202,
        'pair': 'XMR_VTC',
        'maxLimit': 29.0454202,
        'min': 0.00124162,
        'minerFee': 0.02
      },
      {
        'rate': '0.03077666',
        'limit': 932.20470089,
        'pair': 'VTC_XMR',
        'maxLimit': 932.20470089,
        'min': 1.2786463,
        'minerFee': 0.02
      },
      {
        'rate': '1748.57103277',
        'limit': 29.0454202,
        'pair': 'XMR_VOX',
        'maxLimit': 29.0454202,
        'min': 0.00001091,
        'minerFee': 0.01
      },
      {
        'rate': '0.00054083',
        'limit': 20936.54867898,
        'pair': 'VOX_XMR',
        'maxLimit': 20936.54867898,
        'min': 70.64933466,
        'minerFee': 0.02
      },
      {
        'rate': '26678.95500000',
        'limit': 29.0454202,
        'pair': 'XMR_SC',
        'maxLimit': 29.0454202,
        'min': 0.00072841,
        'minerFee': 10
      },
      {
        'rate': '0.00003609',
        'limit': 794496.55414927,
        'pair': 'SC_XMR',
        'maxLimit': 794496.55414927,
        'min': 1077.93757576,
        'minerFee': 0.02
      },
      {
        'rate': '587.13272090',
        'limit': 29.0454202,
        'pair': 'XMR_LBC',
        'maxLimit': 29.0454202,
        'min': 0.00006632,
        'minerFee': 0.02
      },
      {
        'rate': '0.00164305',
        'limit': 17452.61102389,
        'pair': 'LBC_XMR',
        'maxLimit': 17452.61102389,
        'min': 23.72253418,
        'minerFee': 0.02
      },
      {
        'rate': '29.99882496',
        'limit': 29.0454202,
        'pair': 'XMR_WAVES',
        'maxLimit': 29.0454202,
        'min': 0.00006531,
        'minerFee': 0.001
      },
      {
        'rate': '0.03235922',
        'limit': 886.16713604,
        'pair': 'WAVES_XMR',
        'maxLimit': 886.16713604,
        'min': 1.21207374,
        'minerFee': 0.02
      },
      {
        'rate': '78.33486208',
        'limit': 29.0454202,
        'pair': 'XMR_GAME',
        'maxLimit': 29.0454202,
        'min': 0.00490368,
        'minerFee': 0.2
      },
      {
        'rate': '0.01215500',
        'limit': 2360.35815255,
        'pair': 'GAME_XMR',
        'maxLimit': 2360.35815255,
        'min': 3.16504493,
        'minerFee': 0.02
      },
      {
        'rate': '55.35226902',
        'limit': 29.0454202,
        'pair': 'XMR_KMD',
        'maxLimit': 29.0454202,
        'min': 0.00007116,
        'minerFee': 0.002
      },
      {
        'rate': '0.01762999',
        'limit': 1626.52837857,
        'pair': 'KMD_XMR',
        'maxLimit': 1626.52837857,
        'min': 2.23645531,
        'minerFee': 0.02
      },
      {
        'rate': '1085.58016646',
        'limit': 29.0454202,
        'pair': 'XMR_SNGLS',
        'maxLimit': 29.0454202,
        'min': 0.00536225,
        'minerFee': 3
      },
      {
        'rate': '0.00088566',
        'limit': 32377.60252019,
        'pair': 'SNGLS_XMR',
        'maxLimit': 32377.60252019,
        'min': 43.86182491,
        'minerFee': 0.02
      },
      {
        'rate': '473.57535712',
        'limit': 29.0454202,
        'pair': 'XMR_GNT',
        'maxLimit': 29.0454202,
        'min': 0.000041,
        'minerFee': 0.01
      },
      {
        'rate': '0.00203277',
        'limit': 14113.76770148,
        'pair': 'GNT_XMR',
        'maxLimit': 14113.76770148,
        'min': 19.12469892,
        'minerFee': 0.02
      },
      {
        'rate': '94.78956879',
        'limit': 29.0454202,
        'pair': 'XMR_SWT',
        'maxLimit': 29.0454202,
        'min': 0.00192268,
        'minerFee': 0.1
      },
      {
        'rate': '0.00952685',
        'limit': 3009.98286529,
        'pair': 'SWT_XMR',
        'maxLimit': 3009.98286529,
        'min': 3.82988157,
        'minerFee': 0.02
      },
      {
        'rate': '291.71819582',
        'limit': 29.0454202,
        'pair': 'XMR_WINGS',
        'maxLimit': 29.0454202,
        'min': 0.00006588,
        'minerFee': 0.01
      },
      {
        'rate': '0.00326446',
        'limit': 8784.19391388,
        'pair': 'WINGS_XMR',
        'maxLimit': 8784.19391388,
        'min': 11.78659377,
        'minerFee': 0.02
      },
      {
        'rate': '393.91745637',
        'limit': 29.0454202,
        'pair': 'XMR_TRST',
        'maxLimit': 29.0454202,
        'min': 0.00004768,
        'minerFee': 0.01
      },
      {
        'rate': '0.00236269',
        'limit': 12136.84512801,
        'pair': 'TRST_XMR',
        'maxLimit': 12136.84512801,
        'min': 15.91585682,
        'minerFee': 0.02
      },
      {
        'rate': '267.60046048',
        'limit': 29.0454202,
        'pair': 'XMR_RLC',
        'maxLimit': 29.0454202,
        'min': 0.00007054,
        'minerFee': 0.01
      },
      {
        'rate': '0.00349545',
        'limit': 8203.69754086,
        'pair': 'RLC_XMR',
        'maxLimit': 8203.69754086,
        'min': 10.81213982,
        'minerFee': 0.02
      },
      {
        'rate': '766.23630548',
        'limit': 13.2080738,
        'pair': 'XMR_GUP',
        'maxLimit': 13.2080738,
        'min': 0.00002488,
        'minerFee': 0.01
      },
      {
        'rate': '0.00123271',
        'limit': 6670.4980368,
        'pair': 'GUP_XMR',
        'maxLimit': 6670.4980368,
        'min': 30.95904265,
        'minerFee': 0.02
      },
      {
        'rate': '75.24833461',
        'limit': 29.0454202,
        'pair': 'XMR_ANT',
        'maxLimit': 29.0454202,
        'min': 0.00025775,
        'minerFee': 0.01
      },
      {
        'rate': '0.01277133',
        'limit': 2245.31634868,
        'pair': 'ANT_XMR',
        'maxLimit': 2245.31634868,
        'min': 3.04033675,
        'minerFee': 0.02
      },
      {
        'rate': '3.02025905',
        'limit': 29.0454202,
        'pair': 'XMR_DCR',
        'maxLimit': 29.0454202,
        'min': 0.01949908,
        'minerFee': 0.03
      },
      {
        'rate': '0.32205972',
        'limit': 89.03840693,
        'pair': 'DCR_XMR',
        'maxLimit': 89.03840693,
        'min': 0.12203067,
        'minerFee': 0.02
      },
      {
        'rate': '908.57122291',
        'limit': 29.0454202,
        'pair': 'XMR_BAT',
        'maxLimit': 29.0454202,
        'min': 0.00002144,
        'minerFee': 0.01
      },
      {
        'rate': '0.00106224',
        'limit': 26995.43963393,
        'pair': 'BAT_XMR',
        'maxLimit': 26995.43963393,
        'min': 36.7099484,
        'minerFee': 0.02
      },
      {
        'rate': '60.71762172',
        'limit': 29.0454202,
        'pair': 'XMR_BNT',
        'maxLimit': 29.0454202,
        'min': 0.00030546,
        'minerFee': 0.01
      },
      {
        'rate': '0.01513569',
        'limit': 1894.57319025,
        'pair': 'BNT_XMR',
        'maxLimit': 1894.57319025,
        'min': 2.45323724,
        'minerFee': 0.02
      },
      {
        'rate': '4347.68155555',
        'limit': 29.0454202,
        'pair': 'XMR_SNT',
        'maxLimit': 29.0454202,
        'min': 0.00131114,
        'minerFee': 3
      },
      {
        'rate': '0.00021655',
        'limit': 132416.09235821,
        'pair': 'SNT_XMR',
        'maxLimit': 132416.09235821,
        'min': 175.66390123,
        'minerFee': 0.02
      },
      {
        'rate': '10.95638151',
        'limit': 29.0454202,
        'pair': 'XMR_NMR',
        'maxLimit': 29.0454202,
        'min': 0.00067238,
        'minerFee': 0.004
      },
      {
        'rate': '0.08329130',
        'limit': 344.28184013,
        'pair': 'NMR_XMR',
        'maxLimit': 344.28184013,
        'min': 0.44268208,
        'minerFee': 0.02
      },
      {
        'rate': '189.55872860',
        'limit': 29.0454202,
        'pair': 'XMR_EDG',
        'maxLimit': 29.0454202,
        'min': 0.00305934,
        'minerFee': 0.3
      },
      {
        'rate': '0.00505300',
        'limit': 5674.97538678,
        'pair': 'EDG_XMR',
        'maxLimit': 5674.97538678,
        'min': 7.65893853,
        'minerFee': 0.02
      },
      {
        'rate': '477.44333785',
        'limit': 29.0454202,
        'pair': 'XMR_CVC',
        'maxLimit': 29.0454202,
        'min': 0.00040388,
        'minerFee': 0.1
      },
      {
        'rate': '0.00200222',
        'limit': 14329.15538837,
        'pair': 'CVC_XMR',
        'maxLimit': 14329.15538837,
        'min': 19.29063991,
        'minerFee': 0.02
      },
      {
        'rate': '30.28101996',
        'limit': 22.82458945,
        'pair': 'XMR_MTL',
        'maxLimit': 22.82458945,
        'min': 0.00064114,
        'minerFee': 0.01
      },
      {
        'rate': '0.03176841',
        'limit': 902.64762672,
        'pair': 'MTL_XMR',
        'maxLimit': 902.64762672,
        'min': 1.22347555,
        'minerFee': 0.02
      },
      {
        'rate': '7043.24412000',
        'limit': 29.0454202,
        'pair': 'XMR_FUN',
        'maxLimit': 29.0454202,
        'min': 0.00000272,
        'minerFee': 0.01
      },
      {
        'rate': '0.00013493',
        'limit': 212519.65440207,
        'pair': 'FUN_XMR',
        'maxLimit': 212519.65440207,
        'min': 284.57552,
        'minerFee': 0.02
      },
      {
        'rate': '3593.49189795',
        'limit': 29.0454202,
        'pair': 'XMR_DNT',
        'maxLimit': 29.0454202,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00026097',
        'limit': 109877.18302064,
        'pair': 'DNT_XMR',
        'maxLimit': 109877.18302064,
        'min': 145.19159184,
        'minerFee': 0.02
      },
      {
        'rate': '385.63535479',
        'limit': 29.0454202,
        'pair': 'XMR_1ST',
        'maxLimit': 29.0454202,
        'min': 0.00004994,
        'minerFee': 0.01
      },
      {
        'rate': '0.00247430',
        'limit': 11589.37971717,
        'pair': '1ST_XMR',
        'maxLimit': 11589.37971717,
        'min': 15.58122646,
        'minerFee': 0.02
      },
      {
        'rate': '39.31434826',
        'limit': 14.5227101,
        'pair': 'XMR_SALT',
        'maxLimit': 14.5227101,
        'min': 0.00245016,
        'minerFee': 0.05
      },
      {
        'rate': '0.02428108',
        'limit': 590.6981482,
        'pair': 'SALT_XMR',
        'maxLimit': 590.6981482,
        'min': 1.58845852,
        'minerFee': 0.02
      },
      {
        'rate': '737.73045582',
        'limit': 29.0454202,
        'pair': 'XMR_XEM',
        'maxLimit': 29.0454202,
        'min': 0.01065501,
        'minerFee': 4
      },
      {
        'rate': '0.00131988',
        'limit': 21725.82079079,
        'pair': 'XEM_XMR',
        'maxLimit': 21725.82079079,
        'min': 29.79224456,
        'minerFee': 0.02
      },
      {
        'rate': '1141.16074530',
        'limit': 29.0454202,
        'pair': 'XMR_RCN',
        'maxLimit': 29.0454202,
        'min': 0.00336191,
        'minerFee': 2
      },
      {
        'rate': '0.00083291',
        'limit': 34428.18401314,
        'pair': 'RCN_XMR',
        'maxLimit': 34428.18401314,
        'min': 46.10750486,
        'minerFee': 0.02
      },
      {
        'rate': '83.89049183',
        'limit': 29.0454202,
        'pair': 'XMR_NMC',
        'maxLimit': 29.0454202,
        'min': 0.00010724,
        'minerFee': 0.005
      },
      {
        'rate': '0.01063277',
        'limit': 496.85281567,
        'pair': 'NMC_XMR',
        'maxLimit': 496.85281567,
        'min': 3.38780381,
        'minerFee': 0.02
      },
      {
        'rate': '5.88154885',
        'limit': 29.0454202,
        'pair': 'XMR_REP',
        'maxLimit': 29.0454202,
        'min': 0.00325463,
        'minerFee': 0.01
      },
      {
        'rate': '0.16134833',
        'limit': 177.81499661,
        'pair': 'REP_XMR',
        'maxLimit': 177.81499661,
        'min': 0.23751838,
        'minerFee': 0.02
      },
      {
        'rate': '1.43870054',
        'limit': 29.0454202,
        'pair': 'XMR_GNO',
        'maxLimit': 29.0454202,
        'min': 0.01348261,
        'minerFee': 0.01
      },
      {
        'rate': '0.66840055',
        'limit': 42.92359291,
        'pair': 'GNO_XMR',
        'maxLimit': 42.92359291,
        'min': 0.05809997,
        'minerFee': 0.02
      },
      {
        'rate': '723.19389511',
        'limit': 29.0454202,
        'pair': 'XMR_ZRX',
        'maxLimit': 29.0454202,
        'min': 0.00001339,
        'minerFee': 0.005
      },
      {
        'rate': '0.00132777',
        'limit': 21607.64687017,
        'pair': 'ZRX_XMR',
        'maxLimit': 21607.64687017,
        'min': 29.20520525,
        'minerFee': 0.02
      },
      {
        'rate': '0.00072636',
        'limit': 19763.5957728,
        'pair': 'XRP_ZEC',
        'maxLimit': 19763.5957728,
        'min': 0.27085714,
        'minerFee': 0.0001
      },
      {
        'rate': '1344.12857142',
        'limit': 14.52665992,
        'pair': 'ZEC_XRP',
        'maxLimit': 14.52665992,
        'min': 0.00073185,
        'minerFee': 0.5
      },
      {
        'rate': '0.00052715',
        'limit': 19763.5957728,
        'pair': 'XRP_ETH',
        'maxLimit': 19763.5957728,
        'min': 3.7447619,
        'minerFee': 0.001
      },
      {
        'rate': '1858.33809523',
        'limit': 10.50707549,
        'pair': 'ETH_XRP',
        'maxLimit': 10.50707549,
        'min': 0.00053114,
        'minerFee': 0.5
      },
      {
        'rate': '0.00885120',
        'limit': 19763.5957728,
        'pair': 'XRP_ETC',
        'maxLimit': 19763.5957728,
        'min': 2.2781181,
        'minerFee': 0.01
      },
      {
        'rate': '112.93770457',
        'limit': 172.71490928,
        'pair': 'ETC_XRP',
        'maxLimit': 172.71490928,
        'min': 0.00891809,
        'minerFee': 0.5
      },
      {
        'rate': '0.08816298',
        'limit': 19763.5957728,
        'pair': 'XRP_EOS',
        'maxLimit': 19763.5957728,
        'min': 0.88841143,
        'minerFee': 0.04
      },
      {
        'rate': '11.02185428',
        'limit': 1771.54389282,
        'pair': 'EOS_XRP',
        'maxLimit': 1771.54389282,
        'min': 0.08882921,
        'minerFee': 0.5
      },
      {
        'rate': '0.02674063',
        'limit': 19763.5957728,
        'pair': 'XRP_OMG',
        'maxLimit': 19763.5957728,
        'min': 0.73274667,
        'minerFee': 0.01
      },
      {
        'rate': '36.36255333',
        'limit': 536.97270564,
        'pair': 'OMG_XRP',
        'maxLimit': 536.97270564,
        'min': 0.02698349,
        'minerFee': 0.5
      },
      {
        'rate': '0.00002596',
        'limit': 19763.5957728,
        'pair': 'XRP_BTC',
        'maxLimit': 19763.5957728,
        'min': 95.23809524,
        'minerFee': 0.00125
      },
      {
        'rate': '37847.61904761',
        'limit': 0.51642276,
        'pair': 'BTC_XRP',
        'maxLimit': 0.51642276,
        'min': 0.00002613,
        'minerFee': 0.5
      },
      {
        'rate': '0.73942975',
        'limit': 19763.5957728,
        'pair': 'XRP_BLK',
        'maxLimit': 19763.5957728,
        'min': 0.02612571,
        'minerFee': 0.01
      },
      {
        'rate': '1.29452914',
        'limit': 15060.44794975,
        'pair': 'BLK_XRP',
        'maxLimit': 15060.44794975,
        'min': 0.74614506,
        'minerFee': 0.5
      },
      {
        'rate': '0.03258854',
        'limit': 19763.5957728,
        'pair': 'XRP_CLAM',
        'maxLimit': 19763.5957728,
        'min': 0.05874438,
        'minerFee': 0.001
      },
      {
        'rate': '29.10784076',
        'limit': 669.79165287,
        'pair': 'CLAM_XRP',
        'maxLimit': 669.79165287,
        'min': 0.03286792,
        'minerFee': 0.5
      },
      {
        'rate': '21.41148347',
        'limit': 19763.5957728,
        'pair': 'XRP_DGB',
        'maxLimit': 19763.5957728,
        'min': 0.00091429,
        'minerFee': 0.01
      },
      {
        'rate': '0.04532571',
        'limit': 430352.30016419,
        'pair': 'DGB_XRP',
        'maxLimit': 430352.30016419,
        'min': 21.59504132,
        'minerFee': 0.5
      },
      {
        'rate': '123.37092857',
        'limit': 19763.5957728,
        'pair': 'XRP_DOGE',
        'maxLimit': 19763.5957728,
        'min': 0.03047619,
        'minerFee': 2
      },
      {
        'rate': '0.00755428',
        'limit': 2582113.80098513,
        'pair': 'DOGE_XRP',
        'maxLimit': 2582113.80098513,
        'min': 124.42857143,
        'minerFee': 0.5
      },
      {
        'rate': '0.01048932',
        'limit': 19763.5957728,
        'pair': 'XRP_FCT',
        'maxLimit': 19763.5957728,
        'min': 18.47900952,
        'minerFee': 0.1
      },
      {
        'rate': '91.56349219',
        'limit': 212.92535168,
        'pair': 'FCT_XRP',
        'maxLimit': 212.92535168,
        'min': 0.01057925,
        'minerFee': 0.5
      },
      {
        'rate': '0.04027252',
        'limit': 19763.5957728,
        'pair': 'XRP_MONA',
        'maxLimit': 19763.5957728,
        'min': 9.63169524,
        'minerFee': 0.2
      },
      {
        'rate': '23.86252495',
        'limit': 817.02120016,
        'pair': 'MONA_XRP',
        'maxLimit': 817.02120016,
        'min': 0.04063827,
        'minerFee': 0.5
      },
      {
        'rate': '1.27374115',
        'limit': 19763.5957728,
        'pair': 'XRP_NXT',
        'maxLimit': 19763.5957728,
        'min': 1.5352381,
        'minerFee': 1
      },
      {
        'rate': '0.76109428',
        'limit': 25628.92110159,
        'pair': 'NXT_XRP',
        'maxLimit': 25628.92110159,
        'min': 1.28466077,
        'minerFee': 0.5
      },
      {
        'rate': '0.89169524',
        'limit': 19763.5957728,
        'pair': 'XRP_POT',
        'maxLimit': 19763.5957728,
        'min': 0.02209524,
        'minerFee': 0.01
      },
      {
        'rate': '1.09537142',
        'limit': 17807.6813861,
        'pair': 'POT_XRP',
        'maxLimit': 17807.6813861,
        'min': 0.89979339,
        'minerFee': 0.5
      },
      {
        'rate': '184.96307142',
        'limit': 19763.5957728,
        'pair': 'XRP_RDD',
        'maxLimit': 19763.5957728,
        'min': 0.00009143,
        'minerFee': 0.01
      },
      {
        'rate': '0.00453028',
        'limit': 4303523.00164188,
        'pair': 'RDD_XRP',
        'maxLimit': 4303523.00164188,
        'min': 186.64285714,
        'minerFee': 0.5
      },
      {
        'rate': '3.45725367',
        'limit': 19763.5957728,
        'pair': 'XRP_START',
        'maxLimit': 19763.5957728,
        'min': 0.00990476,
        'minerFee': 0.02
      },
      {
        'rate': '0.24539047',
        'limit': 79449.65541493,
        'pair': 'START_XRP',
        'maxLimit': 79449.65541493,
        'min': 3.48865154,
        'minerFee': 0.5
      },
      {
        'rate': '0.43785524',
        'limit': 4311.59925839,
        'pair': 'XRP_VRC',
        'maxLimit': 19763.5957728,
        'min': 0.00085775,
        'minerFee': 0.0002
      },
      {
        'rate': '2.12508152',
        'limit': 9174.32510565,
        'pair': 'VRC_XRP',
        'maxLimit': 9174.32510565,
        'min': 0.44160892,
        'minerFee': 0.5
      },
      {
        'rate': '0.04653995',
        'limit': 19763.5957728,
        'pair': 'XRP_VTC',
        'maxLimit': 19763.5957728,
        'min': 0.84416,
        'minerFee': 0.02
      },
      {
        'rate': '20.92461600',
        'limit': 932.20470089,
        'pair': 'VTC_XRP',
        'maxLimit': 932.20470089,
        'min': 0.04696262,
        'minerFee': 0.5
      },
      {
        'rate': '2.57148262',
        'limit': 19763.5957728,
        'pair': 'XRP_VOX',
        'maxLimit': 19763.5957728,
        'min': 0.00742095,
        'minerFee': 0.01
      },
      {
        'rate': '0.36770819',
        'limit': 20936.54867898,
        'pair': 'VOX_XRP',
        'maxLimit': 20936.54867898,
        'min': 2.59483615,
        'minerFee': 0.5
      },
      {
        'rate': '39.23459090',
        'limit': 19763.5957728,
        'pair': 'XRP_SC',
        'maxLimit': 19763.5957728,
        'min': 0.4952381,
        'minerFee': 10
      },
      {
        'rate': '0.02453904',
        'limit': 794496.55414927,
        'pair': 'SC_XRP',
        'maxLimit': 794496.55414927,
        'min': 39.59090909,
        'minerFee': 0.5
      },
      {
        'rate': '0.86344881',
        'limit': 19763.5957728,
        'pair': 'XRP_LBC',
        'maxLimit': 19763.5957728,
        'min': 0.04508952,
        'minerFee': 0.02
      },
      {
        'rate': '1.11709295',
        'limit': 17452.61102389,
        'pair': 'LBC_XRP',
        'maxLimit': 17452.61102389,
        'min': 0.87129043,
        'minerFee': 0.5
      },
      {
        'rate': '0.04411685',
        'limit': 19763.5957728,
        'pair': 'XRP_WAVES',
        'maxLimit': 19763.5957728,
        'min': 0.04440076,
        'minerFee': 0.001
      },
      {
        'rate': '22.00057752',
        'limit': 886.16713604,
        'pair': 'WAVES_XRP',
        'maxLimit': 886.16713604,
        'min': 0.04451751,
        'minerFee': 0.5
      },
      {
        'rate': '0.11520077',
        'limit': 19763.5957728,
        'pair': 'XRP_GAME',
        'maxLimit': 19763.5957728,
        'min': 3.33394286,
        'minerFee': 0.2
      },
      {
        'rate': '8.26401085',
        'limit': 2360.35815255,
        'pair': 'GAME_XRP',
        'maxLimit': 2360.35815255,
        'min': 0.116247,
        'minerFee': 0.5
      },
      {
        'rate': '0.08140212',
        'limit': 19763.5957728,
        'pair': 'XRP_KMD',
        'maxLimit': 19763.5957728,
        'min': 0.04838095,
        'minerFee': 0.002
      },
      {
        'rate': '11.98638095',
        'limit': 1626.52837857,
        'pair': 'KMD_XRP',
        'maxLimit': 1626.52837857,
        'min': 0.0821414,
        'minerFee': 0.5
      },
      {
        'rate': '1.59647533',
        'limit': 19763.5957728,
        'pair': 'XRP_SNGLS',
        'maxLimit': 19763.5957728,
        'min': 3.64571429,
        'minerFee': 3
      },
      {
        'rate': '0.60215047',
        'limit': 32377.60252019,
        'pair': 'SNGLS_XRP',
        'maxLimit': 32377.60252019,
        'min': 1.61097411,
        'minerFee': 0.5
      },
      {
        'rate': '0.69644879',
        'limit': 19763.5957728,
        'pair': 'XRP_GNT',
        'maxLimit': 19763.5957728,
        'min': 0.0278781,
        'minerFee': 0.01
      },
      {
        'rate': '1.38205657',
        'limit': 14113.76770148,
        'pair': 'GNT_XRP',
        'maxLimit': 14113.76770148,
        'min': 0.70241935,
        'minerFee': 0.5
      },
      {
        'rate': '0.13939938',
        'limit': 19763.5957728,
        'pair': 'XRP_SWT',
        'maxLimit': 19763.5957728,
        'min': 1.3072,
        'minerFee': 0.1
      },
      {
        'rate': '6.47717599',
        'limit': 3009.98286529,
        'pair': 'SWT_XRP',
        'maxLimit': 3009.98286529,
        'min': 0.14066537,
        'minerFee': 0.5
      },
      {
        'rate': '0.42900646',
        'limit': 19763.5957728,
        'pair': 'XRP_WINGS',
        'maxLimit': 19763.5957728,
        'min': 0.04479238,
        'minerFee': 0.01
      },
      {
        'rate': '2.21946247',
        'limit': 8784.19391388,
        'pair': 'WINGS_XRP',
        'maxLimit': 8784.19391388,
        'min': 0.43290258,
        'minerFee': 0.5
      },
      {
        'rate': '0.57930268',
        'limit': 19763.5957728,
        'pair': 'XRP_TRST',
        'maxLimit': 19763.5957728,
        'min': 0.03241905,
        'minerFee': 0.01
      },
      {
        'rate': '1.60636380',
        'limit': 12136.84512801,
        'pair': 'TRST_XRP',
        'maxLimit': 12136.84512801,
        'min': 0.58456376,
        'minerFee': 0.5
      },
      {
        'rate': '0.39353844',
        'limit': 19763.5957728,
        'pair': 'XRP_RLC',
        'maxLimit': 19763.5957728,
        'min': 0.0479619,
        'minerFee': 0.01
      },
      {
        'rate': '2.37651238',
        'limit': 8203.69754086,
        'pair': 'RLC_XRP',
        'maxLimit': 8203.69754086,
        'min': 0.39711246,
        'minerFee': 0.5
      },
      {
        'rate': '1.12684203',
        'limit': 8990.37138691,
        'pair': 'XRP_GUP',
        'maxLimit': 8990.37138691,
        'min': 0.01691429,
        'minerFee': 0.01
      },
      {
        'rate': '0.83810285',
        'limit': 6670.4980368,
        'pair': 'GUP_XRP',
        'maxLimit': 6670.4980368,
        'min': 1.13707572,
        'minerFee': 0.5
      },
      {
        'rate': '0.11066166',
        'limit': 19763.5957728,
        'pair': 'XRP_ANT',
        'maxLimit': 19763.5957728,
        'min': 0.1752381,
        'minerFee': 0.01
      },
      {
        'rate': '8.68304761',
        'limit': 2245.31634868,
        'pair': 'ANT_XRP',
        'maxLimit': 2245.31634868,
        'min': 0.11166667,
        'minerFee': 0.5
      },
      {
        'rate': '0.00444165',
        'limit': 19763.5957728,
        'pair': 'XRP_DCR',
        'maxLimit': 19763.5957728,
        'min': 13.25714286,
        'minerFee': 0.03
      },
      {
        'rate': '218.96380952',
        'limit': 89.03840693,
        'pair': 'DCR_XRP',
        'maxLimit': 89.03840693,
        'min': 0.00448199,
        'minerFee': 0.5
      },
      {
        'rate': '1.33616253',
        'limit': 19763.5957728,
        'pair': 'XRP_BAT',
        'maxLimit': 19763.5957728,
        'min': 0.01457524,
        'minerFee': 0.01
      },
      {
        'rate': '0.72220304',
        'limit': 26995.43963393,
        'pair': 'BAT_XRP',
        'maxLimit': 26995.43963393,
        'min': 1.34829721,
        'minerFee': 0.5
      },
      {
        'rate': '0.08929251',
        'limit': 19763.5957728,
        'pair': 'XRP_BNT',
        'maxLimit': 19763.5957728,
        'min': 0.20768,
        'minerFee': 0.01
      },
      {
        'rate': '10.29054400',
        'limit': 1894.57319025,
        'pair': 'BNT_XRP',
        'maxLimit': 1894.57319025,
        'min': 0.09010345,
        'minerFee': 0.5
      },
      {
        'rate': '6.39378518',
        'limit': 19763.5957728,
        'pair': 'XRP_SNT',
        'maxLimit': 19763.5957728,
        'min': 0.89142857,
        'minerFee': 3
      },
      {
        'rate': '0.14723428',
        'limit': 132416.09235821,
        'pair': 'SNT_XRP',
        'maxLimit': 132416.09235821,
        'min': 6.45185185,
        'minerFee': 0.5
      },
      {
        'rate': '0.01611266',
        'limit': 19763.5957728,
        'pair': 'XRP_NMR',
        'maxLimit': 19763.5957728,
        'min': 0.45714286,
        'minerFee': 0.004
      },
      {
        'rate': '56.62857142',
        'limit': 344.28184013,
        'pair': 'NMR_XRP',
        'maxLimit': 344.28184013,
        'min': 0.016259,
        'minerFee': 0.5
      },
      {
        'rate': '0.27876875',
        'limit': 19763.5957728,
        'pair': 'XRP_EDG',
        'maxLimit': 19763.5957728,
        'min': 2.08,
        'minerFee': 0.3
      },
      {
        'rate': '3.43546666',
        'limit': 5674.97538678,
        'pair': 'EDG_XRP',
        'maxLimit': 5674.97538678,
        'min': 0.28130046,
        'minerFee': 0.5
      },
      {
        'rate': '0.70213747',
        'limit': 19763.5957728,
        'pair': 'XRP_CVC',
        'maxLimit': 19763.5957728,
        'min': 0.27459048,
        'minerFee': 0.1
      },
      {
        'rate': '1.36128228',
        'limit': 14329.15538837,
        'pair': 'CVC_XRP',
        'maxLimit': 14329.15538837,
        'min': 0.7085141,
        'minerFee': 0.5
      },
      {
        'rate': '0.04453185',
        'limit': 15536.06824666,
        'pair': 'XRP_MTL',
        'maxLimit': 15536.06824666,
        'min': 0.43590095,
        'minerFee': 0.01
      },
      {
        'rate': '21.59889219',
        'limit': 902.64762672,
        'pair': 'MTL_XRP',
        'maxLimit': 902.64762672,
        'min': 0.04493628,
        'minerFee': 0.5
      },
      {
        'rate': '10.35793199',
        'limit': 19763.5957728,
        'pair': 'XRP_FUN',
        'maxLimit': 19763.5957728,
        'min': 0.00185143,
        'minerFee': 0.01
      },
      {
        'rate': '0.09173828',
        'limit': 212519.65440207,
        'pair': 'FUN_XRP',
        'maxLimit': 212519.65440207,
        'min': 10.452,
        'minerFee': 0.5
      },
      {
        'rate': '5.28465918',
        'limit': 19763.5957728,
        'pair': 'XRP_DNT',
        'maxLimit': 19763.5957728,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.17743619',
        'limit': 109877.18302064,
        'pair': 'DNT_XRP',
        'maxLimit': 109877.18302064,
        'min': 5.33265306,
        'minerFee': 0.5
      },
      {
        'rate': '0.56712286',
        'limit': 19763.5957728,
        'pair': 'XRP_1ST',
        'maxLimit': 19763.5957728,
        'min': 0.03395048,
        'minerFee': 0.01
      },
      {
        'rate': '1.68224609',
        'limit': 11589.37971717,
        'pair': '1ST_XRP',
        'maxLimit': 11589.37971717,
        'min': 0.57227332,
        'minerFee': 0.5
      },
      {
        'rate': '0.05781644',
        'limit': 9885.20804139,
        'pair': 'XRP_SALT',
        'maxLimit': 9885.20804139,
        'min': 1.66582857,
        'minerFee': 0.05
      },
      {
        'rate': '16.50836114',
        'limit': 590.6981482,
        'pair': 'SALT_XRP',
        'maxLimit': 590.6981482,
        'min': 0.05834152,
        'minerFee': 0.5
      },
      {
        'rate': '1.08492022',
        'limit': 19763.5957728,
        'pair': 'XRP_XEM',
        'maxLimit': 19763.5957728,
        'min': 7.24419048,
        'minerFee': 4
      },
      {
        'rate': '0.89737409',
        'limit': 21725.82079079,
        'pair': 'XEM_XRP',
        'maxLimit': 21725.82079079,
        'min': 1.09422111,
        'minerFee': 0.5
      },
      {
        'rate': '1.67821322',
        'limit': 19763.5957728,
        'pair': 'XRP_RCN',
        'maxLimit': 19763.5957728,
        'min': 2.28571429,
        'minerFee': 2
      },
      {
        'rate': '0.56628571',
        'limit': 34428.18401314,
        'pair': 'RCN_XRP',
        'maxLimit': 34428.18401314,
        'min': 1.69345431,
        'minerFee': 0.5
      },
      {
        'rate': '0.12337092',
        'limit': 19763.5957728,
        'pair': 'XRP_NMC',
        'maxLimit': 19763.5957728,
        'min': 0.07291048,
        'minerFee': 0.005
      },
      {
        'rate': '7.22907371',
        'limit': 496.85281567,
        'pair': 'NMC_XRP',
        'maxLimit': 496.85281567,
        'min': 0.12442857,
        'minerFee': 0.5
      },
      {
        'rate': '0.00864951',
        'limit': 19763.5957728,
        'pair': 'XRP_REP',
        'maxLimit': 19763.5957728,
        'min': 2.21277714,
        'minerFee': 0.01
      },
      {
        'rate': '109.69842685',
        'limit': 177.81499661,
        'pair': 'REP_XRP',
        'maxLimit': 177.81499661,
        'min': 0.00872367,
        'minerFee': 0.5
      },
      {
        'rate': '0.00211577',
        'limit': 19763.5957728,
        'pair': 'XRP_GNO',
        'maxLimit': 19763.5957728,
        'min': 9.16663619,
        'minerFee': 0.01
      },
      {
        'rate': '454.43598914',
        'limit': 42.92359291,
        'pair': 'GNO_XRP',
        'maxLimit': 42.92359291,
        'min': 0.00213392,
        'minerFee': 0.5
      },
      {
        'rate': '1.06354248',
        'limit': 19763.5957728,
        'pair': 'XRP_ZRX',
        'maxLimit': 19763.5957728,
        'min': 0.00910476,
        'minerFee': 0.005
      },
      {
        'rate': '0.90273714',
        'limit': 21607.64687017,
        'pair': 'ZRX_XRP',
        'maxLimit': 21607.64687017,
        'min': 1.0726601,
        'minerFee': 0.5
      },
      {
        'rate': '0.71720007',
        'limit': 14.52665992,
        'pair': 'ZEC_ETH',
        'maxLimit': 14.52665992,
        'min': 0.00275319,
        'minerFee': 0.001
      },
      {
        'rate': '1.36627198',
        'limit': 10.50707549,
        'pair': 'ETH_ZEC',
        'maxLimit': 10.50707549,
        'min': 0.00014452,
        'minerFee': 0.0001
      },
      {
        'rate': '12.04210750',
        'limit': 14.52665992,
        'pair': 'ZEC_ETC',
        'maxLimit': 14.52665992,
        'min': 0.0016749,
        'minerFee': 0.01
      },
      {
        'rate': '0.08303312',
        'limit': 172.71490928,
        'pair': 'ETC_ZEC',
        'maxLimit': 172.71490928,
        'min': 0.00242662,
        'minerFee': 0.0001
      },
      {
        'rate': '119.94620274',
        'limit': 14.52665992,
        'pair': 'ZEC_EOS',
        'maxLimit': 14.52665992,
        'min': 0.00065317,
        'minerFee': 0.04
      },
      {
        'rate': '0.00810339',
        'limit': 1771.54389282,
        'pair': 'EOS_ZEC',
        'maxLimit': 1771.54389282,
        'min': 0.02417052,
        'minerFee': 0.0001
      },
      {
        'rate': '36.38077387',
        'limit': 14.52665992,
        'pair': 'ZEC_OMG',
        'maxLimit': 14.52665992,
        'min': 0.00053872,
        'minerFee': 0.01
      },
      {
        'rate': '0.02673417',
        'limit': 536.97270564,
        'pair': 'OMG_ZEC',
        'maxLimit': 536.97270564,
        'min': 0.00734223,
        'minerFee': 0.0001
      },
      {
        'rate': '0.03531892',
        'limit': 14.52665992,
        'pair': 'ZEC_BTC',
        'maxLimit': 14.52665992,
        'min': 0.07002017,
        'minerFee': 0.00125
      },
      {
        'rate': '27.82601389',
        'limit': 0.51642276,
        'pair': 'BTC_ZEC',
        'maxLimit': 0.51642276,
        'min': 0.00000711,
        'minerFee': 0.0001
      },
      {
        'rate': '1005.99800114',
        'limit': 14.52665992,
        'pair': 'ZEC_BLK',
        'maxLimit': 14.52665992,
        'min': 0.00001921,
        'minerFee': 0.01
      },
      {
        'rate': '0.00095175',
        'limit': 15060.44794975,
        'pair': 'BLK_ZEC',
        'maxLimit': 15060.44794975,
        'min': 0.20302684,
        'minerFee': 0.0001
      },
      {
        'rate': '44.33688679',
        'limit': 14.52665992,
        'pair': 'ZEC_CLAM',
        'maxLimit': 14.52665992,
        'min': 0.00004319,
        'minerFee': 0.001
      },
      {
        'rate': '0.02140042',
        'limit': 669.79165287,
        'pair': 'CLAM_ZEC',
        'maxLimit': 669.79165287,
        'min': 0.0089434,
        'minerFee': 0.0001
      },
      {
        'rate': '29130.43388429',
        'limit': 14.52665992,
        'pair': 'ZEC_DGB',
        'maxLimit': 14.52665992,
        'min': 6.7e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00003332',
        'limit': 430352.30016419,
        'pair': 'DGB_ZEC',
        'maxLimit': 430352.30016419,
        'min': 5.87603306,
        'minerFee': 0.0001
      },
      {
        'rate': '167846.78571428',
        'limit': 14.52665992,
        'pair': 'ZEC_DOGE',
        'maxLimit': 14.52665992,
        'min': 0.00002241,
        'minerFee': 2
      },
      {
        'rate': '0.00000555',
        'limit': 2582113.80098513,
        'pair': 'DOGE_ZEC',
        'maxLimit': 2582113.80098513,
        'min': 33.85714286,
        'minerFee': 0.0001
      },
      {
        'rate': '14.27077892',
        'limit': 14.52665992,
        'pair': 'ZEC_FCT',
        'maxLimit': 14.52665992,
        'min': 0.01358598,
        'minerFee': 0.1
      },
      {
        'rate': '0.06731855',
        'limit': 212.92535168,
        'pair': 'FCT_ZEC',
        'maxLimit': 212.92535168,
        'min': 0.00287862,
        'minerFee': 0.0001
      },
      {
        'rate': '54.79097653',
        'limit': 14.52665992,
        'pair': 'ZEC_MONA',
        'maxLimit': 14.52665992,
        'min': 0.00708134,
        'minerFee': 0.2
      },
      {
        'rate': '0.01754400',
        'limit': 817.02120016,
        'pair': 'MONA_ZEC',
        'maxLimit': 817.02120016,
        'min': 0.01105771,
        'minerFee': 0.0001
      },
      {
        'rate': '1732.93141592',
        'limit': 14.52665992,
        'pair': 'ZEC_NXT',
        'maxLimit': 14.52665992,
        'min': 0.00112873,
        'minerFee': 1
      },
      {
        'rate': '0.00055956',
        'limit': 25628.92110159,
        'pair': 'NXT_ZEC',
        'maxLimit': 25628.92110159,
        'min': 0.34955752,
        'minerFee': 0.0001
      },
      {
        'rate': '1213.15599173',
        'limit': 14.52665992,
        'pair': 'ZEC_POT',
        'maxLimit': 14.52665992,
        'min': 0.00001624,
        'minerFee': 0.01
      },
      {
        'rate': '0.00080532',
        'limit': 17807.6813861,
        'pair': 'POT_ZEC',
        'maxLimit': 17807.6813861,
        'min': 0.24483471,
        'minerFee': 0.0001
      },
      {
        'rate': '251643.21428571',
        'limit': 14.52665992,
        'pair': 'ZEC_RDD',
        'maxLimit': 14.52665992,
        'min': 7e-8,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000333',
        'limit': 4303523.00164188,
        'pair': 'RDD_ZEC',
        'maxLimit': 4303523.00164188,
        'min': 50.78571429,
        'minerFee': 0.0001
      },
      {
        'rate': '4703.61148197',
        'limit': 14.52665992,
        'pair': 'ZEC_START',
        'maxLimit': 14.52665992,
        'min': 0.00000728,
        'minerFee': 0.02
      },
      {
        'rate': '0.00018041',
        'limit': 79449.65541493,
        'pair': 'START_ZEC',
        'maxLimit': 79449.65541493,
        'min': 0.94926569,
        'minerFee': 0.0001
      },
      {
        'rate': '595.70432651',
        'limit': 3.16911642,
        'pair': 'ZEC_VRC',
        'maxLimit': 14.52665992,
        'min': 6.3e-7,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00156238',
        'limit': 9174.32510565,
        'pair': 'VRC_ZEC',
        'maxLimit': 9174.32510565,
        'min': 0.12016224,
        'minerFee': 0.0001
      },
      {
        'rate': '63.31784687',
        'limit': 14.52665992,
        'pair': 'ZEC_VTC',
        'maxLimit': 14.52665992,
        'min': 0.00062064,
        'minerFee': 0.02
      },
      {
        'rate': '0.01538402',
        'limit': 932.20470089,
        'pair': 'VTC_ZEC',
        'maxLimit': 932.20470089,
        'min': 0.01277858,
        'minerFee': 0.0001
      },
      {
        'rate': '3498.51539225',
        'limit': 14.52665992,
        'pair': 'ZEC_VOX',
        'maxLimit': 14.52665992,
        'min': 0.00000546,
        'minerFee': 0.01
      },
      {
        'rate': '0.00027034',
        'limit': 20936.54867898,
        'pair': 'VOX_ZEC',
        'maxLimit': 20936.54867898,
        'min': 0.7060576,
        'minerFee': 0.0001
      },
      {
        'rate': '53378.86363636',
        'limit': 14.52665992,
        'pair': 'ZEC_SC',
        'maxLimit': 14.52665992,
        'min': 0.0003641,
        'minerFee': 10
      },
      {
        'rate': '0.00001804',
        'limit': 794496.55414927,
        'pair': 'SC_ZEC',
        'maxLimit': 794496.55414927,
        'min': 10.77272727,
        'minerFee': 0.0001
      },
      {
        'rate': '1174.72657552',
        'limit': 14.52665992,
        'pair': 'ZEC_LBC',
        'maxLimit': 14.52665992,
        'min': 0.00003315,
        'minerFee': 0.02
      },
      {
        'rate': '0.00082129',
        'limit': 17452.61102389,
        'pair': 'LBC_ZEC',
        'maxLimit': 17452.61102389,
        'min': 0.23707903,
        'minerFee': 0.0001
      },
      {
        'rate': '60.02121098',
        'limit': 14.52665992,
        'pair': 'ZEC_WAVES',
        'maxLimit': 14.52665992,
        'min': 0.00003264,
        'minerFee': 0.001
      },
      {
        'rate': '0.01617508',
        'limit': 886.16713604,
        'pair': 'WAVES_ZEC',
        'maxLimit': 886.16713604,
        'min': 0.01211326,
        'minerFee': 0.0001
      },
      {
        'rate': '156.73124833',
        'limit': 14.52665992,
        'pair': 'ZEC_GAME',
        'maxLimit': 14.52665992,
        'min': 0.00245115,
        'minerFee': 0.2
      },
      {
        'rate': '0.00607579',
        'limit': 2360.35815255,
        'pair': 'GAME_ZEC',
        'maxLimit': 2360.35815255,
        'min': 0.03163093,
        'minerFee': 0.0001
      },
      {
        'rate': '110.74801169',
        'limit': 14.52665992,
        'pair': 'ZEC_KMD',
        'maxLimit': 14.52665992,
        'min': 0.00003557,
        'minerFee': 0.002
      },
      {
        'rate': '0.00881252',
        'limit': 1626.52837857,
        'pair': 'KMD_ZEC',
        'maxLimit': 1626.52837857,
        'min': 0.02235076,
        'minerFee': 0.0001
      },
      {
        'rate': '2172.01294697',
        'limit': 14.52665992,
        'pair': 'ZEC_SNGLS',
        'maxLimit': 14.52665992,
        'min': 0.00268037,
        'minerFee': 3
      },
      {
        'rate': '0.00044270',
        'limit': 32377.60252019,
        'pair': 'SNGLS_ZEC',
        'maxLimit': 32377.60252019,
        'min': 0.43834772,
        'minerFee': 0.0001
      },
      {
        'rate': '947.52217741',
        'limit': 14.52665992,
        'pair': 'ZEC_GNT',
        'maxLimit': 14.52665992,
        'min': 0.0000205,
        'minerFee': 0.01
      },
      {
        'rate': '0.00101610',
        'limit': 14113.76770148,
        'pair': 'GNT_ZEC',
        'maxLimit': 14113.76770148,
        'min': 0.19112903,
        'minerFee': 0.0001
      },
      {
        'rate': '189.65358527',
        'limit': 14.52665992,
        'pair': 'ZEC_SWT',
        'maxLimit': 14.52665992,
        'min': 0.00096107,
        'minerFee': 0.1
      },
      {
        'rate': '0.00476209',
        'limit': 3009.98286529,
        'pair': 'SWT_ZEC',
        'maxLimit': 3009.98286529,
        'min': 0.03827519,
        'minerFee': 0.0001
      },
      {
        'rate': '583.66550695',
        'limit': 14.52665992,
        'pair': 'ZEC_WINGS',
        'maxLimit': 14.52665992,
        'min': 0.00003293,
        'minerFee': 0.01
      },
      {
        'rate': '0.00163177',
        'limit': 8784.19391388,
        'pair': 'WINGS_ZEC',
        'maxLimit': 8784.19391388,
        'min': 0.11779324,
        'minerFee': 0.0001
      },
      {
        'rate': '788.14429530',
        'limit': 14.52665992,
        'pair': 'ZEC_TRST',
        'maxLimit': 14.52665992,
        'min': 0.00002383,
        'minerFee': 0.01
      },
      {
        'rate': '0.00118101',
        'limit': 12136.84512801,
        'pair': 'TRST_ZEC',
        'maxLimit': 12136.84512801,
        'min': 0.1590604,
        'minerFee': 0.0001
      },
      {
        'rate': '535.41109422',
        'limit': 14.52665992,
        'pair': 'ZEC_RLC',
        'maxLimit': 14.52665992,
        'min': 0.00003526,
        'minerFee': 0.01
      },
      {
        'rate': '0.00174723',
        'limit': 8203.69754086,
        'pair': 'RLC_ZEC',
        'maxLimit': 8203.69754086,
        'min': 0.10805471,
        'minerFee': 0.0001
      },
      {
        'rate': '1533.07441253',
        'limit': 6.60811264,
        'pair': 'ZEC_GUP',
        'maxLimit': 6.60811264,
        'min': 0.00001244,
        'minerFee': 0.01
      },
      {
        'rate': '0.00061618',
        'limit': 6670.4980368,
        'pair': 'GUP_ZEC',
        'maxLimit': 6670.4980368,
        'min': 0.30939948,
        'minerFee': 0.0001
      },
      {
        'rate': '150.55576923',
        'limit': 14.52665992,
        'pair': 'ZEC_ANT',
        'maxLimit': 14.52665992,
        'min': 0.00012884,
        'minerFee': 0.01
      },
      {
        'rate': '0.00638387',
        'limit': 2245.31634868,
        'pair': 'ANT_ZEC',
        'maxLimit': 2245.31634868,
        'min': 0.03038462,
        'minerFee': 0.0001
      },
      {
        'rate': '6.04289022',
        'limit': 14.52665992,
        'pair': 'ZEC_DCR',
        'maxLimit': 14.52665992,
        'min': 0.00974681,
        'minerFee': 0.03
      },
      {
        'rate': '0.16098476',
        'limit': 89.03840693,
        'pair': 'DCR_ZEC',
        'maxLimit': 89.03840693,
        'min': 0.00121955,
        'minerFee': 0.0001
      },
      {
        'rate': '1817.85603715',
        'limit': 14.52665992,
        'pair': 'ZEC_BAT',
        'maxLimit': 14.52665992,
        'min': 0.00001072,
        'minerFee': 0.01
      },
      {
        'rate': '0.00053097',
        'limit': 26995.43963393,
        'pair': 'BAT_ZEC',
        'maxLimit': 26995.43963393,
        'min': 0.36687307,
        'minerFee': 0.0001
      },
      {
        'rate': '121.48293103',
        'limit': 14.52665992,
        'pair': 'ZEC_BNT',
        'maxLimit': 14.52665992,
        'min': 0.00015269,
        'minerFee': 0.01
      },
      {
        'rate': '0.00756572',
        'limit': 1894.57319025,
        'pair': 'BNT_ZEC',
        'maxLimit': 1894.57319025,
        'min': 0.02451724,
        'minerFee': 0.0001
      },
      {
        'rate': '8698.77777777',
        'limit': 14.52665992,
        'pair': 'ZEC_SNT',
        'maxLimit': 14.52665992,
        'min': 0.00065539,
        'minerFee': 3
      },
      {
        'rate': '0.00010824',
        'limit': 132416.09235821,
        'pair': 'SNT_ZEC',
        'maxLimit': 132416.09235821,
        'min': 1.75555556,
        'minerFee': 0.0001
      },
      {
        'rate': '21.92136817',
        'limit': 14.52665992,
        'pair': 'ZEC_NMR',
        'maxLimit': 14.52665992,
        'min': 0.0003361,
        'minerFee': 0.004
      },
      {
        'rate': '0.04163399',
        'limit': 344.28184013,
        'pair': 'NMR_ZEC',
        'maxLimit': 344.28184013,
        'min': 0.00442409,
        'minerFee': 0.0001
      },
      {
        'rate': '379.26633652',
        'limit': 14.52665992,
        'pair': 'ZEC_EDG',
        'maxLimit': 14.52665992,
        'min': 0.00152924,
        'minerFee': 0.3
      },
      {
        'rate': '0.00252579',
        'limit': 5674.97538678,
        'pair': 'EDG_ZEC',
        'maxLimit': 5674.97538678,
        'min': 0.07654215,
        'minerFee': 0.0001
      },
      {
        'rate': '955.26165943',
        'limit': 14.52665992,
        'pair': 'ZEC_CVC',
        'maxLimit': 14.52665992,
        'min': 0.00020188,
        'minerFee': 0.1
      },
      {
        'rate': '0.00100083',
        'limit': 14329.15538837,
        'pair': 'CVC_ZEC',
        'maxLimit': 14329.15538837,
        'min': 0.19278742,
        'minerFee': 0.0001
      },
      {
        'rate': '60.58582262',
        'limit': 11.41933793,
        'pair': 'ZEC_MTL',
        'maxLimit': 11.41933793,
        'min': 0.00032048,
        'minerFee': 0.01
      },
      {
        'rate': '0.01587975',
        'limit': 902.64762672,
        'pair': 'MTL_ZEC',
        'maxLimit': 902.64762672,
        'min': 0.01222721,
        'minerFee': 0.0001
      },
      {
        'rate': '14092.01999999',
        'limit': 14.52665992,
        'pair': 'ZEC_FUN',
        'maxLimit': 14.52665992,
        'min': 0.00000136,
        'minerFee': 0.01
      },
      {
        'rate': '0.00006744',
        'limit': 212519.65440207,
        'pair': 'FUN_ZEC',
        'maxLimit': 212519.65440207,
        'min': 2.844,
        'minerFee': 0.0001
      },
      {
        'rate': '7189.80612244',
        'limit': 14.52665992,
        'pair': 'ZEC_DNT',
        'maxLimit': 14.52665992,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00013045',
        'limit': 109877.18302064,
        'pair': 'DNT_ZEC',
        'maxLimit': 109877.18302064,
        'min': 1.45102041,
        'minerFee': 0.0001
      },
      {
        'rate': '771.57358738',
        'limit': 14.52665992,
        'pair': 'ZEC_1ST',
        'maxLimit': 14.52665992,
        'min': 0.00002496,
        'minerFee': 0.01
      },
      {
        'rate': '0.00123680',
        'limit': 11589.37971717,
        'pair': '1ST_ZEC',
        'maxLimit': 11589.37971717,
        'min': 0.15571616,
        'minerFee': 0.0001
      },
      {
        'rate': '78.65957399',
        'limit': 7.26583646,
        'pair': 'ZEC_SALT',
        'maxLimit': 7.26583646,
        'min': 0.00122474,
        'minerFee': 0.05
      },
      {
        'rate': '0.01213714',
        'limit': 590.6981482,
        'pair': 'SALT_ZEC',
        'maxLimit': 590.6981482,
        'min': 0.01587479,
        'minerFee': 0.0001
      },
      {
        'rate': '1476.03957286',
        'limit': 14.52665992,
        'pair': 'ZEC_XEM',
        'maxLimit': 14.52665992,
        'min': 0.00532601,
        'minerFee': 4
      },
      {
        'rate': '0.00065975',
        'limit': 21725.82079079,
        'pair': 'XEM_ZEC',
        'maxLimit': 21725.82079079,
        'min': 0.29773869,
        'minerFee': 0.0001
      },
      {
        'rate': '2283.21775761',
        'limit': 14.52665992,
        'pair': 'ZEC_RCN',
        'maxLimit': 14.52665992,
        'min': 0.00168048,
        'minerFee': 2
      },
      {
        'rate': '0.00041633',
        'limit': 34428.18401314,
        'pair': 'RCN_ZEC',
        'maxLimit': 34428.18401314,
        'min': 0.46079067,
        'minerFee': 0.0001
      },
      {
        'rate': '167.84678571',
        'limit': 14.52665992,
        'pair': 'ZEC_NMC',
        'maxLimit': 14.52665992,
        'min': 0.0000536,
        'minerFee': 0.005
      },
      {
        'rate': '0.00531489',
        'limit': 496.85281567,
        'pair': 'NMC_ZEC',
        'maxLimit': 496.85281567,
        'min': 0.03385714,
        'minerFee': 0.0001
      },
      {
        'rate': '11.76771108',
        'limit': 14.52665992,
        'pair': 'ZEC_REP',
        'maxLimit': 14.52665992,
        'min': 0.00162686,
        'minerFee': 0.01
      },
      {
        'rate': '0.08065157',
        'limit': 177.81499661,
        'pair': 'REP_ZEC',
        'maxLimit': 177.81499661,
        'min': 0.00237372,
        'minerFee': 0.0001
      },
      {
        'rate': '2.87852958',
        'limit': 14.52665992,
        'pair': 'ZEC_GNO',
        'maxLimit': 14.52665992,
        'min': 0.00673942,
        'minerFee': 0.01
      },
      {
        'rate': '0.33410667',
        'limit': 42.92359291,
        'pair': 'GNO_ZEC',
        'maxLimit': 42.92359291,
        'min': 0.00058064,
        'minerFee': 0.0001
      },
      {
        'rate': '1446.95504926',
        'limit': 14.52665992,
        'pair': 'ZEC_ZRX',
        'maxLimit': 14.52665992,
        'min': 0.00000669,
        'minerFee': 0.005
      },
      {
        'rate': '0.00066370',
        'limit': 21607.64687017,
        'pair': 'ZRX_ZEC',
        'maxLimit': 21607.64687017,
        'min': 0.29187192,
        'minerFee': 0.0001
      },
      {
        'rate': '16.64893344',
        'limit': 10.50707549,
        'pair': 'ETH_ETC',
        'maxLimit': 10.50707549,
        'min': 0.00121556,
        'minerFee': 0.01
      },
      {
        'rate': '0.06026129',
        'limit': 172.71490928,
        'pair': 'ETC_ETH',
        'maxLimit': 172.71490928,
        'min': 0.03354949,
        'minerFee': 0.001
      },
      {
        'rate': '165.83279507',
        'limit': 10.50707549,
        'pair': 'ETH_EOS',
        'maxLimit': 10.50707549,
        'min': 0.00047404,
        'minerFee': 0.04
      },
      {
        'rate': '0.00588104',
        'limit': 1771.54389282,
        'pair': 'EOS_ETH',
        'maxLimit': 1771.54389282,
        'min': 0.33417188,
        'minerFee': 0.001
      },
      {
        'rate': '50.29859454',
        'limit': 10.50707549,
        'pair': 'ETH_OMG',
        'maxLimit': 10.50707549,
        'min': 0.00039098,
        'minerFee': 0.01
      },
      {
        'rate': '0.01940232',
        'limit': 536.97270564,
        'pair': 'OMG_ETH',
        'maxLimit': 536.97270564,
        'min': 0.10151079,
        'minerFee': 0.001
      },
      {
        'rate': '0.04883052',
        'limit': 10.50707549,
        'pair': 'ETH_BTC',
        'maxLimit': 10.50707549,
        'min': 0.05081714,
        'minerFee': 0.00125
      },
      {
        'rate': '20.19473127',
        'limit': 0.51642276,
        'pair': 'BTC_ETH',
        'maxLimit': 0.51642276,
        'min': 0.0000983,
        'minerFee': 0.001
      },
      {
        'rate': '1390.85237007',
        'limit': 10.50707549,
        'pair': 'ETH_BLK',
        'maxLimit': 10.50707549,
        'min': 0.00001394,
        'minerFee': 0.01
      },
      {
        'rate': '0.00069073',
        'limit': 15060.44794975,
        'pair': 'BLK_ETH',
        'maxLimit': 15060.44794975,
        'min': 2.80696745,
        'minerFee': 0.001
      },
      {
        'rate': '61.29839622',
        'limit': 10.50707549,
        'pair': 'ETH_CLAM',
        'maxLimit': 10.50707549,
        'min': 0.00003134,
        'minerFee': 0.001
      },
      {
        'rate': '0.01553136',
        'limit': 669.79165287,
        'pair': 'CLAM_ETH',
        'maxLimit': 669.79165287,
        'min': 0.1236478,
        'minerFee': 0.001
      },
      {
        'rate': '40274.56611570',
        'limit': 10.50707549,
        'pair': 'ETH_DGB',
        'maxLimit': 10.50707549,
        'min': 4.9e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00002418',
        'limit': 430352.30016419,
        'pair': 'DGB_ETH',
        'maxLimit': 430352.30016419,
        'min': 81.23966942,
        'minerFee': 0.001
      },
      {
        'rate': '232058.21428571',
        'limit': 10.50707549,
        'pair': 'ETH_DOGE',
        'maxLimit': 10.50707549,
        'min': 0.00001626,
        'minerFee': 2
      },
      {
        'rate': '0.00000403',
        'limit': 2582113.80098513,
        'pair': 'DOGE_ETH',
        'maxLimit': 2582113.80098513,
        'min': 468.0952381,
        'minerFee': 0.001
      },
      {
        'rate': '19.73020490',
        'limit': 10.50707549,
        'pair': 'ETH_FCT',
        'maxLimit': 10.50707549,
        'min': 0.00986003,
        'minerFee': 0.1
      },
      {
        'rate': '0.04885644',
        'limit': 212.92535168,
        'pair': 'FCT_ETH',
        'maxLimit': 212.92535168,
        'min': 0.0397987,
        'minerFee': 0.001
      },
      {
        'rate': '75.75180018',
        'limit': 10.50707549,
        'pair': 'ETH_MONA',
        'maxLimit': 10.50707549,
        'min': 0.00513928,
        'minerFee': 0.2
      },
      {
        'rate': '0.01273256',
        'limit': 817.02120016,
        'pair': 'MONA_ETH',
        'maxLimit': 817.02120016,
        'min': 0.15287952,
        'minerFee': 0.001
      },
      {
        'rate': '2395.88126843',
        'limit': 10.50707549,
        'pair': 'ETH_NXT',
        'maxLimit': 10.50707549,
        'min': 0.00081917,
        'minerFee': 1
      },
      {
        'rate': '0.00040610',
        'limit': 25628.92110159,
        'pair': 'NXT_ETH',
        'maxLimit': 25628.92110159,
        'min': 4.83284169,
        'minerFee': 0.001
      },
      {
        'rate': '1677.26067493',
        'limit': 10.50707549,
        'pair': 'ETH_POT',
        'maxLimit': 10.50707549,
        'min': 0.00001179,
        'minerFee': 0.01
      },
      {
        'rate': '0.00058446',
        'limit': 17807.6813861,
        'pair': 'POT_ETH',
        'maxLimit': 17807.6813861,
        'min': 3.38498623,
        'minerFee': 0.001
      },
      {
        'rate': '347911.78571428',
        'limit': 10.50707549,
        'pair': 'ETH_RDD',
        'maxLimit': 10.50707549,
        'min': 5e-8,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000241',
        'limit': 4303523.00164188,
        'pair': 'RDD_ETH',
        'maxLimit': 4303523.00164188,
        'min': 702.14285714,
        'minerFee': 0.001
      },
      {
        'rate': '6503.02403204',
        'limit': 10.50707549,
        'pair': 'ETH_START',
        'maxLimit': 10.50707549,
        'min': 0.00000528,
        'minerFee': 0.02
      },
      {
        'rate': '0.00013093',
        'limit': 79449.65541493,
        'pair': 'START_ETH',
        'maxLimit': 79449.65541493,
        'min': 13.12416555,
        'minerFee': 0.001
      },
      {
        'rate': '823.59683961',
        'limit': 2.29220933,
        'pair': 'ETH_VRC',
        'maxLimit': 10.50707549,
        'min': 4.6e-7,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00113390',
        'limit': 9174.32510565,
        'pair': 'VRC_ETH',
        'maxLimit': 9174.32510565,
        'min': 1.66131486,
        'minerFee': 0.001
      },
      {
        'rate': '87.54070812',
        'limit': 10.50707549,
        'pair': 'ETH_VTC',
        'maxLimit': 10.50707549,
        'min': 0.00045043,
        'minerFee': 0.02
      },
      {
        'rate': '0.01116495',
        'limit': 932.20470089,
        'pair': 'VTC_ETH',
        'maxLimit': 932.20470089,
        'min': 0.17667146,
        'minerFee': 0.001
      },
      {
        'rate': '4836.90665342',
        'limit': 10.50707549,
        'pair': 'ETH_VOX',
        'maxLimit': 10.50707549,
        'min': 0.00000396,
        'minerFee': 0.01
      },
      {
        'rate': '0.00019620',
        'limit': 20936.54867898,
        'pair': 'VOX_ETH',
        'maxLimit': 20936.54867898,
        'min': 9.76166832,
        'minerFee': 0.001
      },
      {
        'rate': '73799.46969696',
        'limit': 10.50707549,
        'pair': 'ETH_SC',
        'maxLimit': 10.50707549,
        'min': 0.00026425,
        'minerFee': 10
      },
      {
        'rate': '0.00001309',
        'limit': 794496.55414927,
        'pair': 'SC_ETH',
        'maxLimit': 794496.55414927,
        'min': 148.93939394,
        'minerFee': 0.001
      },
      {
        'rate': '1624.12970990',
        'limit': 10.50707549,
        'pair': 'ETH_LBC',
        'maxLimit': 10.50707549,
        'min': 0.00002406,
        'minerFee': 0.02
      },
      {
        'rate': '0.00059605',
        'limit': 17452.61102389,
        'pair': 'LBC_ETH',
        'maxLimit': 17452.61102389,
        'min': 3.27775925,
        'minerFee': 0.001
      },
      {
        'rate': '82.98291195',
        'limit': 10.50707549,
        'pair': 'ETH_WAVES',
        'maxLimit': 10.50707549,
        'min': 0.00002369,
        'minerFee': 0.001
      },
      {
        'rate': '0.01173906',
        'limit': 886.16713604,
        'pair': 'WAVES_ETH',
        'maxLimit': 886.16713604,
        'min': 0.16747308,
        'minerFee': 0.001
      },
      {
        'rate': '216.69031942',
        'limit': 10.50707549,
        'pair': 'ETH_GAME',
        'maxLimit': 10.50707549,
        'min': 0.00177893,
        'minerFee': 0.2
      },
      {
        'rate': '0.00440951',
        'limit': 2360.35815255,
        'pair': 'GAME_ETH',
        'maxLimit': 2360.35815255,
        'min': 0.43731649,
        'minerFee': 0.001
      },
      {
        'rate': '153.11574612',
        'limit': 10.50707549,
        'pair': 'ETH_KMD',
        'maxLimit': 10.50707549,
        'min': 0.00002582,
        'minerFee': 0.002
      },
      {
        'rate': '0.00639569',
        'limit': 1626.52837857,
        'pair': 'KMD_ETH',
        'maxLimit': 1626.52837857,
        'min': 0.30901261,
        'minerFee': 0.001
      },
      {
        'rate': '3002.93773119',
        'limit': 10.50707549,
        'pair': 'ETH_SNGLS',
        'maxLimit': 10.50707549,
        'min': 0.00194528,
        'minerFee': 3
      },
      {
        'rate': '0.00032129',
        'limit': 32377.60252019,
        'pair': 'SNGLS_ETH',
        'maxLimit': 32377.60252019,
        'min': 6.06041924,
        'minerFee': 0.001
      },
      {
        'rate': '1310.00604838',
        'limit': 10.50707549,
        'pair': 'ETH_GNT',
        'maxLimit': 10.50707549,
        'min': 0.00001488,
        'minerFee': 0.01
      },
      {
        'rate': '0.00073743',
        'limit': 14113.76770148,
        'pair': 'GNT_ETH',
        'maxLimit': 14113.76770148,
        'min': 2.64247312,
        'minerFee': 0.001
      },
      {
        'rate': '262.20741817',
        'limit': 10.50707549,
        'pair': 'ETH_SWT',
        'maxLimit': 10.50707549,
        'min': 0.0006975,
        'minerFee': 0.1
      },
      {
        'rate': '0.00345609',
        'limit': 3009.98286529,
        'pair': 'SWT_ETH',
        'maxLimit': 3009.98286529,
        'min': 0.52917743,
        'minerFee': 0.001
      },
      {
        'rate': '806.95245195',
        'limit': 10.50707549,
        'pair': 'ETH_WINGS',
        'maxLimit': 10.50707549,
        'min': 0.0000239,
        'minerFee': 0.01
      },
      {
        'rate': '0.00118426',
        'limit': 8784.19391388,
        'pair': 'WINGS_ETH',
        'maxLimit': 8784.19391388,
        'min': 1.62856196,
        'minerFee': 0.001
      },
      {
        'rate': '1089.65659955',
        'limit': 10.50707549,
        'pair': 'ETH_TRST',
        'maxLimit': 10.50707549,
        'min': 0.0000173,
        'minerFee': 0.01
      },
      {
        'rate': '0.00085712',
        'limit': 12136.84512801,
        'pair': 'TRST_ETH',
        'maxLimit': 12136.84512801,
        'min': 2.19910515,
        'minerFee': 0.001
      },
      {
        'rate': '740.23784194',
        'limit': 10.50707549,
        'pair': 'ETH_RLC',
        'maxLimit': 10.50707549,
        'min': 0.00002559,
        'minerFee': 0.01
      },
      {
        'rate': '0.00126805',
        'limit': 8203.69754086,
        'pair': 'RLC_ETH',
        'maxLimit': 8203.69754086,
        'min': 1.49392097,
        'minerFee': 0.001
      },
      {
        'rate': '2119.56701479',
        'limit': 4.77962165,
        'pair': 'ETH_GUP',
        'maxLimit': 4.77962165,
        'min': 0.00000903,
        'minerFee': 0.01
      },
      {
        'rate': '0.00044719',
        'limit': 6670.4980368,
        'pair': 'GUP_ETH',
        'maxLimit': 6670.4980368,
        'min': 4.27763272,
        'minerFee': 0.001
      },
      {
        'rate': '208.15235042',
        'limit': 10.50707549,
        'pair': 'ETH_ANT',
        'maxLimit': 10.50707549,
        'min': 0.0000935,
        'minerFee': 0.01
      },
      {
        'rate': '0.00463310',
        'limit': 2245.31634868,
        'pair': 'ANT_ETH',
        'maxLimit': 2245.31634868,
        'min': 0.42008547,
        'minerFee': 0.001
      },
      {
        'rate': '8.35465694',
        'limit': 10.50707549,
        'pair': 'ETH_DCR',
        'maxLimit': 10.50707549,
        'min': 0.00707375,
        'minerFee': 0.03
      },
      {
        'rate': '0.11683470',
        'limit': 89.03840693,
        'pair': 'DCR_ETH',
        'maxLimit': 89.03840693,
        'min': 0.01686106,
        'minerFee': 0.001
      },
      {
        'rate': '2513.29463364',
        'limit': 10.50707549,
        'pair': 'ETH_BAT',
        'maxLimit': 10.50707549,
        'min': 0.00000778,
        'minerFee': 0.01
      },
      {
        'rate': '0.00038535',
        'limit': 26995.43963393,
        'pair': 'BAT_ETH',
        'maxLimit': 26995.43963393,
        'min': 5.07223942,
        'minerFee': 0.001
      },
      {
        'rate': '167.95741379',
        'limit': 10.50707549,
        'pair': 'ETH_BNT',
        'maxLimit': 10.50707549,
        'min': 0.00011081,
        'minerFee': 0.01
      },
      {
        'rate': '0.00549082',
        'limit': 1894.57319025,
        'pair': 'BNT_ETH',
        'maxLimit': 1894.57319025,
        'min': 0.33896552,
        'minerFee': 0.001
      },
      {
        'rate': '12026.58024691',
        'limit': 10.50707549,
        'pair': 'ETH_SNT',
        'maxLimit': 10.50707549,
        'min': 0.00047565,
        'minerFee': 3
      },
      {
        'rate': '0.00007856',
        'limit': 132416.09235821,
        'pair': 'SNT_ETH',
        'maxLimit': 132416.09235821,
        'min': 24.27160494,
        'minerFee': 0.001
      },
      {
        'rate': '30.30760184',
        'limit': 10.50707549,
        'pair': 'ETH_NMR',
        'maxLimit': 10.50707549,
        'min': 0.00024392,
        'minerFee': 0.004
      },
      {
        'rate': '0.03021587',
        'limit': 344.28184013,
        'pair': 'NMR_ETH',
        'maxLimit': 344.28184013,
        'min': 0.06116569,
        'minerFee': 0.001
      },
      {
        'rate': '524.35838088',
        'limit': 10.50707549,
        'pair': 'ETH_EDG',
        'maxLimit': 10.50707549,
        'min': 0.00110985,
        'minerFee': 0.3
      },
      {
        'rate': '0.00183309',
        'limit': 5674.97538678,
        'pair': 'EDG_ETH',
        'maxLimit': 5674.97538678,
        'min': 1.05824093,
        'minerFee': 0.001
      },
      {
        'rate': '1320.70634490',
        'limit': 10.50707549,
        'pair': 'ETH_CVC',
        'maxLimit': 10.50707549,
        'min': 0.00014652,
        'minerFee': 0.1
      },
      {
        'rate': '0.00072635',
        'limit': 14329.15538837,
        'pair': 'CVC_ETH',
        'maxLimit': 14329.15538837,
        'min': 2.6654013,
        'minerFee': 0.001
      },
      {
        'rate': '83.76352129',
        'limit': 8.25956182,
        'pair': 'ETH_MTL',
        'maxLimit': 8.25956182,
        'min': 0.00023259,
        'minerFee': 0.01
      },
      {
        'rate': '0.01152473',
        'limit': 902.64762672,
        'pair': 'MTL_ETH',
        'maxLimit': 902.64762672,
        'min': 0.16904848,
        'minerFee': 0.001
      },
      {
        'rate': '19483.05999999',
        'limit': 10.50707549,
        'pair': 'ETH_FUN',
        'maxLimit': 10.50707549,
        'min': 9.9e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00004894',
        'limit': 212519.65440207,
        'pair': 'FUN_ETH',
        'maxLimit': 212519.65440207,
        'min': 39.32,
        'minerFee': 0.001
      },
      {
        'rate': '9940.33673469',
        'limit': 10.50707549,
        'pair': 'ETH_DNT',
        'maxLimit': 10.50707549,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00009467',
        'limit': 109877.18302064,
        'pair': 'DNT_ETH',
        'maxLimit': 109877.18302064,
        'min': 20.06122449,
        'minerFee': 0.001
      },
      {
        'rate': '1066.74660534',
        'limit': 10.50707549,
        'pair': 'ETH_1ST',
        'maxLimit': 10.50707549,
        'min': 0.00001812,
        'minerFee': 0.01
      },
      {
        'rate': '0.00089761',
        'limit': 11589.37971717,
        'pair': '1ST_ETH',
        'maxLimit': 11589.37971717,
        'min': 2.15286903,
        'minerFee': 0.001
      },
      {
        'rate': '108.75156291',
        'limit': 5.25535068,
        'pair': 'ETH_SALT',
        'maxLimit': 5.25535068,
        'min': 0.00088885,
        'minerFee': 0.05
      },
      {
        'rate': '0.00880853',
        'limit': 590.6981482,
        'pair': 'SALT_ETH',
        'maxLimit': 590.6981482,
        'min': 0.21947843,
        'minerFee': 0.001
      },
      {
        'rate': '2040.71293969',
        'limit': 10.50707549,
        'pair': 'ETH_XEM',
        'maxLimit': 10.50707549,
        'min': 0.00386535,
        'minerFee': 4
      },
      {
        'rate': '0.00047882',
        'limit': 21725.82079079,
        'pair': 'XEM_ETH',
        'maxLimit': 21725.82079079,
        'min': 4.11641541,
        'minerFee': 0.001
      },
      {
        'rate': '3156.68502916',
        'limit': 10.50707549,
        'pair': 'ETH_RCN',
        'maxLimit': 10.50707549,
        'min': 0.00121961,
        'minerFee': 2
      },
      {
        'rate': '0.00030215',
        'limit': 34428.18401314,
        'pair': 'RCN_ETH',
        'maxLimit': 34428.18401314,
        'min': 6.37070642,
        'minerFee': 0.001
      },
      {
        'rate': '232.05821428',
        'limit': 10.50707549,
        'pair': 'ETH_NMC',
        'maxLimit': 10.50707549,
        'min': 0.0000389,
        'minerFee': 0.005
      },
      {
        'rate': '0.00385728',
        'limit': 496.85281567,
        'pair': 'NMC_ETH',
        'maxLimit': 496.85281567,
        'min': 0.46809524,
        'minerFee': 0.001
      },
      {
        'rate': '16.26956398',
        'limit': 10.50707549,
        'pair': 'ETH_REP',
        'maxLimit': 10.50707549,
        'min': 0.00118069,
        'minerFee': 0.01
      },
      {
        'rate': '0.05853288',
        'limit': 177.81499661,
        'pair': 'REP_ETH',
        'maxLimit': 177.81499661,
        'min': 0.03281808,
        'minerFee': 0.001
      },
      {
        'rate': '3.97973920',
        'limit': 10.50707549,
        'pair': 'ETH_GNO',
        'maxLimit': 10.50707549,
        'min': 0.00489113,
        'minerFee': 0.01
      },
      {
        'rate': '0.24247793',
        'limit': 42.92359291,
        'pair': 'GNO_ETH',
        'maxLimit': 42.92359291,
        'min': 0.00802771,
        'minerFee': 0.001
      },
      {
        'rate': '2000.50184729',
        'limit': 10.50707549,
        'pair': 'ETH_ZRX',
        'maxLimit': 10.50707549,
        'min': 0.00000486,
        'minerFee': 0.005
      },
      {
        'rate': '0.00048168',
        'limit': 21607.64687017,
        'pair': 'ZRX_ETH',
        'maxLimit': 21607.64687017,
        'min': 4.03530378,
        'minerFee': 0.001
      },
      {
        'rate': '10.07823886',
        'limit': 172.71490928,
        'pair': 'ETC_EOS',
        'maxLimit': 172.71490928,
        'min': 0.00795932,
        'minerFee': 0.04
      },
      {
        'rate': '0.09874528',
        'limit': 1771.54389282,
        'pair': 'EOS_ETC',
        'maxLimit': 1771.54389282,
        'min': 0.20329277,
        'minerFee': 0.01
      },
      {
        'rate': '3.05681681',
        'limit': 172.77451137,
        'pair': 'ETC_OMG',
        'maxLimit': 172.77451137,
        'min': 0.00656471,
        'minerFee': 0.01
      },
      {
        'rate': '0.32577372',
        'limit': 536.97270564,
        'pair': 'OMG_ETC',
        'maxLimit': 536.97270564,
        'min': 0.06175388,
        'minerFee': 0.01
      },
      {
        'rate': '0.00296760',
        'limit': 172.77451137,
        'pair': 'ETC_BTC',
        'maxLimit': 172.77451137,
        'min': 0.85324232,
        'minerFee': 0.00125
      },
      {
        'rate': '339.07849829',
        'limit': 0.51642276,
        'pair': 'BTC_ETC',
        'maxLimit': 0.51642276,
        'min': 0.0000598,
        'minerFee': 0.01
      },
      {
        'rate': '84.52683323',
        'limit': 172.77451137,
        'pair': 'ETC_BLK',
        'maxLimit': 172.77451137,
        'min': 0.00023406,
        'minerFee': 0.01
      },
      {
        'rate': '0.01159774',
        'limit': 15060.44794975,
        'pair': 'BLK_ETC',
        'maxLimit': 15060.44794975,
        'min': 1.70761279,
        'minerFee': 0.01
      },
      {
        'rate': '3.72531410',
        'limit': 172.77451137,
        'pair': 'ETC_CLAM',
        'maxLimit': 172.77451137,
        'min': 0.00052629,
        'minerFee': 0.001
      },
      {
        'rate': '0.26077843',
        'limit': 669.79165287,
        'pair': 'CLAM_ETC',
        'maxLimit': 669.79165287,
        'min': 0.07522088,
        'minerFee': 0.01
      },
      {
        'rate': '2447.62373140',
        'limit': 172.77451137,
        'pair': 'ETC_DGB',
        'maxLimit': 172.77451137,
        'min': 0.00000819,
        'minerFee': 0.01
      },
      {
        'rate': '0.00040607',
        'limit': 430352.30016419,
        'pair': 'DGB_ETC',
        'maxLimit': 430352.30016419,
        'min': 49.42198347,
        'minerFee': 0.01
      },
      {
        'rate': '14102.97483333',
        'limit': 172.77451137,
        'pair': 'ETC_DOGE',
        'maxLimit': 172.77451137,
        'min': 0.00027304,
        'minerFee': 2
      },
      {
        'rate': '0.00006767',
        'limit': 2582113.80098513,
        'pair': 'DOGE_ETC',
        'maxLimit': 2582113.80098513,
        'min': 284.7647619,
        'minerFee': 0.01
      },
      {
        'rate': '1.19907232',
        'limit': 172.77451137,
        'pair': 'ETC_FCT',
        'maxLimit': 172.77451137,
        'min': 0.16555427,
        'minerFee': 0.1
      },
      {
        'rate': '0.82032138',
        'limit': 212.92535168,
        'pair': 'FCT_ETC',
        'maxLimit': 212.92535168,
        'min': 0.02421146,
        'minerFee': 0.01
      },
      {
        'rate': '4.60369476',
        'limit': 172.77451137,
        'pair': 'ETC_MONA',
        'maxLimit': 172.77451137,
        'min': 0.08629078,
        'minerFee': 0.2
      },
      {
        'rate': '0.21378541',
        'limit': 817.02120016,
        'pair': 'MONA_ETC',
        'maxLimit': 817.02120016,
        'min': 0.09300393,
        'minerFee': 0.01
      },
      {
        'rate': '145.60593485',
        'limit': 172.77451137,
        'pair': 'ETC_NXT',
        'maxLimit': 172.77451137,
        'min': 0.01375427,
        'minerFee': 1
      },
      {
        'rate': '0.00681867',
        'limit': 25628.92110159,
        'pair': 'NXT_ETC',
        'maxLimit': 25628.92110159,
        'min': 2.94004916,
        'minerFee': 0.01
      },
      {
        'rate': '101.93284090',
        'limit': 172.77451137,
        'pair': 'ETC_POT',
        'maxLimit': 172.77451137,
        'min': 0.00019795,
        'minerFee': 0.01
      },
      {
        'rate': '0.00981348',
        'limit': 17807.6813861,
        'pair': 'POT_ETC',
        'maxLimit': 17807.6813861,
        'min': 2.05924931,
        'minerFee': 0.01
      },
      {
        'rate': '21143.78357142',
        'limit': 172.77451137,
        'pair': 'ETC_RDD',
        'maxLimit': 172.77451137,
        'min': 8.2e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00004058',
        'limit': 4303523.00164188,
        'pair': 'RDD_ETC',
        'maxLimit': 4303523.00164188,
        'min': 427.14714286,
        'minerFee': 0.01
      },
      {
        'rate': '395.21090787',
        'limit': 172.77451137,
        'pair': 'ETC_START',
        'maxLimit': 172.77451137,
        'min': 0.00008874,
        'minerFee': 0.02
      },
      {
        'rate': '0.00219846',
        'limit': 79449.65541493,
        'pair': 'START_ETC',
        'maxLimit': 79449.65541493,
        'min': 7.98405874,
        'minerFee': 0.01
      },
      {
        'rate': '50.05280910',
        'limit': 37.67925025,
        'pair': 'ETC_VRC',
        'maxLimit': 172.77451137,
        'min': 0.00000768,
        'minerFee': 0.0002
      },
      {
        'rate': '0.01903869',
        'limit': 9174.32510565,
        'pair': 'VRC_ETC',
        'maxLimit': 9174.32510565,
        'min': 1.01065743,
        'minerFee': 0.01
      },
      {
        'rate': '5.32014683',
        'limit': 172.77451137,
        'pair': 'ETC_VTC',
        'maxLimit': 172.77451137,
        'min': 0.00756287,
        'minerFee': 0.02
      },
      {
        'rate': '0.18746456',
        'limit': 932.20470089,
        'pair': 'VTC_ETC',
        'maxLimit': 932.20470089,
        'min': 0.10747771,
        'minerFee': 0.01
      },
      {
        'rate': '293.95528301',
        'limit': 172.77451137,
        'pair': 'ETC_VOX',
        'maxLimit': 172.77451137,
        'min': 0.00006648,
        'minerFee': 0.01
      },
      {
        'rate': '0.00329431',
        'limit': 20936.54867898,
        'pair': 'VOX_ETC',
        'maxLimit': 20936.54867898,
        'min': 5.93849057,
        'minerFee': 0.01
      },
      {
        'rate': '4485.04500000',
        'limit': 172.77451137,
        'pair': 'ETC_SC',
        'maxLimit': 172.77451137,
        'min': 0.00443686,
        'minerFee': 10
      },
      {
        'rate': '0.00021984',
        'limit': 794496.55414927,
        'pair': 'SC_ETC',
        'maxLimit': 794496.55414927,
        'min': 90.6069697,
        'minerFee': 0.01
      },
      {
        'rate': '98.70389129',
        'limit': 172.77451137,
        'pair': 'ETC_LBC',
        'maxLimit': 172.77451137,
        'min': 0.00040396,
        'minerFee': 0.02
      },
      {
        'rate': '0.01000808',
        'limit': 17452.61102389,
        'pair': 'LBC_ETC',
        'maxLimit': 17452.61102389,
        'min': 1.99401801,
        'minerFee': 0.01
      },
      {
        'rate': '5.04315404',
        'limit': 172.77451137,
        'pair': 'ETC_WAVES',
        'maxLimit': 172.77451137,
        'min': 0.00039779,
        'minerFee': 0.001
      },
      {
        'rate': '0.19710415',
        'limit': 886.16713604,
        'pair': 'WAVES_ETC',
        'maxLimit': 886.16713604,
        'min': 0.1018819,
        'minerFee': 0.01
      },
      {
        'rate': '13.16900836',
        'limit': 172.77451137,
        'pair': 'ETC_GAME',
        'maxLimit': 172.77451137,
        'min': 0.02986894,
        'minerFee': 0.2
      },
      {
        'rate': '0.07403763',
        'limit': 2360.35815255,
        'pair': 'GAME_ETC',
        'maxLimit': 2360.35815255,
        'min': 0.26604057,
        'minerFee': 0.01
      },
      {
        'rate': '9.30536512',
        'limit': 172.77451137,
        'pair': 'ETC_KMD',
        'maxLimit': 172.77451137,
        'min': 0.00043345,
        'minerFee': 0.002
      },
      {
        'rate': '0.10738651',
        'limit': 1626.52837857,
        'pair': 'KMD_ETC',
        'maxLimit': 1626.52837857,
        'min': 0.18798717,
        'minerFee': 0.01
      },
      {
        'rate': '182.49874845',
        'limit': 172.77451137,
        'pair': 'ETC_SNGLS',
        'maxLimit': 172.77451137,
        'min': 0.03266212,
        'minerFee': 3
      },
      {
        'rate': '0.00539469',
        'limit': 32377.60252019,
        'pair': 'SNGLS_ETC',
        'maxLimit': 32377.60252019,
        'min': 3.6868434,
        'minerFee': 0.01
      },
      {
        'rate': '79.61356760',
        'limit': 172.77451137,
        'pair': 'ETC_GNT',
        'maxLimit': 172.77451137,
        'min': 0.00024976,
        'minerFee': 0.01
      },
      {
        'rate': '0.01238190',
        'limit': 14113.76770148,
        'pair': 'GNT_ETC',
        'maxLimit': 14113.76770148,
        'min': 1.60754301,
        'minerFee': 0.01
      },
      {
        'rate': '15.93523740',
        'limit': 172.77451137,
        'pair': 'ETC_SWT',
        'maxLimit': 172.77451137,
        'min': 0.01171126,
        'minerFee': 0.1
      },
      {
        'rate': '0.05802930',
        'limit': 3009.98286529,
        'pair': 'SWT_ETC',
        'maxLimit': 3009.98286529,
        'min': 0.32192399,
        'minerFee': 0.01
      },
      {
        'rate': '49.04124751',
        'limit': 172.77451137,
        'pair': 'ETC_WINGS',
        'maxLimit': 172.77451137,
        'min': 0.0004013,
        'minerFee': 0.01
      },
      {
        'rate': '0.01988426',
        'limit': 8784.19391388,
        'pair': 'WINGS_ETC',
        'maxLimit': 8784.19391388,
        'min': 0.99073227,
        'minerFee': 0.01
      },
      {
        'rate': '66.22214093',
        'limit': 172.77451137,
        'pair': 'ETC_TRST',
        'maxLimit': 172.77451137,
        'min': 0.00029044,
        'minerFee': 0.01
      },
      {
        'rate': '0.01439148',
        'limit': 12136.84512801,
        'pair': 'TRST_ETC',
        'maxLimit': 12136.84512801,
        'min': 1.33782103,
        'minerFee': 0.01
      },
      {
        'rate': '44.98677355',
        'limit': 172.77451137,
        'pair': 'ETC_RLC',
        'maxLimit': 172.77451137,
        'min': 0.00042969,
        'minerFee': 0.01
      },
      {
        'rate': '0.02129127',
        'limit': 8203.69754086,
        'pair': 'RLC_ETC',
        'maxLimit': 8203.69754086,
        'min': 0.90882371,
        'minerFee': 0.01
      },
      {
        'rate': '128.81330287',
        'limit': 78.56723991,
        'pair': 'ETC_GUP',
        'maxLimit': 78.56723991,
        'min': 0.00015154,
        'minerFee': 0.01
      },
      {
        'rate': '0.00750860',
        'limit': 6670.4980368,
        'pair': 'GUP_ETC',
        'maxLimit': 6670.4980368,
        'min': 2.60228895,
        'minerFee': 0.01
      },
      {
        'rate': '12.65012692',
        'limit': 172.77451137,
        'pair': 'ETC_ANT',
        'maxLimit': 172.77451137,
        'min': 0.00156997,
        'minerFee': 0.01
      },
      {
        'rate': '0.07779180',
        'limit': 2245.31634868,
        'pair': 'ANT_ETC',
        'maxLimit': 2245.31634868,
        'min': 0.25555812,
        'minerFee': 0.01
      },
      {
        'rate': '0.50774094',
        'limit': 172.77451137,
        'pair': 'ETC_DCR',
        'maxLimit': 172.77451137,
        'min': 0.11877133,
        'minerFee': 0.03
      },
      {
        'rate': '1.96170648',
        'limit': 89.03840693,
        'pair': 'DCR_ETC',
        'maxLimit': 89.03840693,
        'min': 0.01025739,
        'minerFee': 0.01
      },
      {
        'rate': '152.74147058',
        'limit': 172.77451137,
        'pair': 'ETC_BAT',
        'maxLimit': 172.77451137,
        'min': 0.00013058,
        'minerFee': 0.01
      },
      {
        'rate': '0.00647024',
        'limit': 26995.43963393,
        'pair': 'BAT_ETC',
        'maxLimit': 26995.43963393,
        'min': 3.08568627,
        'minerFee': 0.01
      },
      {
        'rate': '10.20734379',
        'limit': 172.77451137,
        'pair': 'ETC_BNT',
        'maxLimit': 172.77451137,
        'min': 0.00186061,
        'minerFee': 0.01
      },
      {
        'rate': '0.09219344',
        'limit': 1894.57319025,
        'pair': 'BNT_ETC',
        'maxLimit': 1894.57319025,
        'min': 0.20620897,
        'minerFee': 0.01
      },
      {
        'rate': '730.89622222',
        'limit': 172.77451137,
        'pair': 'ETC_SNT',
        'maxLimit': 172.77451137,
        'min': 0.00798635,
        'minerFee': 3
      },
      {
        'rate': '0.00131907',
        'limit': 132416.09235821,
        'pair': 'SNT_ETC',
        'maxLimit': 132416.09235821,
        'min': 14.76558025,
        'minerFee': 0.01
      },
      {
        'rate': '1.84189613',
        'limit': 172.77451137,
        'pair': 'ETC_NMR',
        'maxLimit': 172.77451137,
        'min': 0.00409556,
        'minerFee': 0.004
      },
      {
        'rate': '0.50733788',
        'limit': 344.28184013,
        'pair': 'NMR_ETC',
        'maxLimit': 344.28184013,
        'min': 0.03721002,
        'minerFee': 0.01
      },
      {
        'rate': '31.86704381',
        'limit': 172.77451137,
        'pair': 'ETC_EDG',
        'maxLimit': 172.77451137,
        'min': 0.01863481,
        'minerFee': 0.3
      },
      {
        'rate': '0.03077849',
        'limit': 5674.97538678,
        'pair': 'EDG_ETC',
        'maxLimit': 5674.97538678,
        'min': 0.64377866,
        'minerFee': 0.01
      },
      {
        'rate': '80.26382049',
        'limit': 172.77451137,
        'pair': 'ETC_CVC',
        'maxLimit': 172.77451137,
        'min': 0.00246007,
        'minerFee': 0.1
      },
      {
        'rate': '0.01219578',
        'limit': 14329.15538837,
        'pair': 'CVC_ETC',
        'maxLimit': 14329.15538837,
        'min': 1.62149132,
        'minerFee': 0.01
      },
      {
        'rate': '5.09059433',
        'limit': 135.77036461,
        'pair': 'ETC_MTL',
        'maxLimit': 135.77036461,
        'min': 0.00390526,
        'minerFee': 0.01
      },
      {
        'rate': '0.19350543',
        'limit': 902.64762672,
        'pair': 'MTL_ETC',
        'maxLimit': 902.64762672,
        'min': 0.10284029,
        'minerFee': 0.01
      },
      {
        'rate': '1184.05187999',
        'limit': 172.77451137,
        'pair': 'ETC_FUN',
        'maxLimit': 172.77451137,
        'min': 0.00001659,
        'minerFee': 0.01
      },
      {
        'rate': '0.00082188',
        'limit': 212519.65440207,
        'pair': 'FUN_ETC',
        'maxLimit': 212519.65440207,
        'min': 23.92024,
        'minerFee': 0.01
      },
      {
        'rate': '604.10810204',
        'limit': 172.77451137,
        'pair': 'ETC_DNT',
        'maxLimit': 172.77451137,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00158965',
        'limit': 109877.18302064,
        'pair': 'DNT_ETC',
        'maxLimit': 109877.18302064,
        'min': 12.20420408,
        'minerFee': 0.01
      },
      {
        'rate': '64.82982260',
        'limit': 172.77451137,
        'pair': 'ETC_1ST',
        'maxLimit': 172.77451137,
        'min': 0.00030416,
        'minerFee': 0.01
      },
      {
        'rate': '0.01507131',
        'limit': 11589.37971717,
        'pair': '1ST_ETC',
        'maxLimit': 11589.37971717,
        'min': 1.30969339,
        'minerFee': 0.01
      },
      {
        'rate': '6.60920268',
        'limit': 86.38725569,
        'pair': 'ETC_SALT',
        'maxLimit': 86.38725569,
        'min': 0.01492423,
        'minerFee': 0.05
      },
      {
        'rate': '0.14789913',
        'limit': 590.6981482,
        'pair': 'SALT_ETC',
        'maxLimit': 590.6981482,
        'min': 0.13351925,
        'minerFee': 0.01
      },
      {
        'rate': '124.02113546',
        'limit': 172.77451137,
        'pair': 'ETC_XEM',
        'maxLimit': 172.77451137,
        'min': 0.06490102,
        'minerFee': 4
      },
      {
        'rate': '0.00803961',
        'limit': 21725.82079079,
        'pair': 'XEM_ETC',
        'maxLimit': 21725.82079079,
        'min': 2.50421273,
        'minerFee': 0.01
      },
      {
        'rate': '191.84249513',
        'limit': 172.77451137,
        'pair': 'ETC_RCN',
        'maxLimit': 172.77451137,
        'min': 0.02047782,
        'minerFee': 2
      },
      {
        'rate': '0.00507337',
        'limit': 34428.18401314,
        'pair': 'RCN_ETC',
        'maxLimit': 34428.18401314,
        'min': 3.87560596,
        'minerFee': 0.01
      },
      {
        'rate': '14.10297483',
        'limit': 172.77451137,
        'pair': 'ETC_NMC',
        'maxLimit': 172.77451137,
        'min': 0.00065321,
        'minerFee': 0.005
      },
      {
        'rate': '0.06476559',
        'limit': 496.85281567,
        'pair': 'NMC_ETC',
        'maxLimit': 496.85281567,
        'min': 0.28476476,
        'minerFee': 0.01
      },
      {
        'rate': '0.98875729',
        'limit': 172.77451137,
        'pair': 'ETC_REP',
        'maxLimit': 172.77451137,
        'min': 0.01982437,
        'minerFee': 0.01
      },
      {
        'rate': '0.98279307',
        'limit': 177.81499661,
        'pair': 'REP_ETC',
        'maxLimit': 177.81499661,
        'min': 0.01996481,
        'minerFee': 0.01
      },
      {
        'rate': '0.24186242',
        'limit': 172.77451137,
        'pair': 'ETC_GNO',
        'maxLimit': 172.77451137,
        'min': 0.0821243,
        'minerFee': 0.01
      },
      {
        'rate': '4.07131218',
        'limit': 42.92359291,
        'pair': 'GNO_ETC',
        'maxLimit': 42.92359291,
        'min': 0.00488364,
        'minerFee': 0.01
      },
      {
        'rate': '121.57736925',
        'limit': 172.77451137,
        'pair': 'ETC_ZRX',
        'maxLimit': 172.77451137,
        'min': 0.00008157,
        'minerFee': 0.005
      },
      {
        'rate': '0.00808766',
        'limit': 21607.64687017,
        'pair': 'ZRX_ETC',
        'maxLimit': 21607.64687017,
        'min': 2.45486864,
        'minerFee': 0.01
      },
      {
        'rate': '0.29832234',
        'limit': 1771.5438959,
        'pair': 'EOS_OMG',
        'maxLimit': 1771.5438959,
        'min': 0.06538822,
        'minerFee': 0.01
      },
      {
        'rate': '3.24489062',
        'limit': 536.97270564,
        'pair': 'OMG_EOS',
        'maxLimit': 536.97270564,
        'min': 0.02408253,
        'minerFee': 0.04
      },
      {
        'rate': '0.00028961',
        'limit': 1771.5438959,
        'pair': 'EOS_BTC',
        'maxLimit': 1771.5438959,
        'min': 8.49877618,
        'minerFee': 0.00125
      },
      {
        'rate': '3377.41365243',
        'limit': 0.51642276,
        'pair': 'BTC_EOS',
        'maxLimit': 0.51642276,
        'min': 0.00002332,
        'minerFee': 0.04
      },
      {
        'rate': '8.24918360',
        'limit': 1771.5438959,
        'pair': 'EOS_BLK',
        'maxLimit': 1771.5438959,
        'min': 0.00233138,
        'minerFee': 0.01
      },
      {
        'rate': '0.11552009',
        'limit': 15060.44794975,
        'pair': 'BLK_EOS',
        'maxLimit': 15060.44794975,
        'min': 0.66592804,
        'minerFee': 0.04
      },
      {
        'rate': '0.36356247',
        'limit': 1771.5438959,
        'pair': 'EOS_CLAM',
        'maxLimit': 1771.5438959,
        'min': 0.00524218,
        'minerFee': 0.001
      },
      {
        'rate': '2.59750074',
        'limit': 669.79165287,
        'pair': 'CLAM_EOS',
        'maxLimit': 669.79165287,
        'min': 0.02933434,
        'minerFee': 0.04
      },
      {
        'rate': '238.86955785',
        'limit': 1771.5438959,
        'pair': 'EOS_DGB',
        'maxLimit': 1771.5438959,
        'min': 0.00008159,
        'minerFee': 0.01
      },
      {
        'rate': '0.00404473',
        'limit': 430352.30016419,
        'pair': 'DGB_EOS',
        'maxLimit': 430352.30016419,
        'min': 19.27338843,
        'minerFee': 0.04
      },
      {
        'rate': '1376.34364285',
        'limit': 1771.5438959,
        'pair': 'EOS_DOGE',
        'maxLimit': 1771.5438959,
        'min': 0.00271961,
        'minerFee': 2
      },
      {
        'rate': '0.00067412',
        'limit': 2582113.80098513,
        'pair': 'DOGE_EOS',
        'maxLimit': 2582113.80098513,
        'min': 111.05142857,
        'minerFee': 0.04
      },
      {
        'rate': '0.11702038',
        'limit': 1771.5438959,
        'pair': 'EOS_FCT',
        'maxLimit': 1771.5438959,
        'min': 1.64901414,
        'minerFee': 0.1
      },
      {
        'rate': '8.17086507',
        'limit': 212.92535168,
        'pair': 'FCT_EOS',
        'maxLimit': 212.92535168,
        'min': 0.00944189,
        'minerFee': 0.04
      },
      {
        'rate': '0.44928600',
        'limit': 1771.5438959,
        'pair': 'EOS_MONA',
        'maxLimit': 1771.5438959,
        'min': 0.85950503,
        'minerFee': 0.2
      },
      {
        'rate': '2.12942371',
        'limit': 817.02120016,
        'pair': 'MONA_EOS',
        'maxLimit': 817.02120016,
        'min': 0.0362693,
        'minerFee': 0.04
      },
      {
        'rate': '14.21003761',
        'limit': 1771.5438959,
        'pair': 'EOS_NXT',
        'maxLimit': 1771.5438959,
        'min': 0.13700027,
        'minerFee': 1
      },
      {
        'rate': '0.06791788',
        'limit': 25628.92110159,
        'pair': 'NXT_EOS',
        'maxLimit': 25628.92110159,
        'min': 1.14654867,
        'minerFee': 0.04
      },
      {
        'rate': '9.94787913',
        'limit': 1771.5438959,
        'pair': 'EOS_POT',
        'maxLimit': 1771.5438959,
        'min': 0.00197172,
        'minerFee': 0.01
      },
      {
        'rate': '0.09774782',
        'limit': 17807.6813861,
        'pair': 'POT_EOS',
        'maxLimit': 17807.6813861,
        'min': 0.80305785,
        'minerFee': 0.04
      },
      {
        'rate': '2063.47435714',
        'limit': 1771.5438959,
        'pair': 'EOS_RDD',
        'maxLimit': 1771.5438959,
        'min': 0.00000816,
        'minerFee': 0.01
      },
      {
        'rate': '0.00040426',
        'limit': 4303523.00164188,
        'pair': 'RDD_EOS',
        'maxLimit': 4303523.00164188,
        'min': 166.57714286,
        'minerFee': 0.04
      },
      {
        'rate': '38.56961415',
        'limit': 1771.5438959,
        'pair': 'EOS_START',
        'maxLimit': 1771.5438959,
        'min': 0.00088387,
        'minerFee': 0.02
      },
      {
        'rate': '0.02189794',
        'limit': 79449.65541493,
        'pair': 'START_EOS',
        'maxLimit': 79449.65541493,
        'min': 3.11359146,
        'minerFee': 0.04
      },
      {
        'rate': '4.88477547',
        'limit': 386.47761182,
        'pair': 'EOS_VRC',
        'maxLimit': 1771.5438959,
        'min': 0.00007654,
        'minerFee': 0.0002
      },
      {
        'rate': '0.18963621',
        'limit': 9174.32510565,
        'pair': 'VRC_EOS',
        'maxLimit': 9174.32510565,
        'min': 0.39413216,
        'minerFee': 0.04
      },
      {
        'rate': '0.51920634',
        'limit': 1771.5438959,
        'pair': 'EOS_VTC',
        'maxLimit': 1771.5438959,
        'min': 0.07533043,
        'minerFee': 0.02
      },
      {
        'rate': '1.86725309',
        'limit': 932.20470089,
        'pair': 'VTC_EOS',
        'maxLimit': 932.20470089,
        'min': 0.04191373,
        'minerFee': 0.04
      },
      {
        'rate': '28.68782621',
        'limit': 1771.5438959,
        'pair': 'EOS_VOX',
        'maxLimit': 1771.5438959,
        'min': 0.00066222,
        'minerFee': 0.01
      },
      {
        'rate': '0.03281323',
        'limit': 20936.54867898,
        'pair': 'VOX_EOS',
        'maxLimit': 20936.54867898,
        'min': 2.31586892,
        'minerFee': 0.04
      },
      {
        'rate': '437.70668181',
        'limit': 1771.5438959,
        'pair': 'EOS_SC',
        'maxLimit': 1771.5438959,
        'min': 0.04419364,
        'minerFee': 10
      },
      {
        'rate': '0.00218979',
        'limit': 794496.55414927,
        'pair': 'SC_EOS',
        'maxLimit': 794496.55414927,
        'min': 35.33454545,
        'minerFee': 0.04
      },
      {
        'rate': '9.63275791',
        'limit': 1771.5438959,
        'pair': 'EOS_LBC',
        'maxLimit': 1771.5438959,
        'min': 0.00402366,
        'minerFee': 0.02
      },
      {
        'rate': '0.09968619',
        'limit': 17452.61102389,
        'pair': 'LBC_EOS',
        'maxLimit': 17452.61102389,
        'min': 0.77761921,
        'minerFee': 0.04
      },
      {
        'rate': '0.49217393',
        'limit': 1771.5438959,
        'pair': 'EOS_WAVES',
        'maxLimit': 1771.5438959,
        'min': 0.0039622,
        'minerFee': 0.001
      },
      {
        'rate': '1.96326883',
        'limit': 886.16713604,
        'pair': 'WAVES_EOS',
        'maxLimit': 886.16713604,
        'min': 0.0397315,
        'minerFee': 0.04
      },
      {
        'rate': '1.28519623',
        'limit': 1771.5438959,
        'pair': 'EOS_GAME',
        'maxLimit': 1771.5438959,
        'min': 0.29751156,
        'minerFee': 0.2
      },
      {
        'rate': '0.73745677',
        'limit': 2360.35815255,
        'pair': 'GAME_EOS',
        'maxLimit': 2360.35815255,
        'min': 0.10374944,
        'minerFee': 0.04
      },
      {
        'rate': '0.90813369',
        'limit': 1771.5438959,
        'pair': 'EOS_KMD',
        'maxLimit': 1771.5438959,
        'min': 0.00431738,
        'minerFee': 0.002
      },
      {
        'rate': '1.06963047',
        'limit': 1626.52837857,
        'pair': 'KMD_EOS',
        'maxLimit': 1626.52837857,
        'min': 0.07331049,
        'minerFee': 0.04
      },
      {
        'rate': '17.81050616',
        'limit': 1771.5438959,
        'pair': 'EOS_SNGLS',
        'maxLimit': 1771.5438959,
        'min': 0.32533315,
        'minerFee': 3
      },
      {
        'rate': '0.05373419',
        'limit': 32377.60252019,
        'pair': 'SNGLS_EOS',
        'maxLimit': 32377.60252019,
        'min': 1.43778052,
        'minerFee': 0.04
      },
      {
        'rate': '7.76968185',
        'limit': 1771.5438959,
        'pair': 'EOS_GNT',
        'maxLimit': 1771.5438959,
        'min': 0.00248776,
        'minerFee': 0.01
      },
      {
        'rate': '0.12333078',
        'limit': 14113.76770148,
        'pair': 'GNT_EOS',
        'maxLimit': 14113.76770148,
        'min': 0.62690323,
        'minerFee': 0.04
      },
      {
        'rate': '1.55515939',
        'limit': 1771.5438959,
        'pair': 'EOS_SWT',
        'maxLimit': 1771.5438959,
        'min': 0.1166508,
        'minerFee': 0.1
      },
      {
        'rate': '0.57800472',
        'limit': 3009.98286529,
        'pair': 'SWT_EOS',
        'maxLimit': 3009.98286529,
        'min': 0.12554264,
        'minerFee': 0.04
      },
      {
        'rate': '4.78605715',
        'limit': 1771.5438959,
        'pair': 'EOS_WINGS',
        'maxLimit': 1771.5438959,
        'min': 0.00399714,
        'minerFee': 0.01
      },
      {
        'rate': '0.19805850',
        'limit': 8784.19391388,
        'pair': 'WINGS_EOS',
        'maxLimit': 8784.19391388,
        'min': 0.38636183,
        'minerFee': 0.04
      },
      {
        'rate': '6.46278322',
        'limit': 1771.5438959,
        'pair': 'EOS_TRST',
        'maxLimit': 1771.5438959,
        'min': 0.00289298,
        'minerFee': 0.01
      },
      {
        'rate': '0.14334732',
        'limit': 12136.84512801,
        'pair': 'TRST_EOS',
        'maxLimit': 12136.84512801,
        'min': 0.52171812,
        'minerFee': 0.04
      },
      {
        'rate': '4.39037097',
        'limit': 1771.5438959,
        'pair': 'EOS_RLC',
        'maxLimit': 1771.5438959,
        'min': 0.00427998,
        'minerFee': 0.01
      },
      {
        'rate': '0.21207319',
        'limit': 8203.69754086,
        'pair': 'RLC_EOS',
        'maxLimit': 8203.69754086,
        'min': 0.35441945,
        'minerFee': 0.04
      },
      {
        'rate': '12.57121018',
        'limit': 805.86739508,
        'pair': 'EOS_GUP',
        'maxLimit': 805.86739508,
        'min': 0.00150938,
        'minerFee': 0.01
      },
      {
        'rate': '0.07478991',
        'limit': 6670.4980368,
        'pair': 'GUP_EOS',
        'maxLimit': 6670.4980368,
        'min': 1.01483029,
        'minerFee': 0.04
      },
      {
        'rate': '1.23455730',
        'limit': 1771.5438959,
        'pair': 'EOS_ANT',
        'maxLimit': 1771.5438959,
        'min': 0.01563775,
        'minerFee': 0.01
      },
      {
        'rate': '0.77485042',
        'limit': 2245.31634868,
        'pair': 'ANT_EOS',
        'maxLimit': 2245.31634868,
        'min': 0.09966154,
        'minerFee': 0.04
      },
      {
        'rate': '0.04955169',
        'limit': 1771.5438959,
        'pair': 'EOS_DCR',
        'maxLimit': 1771.5438959,
        'min': 1.18302964,
        'minerFee': 0.03
      },
      {
        'rate': '19.53970628',
        'limit': 89.03840693,
        'pair': 'DCR_EOS',
        'maxLimit': 89.03840693,
        'min': 0.00400014,
        'minerFee': 0.04
      },
      {
        'rate': '14.90641950',
        'limit': 1771.5438959,
        'pair': 'EOS_BAT',
        'maxLimit': 1771.5438959,
        'min': 0.00130065,
        'minerFee': 0.01
      },
      {
        'rate': '0.06444734',
        'limit': 26995.43963393,
        'pair': 'BAT_EOS',
        'maxLimit': 26995.43963393,
        'min': 1.20334365,
        'minerFee': 0.04
      },
      {
        'rate': '0.99616003',
        'limit': 1771.5438959,
        'pair': 'EOS_BNT',
        'maxLimit': 1771.5438959,
        'min': 0.01853277,
        'minerFee': 0.01
      },
      {
        'rate': '0.91829881',
        'limit': 1894.57319025,
        'pair': 'BNT_EOS',
        'maxLimit': 1894.57319025,
        'min': 0.08041655,
        'minerFee': 0.04
      },
      {
        'rate': '71.32997777',
        'limit': 1771.5438959,
        'pair': 'EOS_SNT',
        'maxLimit': 1771.5438959,
        'min': 0.07954855,
        'minerFee': 3
      },
      {
        'rate': '0.01313876',
        'limit': 132416.09235821,
        'pair': 'SNT_EOS',
        'maxLimit': 132416.09235821,
        'min': 5.75822222,
        'minerFee': 0.04
      },
      {
        'rate': '0.17975521',
        'limit': 1771.5438959,
        'pair': 'EOS_NMR',
        'maxLimit': 1771.5438959,
        'min': 0.04079413,
        'minerFee': 0.004
      },
      {
        'rate': '5.05337231',
        'limit': 344.28184013,
        'pair': 'NMR_EOS',
        'maxLimit': 344.28184013,
        'min': 0.01451102,
        'minerFee': 0.04
      },
      {
        'rate': '3.10998395',
        'limit': 1771.5438959,
        'pair': 'EOS_EDG',
        'maxLimit': 1771.5438959,
        'min': 0.18561327,
        'minerFee': 0.3
      },
      {
        'rate': '0.30657125',
        'limit': 5674.97538678,
        'pair': 'EDG_EOS',
        'maxLimit': 5674.97538678,
        'min': 0.25105824,
        'minerFee': 0.04
      },
      {
        'rate': '7.83314560',
        'limit': 1771.5438959,
        'pair': 'EOS_CVC',
        'maxLimit': 1771.5438959,
        'min': 0.02450367,
        'minerFee': 0.1
      },
      {
        'rate': '0.12147695',
        'limit': 14329.15538837,
        'pair': 'CVC_EOS',
        'maxLimit': 14329.15538837,
        'min': 0.63234273,
        'minerFee': 0.04
      },
      {
        'rate': '0.49680374',
        'limit': 1392.60218615,
        'pair': 'EOS_MTL',
        'maxLimit': 1392.60218615,
        'min': 0.03889856,
        'minerFee': 0.01
      },
      {
        'rate': '1.92742357',
        'limit': 902.64762672,
        'pair': 'MTL_EOS',
        'maxLimit': 902.64762672,
        'min': 0.04010525,
        'minerFee': 0.04
      },
      {
        'rate': '115.55456399',
        'limit': 1771.5438959,
        'pair': 'EOS_FUN',
        'maxLimit': 1771.5438959,
        'min': 0.00016522,
        'minerFee': 0.01
      },
      {
        'rate': '0.00818646',
        'limit': 212519.65440207,
        'pair': 'FUN_EOS',
        'maxLimit': 212519.65440207,
        'min': 9.32832,
        'minerFee': 0.04
      },
      {
        'rate': '58.95641020',
        'limit': 1771.5438959,
        'pair': 'EOS_DNT',
        'maxLimit': 1771.5438959,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.01583389',
        'limit': 109877.18302064,
        'pair': 'DNT_EOS',
        'maxLimit': 109877.18302064,
        'min': 4.75934694,
        'minerFee': 0.04
      },
      {
        'rate': '6.32690341',
        'limit': 1771.5438959,
        'pair': 'EOS_1ST',
        'maxLimit': 1771.5438959,
        'min': 0.00302964,
        'minerFee': 0.01
      },
      {
        'rate': '0.15011884',
        'limit': 11589.37971717,
        'pair': '1ST_EOS',
        'maxLimit': 11589.37971717,
        'min': 0.51074901,
        'minerFee': 0.04
      },
      {
        'rate': '0.64500850',
        'limit': 886.07761697,
        'pair': 'EOS_SALT',
        'maxLimit': 886.07761697,
        'min': 0.14865379,
        'minerFee': 0.05
      },
      {
        'rate': '1.47315909',
        'limit': 590.6981482,
        'pair': 'SALT_EOS',
        'maxLimit': 590.6981482,
        'min': 0.0520693,
        'minerFee': 0.04
      },
      {
        'rate': '12.10352449',
        'limit': 1771.5438959,
        'pair': 'EOS_XEM',
        'maxLimit': 1771.5438959,
        'min': 0.64645091,
        'minerFee': 4
      },
      {
        'rate': '0.08007910',
        'limit': 21725.82079079,
        'pair': 'XEM_EOS',
        'maxLimit': 21725.82079079,
        'min': 0.97658291,
        'minerFee': 0.04
      },
      {
        'rate': '18.72238561',
        'limit': 1771.5438959,
        'pair': 'EOS_RCN',
        'maxLimit': 1771.5438959,
        'min': 0.20397063,
        'minerFee': 2
      },
      {
        'rate': '0.05053372',
        'limit': 34428.18401314,
        'pair': 'RCN_EOS',
        'maxLimit': 34428.18401314,
        'min': 1.51139339,
        'minerFee': 0.04
      },
      {
        'rate': '1.37634364',
        'limit': 1771.5438959,
        'pair': 'EOS_NMC',
        'maxLimit': 1771.5438959,
        'min': 0.00650632,
        'minerFee': 0.005
      },
      {
        'rate': '0.64510193',
        'limit': 496.85281567,
        'pair': 'NMC_EOS',
        'maxLimit': 496.85281567,
        'min': 0.11105143,
        'minerFee': 0.04
      },
      {
        'rate': '0.09649523',
        'limit': 1771.5438959,
        'pair': 'EOS_REP',
        'maxLimit': 1771.5438959,
        'min': 0.19746193,
        'minerFee': 0.01
      },
      {
        'rate': '9.78917495',
        'limit': 177.81499661,
        'pair': 'REP_EOS',
        'maxLimit': 177.81499661,
        'min': 0.0077858,
        'minerFee': 0.04
      },
      {
        'rate': '0.02360394',
        'limit': 1771.5438959,
        'pair': 'EOS_GNO',
        'maxLimit': 1771.5438959,
        'min': 0.81800449,
        'minerFee': 0.01
      },
      {
        'rate': '40.55257246',
        'limit': 42.92359291,
        'pair': 'GNO_EOS',
        'maxLimit': 42.92359291,
        'min': 0.0019045,
        'minerFee': 0.04
      },
      {
        'rate': '11.86503140',
        'limit': 1771.5438959,
        'pair': 'EOS_ZRX',
        'maxLimit': 1771.5438959,
        'min': 0.00081248,
        'minerFee': 0.005
      },
      {
        'rate': '0.08055768',
        'limit': 21607.64687017,
        'pair': 'ZRX_EOS',
        'maxLimit': 21607.64687017,
        'min': 0.9573399,
        'minerFee': 0.04
      },
      {
        'rate': '0.00095547',
        'limit': 536.9727058,
        'pair': 'OMG_BTC',
        'maxLimit': 536.9727058,
        'min': 2.58165784,
        'minerFee': 0.00125
      },
      {
        'rate': '1024.40182987',
        'limit': 0.51660097,
        'pair': 'BTC_OMG',
        'maxLimit': 0.51660097,
        'min': 0.00001923,
        'minerFee': 0.01
      },
      {
        'rate': '27.21514648',
        'limit': 536.9727058,
        'pair': 'OMG_BLK',
        'maxLimit': 536.9727058,
        'min': 0.0007082,
        'minerFee': 0.01
      },
      {
        'rate': '0.03503821',
        'limit': 15065.64508335,
        'pair': 'BLK_OMG',
        'maxLimit': 15065.64508335,
        'min': 0.54924615,
        'minerFee': 0.01
      },
      {
        'rate': '1.19944062',
        'limit': 536.9727058,
        'pair': 'OMG_CLAM',
        'maxLimit': 536.9727058,
        'min': 0.00159241,
        'minerFee': 0.001
      },
      {
        'rate': '0.78784378',
        'limit': 670.0227909,
        'pair': 'CLAM_OMG',
        'maxLimit': 670.0227909,
        'min': 0.02419447,
        'minerFee': 0.01
      },
      {
        'rate': '788.06222727',
        'limit': 536.9727058,
        'pair': 'OMG_DGB',
        'maxLimit': 536.9727058,
        'min': 0.00002478,
        'minerFee': 0.01
      },
      {
        'rate': '0.00122680',
        'limit': 430500.81020252,
        'pair': 'DGB_OMG',
        'maxLimit': 430500.81020252,
        'min': 15.89636364,
        'minerFee': 0.01
      },
      {
        'rate': '4540.73950000',
        'limit': 536.9727058,
        'pair': 'OMG_DOGE',
        'maxLimit': 536.9727058,
        'min': 0.00082613,
        'minerFee': 2
      },
      {
        'rate': '0.00020446',
        'limit': 2583004.86121515,
        'pair': 'DOGE_OMG',
        'maxLimit': 2583004.86121515,
        'min': 91.59333333,
        'minerFee': 0.01
      },
      {
        'rate': '0.38606571',
        'limit': 536.9727058,
        'pair': 'OMG_FCT',
        'maxLimit': 536.9727058,
        'min': 0.50091804,
        'minerFee': 0.1
      },
      {
        'rate': '2.47829199',
        'limit': 212.99882997,
        'pair': 'FCT_OMG',
        'maxLimit': 212.99882997,
        'min': 0.00778751,
        'minerFee': 0.01
      },
      {
        'rate': '1.48225389',
        'limit': 536.9727058,
        'pair': 'OMG_MONA',
        'maxLimit': 536.9727058,
        'min': 0.26109029,
        'minerFee': 0.2
      },
      {
        'rate': '0.64587209',
        'limit': 817.30314556,
        'pair': 'MONA_OMG',
        'maxLimit': 817.30314556,
        'min': 0.02991431,
        'minerFee': 0.01
      },
      {
        'rate': '46.88079129',
        'limit': 536.9727058,
        'pair': 'OMG_NXT',
        'maxLimit': 536.9727058,
        'min': 0.04161632,
        'minerFee': 1
      },
      {
        'rate': '0.02060008',
        'limit': 25637.76504322,
        'pair': 'NXT_OMG',
        'maxLimit': 25637.76504322,
        'min': 0.94565388,
        'minerFee': 0.01
      },
      {
        'rate': '32.81936742',
        'limit': 536.9727058,
        'pair': 'OMG_POT',
        'maxLimit': 536.9727058,
        'min': 0.00059894,
        'minerFee': 0.01
      },
      {
        'rate': '0.02964775',
        'limit': 17813.82662907,
        'pair': 'POT_OMG',
        'maxLimit': 17813.82662907,
        'min': 0.66234848,
        'minerFee': 0.01
      },
      {
        'rate': '6807.67450000',
        'limit': 536.9727058,
        'pair': 'OMG_RDD',
        'maxLimit': 536.9727058,
        'min': 0.00000248,
        'minerFee': 0.01
      },
      {
        'rate': '0.00012261',
        'limit': 4305000.68880011,
        'pair': 'RDD_OMG',
        'maxLimit': 4305000.68880011,
        'min': 137.39,
        'minerFee': 0.01
      },
      {
        'rate': '127.24625233',
        'limit': 536.9727058,
        'pair': 'OMG_START',
        'maxLimit': 536.9727058,
        'min': 0.00026849,
        'minerFee': 0.02
      },
      {
        'rate': '0.00664183',
        'limit': 79477.06633617,
        'pair': 'START_OMG',
        'maxLimit': 79477.06633617,
        'min': 2.56803738,
        'minerFee': 0.01
      },
      {
        'rate': '16.11551960',
        'limit': 117.14523684,
        'pair': 'OMG_VRC',
        'maxLimit': 536.9727058,
        'min': 0.00002325,
        'minerFee': 0.0002
      },
      {
        'rate': '0.05751825',
        'limit': 9177.49104318,
        'pair': 'VRC_OMG',
        'maxLimit': 9177.49104318,
        'min': 0.32507352,
        'minerFee': 0.01
      },
      {
        'rate': '1.71293031',
        'limit': 536.9727058,
        'pair': 'OMG_VTC',
        'maxLimit': 536.9727058,
        'min': 0.02288299,
        'minerFee': 0.02
      },
      {
        'rate': '0.56635397',
        'limit': 932.52639437,
        'pair': 'VTC_OMG',
        'maxLimit': 932.52639437,
        'min': 0.03456973,
        'minerFee': 0.01
      },
      {
        'rate': '94.64492850',
        'limit': 536.9727058,
        'pair': 'OMG_VOX',
        'maxLimit': 536.9727058,
        'min': 0.00020116,
        'minerFee': 0.01
      },
      {
        'rate': '0.00995252',
        'limit': 20936.54867898,
        'pair': 'VOX_OMG',
        'maxLimit': 20936.54867898,
        'min': 1.91008937,
        'minerFee': 0.01
      },
      {
        'rate': '1444.05216666',
        'limit': 536.9727058,
        'pair': 'OMG_SC',
        'maxLimit': 536.9727058,
        'min': 0.01342462,
        'minerFee': 10
      },
      {
        'rate': '0.00066418',
        'limit': 794770.72652774,
        'pair': 'SC_OMG',
        'maxLimit': 794770.72652774,
        'min': 29.14333333,
        'minerFee': 0.01
      },
      {
        'rate': '31.77974091',
        'limit': 536.9727058,
        'pair': 'OMG_LBC',
        'maxLimit': 536.9727058,
        'min': 0.00122226,
        'minerFee': 0.02
      },
      {
        'rate': '0.03023565',
        'limit': 17458.63373582,
        'pair': 'LBC_OMG',
        'maxLimit': 17458.63373582,
        'min': 0.64136712,
        'minerFee': 0.01
      },
      {
        'rate': '1.62374681',
        'limit': 536.9727058,
        'pair': 'OMG_WAVES',
        'maxLimit': 536.9727058,
        'min': 0.00120359,
        'minerFee': 0.001
      },
      {
        'rate': '0.59547592',
        'limit': 886.47294297,
        'pair': 'WAVES_OMG',
        'maxLimit': 886.47294297,
        'min': 0.03276987,
        'minerFee': 0.01
      },
      {
        'rate': '4.24003216',
        'limit': 536.9727058,
        'pair': 'OMG_GAME',
        'maxLimit': 536.9727058,
        'min': 0.09037455,
        'minerFee': 0.2
      },
      {
        'rate': '0.22367700',
        'limit': 2361.17268725,
        'pair': 'GAME_OMG',
        'maxLimit': 2361.17268725,
        'min': 0.08557078,
        'minerFee': 0.01
      },
      {
        'rate': '2.99605303',
        'limit': 536.9727058,
        'pair': 'OMG_KMD',
        'maxLimit': 536.9727058,
        'min': 0.00131148,
        'minerFee': 0.002
      },
      {
        'rate': '0.32442790',
        'limit': 1627.08967371,
        'pair': 'KMD_OMG',
        'maxLimit': 1627.08967371,
        'min': 0.06046525,
        'minerFee': 0.01
      },
      {
        'rate': '58.75921270',
        'limit': 536.9727058,
        'pair': 'OMG_SNGLS',
        'maxLimit': 536.9727058,
        'min': 0.09882586,
        'minerFee': 3
      },
      {
        'rate': '0.01629803',
        'limit': 32388.7751647,
        'pair': 'SNGLS_OMG',
        'maxLimit': 32388.7751647,
        'min': 1.18585697,
        'minerFee': 0.01
      },
      {
        'rate': '25.63320685',
        'limit': 536.9727058,
        'pair': 'OMG_GNT',
        'maxLimit': 536.9727058,
        'min': 0.0007557,
        'minerFee': 0.01
      },
      {
        'rate': '0.03740729',
        'limit': 14118.6382138,
        'pair': 'GNT_OMG',
        'maxLimit': 14118.6382138,
        'min': 0.51705914,
        'minerFee': 0.01
      },
      {
        'rate': '5.13067630',
        'limit': 536.9727058,
        'pair': 'OMG_SWT',
        'maxLimit': 536.9727058,
        'min': 0.0354348,
        'minerFee': 0.1
      },
      {
        'rate': '0.17531368',
        'limit': 3011.02157862,
        'pair': 'SWT_OMG',
        'maxLimit': 3011.02157862,
        'min': 0.10354543,
        'minerFee': 0.01
      },
      {
        'rate': '15.78983482',
        'limit': 536.9727058,
        'pair': 'OMG_WINGS',
        'maxLimit': 536.9727058,
        'min': 0.00121421,
        'minerFee': 0.01
      },
      {
        'rate': '0.06007280',
        'limit': 8787.22524652,
        'pair': 'WINGS_OMG',
        'maxLimit': 8787.22524652,
        'min': 0.31866468,
        'minerFee': 0.01
      },
      {
        'rate': '21.32157561',
        'limit': 536.9727058,
        'pair': 'OMG_TRST',
        'maxLimit': 536.9727058,
        'min': 0.0008788,
        'minerFee': 0.01
      },
      {
        'rate': '0.04347844',
        'limit': 12141.03335152,
        'pair': 'TRST_OMG',
        'maxLimit': 12141.03335152,
        'min': 0.43030425,
        'minerFee': 0.01
      },
      {
        'rate': '14.48441382',
        'limit': 536.9727058,
        'pair': 'OMG_RLC',
        'maxLimit': 536.9727058,
        'min': 0.00130012,
        'minerFee': 0.01
      },
      {
        'rate': '0.06432357',
        'limit': 8206.52851665,
        'pair': 'RLC_OMG',
        'maxLimit': 8206.52851665,
        'min': 0.29231915,
        'minerFee': 0.01
      },
      {
        'rate': '41.47408311',
        'limit': 244.26648263,
        'pair': 'OMG_GUP',
        'maxLimit': 244.26648263,
        'min': 0.0004585,
        'minerFee': 0.01
      },
      {
        'rate': '0.02268440',
        'limit': 6670.4980368,
        'pair': 'GUP_OMG',
        'maxLimit': 6670.4980368,
        'min': 0.8370148,
        'minerFee': 0.01
      },
      {
        'rate': '4.07296764',
        'limit': 536.9727058,
        'pair': 'OMG_ANT',
        'maxLimit': 536.9727058,
        'min': 0.00475025,
        'minerFee': 0.01
      },
      {
        'rate': '0.23501863',
        'limit': 2246.09118367,
        'pair': 'ANT_OMG',
        'maxLimit': 2246.09118367,
        'min': 0.08219915,
        'minerFee': 0.01
      },
      {
        'rate': '0.16347760',
        'limit': 536.9727058,
        'pair': 'OMG_DCR',
        'maxLimit': 536.9727058,
        'min': 0.35936677,
        'minerFee': 0.03
      },
      {
        'rate': '5.92655699',
        'limit': 89.06913315,
        'pair': 'DCR_OMG',
        'maxLimit': 89.06913315,
        'min': 0.00329925,
        'minerFee': 0.01
      },
      {
        'rate': '49.17824716',
        'limit': 536.9727058,
        'pair': 'OMG_BAT',
        'maxLimit': 536.9727058,
        'min': 0.0003951,
        'minerFee': 0.01
      },
      {
        'rate': '0.01954741',
        'limit': 27004.75547533,
        'pair': 'BAT_OMG',
        'maxLimit': 27004.75547533,
        'min': 0.99249742,
        'minerFee': 0.01
      },
      {
        'rate': '3.28646355',
        'limit': 536.9727058,
        'pair': 'OMG_BNT',
        'maxLimit': 536.9727058,
        'min': 0.00562967,
        'minerFee': 0.01
      },
      {
        'rate': '0.27852774',
        'limit': 1895.22698531,
        'pair': 'BNT_OMG',
        'maxLimit': 1895.22698531,
        'min': 0.06632621,
        'minerFee': 0.01
      },
      {
        'rate': '235.32701975',
        'limit': 536.9727058,
        'pair': 'OMG_SNT',
        'maxLimit': 536.9727058,
        'min': 0.02416432,
        'minerFee': 3
      },
      {
        'rate': '0.00398509',
        'limit': 132461.78775462,
        'pair': 'SNT_OMG',
        'maxLimit': 132461.78775462,
        'min': 4.74928395,
        'minerFee': 0.01
      },
      {
        'rate': '0.59303621',
        'limit': 536.9727058,
        'pair': 'OMG_NMR',
        'maxLimit': 536.9727058,
        'min': 0.01239196,
        'minerFee': 0.004
      },
      {
        'rate': '1.53273025',
        'limit': 344.40064816,
        'pair': 'NMR_OMG',
        'maxLimit': 344.40064816,
        'min': 0.01196844,
        'minerFee': 0.01
      },
      {
        'rate': '10.26024792',
        'limit': 536.9727058,
        'pair': 'OMG_EDG',
        'maxLimit': 536.9727058,
        'min': 0.05638341,
        'minerFee': 0.3
      },
      {
        'rate': '0.09298563',
        'limit': 5676.93376091,
        'pair': 'EDG_OMG',
        'maxLimit': 5676.93376091,
        'min': 0.20706858,
        'minerFee': 0.01
      },
      {
        'rate': '25.84258215',
        'limit': 536.9727058,
        'pair': 'OMG_CVC',
        'maxLimit': 536.9727058,
        'min': 0.00744344,
        'minerFee': 0.1
      },
      {
        'rate': '0.03684500',
        'limit': 14334.10006435,
        'pair': 'CVC_OMG',
        'maxLimit': 14334.10006435,
        'min': 0.52154555,
        'minerFee': 0.01
      },
      {
        'rate': '1.63902118',
        'limit': 422.11167717,
        'pair': 'OMG_MTL',
        'maxLimit': 422.11167717,
        'min': 0.01181614,
        'minerFee': 0.01
      },
      {
        'rate': '0.58460375',
        'limit': 902.95912056,
        'pair': 'MTL_OMG',
        'maxLimit': 902.95912056,
        'min': 0.03307813,
        'minerFee': 0.01
      },
      {
        'rate': '381.22977200',
        'limit': 536.9727058,
        'pair': 'OMG_FUN',
        'maxLimit': 536.9727058,
        'min': 0.00005019,
        'minerFee': 0.01
      },
      {
        'rate': '0.00248302',
        'limit': 212592.98817303,
        'pair': 'FUN_OMG',
        'maxLimit': 212592.98817303,
        'min': 7.69384,
        'minerFee': 0.01
      },
      {
        'rate': '194.50498571',
        'limit': 536.9727058,
        'pair': 'OMG_DNT',
        'maxLimit': 536.9727058,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00480255',
        'limit': 109915.10047724,
        'pair': 'DNT_OMG',
        'maxLimit': 109915.10047724,
        'min': 3.92542857,
        'minerFee': 0.01
      },
      {
        'rate': '20.87329018',
        'limit': 536.9727058,
        'pair': 'OMG_1ST',
        'maxLimit': 536.9727058,
        'min': 0.00092031,
        'minerFee': 0.01
      },
      {
        'rate': '0.04553230',
        'limit': 11593.37908983,
        'pair': '1ST_OMG',
        'maxLimit': 11593.37908983,
        'min': 0.42125712,
        'minerFee': 0.01
      },
      {
        'rate': '2.12796827',
        'limit': 268.57900463,
        'pair': 'OMG_SALT',
        'maxLimit': 268.57900463,
        'min': 0.04515629,
        'minerFee': 0.05
      },
      {
        'rate': '0.44682152',
        'limit': 590.6981482,
        'pair': 'SALT_OMG',
        'maxLimit': 590.6981482,
        'min': 0.04294588,
        'minerFee': 0.01
      },
      {
        'rate': '39.93112625',
        'limit': 536.9727058,
        'pair': 'OMG_XEM',
        'maxLimit': 536.9727058,
        'min': 0.19637122,
        'minerFee': 4
      },
      {
        'rate': '0.02428866',
        'limit': 21733.31814232,
        'pair': 'XEM_OMG',
        'maxLimit': 21733.31814232,
        'min': 0.80546901,
        'minerFee': 0.01
      },
      {
        'rate': '61.76762346',
        'limit': 536.9727058,
        'pair': 'OMG_RCN',
        'maxLimit': 536.9727058,
        'min': 0.06195979,
        'minerFee': 2
      },
      {
        'rate': '0.01532730',
        'limit': 34440.0648162,
        'pair': 'RCN_OMG',
        'maxLimit': 34440.0648162,
        'min': 1.24657161,
        'minerFee': 0.01
      },
      {
        'rate': '4.54073950',
        'limit': 536.9727058,
        'pair': 'OMG_NMC',
        'maxLimit': 536.9727058,
        'min': 0.00197641,
        'minerFee': 0.005
      },
      {
        'rate': '0.19566498',
        'limit': 496.85281567,
        'pair': 'NMC_OMG',
        'maxLimit': 496.85281567,
        'min': 0.09159333,
        'minerFee': 0.01
      },
      {
        'rate': '0.31835051',
        'limit': 536.9727058,
        'pair': 'OMG_REP',
        'maxLimit': 536.9727058,
        'min': 0.05998265,
        'minerFee': 0.01
      },
      {
        'rate': '2.96914123',
        'limit': 177.87635866,
        'pair': 'REP_OMG',
        'maxLimit': 177.87635866,
        'min': 0.00642159,
        'minerFee': 0.01
      },
      {
        'rate': '0.07787252',
        'limit': 536.9727058,
        'pair': 'OMG_GNO',
        'maxLimit': 536.9727058,
        'min': 0.24848374,
        'minerFee': 0.01
      },
      {
        'rate': '12.29994516',
        'limit': 42.93840538,
        'pair': 'GNO_OMG',
        'maxLimit': 42.93840538,
        'min': 0.0015708,
        'minerFee': 0.01
      },
      {
        'rate': '39.14430603',
        'limit': 536.9727058,
        'pair': 'OMG_ZRX',
        'maxLimit': 536.9727058,
        'min': 0.00024681,
        'minerFee': 0.005
      },
      {
        'rate': '0.02443384',
        'limit': 21615.10344113,
        'pair': 'ZRX_OMG',
        'maxLimit': 21615.10344113,
        'min': 0.7895977,
        'minerFee': 0.01
      },
      {
        'rate': '28326.67047401',
        'limit': 0.51660097,
        'pair': 'BTC_BLK',
        'maxLimit': 0.51660097,
        'min': 6.9e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00003401',
        'limit': 15065.64508335,
        'pair': 'BLK_BTC',
        'maxLimit': 15065.64508335,
        'min': 71.38777841,
        'minerFee': 0.00125
      },
      {
        'rate': '1248.42767295',
        'limit': 0.51660097,
        'pair': 'BTC_CLAM',
        'maxLimit': 0.51660097,
        'min': 0.00000154,
        'minerFee': 0.001
      },
      {
        'rate': '0.00076485',
        'limit': 670.02279117,
        'pair': 'CLAM_BTC',
        'maxLimit': 670.02279117,
        'min': 3.14465409,
        'minerFee': 0.00125
      },
      {
        'rate': '820247.93388429',
        'limit': 0.51660097,
        'pair': 'BTC_DGB',
        'maxLimit': 0.51660097,
        'min': 2e-8,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000119',
        'limit': 430500.81020252,
        'pair': 'DGB_BTC',
        'maxLimit': 430500.81020252,
        'min': 2066.11570248,
        'minerFee': 0.00125
      },
      {
        'rate': '4726190.47619047',
        'limit': 0.51660097,
        'pair': 'BTC_DOGE',
        'maxLimit': 0.51660097,
        'min': 8e-7,
        'minerFee': 2
      },
      {
        'rate': '0.00000019',
        'limit': 2583004.86121515,
        'pair': 'DOGE_BTC',
        'maxLimit': 2583004.86121515,
        'min': 11904.76190476,
        'minerFee': 0.00125
      },
      {
        'rate': '401.83325033',
        'limit': 0.51660097,
        'pair': 'BTC_FCT',
        'maxLimit': 0.51660097,
        'min': 0.00048507,
        'minerFee': 0.1
      },
      {
        'rate': '0.00240596',
        'limit': 212.99882997,
        'pair': 'FCT_BTC',
        'maxLimit': 212.99882997,
        'min': 1.01217443,
        'minerFee': 0.00125
      },
      {
        'rate': '1542.79226737',
        'limit': 0.51660097,
        'pair': 'BTC_MONA',
        'maxLimit': 0.51660097,
        'min': 0.00025283,
        'minerFee': 0.2
      },
      {
        'rate': '0.00062702',
        'limit': 817.30314582,
        'pair': 'MONA_BTC',
        'maxLimit': 817.30314582,
        'min': 3.88808535,
        'minerFee': 0.00125
      },
      {
        'rate': '48795.47689282',
        'limit': 0.51660097,
        'pair': 'BTC_NXT',
        'maxLimit': 0.51660097,
        'min': 0.0000403,
        'minerFee': 1
      },
      {
        'rate': '0.00001999',
        'limit': 25637.76504322,
        'pair': 'NXT_BTC',
        'maxLimit': 25637.76504322,
        'min': 122.91052114,
        'minerFee': 0.00125
      },
      {
        'rate': '34159.77961432',
        'limit': 0.51660097,
        'pair': 'BTC_POT',
        'maxLimit': 0.51660097,
        'min': 5.8e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00002878',
        'limit': 17813.82662907,
        'pair': 'POT_BTC',
        'maxLimit': 17813.82662907,
        'min': 86.08815427,
        'minerFee': 0.00125
      },
      {
        'rate': '7085714.28571428',
        'limit': 0.51660097,
        'pair': 'BTC_RDD',
        'maxLimit': 0.51660097,
        'min': 0,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000011',
        'limit': 4305000.68880011,
        'pair': 'RDD_BTC',
        'maxLimit': 4305000.68880011,
        'min': 17857.14285714,
        'minerFee': 0.00125
      },
      {
        'rate': '132443.25767690',
        'limit': 0.51660097,
        'pair': 'BTC_START',
        'maxLimit': 0.51660097,
        'min': 2.6e-7,
        'minerFee': 0.02
      },
      {
        'rate': '0.00000644',
        'limit': 79477.06633617,
        'pair': 'START_BTC',
        'maxLimit': 79477.06633617,
        'min': 333.77837116,
        'minerFee': 0.00125
      },
      {
        'rate': '16773.70288997',
        'limit': 0.11266209,
        'pair': 'BTC_VRC',
        'maxLimit': 0.51660097,
        'min': 2e-8,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00005583',
        'limit': 9177.49104318,
        'pair': 'VRC_BTC',
        'maxLimit': 9177.49104318,
        'min': 42.25114078,
        'minerFee': 0.00125
      },
      {
        'rate': '1782.89000718',
        'limit': 0.51660097,
        'pair': 'BTC_VTC',
        'maxLimit': 0.51660097,
        'min': 0.00002216,
        'minerFee': 0.02
      },
      {
        'rate': '0.00054982',
        'limit': 932.52639437,
        'pair': 'VTC_BTC',
        'maxLimit': 932.52639437,
        'min': 4.49317038,
        'minerFee': 0.00125
      },
      {
        'rate': '98510.42701092',
        'limit': 0.51660097,
        'pair': 'BTC_VOX',
        'maxLimit': 0.51660097,
        'min': 1.9e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000966',
        'limit': 20936.54867898,
        'pair': 'VOX_BTC',
        'maxLimit': 20936.54867898,
        'min': 248.26216485,
        'minerFee': 0.00125
      },
      {
        'rate': '1503030.30303030',
        'limit': 0.51660097,
        'pair': 'BTC_SC',
        'maxLimit': 0.51660097,
        'min': 0.000013,
        'minerFee': 10
      },
      {
        'rate': '0.00000064',
        'limit': 794771.04235812,
        'pair': 'SC_BTC',
        'maxLimit': 794771.04235812,
        'min': 3787.87878788,
        'minerFee': 0.00125
      },
      {
        'rate': '33077.69256418',
        'limit': 0.51660097,
        'pair': 'BTC_LBC',
        'maxLimit': 0.51660097,
        'min': 0.00000118,
        'minerFee': 0.02
      },
      {
        'rate': '0.00002935',
        'limit': 17458.63394919,
        'pair': 'LBC_BTC',
        'maxLimit': 17458.63394919,
        'min': 83.36112037,
        'minerFee': 0.00125
      },
      {
        'rate': '1690.06405887',
        'limit': 0.51660097,
        'pair': 'BTC_WAVES',
        'maxLimit': 0.51660097,
        'min': 0.00000117,
        'minerFee': 0.001
      },
      {
        'rate': '0.00057809',
        'limit': 886.47294359,
        'pair': 'WAVES_BTC',
        'maxLimit': 886.47294359,
        'min': 4.25923402,
        'minerFee': 0.00125
      },
      {
        'rate': '4413.20402171',
        'limit': 0.51660097,
        'pair': 'BTC_GAME',
        'maxLimit': 0.51660097,
        'min': 0.00008752,
        'minerFee': 0.2
      },
      {
        'rate': '0.00021714',
        'limit': 2361.17269115,
        'pair': 'GAME_BTC',
        'maxLimit': 2361.17269115,
        'min': 11.12198594,
        'minerFee': 0.00125
      },
      {
        'rate': '3118.41815724',
        'limit': 0.51660097,
        'pair': 'BTC_KMD',
        'maxLimit': 0.51660097,
        'min': 0.00000127,
        'minerFee': 0.002
      },
      {
        'rate': '0.00031496',
        'limit': 1627.08967371,
        'pair': 'KMD_BTC',
        'maxLimit': 1627.08967371,
        'min': 7.85891673,
        'minerFee': 0.00125
      },
      {
        'rate': '61159.06288532',
        'limit': 0.51660097,
        'pair': 'BTC_SNGLS',
        'maxLimit': 0.51660097,
        'min': 0.0000957,
        'minerFee': 3
      },
      {
        'rate': '0.00001582',
        'limit': 32388.7751647,
        'pair': 'SNGLS_BTC',
        'maxLimit': 32388.7751647,
        'min': 154.13070284,
        'minerFee': 0.00125
      },
      {
        'rate': '26680.10752688',
        'limit': 0.51660097,
        'pair': 'BTC_GNT',
        'maxLimit': 0.51660097,
        'min': 7.3e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00003631',
        'limit': 14118.63835334,
        'pair': 'GNT_BTC',
        'maxLimit': 14118.63835334,
        'min': 67.20430108,
        'minerFee': 0.00125
      },
      {
        'rate': '5340.22394487',
        'limit': 0.51660097,
        'pair': 'BTC_SWT',
        'maxLimit': 0.51660097,
        'min': 0.00003431,
        'minerFee': 0.1
      },
      {
        'rate': '0.00017019',
        'limit': 3011.02157952,
        'pair': 'SWT_BTC',
        'maxLimit': 3011.02157952,
        'min': 13.45822567,
        'minerFee': 0.00125
      },
      {
        'rate': '16434.72498343',
        'limit': 0.51660097,
        'pair': 'BTC_WINGS',
        'maxLimit': 0.51660097,
        'min': 0.00000118,
        'minerFee': 0.01
      },
      {
        'rate': '0.00005831',
        'limit': 8787.22530057,
        'pair': 'WINGS_BTC',
        'maxLimit': 8787.22530057,
        'min': 41.41815772,
        'minerFee': 0.00125
      },
      {
        'rate': '22192.39373601',
        'limit': 0.51660097,
        'pair': 'BTC_TRST',
        'maxLimit': 0.51660097,
        'min': 8.5e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00004220',
        'limit': 12141.03335152,
        'pair': 'TRST_BTC',
        'maxLimit': 12141.03335152,
        'min': 55.92841163,
        'minerFee': 0.00125
      },
      {
        'rate': '15075.98784194',
        'limit': 0.51660097,
        'pair': 'BTC_RLC',
        'maxLimit': 0.51660097,
        'min': 0.00000126,
        'minerFee': 0.01
      },
      {
        'rate': '0.00006244',
        'limit': 8206.52851665,
        'pair': 'RLC_BTC',
        'maxLimit': 8206.52851665,
        'min': 37.99392097,
        'minerFee': 0.00125
      },
      {
        'rate': '43167.97214969',
        'limit': 0.2349184,
        'pair': 'BTC_GUP',
        'maxLimit': 0.2349184,
        'min': 4.4e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00002202',
        'limit': 6670.4980368,
        'pair': 'GUP_BTC',
        'maxLimit': 6670.4980368,
        'min': 108.79025239,
        'minerFee': 0.00125
      },
      {
        'rate': '4239.31623931',
        'limit': 0.51660097,
        'pair': 'BTC_ANT',
        'maxLimit': 0.51660097,
        'min': 0.0000046,
        'minerFee': 0.01
      },
      {
        'rate': '0.00022816',
        'limit': 2246.09118367,
        'pair': 'ANT_BTC',
        'maxLimit': 2246.09118367,
        'min': 10.68376068,
        'minerFee': 0.00125
      },
      {
        'rate': '170.15437392',
        'limit': 0.51660097,
        'pair': 'BTC_DCR',
        'maxLimit': 0.51660097,
        'min': 0.000348,
        'minerFee': 0.03
      },
      {
        'rate': '0.00575359',
        'limit': 89.06913315,
        'pair': 'DCR_BTC',
        'maxLimit': 89.06913315,
        'min': 0.42881647,
        'minerFee': 0.00125
      },
      {
        'rate': '51186.79050567',
        'limit': 0.51660097,
        'pair': 'BTC_BAT',
        'maxLimit': 0.51660097,
        'min': 3.8e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00001897',
        'limit': 27004.75613166,
        'pair': 'BAT_BTC',
        'maxLimit': 27004.75613166,
        'min': 128.99896801,
        'minerFee': 0.00125
      },
      {
        'rate': '3420.68965517',
        'limit': 0.51660097,
        'pair': 'BTC_BNT',
        'maxLimit': 0.51660097,
        'min': 0.00000545,
        'minerFee': 0.01
      },
      {
        'rate': '0.00027039',
        'limit': 1895.22698531,
        'pair': 'BNT_BTC',
        'maxLimit': 1895.22698531,
        'min': 8.62068966,
        'minerFee': 0.00125
      },
      {
        'rate': '244938.27160493',
        'limit': 0.51660097,
        'pair': 'BTC_SNT',
        'maxLimit': 0.51660097,
        'min': 0.0000234,
        'minerFee': 3
      },
      {
        'rate': '0.00000386',
        'limit': 132461.80530075,
        'pair': 'SNT_BTC',
        'maxLimit': 132461.80530075,
        'min': 617.28395062,
        'minerFee': 0.00125
      },
      {
        'rate': '617.25706392',
        'limit': 0.51660097,
        'pair': 'BTC_NMR',
        'maxLimit': 0.51660097,
        'min': 0.000012,
        'minerFee': 0.004
      },
      {
        'rate': '0.00148800',
        'limit': 344.40064816,
        'pair': 'NMR_BTC',
        'maxLimit': 344.40064816,
        'min': 1.55558736,
        'minerFee': 0.00125
      },
      {
        'rate': '10679.29809452',
        'limit': 0.51660097,
        'pair': 'BTC_EDG',
        'maxLimit': 0.51660097,
        'min': 0.0000546,
        'minerFee': 0.3
      },
      {
        'rate': '0.00009027',
        'limit': 5676.93376091,
        'pair': 'EDG_BTC',
        'maxLimit': 5676.93376091,
        'min': 26.91355367,
        'minerFee': 0.00125
      },
      {
        'rate': '26898.04772234',
        'limit': 0.51660097,
        'pair': 'BTC_CVC',
        'maxLimit': 0.51660097,
        'min': 0.00000721,
        'minerFee': 0.1
      },
      {
        'rate': '0.00003576',
        'limit': 14334.10006435,
        'pair': 'CVC_BTC',
        'maxLimit': 14334.10006435,
        'min': 67.78741866,
        'minerFee': 0.00125
      },
      {
        'rate': '1705.96226934',
        'limit': 0.40595746,
        'pair': 'BTC_MTL',
        'maxLimit': 0.40595746,
        'min': 0.00001144,
        'minerFee': 0.01
      },
      {
        'rate': '0.00056754',
        'limit': 902.95912056,
        'pair': 'MTL_BTC',
        'maxLimit': 902.95912056,
        'min': 4.29930007,
        'minerFee': 0.00125
      },
      {
        'rate': '396799.99999999',
        'limit': 0.51660097,
        'pair': 'BTC_FUN',
        'maxLimit': 0.51660097,
        'min': 5e-8,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000241',
        'limit': 212592.98817303,
        'pair': 'FUN_BTC',
        'maxLimit': 212592.98817303,
        'min': 1000,
        'minerFee': 0.00125
      },
      {
        'rate': '202448.97959183',
        'limit': 0.51660097,
        'pair': 'BTC_DNT',
        'maxLimit': 0.51660097,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00000466',
        'limit': 109915.11255857,
        'pair': 'DNT_BTC',
        'maxLimit': 109915.11255857,
        'min': 510.20408163,
        'minerFee': 0.00125
      },
      {
        'rate': '21725.79938677',
        'limit': 0.51660097,
        'pair': 'BTC_1ST',
        'maxLimit': 0.51660097,
        'min': 8.9e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00004420',
        'limit': 11593.37919736,
        'pair': '1ST_BTC',
        'maxLimit': 11593.37919736,
        'min': 54.75251862,
        'minerFee': 0.00125
      },
      {
        'rate': '2214.87898544',
        'limit': 0.25830049,
        'pair': 'BTC_SALT',
        'maxLimit': 0.25830049,
        'min': 0.00004373,
        'minerFee': 0.05
      },
      {
        'rate': '0.00043378',
        'limit': 590.6981482,
        'pair': 'SALT_BTC',
        'maxLimit': 590.6981482,
        'min': 5.58185228,
        'minerFee': 0.00125
      },
      {
        'rate': '41561.97654941',
        'limit': 0.51660097,
        'pair': 'BTC_XEM',
        'maxLimit': 0.51660097,
        'min': 0.00019016,
        'minerFee': 4
      },
      {
        'rate': '0.00002357',
        'limit': 21733.31818956,
        'pair': 'XEM_BTC',
        'maxLimit': 21733.31818956,
        'min': 104.69011725,
        'minerFee': 0.00125
      },
      {
        'rate': '64290.34348671',
        'limit': 0.51660097,
        'pair': 'BTC_RCN',
        'maxLimit': 0.51660097,
        'min': 0.00006,
        'minerFee': 2
      },
      {
        'rate': '0.00001487',
        'limit': 34440.0648162,
        'pair': 'RCN_BTC',
        'maxLimit': 34440.0648162,
        'min': 162.022035,
        'minerFee': 0.00125
      },
      {
        'rate': '4726.19047619',
        'limit': 0.51660097,
        'pair': 'BTC_NMC',
        'maxLimit': 0.51660097,
        'min': 0.00000191,
        'minerFee': 0.005
      },
      {
        'rate': '0.00018995',
        'limit': 496.85281567,
        'pair': 'NMC_BTC',
        'maxLimit': 496.85281567,
        'min': 11.9047619,
        'minerFee': 0.00125
      },
      {
        'rate': '331.35245217',
        'limit': 0.51660097,
        'pair': 'BTC_REP',
        'maxLimit': 0.51660097,
        'min': 0.00005809,
        'minerFee': 0.01
      },
      {
        'rate': '0.00288248',
        'limit': 177.87635866,
        'pair': 'REP_BTC',
        'maxLimit': 177.87635866,
        'min': 0.83464094,
        'minerFee': 0.00125
      },
      {
        'rate': '81.05296167',
        'limit': 0.51660097,
        'pair': 'BTC_GNO',
        'maxLimit': 0.51660097,
        'min': 0.00024062,
        'minerFee': 0.01
      },
      {
        'rate': '0.01194097',
        'limit': 42.93840538,
        'pair': 'GNO_BTC',
        'maxLimit': 42.93840538,
        'min': 0.20416363,
        'minerFee': 0.00125
      },
      {
        'rate': '40743.02134646',
        'limit': 0.51660097,
        'pair': 'BTC_ZRX',
        'maxLimit': 0.51660097,
        'min': 2.4e-7,
        'minerFee': 0.005
      },
      {
        'rate': '0.00002372',
        'limit': 21615.10390834,
        'pair': 'ZRX_BTC',
        'maxLimit': 21615.10390834,
        'min': 102.6272578,
        'minerFee': 0.00125
      },
      {
        'rate': '0.04270075',
        'limit': 15065.64508335,
        'pair': 'BLK_CLAM',
        'maxLimit': 15065.64508335,
        'min': 0.04403312,
        'minerFee': 0.001
      },
      {
        'rate': '21.78538806',
        'limit': 670.0227909,
        'pair': 'CLAM_BLK',
        'maxLimit': 670.0227909,
        'min': 0.00086264,
        'minerFee': 0.01
      },
      {
        'rate': '28.05545454',
        'limit': 15065.64508335,
        'pair': 'BLK_DGB',
        'maxLimit': 15065.64508335,
        'min': 0.00068532,
        'minerFee': 0.01
      },
      {
        'rate': '0.03392347',
        'limit': 430500.81020252,
        'pair': 'DGB_BLK',
        'maxLimit': 430500.81020252,
        'min': 0.56677686,
        'minerFee': 0.01
      },
      {
        'rate': '161.65285714',
        'limit': 15065.64508335,
        'pair': 'BLK_DOGE',
        'maxLimit': 15065.64508335,
        'min': 0.02284409,
        'minerFee': 2
      },
      {
        'rate': '0.00565391',
        'limit': 2583004.86121515,
        'pair': 'DOGE_BLK',
        'maxLimit': 2583004.86121515,
        'min': 3.26571429,
        'minerFee': 0.01
      },
      {
        'rate': '0.01374415',
        'limit': 15065.64508335,
        'pair': 'BLK_FCT',
        'maxLimit': 15065.64508335,
        'min': 13.85134209,
        'minerFee': 0.1
      },
      {
        'rate': '68.52951499',
        'limit': 212.99882997,
        'pair': 'FCT_BLK',
        'maxLimit': 212.99882997,
        'min': 0.00027766,
        'minerFee': 0.01
      },
      {
        'rate': '0.05276902',
        'limit': 15065.64508335,
        'pair': 'BLK_MONA',
        'maxLimit': 15065.64508335,
        'min': 7.21964592,
        'minerFee': 0.2
      },
      {
        'rate': '17.85959908',
        'limit': 817.30314556,
        'pair': 'MONA_BLK',
        'maxLimit': 817.30314556,
        'min': 0.00106658,
        'minerFee': 0.01
      },
      {
        'rate': '1.66898230',
        'limit': 15065.64508335,
        'pair': 'BLK_NXT',
        'maxLimit': 15065.64508335,
        'min': 1.15077099,
        'minerFee': 1
      },
      {
        'rate': '0.56963163',
        'limit': 25637.76504322,
        'pair': 'NXT_BLK',
        'maxLimit': 25637.76504322,
        'min': 0.03371681,
        'minerFee': 0.01
      },
      {
        'rate': '1.16838688',
        'limit': 15065.64508335,
        'pair': 'BLK_POT',
        'maxLimit': 15065.64508335,
        'min': 0.01656196,
        'minerFee': 0.01
      },
      {
        'rate': '0.81981724',
        'limit': 17813.82662907,
        'pair': 'POT_BLK',
        'maxLimit': 17813.82662907,
        'min': 0.0236157,
        'minerFee': 0.01
      },
      {
        'rate': '242.35682142',
        'limit': 15065.64508335,
        'pair': 'BLK_RDD',
        'maxLimit': 15065.64508335,
        'min': 0.00006853,
        'minerFee': 0.01
      },
      {
        'rate': '0.00339063',
        'limit': 4305000.68880011,
        'pair': 'RDD_BLK',
        'maxLimit': 4305000.68880011,
        'min': 4.89857143,
        'minerFee': 0.01
      },
      {
        'rate': '4.53003404',
        'limit': 15065.64508335,
        'pair': 'BLK_START',
        'maxLimit': 15065.64508335,
        'min': 0.00742433,
        'minerFee': 0.02
      },
      {
        'rate': '0.18365933',
        'limit': 79477.06633617,
        'pair': 'START_BLK',
        'maxLimit': 79477.06633617,
        'min': 0.09156208,
        'minerFee': 0.01
      },
      {
        'rate': '0.57372148',
        'limit': 3285.56688894,
        'pair': 'BLK_VRC',
        'maxLimit': 15065.64508335,
        'min': 0.00064295,
        'minerFee': 0.0002
      },
      {
        'rate': '1.59048986',
        'limit': 9177.49104318,
        'pair': 'VRC_BLK',
        'maxLimit': 9177.49104318,
        'min': 0.01159033,
        'minerFee': 0.01
      },
      {
        'rate': '0.06098122',
        'limit': 15065.64508335,
        'pair': 'BLK_VTC',
        'maxLimit': 15065.64508335,
        'min': 0.63275842,
        'minerFee': 0.02
      },
      {
        'rate': '15.66077098',
        'limit': 932.52639437,
        'pair': 'VTC_BLK',
        'maxLimit': 932.52639437,
        'min': 0.00123257,
        'minerFee': 0.01
      },
      {
        'rate': '3.36940963',
        'limit': 15065.64508335,
        'pair': 'BLK_VOX',
        'maxLimit': 15065.64508335,
        'min': 0.00556254,
        'minerFee': 0.01
      },
      {
        'rate': '0.27520645',
        'limit': 20936.54867898,
        'pair': 'VOX_BLK',
        'maxLimit': 20936.54867898,
        'min': 0.06810328,
        'minerFee': 0.01
      },
      {
        'rate': '51.40902272',
        'limit': 15065.64508335,
        'pair': 'BLK_SC',
        'maxLimit': 15065.64508335,
        'min': 0.37121645,
        'minerFee': 10
      },
      {
        'rate': '0.01836593',
        'limit': 794770.72652774,
        'pair': 'SC_BLK',
        'maxLimit': 794770.72652774,
        'min': 1.03909091,
        'minerFee': 0.01
      },
      {
        'rate': '1.13137562',
        'limit': 15065.64508335,
        'pair': 'BLK_LBC',
        'maxLimit': 15065.64508335,
        'min': 0.03379783,
        'minerFee': 0.02
      },
      {
        'rate': '0.83607381',
        'limit': 17458.63373582,
        'pair': 'LBC_BLK',
        'maxLimit': 17458.63373582,
        'min': 0.02286762,
        'minerFee': 0.01
      },
      {
        'rate': '0.05780624',
        'limit': 15065.64508335,
        'pair': 'BLK_WAVES',
        'maxLimit': 15065.64508335,
        'min': 0.03328155,
        'minerFee': 0.001
      },
      {
        'rate': '16.46604854',
        'limit': 886.47294297,
        'pair': 'WAVES_BLK',
        'maxLimit': 886.47294297,
        'min': 0.00116839,
        'minerFee': 0.01
      },
      {
        'rate': '0.15094739',
        'limit': 15065.64508335,
        'pair': 'BLK_GAME',
        'maxLimit': 15065.64508335,
        'min': 2.49902913,
        'minerFee': 0.2
      },
      {
        'rate': '6.18509708',
        'limit': 2361.17268725,
        'pair': 'GAME_BLK',
        'maxLimit': 2361.17268725,
        'min': 0.00305098,
        'minerFee': 0.01
      },
      {
        'rate': '0.10666107',
        'limit': 15065.64508335,
        'pair': 'BLK_KMD',
        'maxLimit': 15065.64508335,
        'min': 0.03626499,
        'minerFee': 0.002
      },
      {
        'rate': '8.97105225',
        'limit': 1627.08967371,
        'pair': 'KMD_BLK',
        'maxLimit': 1627.08967371,
        'min': 0.00215586,
        'minerFee': 0.01
      },
      {
        'rate': '2.09185912',
        'limit': 15065.64508335,
        'pair': 'BLK_SNGLS',
        'maxLimit': 15065.64508335,
        'min': 2.73272416,
        'minerFee': 3
      },
      {
        'rate': '0.45067175',
        'limit': 32388.7751647,
        'pair': 'SNGLS_BLK',
        'maxLimit': 32388.7751647,
        'min': 0.04228113,
        'minerFee': 0.01
      },
      {
        'rate': '0.91255645',
        'limit': 15065.64508335,
        'pair': 'BLK_GNT',
        'maxLimit': 15065.64508335,
        'min': 0.02089663,
        'minerFee': 0.01
      },
      {
        'rate': '1.03438320',
        'limit': 14118.6382138,
        'pair': 'GNT_BLK',
        'maxLimit': 14118.6382138,
        'min': 0.01843548,
        'minerFee': 0.01
      },
      {
        'rate': '0.18265479',
        'limit': 15065.64508335,
        'pair': 'BLK_SWT',
        'maxLimit': 15065.64508335,
        'min': 0.97984009,
        'minerFee': 0.1
      },
      {
        'rate': '4.84775885',
        'limit': 3011.02157862,
        'pair': 'SWT_BLK',
        'maxLimit': 3011.02157862,
        'min': 0.00369186,
        'minerFee': 0.01
      },
      {
        'rate': '0.56212649',
        'limit': 15065.64508335,
        'pair': 'BLK_WINGS',
        'maxLimit': 15065.64508335,
        'min': 0.0335751,
        'minerFee': 0.01
      },
      {
        'rate': '1.66112806',
        'limit': 8787.22524652,
        'pair': 'WINGS_BLK',
        'maxLimit': 8787.22524652,
        'min': 0.01136183,
        'minerFee': 0.01
      },
      {
        'rate': '0.75905939',
        'limit': 15065.64508335,
        'pair': 'BLK_TRST',
        'maxLimit': 15065.64508335,
        'min': 0.0243004,
        'minerFee': 0.01
      },
      {
        'rate': '1.20226227',
        'limit': 12141.03335152,
        'pair': 'TRST_BLK',
        'maxLimit': 12141.03335152,
        'min': 0.01534228,
        'minerFee': 0.01
      },
      {
        'rate': '0.51565281',
        'limit': 15065.64508335,
        'pair': 'BLK_RLC',
        'maxLimit': 15065.64508335,
        'min': 0.03595089,
        'minerFee': 0.01
      },
      {
        'rate': '1.77867004',
        'limit': 8206.52851665,
        'pair': 'RLC_BLK',
        'maxLimit': 8206.52851665,
        'min': 0.01042249,
        'minerFee': 0.01
      },
      {
        'rate': '1.47649934',
        'limit': 6850.93042695,
        'pair': 'BLK_GUP',
        'maxLimit': 6850.93042695,
        'min': 0.01267847,
        'minerFee': 0.01
      },
      {
        'rate': '0.62726727',
        'limit': 6670.4980368,
        'pair': 'GUP_BLK',
        'maxLimit': 6670.4980368,
        'min': 0.02984334,
        'minerFee': 0.01
      },
      {
        'rate': '0.14499980',
        'limit': 15065.64508335,
        'pair': 'BLK_ANT',
        'maxLimit': 15065.64508335,
        'min': 0.13135351,
        'minerFee': 0.01
      },
      {
        'rate': '6.49871501',
        'limit': 2246.09118367,
        'pair': 'ANT_BLK',
        'maxLimit': 2246.09118367,
        'min': 0.00293077,
        'minerFee': 0.01
      },
      {
        'rate': '0.00581988',
        'limit': 15065.64508335,
        'pair': 'BLK_DCR',
        'maxLimit': 15065.64508335,
        'min': 9.93717875,
        'minerFee': 0.03
      },
      {
        'rate': '163.88063963',
        'limit': 89.06913315,
        'pair': 'DCR_BLK',
        'maxLimit': 89.06913315,
        'min': 0.00011763,
        'minerFee': 0.01
      },
      {
        'rate': '1.75077167',
        'limit': 15065.64508335,
        'pair': 'BLK_BAT',
        'maxLimit': 15065.64508335,
        'min': 0.01092519,
        'minerFee': 0.01
      },
      {
        'rate': '0.54052355',
        'limit': 27004.75547533,
        'pair': 'BAT_BLK',
        'maxLimit': 27004.75547533,
        'min': 0.035387,
        'minerFee': 0.01
      },
      {
        'rate': '0.11699984',
        'limit': 15065.64508335,
        'pair': 'BLK_BNT',
        'maxLimit': 15065.64508335,
        'min': 0.15567105,
        'minerFee': 0.01
      },
      {
        'rate': '7.70182495',
        'limit': 1895.22698531,
        'pair': 'BNT_BLK',
        'maxLimit': 1895.22698531,
        'min': 0.00236483,
        'minerFee': 0.01
      },
      {
        'rate': '8.37776666',
        'limit': 15065.64508335,
        'pair': 'BLK_SNT',
        'maxLimit': 15065.64508335,
        'min': 0.66818961,
        'minerFee': 3
      },
      {
        'rate': '0.11019560',
        'limit': 132461.78775462,
        'pair': 'SNT_BLK',
        'maxLimit': 132461.78775462,
        'min': 0.16933333,
        'minerFee': 0.01
      },
      {
        'rate': '0.02111240',
        'limit': 15065.64508335,
        'pair': 'BLK_NMR',
        'maxLimit': 15065.64508335,
        'min': 0.34266134,
        'minerFee': 0.004
      },
      {
        'rate': '42.38292404',
        'limit': 344.40064816,
        'pair': 'NMR_BLK',
        'maxLimit': 344.40064816,
        'min': 0.00042673,
        'minerFee': 0.01
      },
      {
        'rate': '0.36527026',
        'limit': 15065.64508335,
        'pair': 'BLK_EDG',
        'maxLimit': 15065.64508335,
        'min': 1.55910908,
        'minerFee': 0.3
      },
      {
        'rate': '2.57123072',
        'limit': 5676.93376091,
        'pair': 'EDG_BLK',
        'maxLimit': 5676.93376091,
        'min': 0.00738293,
        'minerFee': 0.01
      },
      {
        'rate': '0.92000962',
        'limit': 15065.64508335,
        'pair': 'BLK_CVC',
        'maxLimit': 15065.64508335,
        'min': 0.20582524,
        'minerFee': 0.1
      },
      {
        'rate': '1.01883495',
        'limit': 14334.10006435,
        'pair': 'CVC_BLK',
        'maxLimit': 14334.10006435,
        'min': 0.01859544,
        'minerFee': 0.01
      },
      {
        'rate': '0.05835002',
        'limit': 11838.94614422,
        'pair': 'BLK_MTL',
        'maxLimit': 11838.94614422,
        'min': 0.32673901,
        'minerFee': 0.01
      },
      {
        'rate': '16.16541233',
        'limit': 902.95912056,
        'pair': 'MTL_BLK',
        'maxLimit': 902.95912056,
        'min': 0.00117938,
        'minerFee': 0.01
      },
      {
        'rate': '13.57198199',
        'limit': 15065.64508335,
        'pair': 'BLK_FUN',
        'maxLimit': 15065.64508335,
        'min': 0.00138778,
        'minerFee': 0.01
      },
      {
        'rate': '0.06866033',
        'limit': 212592.98817303,
        'pair': 'FUN_BLK',
        'maxLimit': 212592.98817303,
        'min': 0.27432,
        'minerFee': 0.01
      },
      {
        'rate': '6.92448061',
        'limit': 15065.64508335,
        'pair': 'BLK_DNT',
        'maxLimit': 15065.64508335,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.13279982',
        'limit': 109915.10047724,
        'pair': 'DNT_BLK',
        'maxLimit': 109915.10047724,
        'min': 0.13995918,
        'minerFee': 0.01
      },
      {
        'rate': '0.74310019',
        'limit': 15065.64508335,
        'pair': 'BLK_1ST',
        'maxLimit': 15065.64508335,
        'min': 0.02544832,
        'minerFee': 0.01
      },
      {
        'rate': '1.25905539',
        'limit': 11593.37908983,
        'pair': '1ST_BLK',
        'maxLimit': 11593.37908983,
        'min': 0.01501971,
        'minerFee': 0.01
      },
      {
        'rate': '0.07575679',
        'limit': 7532.82257572,
        'pair': 'BLK_SALT',
        'maxLimit': 7532.82257572,
        'min': 1.24865791,
        'minerFee': 0.05
      },
      {
        'rate': '12.35547001',
        'limit': 590.6981482,
        'pair': 'SALT_BLK',
        'maxLimit': 590.6981482,
        'min': 0.00153121,
        'minerFee': 0.01
      },
      {
        'rate': '1.42157035',
        'limit': 15065.64508335,
        'pair': 'BLK_XEM',
        'maxLimit': 15065.64508335,
        'min': 5.43003998,
        'minerFee': 4
      },
      {
        'rate': '0.67162806',
        'limit': 21733.31814232,
        'pair': 'XEM_BLK',
        'maxLimit': 21733.31814232,
        'min': 0.02871859,
        'minerFee': 0.01
      },
      {
        'rate': '2.19896014',
        'limit': 15065.64508335,
        'pair': 'BLK_RCN',
        'maxLimit': 15065.64508335,
        'min': 1.71330668,
        'minerFee': 2
      },
      {
        'rate': '0.42382924',
        'limit': 34440.0648162,
        'pair': 'RCN_BLK',
        'maxLimit': 34440.0648162,
        'min': 0.04444588,
        'minerFee': 0.01
      },
      {
        'rate': '0.16165285',
        'limit': 15065.64508335,
        'pair': 'BLK_NMC',
        'maxLimit': 15065.64508335,
        'min': 0.05465163,
        'minerFee': 0.005
      },
      {
        'rate': '5.41051113',
        'limit': 496.85281567,
        'pair': 'NMC_BLK',
        'maxLimit': 496.85281567,
        'min': 0.00326571,
        'minerFee': 0.01
      },
      {
        'rate': '0.01133345',
        'limit': 15065.64508335,
        'pair': 'BLK_REP',
        'maxLimit': 15065.64508335,
        'min': 1.65863507,
        'minerFee': 0.01
      },
      {
        'rate': '82.10243575',
        'limit': 177.87635866,
        'pair': 'REP_BLK',
        'maxLimit': 177.87635866,
        'min': 0.00022896,
        'minerFee': 0.01
      },
      {
        'rate': '0.00277230',
        'limit': 15065.64508335,
        'pair': 'BLK_GNO',
        'maxLimit': 15065.64508335,
        'min': 6.87105083,
        'minerFee': 0.01
      },
      {
        'rate': '340.11701599',
        'limit': 42.93840538,
        'pair': 'GNO_BLK',
        'maxLimit': 42.93840538,
        'min': 0.00005601,
        'minerFee': 0.01
      },
      {
        'rate': '1.39355911',
        'limit': 15065.64508335,
        'pair': 'BLK_ZRX',
        'maxLimit': 15065.64508335,
        'min': 0.00682467,
        'minerFee': 0.005
      },
      {
        'rate': '0.67564249',
        'limit': 21615.10344113,
        'pair': 'ZRX_BLK',
        'maxLimit': 21615.10344113,
        'min': 0.02815271,
        'minerFee': 0.01
      },
      {
        'rate': '630.83454545',
        'limit': 670.0227909,
        'pair': 'CLAM_DGB',
        'maxLimit': 670.0227909,
        'min': 0.00003019,
        'minerFee': 0.01
      },
      {
        'rate': '0.00149509',
        'limit': 430500.81020252,
        'pair': 'DGB_CLAM',
        'maxLimit': 430500.81020252,
        'min': 1.27441322,
        'minerFee': 0.001
      },
      {
        'rate': '3634.80857142',
        'limit': 670.0227909,
        'pair': 'CLAM_DOGE',
        'maxLimit': 670.0227909,
        'min': 0.00100629,
        'minerFee': 2
      },
      {
        'rate': '0.00024918',
        'limit': 2583004.86121515,
        'pair': 'DOGE_CLAM',
        'maxLimit': 2583004.86121515,
        'min': 7.34304762,
        'minerFee': 0.001
      },
      {
        'rate': '0.30904106',
        'limit': 670.0227909,
        'pair': 'CLAM_FCT',
        'maxLimit': 670.0227909,
        'min': 0.61015597,
        'minerFee': 0.1
      },
      {
        'rate': '3.02027207',
        'limit': 212.99882997,
        'pair': 'FCT_CLAM',
        'maxLimit': 212.99882997,
        'min': 0.00062433,
        'minerFee': 0.001
      },
      {
        'rate': '1.18652590',
        'limit': 670.0227909,
        'pair': 'CLAM_MONA',
        'maxLimit': 670.0227909,
        'min': 0.31802767,
        'minerFee': 0.2
      },
      {
        'rate': '0.78711849',
        'limit': 817.30314556,
        'pair': 'MONA_CLAM',
        'maxLimit': 817.30314556,
        'min': 0.00239823,
        'minerFee': 0.001
      },
      {
        'rate': '37.52752212',
        'limit': 670.0227909,
        'pair': 'CLAM_NXT',
        'maxLimit': 670.0227909,
        'min': 0.05069182,
        'minerFee': 1
      },
      {
        'rate': '0.02510512',
        'limit': 25637.76504322,
        'pair': 'NXT_CLAM',
        'maxLimit': 25637.76504322,
        'min': 0.07581318,
        'minerFee': 0.001
      },
      {
        'rate': '26.27149758',
        'limit': 670.0227909,
        'pair': 'CLAM_POT',
        'maxLimit': 670.0227909,
        'min': 0.00072956,
        'minerFee': 0.01
      },
      {
        'rate': '0.03613144',
        'limit': 17813.82662907,
        'pair': 'POT_CLAM',
        'maxLimit': 17813.82662907,
        'min': 0.05310055,
        'minerFee': 0.001
      },
      {
        'rate': '5449.45921428',
        'limit': 670.0227909,
        'pair': 'CLAM_RDD',
        'maxLimit': 670.0227909,
        'min': 0.00000302,
        'minerFee': 0.01
      },
      {
        'rate': '0.00014943',
        'limit': 4305000.68880011,
        'pair': 'RDD_CLAM',
        'maxLimit': 4305000.68880011,
        'min': 11.01457143,
        'minerFee': 0.001
      },
      {
        'rate': '101.85905073',
        'limit': 670.0227909,
        'pair': 'CLAM_START',
        'maxLimit': 670.0227909,
        'min': 0.00032704,
        'minerFee': 0.02
      },
      {
        'rate': '0.00809433',
        'limit': 79477.06633617,
        'pair': 'START_CLAM',
        'maxLimit': 79477.06633617,
        'min': 0.20587984,
        'minerFee': 0.001
      },
      {
        'rate': '12.90028392',
        'limit': 146.12083814,
        'pair': 'CLAM_VRC',
        'maxLimit': 670.0227909,
        'min': 0.00002832,
        'minerFee': 0.0002
      },
      {
        'rate': '0.07009698',
        'limit': 9177.49104318,
        'pair': 'VRC_CLAM',
        'maxLimit': 9177.49104318,
        'min': 0.02606118,
        'minerFee': 0.001
      },
      {
        'rate': '1.37117952',
        'limit': 670.0227909,
        'pair': 'CLAM_VTC',
        'maxLimit': 670.0227909,
        'min': 0.02787321,
        'minerFee': 0.02
      },
      {
        'rate': '0.69021030',
        'limit': 932.52639437,
        'pair': 'VTC_CLAM',
        'maxLimit': 932.52639437,
        'min': 0.00277146,
        'minerFee': 0.001
      },
      {
        'rate': '75.76209433',
        'limit': 670.0227909,
        'pair': 'CLAM_VOX',
        'maxLimit': 670.0227909,
        'min': 0.00024503,
        'minerFee': 0.01
      },
      {
        'rate': '0.01212905',
        'limit': 20936.54867898,
        'pair': 'VOX_CLAM',
        'maxLimit': 20936.54867898,
        'min': 0.15313208,
        'minerFee': 0.001
      },
      {
        'rate': '1155.94589393',
        'limit': 670.0227909,
        'pair': 'CLAM_SC',
        'maxLimit': 670.0227909,
        'min': 0.0163522,
        'minerFee': 10
      },
      {
        'rate': '0.00080943',
        'limit': 794770.72652774,
        'pair': 'SC_CLAM',
        'maxLimit': 794770.72652774,
        'min': 2.33642424,
        'minerFee': 0.001
      },
      {
        'rate': '25.43928942',
        'limit': 670.0227909,
        'pair': 'CLAM_LBC',
        'maxLimit': 670.0227909,
        'min': 0.00148881,
        'minerFee': 0.02
      },
      {
        'rate': '0.03684792',
        'limit': 17458.63373582,
        'pair': 'LBC_CLAM',
        'maxLimit': 17458.63373582,
        'min': 0.05141847,
        'minerFee': 0.001
      },
      {
        'rate': '1.29978923',
        'limit': 670.0227909,
        'pair': 'CLAM_WAVES',
        'maxLimit': 670.0227909,
        'min': 0.00146606,
        'minerFee': 0.001
      },
      {
        'rate': '0.72570113',
        'limit': 886.47294297,
        'pair': 'WAVES_CLAM',
        'maxLimit': 886.47294297,
        'min': 0.00262716,
        'minerFee': 0.001
      },
      {
        'rate': '3.39409329',
        'limit': 670.0227909,
        'pair': 'CLAM_GAME',
        'maxLimit': 670.0227909,
        'min': 0.11008302,
        'minerFee': 0.2
      },
      {
        'rate': '0.27259307',
        'limit': 2361.17268725,
        'pair': 'GAME_CLAM',
        'maxLimit': 2361.17268725,
        'min': 0.00686022,
        'minerFee': 0.001
      },
      {
        'rate': '2.39830338',
        'limit': 670.0227909,
        'pair': 'CLAM_KMD',
        'maxLimit': 670.0227909,
        'min': 0.00159748,
        'minerFee': 0.002
      },
      {
        'rate': '0.39537735',
        'limit': 1627.08967371,
        'pair': 'KMD_CLAM',
        'maxLimit': 1627.08967371,
        'min': 0.00484751,
        'minerFee': 0.001
      },
      {
        'rate': '47.03602281',
        'limit': 670.0227909,
        'pair': 'CLAM_SNGLS',
        'maxLimit': 670.0227909,
        'min': 0.12037736,
        'minerFee': 3
      },
      {
        'rate': '0.01986226',
        'limit': 32388.7751647,
        'pair': 'SNGLS_CLAM',
        'maxLimit': 32388.7751647,
        'min': 0.09507028,
        'minerFee': 0.001
      },
      {
        'rate': '20.51908064',
        'limit': 670.0227909,
        'pair': 'CLAM_GNT',
        'maxLimit': 670.0227909,
        'min': 0.0009205,
        'minerFee': 0.01
      },
      {
        'rate': '0.04558791',
        'limit': 14118.6382138,
        'pair': 'GNT_CLAM',
        'maxLimit': 14118.6382138,
        'min': 0.04145269,
        'minerFee': 0.001
      },
      {
        'rate': '4.10704290',
        'limit': 670.0227909,
        'pair': 'CLAM_SWT',
        'maxLimit': 670.0227909,
        'min': 0.04316226,
        'minerFee': 0.1
      },
      {
        'rate': '0.21365320',
        'limit': 3011.02157862,
        'pair': 'SWT_CLAM',
        'maxLimit': 3011.02157862,
        'min': 0.00830125,
        'minerFee': 0.001
      },
      {
        'rate': '12.63956742',
        'limit': 670.0227909,
        'pair': 'CLAM_WINGS',
        'maxLimit': 670.0227909,
        'min': 0.00147899,
        'minerFee': 0.01
      },
      {
        'rate': '0.07321018',
        'limit': 8787.22524652,
        'pair': 'WINGS_CLAM',
        'maxLimit': 8787.22524652,
        'min': 0.02554738,
        'minerFee': 0.001
      },
      {
        'rate': '17.06765749',
        'limit': 670.0227909,
        'pair': 'CLAM_TRST',
        'maxLimit': 670.0227909,
        'min': 0.00107044,
        'minerFee': 0.01
      },
      {
        'rate': '0.05298679',
        'limit': 12141.03335152,
        'pair': 'TRST_CLAM',
        'maxLimit': 12141.03335152,
        'min': 0.03449754,
        'minerFee': 0.001
      },
      {
        'rate': '11.59459407',
        'limit': 670.0227909,
        'pair': 'CLAM_RLC',
        'maxLimit': 670.0227909,
        'min': 0.00158365,
        'minerFee': 0.01
      },
      {
        'rate': '0.07839056',
        'limit': 8206.52851665,
        'pair': 'RLC_CLAM',
        'maxLimit': 8206.52851665,
        'min': 0.02343526,
        'minerFee': 0.001
      },
      {
        'rate': '33.19949042',
        'limit': 304.6852278,
        'pair': 'CLAM_GUP',
        'maxLimit': 304.6852278,
        'min': 0.00055849,
        'minerFee': 0.01
      },
      {
        'rate': '0.02764528',
        'limit': 6670.4980368,
        'pair': 'GUP_CLAM',
        'maxLimit': 6670.4980368,
        'min': 0.06710357,
        'minerFee': 0.001
      },
      {
        'rate': '3.26036021',
        'limit': 670.0227909,
        'pair': 'CLAM_ANT',
        'maxLimit': 670.0227909,
        'min': 0.00578616,
        'minerFee': 0.01
      },
      {
        'rate': '0.28641509',
        'limit': 2246.09118367,
        'pair': 'ANT_CLAM',
        'maxLimit': 2246.09118367,
        'min': 0.00658991,
        'minerFee': 0.001
      },
      {
        'rate': '0.13086179',
        'limit': 670.0227909,
        'pair': 'CLAM_DCR',
        'maxLimit': 670.0227909,
        'min': 0.43773585,
        'minerFee': 0.03
      },
      {
        'rate': '7.22264150',
        'limit': 89.06913315,
        'pair': 'DCR_CLAM',
        'maxLimit': 89.06913315,
        'min': 0.0002645,
        'minerFee': 0.001
      },
      {
        'rate': '39.36657843',
        'limit': 670.0227909,
        'pair': 'CLAM_BAT',
        'maxLimit': 670.0227909,
        'min': 0.00048126,
        'minerFee': 0.01
      },
      {
        'rate': '0.02382226',
        'limit': 27004.75547533,
        'pair': 'BAT_CLAM',
        'maxLimit': 27004.75547533,
        'min': 0.07956863,
        'minerFee': 0.001
      },
      {
        'rate': '2.63077341',
        'limit': 670.0227909,
        'pair': 'CLAM_BNT',
        'maxLimit': 670.0227909,
        'min': 0.00685736,
        'minerFee': 0.01
      },
      {
        'rate': '0.33943924',
        'limit': 1895.22698531,
        'pair': 'BNT_CLAM',
        'maxLimit': 1895.22698531,
        'min': 0.00531738,
        'minerFee': 0.001
      },
      {
        'rate': '188.37636790',
        'limit': 670.0227909,
        'pair': 'CLAM_SNT',
        'maxLimit': 670.0227909,
        'min': 0.02943396,
        'minerFee': 3
      },
      {
        'rate': '0.00485660',
        'limit': 132461.78775462,
        'pair': 'SNT_CLAM',
        'maxLimit': 132461.78775462,
        'min': 0.38075062,
        'minerFee': 0.001
      },
      {
        'rate': '0.47471815',
        'limit': 670.0227909,
        'pair': 'CLAM_NMR',
        'maxLimit': 670.0227909,
        'min': 0.01509434,
        'minerFee': 0.004
      },
      {
        'rate': '1.86792452',
        'limit': 344.40064816,
        'pair': 'NMR_CLAM',
        'maxLimit': 344.40064816,
        'min': 0.00095951,
        'minerFee': 0.001
      },
      {
        'rate': '8.21320152',
        'limit': 670.0227909,
        'pair': 'CLAM_EDG',
        'maxLimit': 670.0227909,
        'min': 0.06867925,
        'minerFee': 0.3
      },
      {
        'rate': '0.11332075',
        'limit': 5676.93376091,
        'pair': 'EDG_CLAM',
        'maxLimit': 5676.93376091,
        'min': 0.01660071,
        'minerFee': 0.001
      },
      {
        'rate': '20.68666729',
        'limit': 670.0227909,
        'pair': 'CLAM_CVC',
        'maxLimit': 670.0227909,
        'min': 0.00906667,
        'minerFee': 0.1
      },
      {
        'rate': '0.04490266',
        'limit': 14334.10006435,
        'pair': 'CVC_CLAM',
        'maxLimit': 14334.10006435,
        'min': 0.04181236,
        'minerFee': 0.001
      },
      {
        'rate': '1.31201618',
        'limit': 526.52001671,
        'pair': 'CLAM_MTL',
        'maxLimit': 526.52001671,
        'min': 0.01439296,
        'minerFee': 0.01
      },
      {
        'rate': '0.71245132',
        'limit': 902.95912056,
        'pair': 'MTL_CLAM',
        'maxLimit': 902.95912056,
        'min': 0.00265188,
        'minerFee': 0.001
      },
      {
        'rate': '305.16971600',
        'limit': 670.0227909,
        'pair': 'CLAM_FUN',
        'maxLimit': 670.0227909,
        'min': 0.00006113,
        'minerFee': 0.01
      },
      {
        'rate': '0.00302603',
        'limit': 212592.98817303,
        'pair': 'FUN_CLAM',
        'maxLimit': 212592.98817303,
        'min': 0.616816,
        'minerFee': 0.001
      },
      {
        'rate': '155.69883469',
        'limit': 670.0227909,
        'pair': 'CLAM_DNT',
        'maxLimit': 670.0227909,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00585283',
        'limit': 109915.10047724,
        'pair': 'DNT_CLAM',
        'maxLimit': 109915.10047724,
        'min': 0.31470204,
        'minerFee': 0.001
      },
      {
        'rate': '16.70881055',
        'limit': 670.0227909,
        'pair': 'CLAM_1ST',
        'maxLimit': 670.0227909,
        'min': 0.00112101,
        'minerFee': 0.01
      },
      {
        'rate': '0.05548981',
        'limit': 11593.37908983,
        'pair': '1ST_CLAM',
        'maxLimit': 11593.37908983,
        'min': 0.03377223,
        'minerFee': 0.001
      },
      {
        'rate': '1.70341227',
        'limit': 335.01139545,
        'pair': 'CLAM_SALT',
        'maxLimit': 335.01139545,
        'min': 0.05500377,
        'minerFee': 0.05
      },
      {
        'rate': '0.54453735',
        'limit': 590.6981482,
        'pair': 'SALT_CLAM',
        'maxLimit': 590.6981482,
        'min': 0.00344298,
        'minerFee': 0.001
      },
      {
        'rate': '31.96439698',
        'limit': 670.0227909,
        'pair': 'CLAM_XEM',
        'maxLimit': 670.0227909,
        'min': 0.23919497,
        'minerFee': 4
      },
      {
        'rate': '0.02960037',
        'limit': 21733.31814232,
        'pair': 'XEM_CLAM',
        'maxLimit': 21733.31814232,
        'min': 0.06457454,
        'minerFee': 0.001
      },
      {
        'rate': '49.44421840',
        'limit': 670.0227909,
        'pair': 'CLAM_RCN',
        'maxLimit': 670.0227909,
        'min': 0.0754717,
        'minerFee': 2
      },
      {
        'rate': '0.01867924',
        'limit': 34440.0648162,
        'pair': 'RCN_CLAM',
        'maxLimit': 34440.0648162,
        'min': 0.09993778,
        'minerFee': 0.001
      },
      {
        'rate': '3.63480857',
        'limit': 670.0227909,
        'pair': 'CLAM_NMC',
        'maxLimit': 670.0227909,
        'min': 0.00240742,
        'minerFee': 0.005
      },
      {
        'rate': '0.23845508',
        'limit': 496.85281567,
        'pair': 'NMC_CLAM',
        'maxLimit': 496.85281567,
        'min': 0.00734305,
        'minerFee': 0.001
      },
      {
        'rate': '0.25483584',
        'limit': 670.0227909,
        'pair': 'CLAM_REP',
        'maxLimit': 670.0227909,
        'min': 0.0730634,
        'minerFee': 0.01
      },
      {
        'rate': '3.61846469',
        'limit': 177.87635866,
        'pair': 'REP_CLAM',
        'maxLimit': 177.87635866,
        'min': 0.00051482,
        'minerFee': 0.001
      },
      {
        'rate': '0.06233604',
        'limit': 670.0227909,
        'pair': 'CLAM_GNO',
        'maxLimit': 670.0227909,
        'min': 0.30267195,
        'minerFee': 0.01
      },
      {
        'rate': '14.98982830',
        'limit': 42.93840538,
        'pair': 'GNO_CLAM',
        'maxLimit': 42.93840538,
        'min': 0.00012593,
        'minerFee': 0.001
      },
      {
        'rate': '31.33455665',
        'limit': 670.0227909,
        'pair': 'CLAM_ZRX',
        'maxLimit': 670.0227909,
        'min': 0.00030063,
        'minerFee': 0.005
      },
      {
        'rate': '0.02977729',
        'limit': 21615.10344113,
        'pair': 'ZRX_CLAM',
        'maxLimit': 21615.10344113,
        'min': 0.06330213,
        'minerFee': 0.001
      },
      {
        'rate': '5.66000000',
        'limit': 430500.81020252,
        'pair': 'DGB_DOGE',
        'maxLimit': 430500.81020252,
        'min': 0.66115702,
        'minerFee': 2
      },
      {
        'rate': '0.16371900',
        'limit': 2583004.86121515,
        'pair': 'DOGE_DGB',
        'maxLimit': 2583004.86121515,
        'min': 0.11428571,
        'minerFee': 0.01
      },
      {
        'rate': '0.00048122',
        'limit': 430500.81020252,
        'pair': 'DGB_FCT',
        'maxLimit': 430500.81020252,
        'min': 400.88760331,
        'minerFee': 0.1
      },
      {
        'rate': '1984.39363636',
        'limit': 212.99882997,
        'pair': 'FCT_DGB',
        'maxLimit': 212.99882997,
        'min': 0.00000972,
        'minerFee': 0.01
      },
      {
        'rate': '0.00184761',
        'limit': 430500.81020252,
        'pair': 'DGB_MONA',
        'maxLimit': 430500.81020252,
        'min': 208.95206612,
        'minerFee': 0.2
      },
      {
        'rate': '517.15636363',
        'limit': 817.30314556,
        'pair': 'MONA_DGB',
        'maxLimit': 817.30314556,
        'min': 0.00003733,
        'minerFee': 0.01
      },
      {
        'rate': '0.05843657',
        'limit': 430500.81020252,
        'pair': 'DGB_NXT',
        'maxLimit': 430500.81020252,
        'min': 33.30578512,
        'minerFee': 1
      },
      {
        'rate': '16.49469008',
        'limit': 25637.76504322,
        'pair': 'NXT_DGB',
        'maxLimit': 25637.76504322,
        'min': 0.00117994,
        'minerFee': 0.01
      },
      {
        'rate': '0.04090909',
        'limit': 430500.81020252,
        'pair': 'DGB_POT',
        'maxLimit': 430500.81020252,
        'min': 0.47933884,
        'minerFee': 0.01
      },
      {
        'rate': '23.73925619',
        'limit': 17813.82662907,
        'pair': 'POT_DGB',
        'maxLimit': 17813.82662907,
        'min': 0.00082645,
        'minerFee': 0.01
      },
      {
        'rate': '8.48571428',
        'limit': 430500.81020252,
        'pair': 'DGB_RDD',
        'maxLimit': 430500.81020252,
        'min': 0.00198347,
        'minerFee': 0.01
      },
      {
        'rate': '0.09818181',
        'limit': 4305000.68880011,
        'pair': 'RDD_DGB',
        'maxLimit': 4305000.68880011,
        'min': 0.17142857,
        'minerFee': 0.01
      },
      {
        'rate': '0.15861148',
        'limit': 430500.81020252,
        'pair': 'DGB_START',
        'maxLimit': 430500.81020252,
        'min': 0.21487603,
        'minerFee': 0.02
      },
      {
        'rate': '5.31818181',
        'limit': 79477.06633617,
        'pair': 'START_DGB',
        'maxLimit': 79477.06633617,
        'min': 0.00320427,
        'minerFee': 0.01
      },
      {
        'rate': '0.02008788',
        'limit': 93885.07385151,
        'pair': 'DGB_VRC',
        'maxLimit': 430500.81020252,
        'min': 0.01860826,
        'minerFee': 0.0002
      },
      {
        'rate': '46.05545454',
        'limit': 9177.49104318,
        'pair': 'VRC_DGB',
        'maxLimit': 9177.49104318,
        'min': 0.00040561,
        'minerFee': 0.01
      },
      {
        'rate': '0.00213515',
        'limit': 430500.81020252,
        'pair': 'DGB_VTC',
        'maxLimit': 430500.81020252,
        'min': 18.31338843,
        'minerFee': 0.02
      },
      {
        'rate': '453.48528099',
        'limit': 932.52639437,
        'pair': 'VTC_DGB',
        'maxLimit': 932.52639437,
        'min': 0.00004313,
        'minerFee': 0.01
      },
      {
        'rate': '0.11797418',
        'limit': 430500.81020252,
        'pair': 'DGB_VOX',
        'maxLimit': 430500.81020252,
        'min': 0.16099174,
        'minerFee': 0.01
      },
      {
        'rate': '7.96909090',
        'limit': 20936.54867898,
        'pair': 'VOX_DGB',
        'maxLimit': 20936.54867898,
        'min': 0.00238332,
        'minerFee': 0.01
      },
      {
        'rate': '1.79999999',
        'limit': 430500.81020252,
        'pair': 'DGB_SC',
        'maxLimit': 430500.81020252,
        'min': 10.74380165,
        'minerFee': 10
      },
      {
        'rate': '0.53181818',
        'limit': 794770.72652774,
        'pair': 'SC_DGB',
        'maxLimit': 794770.72652774,
        'min': 0.03636364,
        'minerFee': 0.01
      },
      {
        'rate': '0.03961320',
        'limit': 430500.81020252,
        'pair': 'DGB_LBC',
        'maxLimit': 430500.81020252,
        'min': 0.97818182,
        'minerFee': 0.02
      },
      {
        'rate': '24.20999999',
        'limit': 17458.63373582,
        'pair': 'LBC_DGB',
        'maxLimit': 17458.63373582,
        'min': 0.00080027,
        'minerFee': 0.01
      },
      {
        'rate': '0.00202398',
        'limit': 430500.81020252,
        'pair': 'DGB_WAVES',
        'maxLimit': 430500.81020252,
        'min': 0.96323967,
        'minerFee': 0.001
      },
      {
        'rate': '476.80363636',
        'limit': 886.47294297,
        'pair': 'WAVES_DGB',
        'maxLimit': 886.47294297,
        'min': 0.00004089,
        'minerFee': 0.01
      },
      {
        'rate': '0.00528516',
        'limit': 430500.81020252,
        'pair': 'DGB_GAME',
        'maxLimit': 430500.81020252,
        'min': 72.32727273,
        'minerFee': 0.2
      },
      {
        'rate': '179.10040909',
        'limit': 2361.17268725,
        'pair': 'GAME_DGB',
        'maxLimit': 2361.17268725,
        'min': 0.00010677,
        'minerFee': 0.01
      },
      {
        'rate': '0.00373455',
        'limit': 430500.81020252,
        'pair': 'DGB_KMD',
        'maxLimit': 430500.81020252,
        'min': 1.04958678,
        'minerFee': 0.002
      },
      {
        'rate': '259.77272727',
        'limit': 1627.08967371,
        'pair': 'KMD_DGB',
        'maxLimit': 1627.08967371,
        'min': 0.00007545,
        'minerFee': 0.01
      },
      {
        'rate': '0.07324290',
        'limit': 430500.81020252,
        'pair': 'DGB_SNGLS',
        'maxLimit': 430500.81020252,
        'min': 79.09090909,
        'minerFee': 3
      },
      {
        'rate': '13.05000000',
        'limit': 32388.7751647,
        'pair': 'SNGLS_DGB',
        'maxLimit': 32388.7751647,
        'min': 0.00147965,
        'minerFee': 0.01
      },
      {
        'rate': '0.03195161',
        'limit': 430500.81020252,
        'pair': 'DGB_GNT',
        'maxLimit': 430500.81020252,
        'min': 0.60479339,
        'minerFee': 0.01
      },
      {
        'rate': '29.95239256',
        'limit': 14118.6382138,
        'pair': 'GNT_DGB',
        'maxLimit': 14118.6382138,
        'min': 0.00064516,
        'minerFee': 0.01
      },
      {
        'rate': '0.00639534',
        'limit': 430500.81020252,
        'pair': 'DGB_SWT',
        'maxLimit': 430500.81020252,
        'min': 28.35867769,
        'minerFee': 0.1
      },
      {
        'rate': '140.37545454',
        'limit': 3011.02157862,
        'pair': 'SWT_DGB',
        'maxLimit': 3011.02157862,
        'min': 0.0001292,
        'minerFee': 0.01
      },
      {
        'rate': '0.01968190',
        'limit': 430500.81020252,
        'pair': 'DGB_WINGS',
        'maxLimit': 430500.81020252,
        'min': 0.97173554,
        'minerFee': 0.01
      },
      {
        'rate': '48.10090909',
        'limit': 8787.22524652,
        'pair': 'WINGS_DGB',
        'maxLimit': 8787.22524652,
        'min': 0.00039761,
        'minerFee': 0.01
      },
      {
        'rate': '0.02657718',
        'limit': 430500.81020252,
        'pair': 'DGB_TRST',
        'maxLimit': 430500.81020252,
        'min': 0.70330579,
        'minerFee': 0.01
      },
      {
        'rate': '34.81363636',
        'limit': 12141.03335152,
        'pair': 'TRST_DGB',
        'maxLimit': 12141.03335152,
        'min': 0.00053691,
        'minerFee': 0.01
      },
      {
        'rate': '0.01805471',
        'limit': 430500.81020252,
        'pair': 'DGB_RLC',
        'maxLimit': 430500.81020252,
        'min': 1.04049587,
        'minerFee': 0.01
      },
      {
        'rate': '51.50454545',
        'limit': 8206.52851665,
        'pair': 'RLC_DGB',
        'maxLimit': 8206.52851665,
        'min': 0.00036474,
        'minerFee': 0.01
      },
      {
        'rate': '0.05169712',
        'limit': 195765.33695,
        'pair': 'DGB_GUP',
        'maxLimit': 195765.33695,
        'min': 0.36694215,
        'minerFee': 0.01
      },
      {
        'rate': '18.16363636',
        'limit': 6670.4980368,
        'pair': 'GUP_DGB',
        'maxLimit': 6670.4980368,
        'min': 0.00104439,
        'minerFee': 0.01
      },
      {
        'rate': '0.00507692',
        'limit': 430500.81020252,
        'pair': 'DGB_ANT',
        'maxLimit': 430500.81020252,
        'min': 3.80165289,
        'minerFee': 0.01
      },
      {
        'rate': '188.18181818',
        'limit': 2246.09118367,
        'pair': 'ANT_DGB',
        'maxLimit': 2246.09118367,
        'min': 0.00010256,
        'minerFee': 0.01
      },
      {
        'rate': '0.00020377',
        'limit': 430500.81020252,
        'pair': 'DGB_DCR',
        'maxLimit': 430500.81020252,
        'min': 287.60330579,
        'minerFee': 0.03
      },
      {
        'rate': '4745.45454545',
        'limit': 89.06913315,
        'pair': 'DCR_DGB',
        'maxLimit': 89.06913315,
        'min': 0.00000412,
        'minerFee': 0.01
      },
      {
        'rate': '0.06130030',
        'limit': 430500.81020252,
        'pair': 'DGB_BAT',
        'maxLimit': 430500.81020252,
        'min': 0.31619835,
        'minerFee': 0.01
      },
      {
        'rate': '15.65181818',
        'limit': 27004.75547533,
        'pair': 'BAT_DGB',
        'maxLimit': 27004.75547533,
        'min': 0.00123839,
        'minerFee': 0.01
      },
      {
        'rate': '0.00409655',
        'limit': 430500.81020252,
        'pair': 'DGB_BNT',
        'maxLimit': 430500.81020252,
        'min': 4.50545455,
        'minerFee': 0.01
      },
      {
        'rate': '223.02000000',
        'limit': 1895.22698531,
        'pair': 'BNT_DGB',
        'maxLimit': 1895.22698531,
        'min': 0.00008276,
        'minerFee': 0.01
      },
      {
        'rate': '0.29333333',
        'limit': 430500.81020252,
        'pair': 'DGB_SNT',
        'maxLimit': 430500.81020252,
        'min': 19.33884298,
        'minerFee': 3
      },
      {
        'rate': '3.19090909',
        'limit': 132461.78775462,
        'pair': 'SNT_DGB',
        'maxLimit': 132461.78775462,
        'min': 0.00592593,
        'minerFee': 0.01
      },
      {
        'rate': '0.00073921',
        'limit': 430500.81020252,
        'pair': 'DGB_NMR',
        'maxLimit': 430500.81020252,
        'min': 9.91735537,
        'minerFee': 0.004
      },
      {
        'rate': '1227.27272727',
        'limit': 344.40064816,
        'pair': 'NMR_DGB',
        'maxLimit': 344.40064816,
        'min': 0.00001493,
        'minerFee': 0.01
      },
      {
        'rate': '0.01278932',
        'limit': 430500.81020252,
        'pair': 'DGB_EDG',
        'maxLimit': 430500.81020252,
        'min': 45.12396694,
        'minerFee': 0.3
      },
      {
        'rate': '74.45454545',
        'limit': 5676.93376091,
        'pair': 'EDG_DGB',
        'maxLimit': 5676.93376091,
        'min': 0.00025837,
        'minerFee': 0.01
      },
      {
        'rate': '0.03221258',
        'limit': 430500.81020252,
        'pair': 'DGB_CVC',
        'maxLimit': 430500.81020252,
        'min': 5.95702479,
        'minerFee': 0.1
      },
      {
        'rate': '29.50216528',
        'limit': 14334.10006435,
        'pair': 'CVC_DGB',
        'maxLimit': 14334.10006435,
        'min': 0.00065076,
        'minerFee': 0.01
      },
      {
        'rate': '0.00204302',
        'limit': 338297.88607102,
        'pair': 'DGB_MTL',
        'maxLimit': 338297.88607102,
        'min': 9.45652893,
        'minerFee': 0.01
      },
      {
        'rate': '468.09818181',
        'limit': 902.95912056,
        'pair': 'MTL_DGB',
        'maxLimit': 902.95912056,
        'min': 0.00004127,
        'minerFee': 0.01
      },
      {
        'rate': '0.47519999',
        'limit': 430500.81020252,
        'pair': 'DGB_FUN',
        'maxLimit': 430500.81020252,
        'min': 0.04016529,
        'minerFee': 0.01
      },
      {
        'rate': '1.98818181',
        'limit': 212592.98817303,
        'pair': 'FUN_DGB',
        'maxLimit': 212592.98817303,
        'min': 0.0096,
        'minerFee': 0.01
      },
      {
        'rate': '0.24244897',
        'limit': 430500.81020252,
        'pair': 'DGB_DNT',
        'maxLimit': 430500.81020252,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '3.84545454',
        'limit': 109915.10047724,
        'pair': 'DNT_DGB',
        'maxLimit': 109915.10047724,
        'min': 0.00489796,
        'minerFee': 0.01
      },
      {
        'rate': '0.02601839',
        'limit': 430500.81020252,
        'pair': 'DGB_1ST',
        'maxLimit': 430500.81020252,
        'min': 0.73652893,
        'minerFee': 0.01
      },
      {
        'rate': '36.45818181',
        'limit': 11593.37908983,
        'pair': '1ST_DGB',
        'maxLimit': 11593.37908983,
        'min': 0.00052562,
        'minerFee': 0.01
      },
      {
        'rate': '0.00265249',
        'limit': 215250.40510126,
        'pair': 'DGB_SALT',
        'maxLimit': 215250.40510126,
        'min': 36.13884298,
        'minerFee': 0.05
      },
      {
        'rate': '357.77454545',
        'limit': 590.6981482,
        'pair': 'SALT_DGB',
        'maxLimit': 590.6981482,
        'min': 0.00005359,
        'minerFee': 0.01
      },
      {
        'rate': '0.04977386',
        'limit': 430500.81020252,
        'pair': 'DGB_XEM',
        'maxLimit': 430500.81020252,
        'min': 157.15702479,
        'minerFee': 4
      },
      {
        'rate': '19.44818181',
        'limit': 21733.31814232,
        'pair': 'XEM_DGB',
        'maxLimit': 21733.31814232,
        'min': 0.00100503,
        'minerFee': 0.01
      },
      {
        'rate': '0.07699287',
        'limit': 430500.81020252,
        'pair': 'DGB_RCN',
        'maxLimit': 430500.81020252,
        'min': 49.58677686,
        'minerFee': 2
      },
      {
        'rate': '12.27272727',
        'limit': 34440.0648162,
        'pair': 'RCN_DGB',
        'maxLimit': 34440.0648162,
        'min': 0.00155541,
        'minerFee': 0.01
      },
      {
        'rate': '0.00565999',
        'limit': 430500.81020252,
        'pair': 'DGB_NMC',
        'maxLimit': 430500.81020252,
        'min': 1.58173554,
        'minerFee': 0.005
      },
      {
        'rate': '156.67090495',
        'limit': 496.85281567,
        'pair': 'NMC_DGB',
        'maxLimit': 496.85281567,
        'min': 0.00011429,
        'minerFee': 0.01
      },
      {
        'rate': '0.00039682',
        'limit': 430500.81020252,
        'pair': 'DGB_REP',
        'maxLimit': 430500.81020252,
        'min': 48.00446281,
        'minerFee': 0.01
      },
      {
        'rate': '2377.42102066',
        'limit': 177.87635866,
        'pair': 'REP_DGB',
        'maxLimit': 177.87635866,
        'min': 0.00000801,
        'minerFee': 0.01
      },
      {
        'rate': '0.00009706',
        'limit': 430500.81020252,
        'pair': 'DGB_GNO',
        'maxLimit': 430500.81020252,
        'min': 198.86297521,
        'minerFee': 0.01
      },
      {
        'rate': '9848.68884710',
        'limit': 42.93840538,
        'pair': 'GNO_DGB',
        'maxLimit': 42.93840538,
        'min': 0.00000196,
        'minerFee': 0.01
      },
      {
        'rate': '0.04879310',
        'limit': 430500.81020252,
        'pair': 'DGB_ZRX',
        'maxLimit': 430500.81020252,
        'min': 0.19752066,
        'minerFee': 0.005
      },
      {
        'rate': '19.56442148',
        'limit': 21615.10344113,
        'pair': 'ZRX_DGB',
        'maxLimit': 21615.10344113,
        'min': 0.00098522,
        'minerFee': 0.01
      },
      {
        'rate': '0.00008020',
        'limit': 2583004.86121515,
        'pair': 'DOGE_FCT',
        'maxLimit': 2583004.86121515,
        'min': 2309.87619048,
        'minerFee': 0.1
      },
      {
        'rate': '11433.88714285',
        'limit': 212.99882997,
        'pair': 'FCT_DOGE',
        'maxLimit': 212.99882997,
        'min': 0.0003239,
        'minerFee': 2
      },
      {
        'rate': '0.00030793',
        'limit': 2583004.86121515,
        'pair': 'DOGE_MONA',
        'maxLimit': 2583004.86121515,
        'min': 1203.96190476,
        'minerFee': 0.2
      },
      {
        'rate': '2979.80571428',
        'limit': 817.30314556,
        'pair': 'MONA_DOGE',
        'maxLimit': 817.30314556,
        'min': 0.00124419,
        'minerFee': 2
      },
      {
        'rate': '0.00973942',
        'limit': 2583004.86121515,
        'pair': 'DOGE_NXT',
        'maxLimit': 2583004.86121515,
        'min': 191.9047619,
        'minerFee': 1
      },
      {
        'rate': '95.04083333',
        'limit': 25637.76504322,
        'pair': 'NXT_DOGE',
        'maxLimit': 25637.76504322,
        'min': 0.03933137,
        'minerFee': 2
      },
      {
        'rate': '0.00681818',
        'limit': 2583004.86121515,
        'pair': 'DOGE_POT',
        'maxLimit': 2583004.86121515,
        'min': 2.76190476,
        'minerFee': 0.01
      },
      {
        'rate': '136.78333333',
        'limit': 17813.82662907,
        'pair': 'POT_DOGE',
        'maxLimit': 17813.82662907,
        'min': 0.02754821,
        'minerFee': 2
      },
      {
        'rate': '1.41428571',
        'limit': 2583004.86121515,
        'pair': 'DOGE_RDD',
        'maxLimit': 2583004.86121515,
        'min': 0.01142857,
        'minerFee': 0.01
      },
      {
        'rate': '0.56571428',
        'limit': 4305000.68880011,
        'pair': 'RDD_DOGE',
        'maxLimit': 4305000.68880011,
        'min': 5.71428571,
        'minerFee': 2
      },
      {
        'rate': '0.02643524',
        'limit': 2583004.86121515,
        'pair': 'DOGE_START',
        'maxLimit': 2583004.86121515,
        'min': 1.23809524,
        'minerFee': 0.02
      },
      {
        'rate': '30.64285714',
        'limit': 79477.06633617,
        'pair': 'START_DOGE',
        'maxLimit': 79477.06633617,
        'min': 0.10680908,
        'minerFee': 2
      },
      {
        'rate': '0.00334798',
        'limit': 563310.44310904,
        'pair': 'DOGE_VRC',
        'maxLimit': 2583004.86121515,
        'min': 0.10721905,
        'minerFee': 0.0002
      },
      {
        'rate': '265.36714285',
        'limit': 9177.49104318,
        'pair': 'VRC_DOGE',
        'maxLimit': 9177.49104318,
        'min': 0.01352037,
        'minerFee': 2
      },
      {
        'rate': '0.00035585',
        'limit': 2583004.86121515,
        'pair': 'DOGE_VTC',
        'maxLimit': 2583004.86121515,
        'min': 105.52,
        'minerFee': 0.02
      },
      {
        'rate': '2612.93900000',
        'limit': 932.52639437,
        'pair': 'VTC_DOGE',
        'maxLimit': 932.52639437,
        'min': 0.00143781,
        'minerFee': 2
      },
      {
        'rate': '0.01966236',
        'limit': 2583004.86121515,
        'pair': 'DOGE_VOX',
        'maxLimit': 2583004.86121515,
        'min': 0.92761905,
        'minerFee': 0.01
      },
      {
        'rate': '45.91714285',
        'limit': 20936.54867898,
        'pair': 'VOX_DOGE',
        'maxLimit': 20936.54867898,
        'min': 0.07944389,
        'minerFee': 2
      },
      {
        'rate': '0.30000000',
        'limit': 2583004.86121515,
        'pair': 'DOGE_SC',
        'maxLimit': 2583004.86121515,
        'min': 61.9047619,
        'minerFee': 10
      },
      {
        'rate': '3.06428571',
        'limit': 794770.72652774,
        'pair': 'SC_DOGE',
        'maxLimit': 794770.72652774,
        'min': 1.21212121,
        'minerFee': 2
      },
      {
        'rate': '0.00660220',
        'limit': 2583004.86121515,
        'pair': 'DOGE_LBC',
        'maxLimit': 2583004.86121515,
        'min': 5.63619048,
        'minerFee': 0.02
      },
      {
        'rate': '139.49571428',
        'limit': 17458.63373582,
        'pair': 'LBC_DOGE',
        'maxLimit': 17458.63373582,
        'min': 0.02667556,
        'minerFee': 2
      },
      {
        'rate': '0.00033733',
        'limit': 2583004.86121515,
        'pair': 'DOGE_WAVES',
        'maxLimit': 2583004.86121515,
        'min': 5.55009524,
        'minerFee': 0.001
      },
      {
        'rate': '2747.29714285',
        'limit': 886.47294297,
        'pair': 'WAVES_DOGE',
        'maxLimit': 886.47294297,
        'min': 0.00136295,
        'minerFee': 2
      },
      {
        'rate': '0.00088086',
        'limit': 2583004.86121515,
        'pair': 'DOGE_GAME',
        'maxLimit': 2583004.86121515,
        'min': 416.74285714,
        'minerFee': 0.2
      },
      {
        'rate': '1031.95950000',
        'limit': 2361.17268725,
        'pair': 'GAME_DOGE',
        'maxLimit': 2361.17268725,
        'min': 0.00355904,
        'minerFee': 2
      },
      {
        'rate': '0.00062242',
        'limit': 2583004.86121515,
        'pair': 'DOGE_KMD',
        'maxLimit': 2583004.86121515,
        'min': 6.04761905,
        'minerFee': 0.002
      },
      {
        'rate': '1496.78571428',
        'limit': 1627.08967371,
        'pair': 'KMD_DOGE',
        'maxLimit': 1627.08967371,
        'min': 0.00251485,
        'minerFee': 2
      },
      {
        'rate': '0.01220715',
        'limit': 2583004.86121515,
        'pair': 'DOGE_SNGLS',
        'maxLimit': 2583004.86121515,
        'min': 455.71428571,
        'minerFee': 3
      },
      {
        'rate': '75.19285714',
        'limit': 32388.7751647,
        'pair': 'SNGLS_DOGE',
        'maxLimit': 32388.7751647,
        'min': 0.04932182,
        'minerFee': 2
      },
      {
        'rate': '0.00532526',
        'limit': 2583004.86121515,
        'pair': 'DOGE_GNT',
        'maxLimit': 2583004.86121515,
        'min': 3.4847619,
        'minerFee': 0.01
      },
      {
        'rate': '172.58283333',
        'limit': 14118.6382138,
        'pair': 'GNT_DOGE',
        'maxLimit': 14118.6382138,
        'min': 0.02150538,
        'minerFee': 2
      },
      {
        'rate': '0.00106589',
        'limit': 2583004.86121515,
        'pair': 'DOGE_SWT',
        'maxLimit': 2583004.86121515,
        'min': 163.4,
        'minerFee': 0.1
      },
      {
        'rate': '808.83000000',
        'limit': 3011.02157862,
        'pair': 'SWT_DOGE',
        'maxLimit': 3011.02157862,
        'min': 0.00430663,
        'minerFee': 2
      },
      {
        'rate': '0.00328031',
        'limit': 2583004.86121515,
        'pair': 'DOGE_WINGS',
        'maxLimit': 2583004.86121515,
        'min': 5.59904762,
        'minerFee': 0.01
      },
      {
        'rate': '277.15285714',
        'limit': 8787.22524652,
        'pair': 'WINGS_DOGE',
        'maxLimit': 8787.22524652,
        'min': 0.01325381,
        'minerFee': 2
      },
      {
        'rate': '0.00442953',
        'limit': 2583004.86121515,
        'pair': 'DOGE_TRST',
        'maxLimit': 2583004.86121515,
        'min': 4.05238095,
        'minerFee': 0.01
      },
      {
        'rate': '200.59285714',
        'limit': 12141.03335152,
        'pair': 'TRST_DOGE',
        'maxLimit': 12141.03335152,
        'min': 0.01789709,
        'minerFee': 2
      },
      {
        'rate': '0.00300911',
        'limit': 2583004.86121515,
        'pair': 'DOGE_RLC',
        'maxLimit': 2583004.86121515,
        'min': 5.9952381,
        'minerFee': 0.01
      },
      {
        'rate': '296.76428571',
        'limit': 8206.52851665,
        'pair': 'RLC_DOGE',
        'maxLimit': 8206.52851665,
        'min': 0.01215805,
        'minerFee': 2
      },
      {
        'rate': '0.00861618',
        'limit': 1174592.0217,
        'pair': 'DOGE_GUP',
        'maxLimit': 1174592.0217,
        'min': 2.11428571,
        'minerFee': 0.01
      },
      {
        'rate': '104.65714285',
        'limit': 6670.4980368,
        'pair': 'GUP_DOGE',
        'maxLimit': 6670.4980368,
        'min': 0.03481288,
        'minerFee': 2
      },
      {
        'rate': '0.00084615',
        'limit': 2583004.86121515,
        'pair': 'DOGE_ANT',
        'maxLimit': 2583004.86121515,
        'min': 21.9047619,
        'minerFee': 0.01
      },
      {
        'rate': '1084.28571428',
        'limit': 2246.09118367,
        'pair': 'ANT_DOGE',
        'maxLimit': 2246.09118367,
        'min': 0.0034188,
        'minerFee': 2
      },
      {
        'rate': '0.00003396',
        'limit': 2583004.86121515,
        'pair': 'DOGE_DCR',
        'maxLimit': 2583004.86121515,
        'min': 1657.14285714,
        'minerFee': 0.03
      },
      {
        'rate': '27342.85714285',
        'limit': 89.06913315,
        'pair': 'DCR_DOGE',
        'maxLimit': 89.06913315,
        'min': 0.00013722,
        'minerFee': 2
      },
      {
        'rate': '0.01021671',
        'limit': 2583004.86121515,
        'pair': 'DOGE_BAT',
        'maxLimit': 2583004.86121515,
        'min': 1.82190476,
        'minerFee': 0.01
      },
      {
        'rate': '90.18428571',
        'limit': 27004.75547533,
        'pair': 'BAT_DOGE',
        'maxLimit': 27004.75547533,
        'min': 0.04127967,
        'minerFee': 2
      },
      {
        'rate': '0.00068275',
        'limit': 2583004.86121515,
        'pair': 'DOGE_BNT',
        'maxLimit': 2583004.86121515,
        'min': 25.96,
        'minerFee': 0.01
      },
      {
        'rate': '1285.02000000',
        'limit': 1895.22698531,
        'pair': 'BNT_DOGE',
        'maxLimit': 1895.22698531,
        'min': 0.00275862,
        'minerFee': 2
      },
      {
        'rate': '0.04888888',
        'limit': 2583004.86121515,
        'pair': 'DOGE_SNT',
        'maxLimit': 2583004.86121515,
        'min': 111.42857143,
        'minerFee': 3
      },
      {
        'rate': '18.38571428',
        'limit': 132461.78775462,
        'pair': 'SNT_DOGE',
        'maxLimit': 132461.78775462,
        'min': 0.19753086,
        'minerFee': 2
      },
      {
        'rate': '0.00012320',
        'limit': 2583004.86121515,
        'pair': 'DOGE_NMR',
        'maxLimit': 2583004.86121515,
        'min': 57.14285714,
        'minerFee': 0.004
      },
      {
        'rate': '7071.42857142',
        'limit': 344.40064816,
        'pair': 'NMR_DOGE',
        'maxLimit': 344.40064816,
        'min': 0.00049779,
        'minerFee': 2
      },
      {
        'rate': '0.00213155',
        'limit': 2583004.86121515,
        'pair': 'DOGE_EDG',
        'maxLimit': 2583004.86121515,
        'min': 260,
        'minerFee': 0.3
      },
      {
        'rate': '429.00000000',
        'limit': 5676.93376091,
        'pair': 'EDG_DOGE',
        'maxLimit': 5676.93376091,
        'min': 0.00861234,
        'minerFee': 2
      },
      {
        'rate': '0.00536876',
        'limit': 2583004.86121515,
        'pair': 'DOGE_CVC',
        'maxLimit': 2583004.86121515,
        'min': 34.32380952,
        'minerFee': 0.1
      },
      {
        'rate': '169.98866666',
        'limit': 14334.10006435,
        'pair': 'CVC_DOGE',
        'maxLimit': 14334.10006435,
        'min': 0.02169197,
        'minerFee': 2
      },
      {
        'rate': '0.00034050',
        'limit': 2029787.3164261,
        'pair': 'DOGE_MTL',
        'maxLimit': 2029787.3164261,
        'min': 54.48761905,
        'minerFee': 0.01
      },
      {
        'rate': '2697.13714285',
        'limit': 902.95912056,
        'pair': 'MTL_DOGE',
        'maxLimit': 902.95912056,
        'min': 0.00137578,
        'minerFee': 2
      },
      {
        'rate': '0.07919999',
        'limit': 2583004.86121515,
        'pair': 'DOGE_FUN',
        'maxLimit': 2583004.86121515,
        'min': 0.23142857,
        'minerFee': 0.01
      },
      {
        'rate': '11.45571428',
        'limit': 212592.98817303,
        'pair': 'FUN_DOGE',
        'maxLimit': 212592.98817303,
        'min': 0.32,
        'minerFee': 2
      },
      {
        'rate': '0.04040816',
        'limit': 2583004.86121515,
        'pair': 'DOGE_DNT',
        'maxLimit': 2583004.86121515,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '22.15714285',
        'limit': 109915.10047724,
        'pair': 'DNT_DOGE',
        'maxLimit': 109915.10047724,
        'min': 0.16326531,
        'minerFee': 2
      },
      {
        'rate': '0.00433639',
        'limit': 2583004.86121515,
        'pair': 'DOGE_1ST',
        'maxLimit': 2583004.86121515,
        'min': 4.24380952,
        'minerFee': 0.01
      },
      {
        'rate': '210.06857142',
        'limit': 11593.37908983,
        'pair': '1ST_DOGE',
        'maxLimit': 11593.37908983,
        'min': 0.01752081,
        'minerFee': 2
      },
      {
        'rate': '0.00044208',
        'limit': 1291502.43060757,
        'pair': 'DOGE_SALT',
        'maxLimit': 1291502.43060757,
        'min': 208.22857143,
        'minerFee': 0.05
      },
      {
        'rate': '2061.46285714',
        'limit': 590.6981482,
        'pair': 'SALT_DOGE',
        'maxLimit': 590.6981482,
        'min': 0.00178619,
        'minerFee': 2
      },
      {
        'rate': '0.00829564',
        'limit': 2583004.86121515,
        'pair': 'DOGE_XEM',
        'maxLimit': 2583004.86121515,
        'min': 905.52380952,
        'minerFee': 4
      },
      {
        'rate': '112.05857142',
        'limit': 21733.31814232,
        'pair': 'XEM_DOGE',
        'maxLimit': 21733.31814232,
        'min': 0.03350084,
        'minerFee': 2
      },
      {
        'rate': '0.01283214',
        'limit': 2583004.86121515,
        'pair': 'DOGE_RCN',
        'maxLimit': 2583004.86121515,
        'min': 285.71428571,
        'minerFee': 2
      },
      {
        'rate': '70.71428571',
        'limit': 34440.0648162,
        'pair': 'RCN_DOGE',
        'maxLimit': 34440.0648162,
        'min': 0.05184705,
        'minerFee': 2
      },
      {
        'rate': '0.00094333',
        'limit': 2583004.86121515,
        'pair': 'DOGE_NMC',
        'maxLimit': 2583004.86121515,
        'min': 9.11380952,
        'minerFee': 0.005
      },
      {
        'rate': '902.72283333',
        'limit': 496.85281567,
        'pair': 'NMC_DOGE',
        'maxLimit': 496.85281567,
        'min': 0.00380952,
        'minerFee': 2
      },
      {
        'rate': '0.00006613',
        'limit': 2583004.86121515,
        'pair': 'DOGE_REP',
        'maxLimit': 2583004.86121515,
        'min': 276.59714286,
        'minerFee': 0.01
      },
      {
        'rate': '13698.47350000',
        'limit': 177.87635866,
        'pair': 'REP_DOGE',
        'maxLimit': 177.87635866,
        'min': 0.00026709,
        'minerFee': 2
      },
      {
        'rate': '0.00001617',
        'limit': 2583004.86121515,
        'pair': 'DOGE_GNO',
        'maxLimit': 2583004.86121515,
        'min': 1145.82952381,
        'minerFee': 0.01
      },
      {
        'rate': '56747.20716666',
        'limit': 42.93840538,
        'pair': 'GNO_DOGE',
        'maxLimit': 42.93840538,
        'min': 0.00006533,
        'minerFee': 2
      },
      {
        'rate': '0.00813218',
        'limit': 2583004.86121515,
        'pair': 'DOGE_ZRX',
        'maxLimit': 2583004.86121515,
        'min': 1.13809524,
        'minerFee': 0.005
      },
      {
        'rate': '112.72833333',
        'limit': 21615.10344113,
        'pair': 'ZRX_DOGE',
        'maxLimit': 21615.10344113,
        'min': 0.03284072,
        'minerFee': 2
      },
      {
        'rate': '3.73241203',
        'limit': 212.99882997,
        'pair': 'FCT_MONA',
        'maxLimit': 212.99882997,
        'min': 0.10236403,
        'minerFee': 0.2
      },
      {
        'rate': '0.25335098',
        'limit': 817.30314556,
        'pair': 'MONA_FCT',
        'maxLimit': 817.30314556,
        'min': 0.75440365,
        'minerFee': 0.1
      },
      {
        'rate': '118.04898230',
        'limit': 212.99882997,
        'pair': 'FCT_NXT',
        'maxLimit': 212.99882997,
        'min': 0.01631625,
        'minerFee': 1
      },
      {
        'rate': '0.00808062',
        'limit': 25637.76504322,
        'pair': 'NXT_FCT',
        'maxLimit': 25637.76504322,
        'min': 23.84827925,
        'minerFee': 0.1
      },
      {
        'rate': '82.64130905',
        'limit': 212.99882997,
        'pair': 'FCT_POT',
        'maxLimit': 212.99882997,
        'min': 0.00023482,
        'minerFee': 0.01
      },
      {
        'rate': '0.01162968',
        'limit': 17813.82662907,
        'pair': 'POT_FCT',
        'maxLimit': 17813.82662907,
        'min': 16.70365014,
        'minerFee': 0.1
      },
      {
        'rate': '17142.16867857',
        'limit': 212.99882997,
        'pair': 'FCT_RDD',
        'maxLimit': 212.99882997,
        'min': 9.7e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00004809',
        'limit': 4305000.68880011,
        'pair': 'RDD_FCT',
        'maxLimit': 4305000.68880011,
        'min': 3464.81428571,
        'minerFee': 0.1
      },
      {
        'rate': '320.41436782',
        'limit': 212.99882997,
        'pair': 'FCT_START',
        'maxLimit': 212.99882997,
        'min': 0.00010527,
        'minerFee': 0.02
      },
      {
        'rate': '0.00260533',
        'limit': 79477.06633617,
        'pair': 'START_FCT',
        'maxLimit': 79477.06633617,
        'min': 64.76288385,
        'minerFee': 0.1
      },
      {
        'rate': '40.57996112',
        'limit': 46.4515058,
        'pair': 'FCT_VRC',
        'maxLimit': 212.99882997,
        'min': 0.00000912,
        'minerFee': 0.0002
      },
      {
        'rate': '0.02256221',
        'limit': 9177.49104318,
        'pair': 'VRC_FCT',
        'maxLimit': 9177.49104318,
        'min': 8.19797195,
        'minerFee': 0.1
      },
      {
        'rate': '4.31327033',
        'limit': 212.99882997,
        'pair': 'FCT_VTC',
        'maxLimit': 212.99882997,
        'min': 0.00897159,
        'minerFee': 0.02
      },
      {
        'rate': '0.22215900',
        'limit': 932.52639437,
        'pair': 'VTC_FCT',
        'maxLimit': 932.52639437,
        'min': 0.87180805,
        'minerFee': 0.1
      },
      {
        'rate': '238.32210675',
        'limit': 212.99882997,
        'pair': 'FCT_VOX',
        'maxLimit': 212.99882997,
        'min': 0.00007887,
        'minerFee': 0.01
      },
      {
        'rate': '0.00390399',
        'limit': 20936.54867898,
        'pair': 'VOX_FCT',
        'maxLimit': 20936.54867898,
        'min': 48.17020854,
        'minerFee': 0.1
      },
      {
        'rate': '3636.21759848',
        'limit': 212.99882997,
        'pair': 'FCT_SC',
        'maxLimit': 212.99882997,
        'min': 0.00526331,
        'minerFee': 10
      },
      {
        'rate': '0.00026053',
        'limit': 794770.72652774,
        'pair': 'SC_FCT',
        'maxLimit': 794770.72652774,
        'min': 734.96060606,
        'minerFee': 0.1
      },
      {
        'rate': '80.02346165',
        'limit': 212.99882997,
        'pair': 'FCT_LBC',
        'maxLimit': 212.99882997,
        'min': 0.0004792,
        'minerFee': 0.02
      },
      {
        'rate': '0.01186029',
        'limit': 17458.63373582,
        'pair': 'LBC_FCT',
        'maxLimit': 17458.63373582,
        'min': 16.17452484,
        'minerFee': 0.1
      },
      {
        'rate': '4.08870044',
        'limit': 212.99882997,
        'pair': 'FCT_WAVES',
        'maxLimit': 212.99882997,
        'min': 0.00047188,
        'minerFee': 0.001
      },
      {
        'rate': '0.23358249',
        'limit': 886.47294297,
        'pair': 'WAVES_FCT',
        'maxLimit': 886.47294297,
        'min': 0.82641747,
        'minerFee': 0.1
      },
      {
        'rate': '10.67667770',
        'limit': 212.99882997,
        'pair': 'FCT_GAME',
        'maxLimit': 212.99882997,
        'min': 0.03543258,
        'minerFee': 0.2
      },
      {
        'rate': '0.08773993',
        'limit': 2361.17268725,
        'pair': 'GAME_FCT',
        'maxLimit': 2361.17268725,
        'min': 2.15799448,
        'minerFee': 0.1
      },
      {
        'rate': '7.54425706',
        'limit': 212.99882997,
        'pair': 'FCT_KMD',
        'maxLimit': 212.99882997,
        'min': 0.00051418,
        'minerFee': 0.002
      },
      {
        'rate': '0.12726069',
        'limit': 1627.08967371,
        'pair': 'KMD_FCT',
        'maxLimit': 1627.08967371,
        'min': 1.52486247,
        'minerFee': 0.1
      },
      {
        'rate': '147.95953236',
        'limit': 212.99882997,
        'pair': 'FCT_SNGLS',
        'maxLimit': 212.99882997,
        'min': 0.03874604,
        'minerFee': 3
      },
      {
        'rate': '0.00639309',
        'limit': 32388.7751647,
        'pair': 'SNGLS_FCT',
        'maxLimit': 32388.7751647,
        'min': 29.90591862,
        'minerFee': 0.1
      },
      {
        'rate': '64.54613709',
        'limit': 212.99882997,
        'pair': 'FCT_GNT',
        'maxLimit': 212.99882997,
        'min': 0.00029628,
        'minerFee': 0.01
      },
      {
        'rate': '0.01467345',
        'limit': 14118.6382138,
        'pair': 'GNT_FCT',
        'maxLimit': 14118.6382138,
        'min': 13.03962366,
        'minerFee': 0.1
      },
      {
        'rate': '12.91937777',
        'limit': 212.99882997,
        'pair': 'FCT_SWT',
        'maxLimit': 212.99882997,
        'min': 0.0138927,
        'minerFee': 0.1
      },
      {
        'rate': '0.06876887',
        'limit': 3011.02157862,
        'pair': 'SWT_FCT',
        'maxLimit': 3011.02157862,
        'min': 2.61129414,
        'minerFee': 0.1
      },
      {
        'rate': '39.75983457',
        'limit': 212.99882997,
        'pair': 'FCT_WINGS',
        'maxLimit': 212.99882997,
        'min': 0.00047605,
        'minerFee': 0.01
      },
      {
        'rate': '0.02356427',
        'limit': 8787.22524652,
        'pair': 'WINGS_FCT',
        'maxLimit': 8787.22524652,
        'min': 8.03634858,
        'minerFee': 0.1
      },
      {
        'rate': '53.68911890',
        'limit': 212.99882997,
        'pair': 'FCT_TRST',
        'maxLimit': 212.99882997,
        'min': 0.00034454,
        'minerFee': 0.01
      },
      {
        'rate': '0.01705493',
        'limit': 12141.03335152,
        'pair': 'TRST_FCT',
        'maxLimit': 12141.03335152,
        'min': 10.85176734,
        'minerFee': 0.1
      },
      {
        'rate': '36.47269931',
        'limit': 212.99882997,
        'pair': 'FCT_RLC',
        'maxLimit': 212.99882997,
        'min': 0.00050973,
        'minerFee': 0.01
      },
      {
        'rate': '0.02523168',
        'limit': 8206.52851665,
        'pair': 'RLC_FCT',
        'maxLimit': 8206.52851665,
        'min': 7.37194529,
        'minerFee': 0.1
      },
      {
        'rate': '104.43444799',
        'limit': 96.85879035,
        'pair': 'FCT_GUP',
        'maxLimit': 96.85879035,
        'min': 0.00017976,
        'minerFee': 0.01
      },
      {
        'rate': '0.00889822',
        'limit': 6670.4980368,
        'pair': 'GUP_FCT',
        'maxLimit': 6670.4980368,
        'min': 21.10852916,
        'minerFee': 0.1
      },
      {
        'rate': '10.25599835',
        'limit': 212.99882997,
        'pair': 'FCT_ANT',
        'maxLimit': 212.99882997,
        'min': 0.0018624,
        'minerFee': 0.01
      },
      {
        'rate': '0.09218884',
        'limit': 2246.09118367,
        'pair': 'ANT_FCT',
        'maxLimit': 2246.09118367,
        'min': 2.07296581,
        'minerFee': 0.1
      },
      {
        'rate': '0.41164727',
        'limit': 212.99882997,
        'pair': 'FCT_DCR',
        'maxLimit': 212.99882997,
        'min': 0.14089468,
        'minerFee': 0.03
      },
      {
        'rate': '2.32476224',
        'limit': 89.06913315,
        'pair': 'DCR_FCT',
        'maxLimit': 89.06913315,
        'min': 0.08320309,
        'minerFee': 0.1
      },
      {
        'rate': '123.83403586',
        'limit': 212.99882997,
        'pair': 'FCT_BAT',
        'maxLimit': 212.99882997,
        'min': 0.0001549,
        'minerFee': 0.01
      },
      {
        'rate': '0.00766770',
        'limit': 27004.75547533,
        'pair': 'BAT_FCT',
        'maxLimit': 27004.75547533,
        'min': 25.02961816,
        'minerFee': 0.1
      },
      {
        'rate': '8.27552970',
        'limit': 212.99882997,
        'pair': 'FCT_BNT',
        'maxLimit': 212.99882997,
        'min': 0.00220719,
        'minerFee': 0.01
      },
      {
        'rate': '0.10925580',
        'limit': 1895.22698531,
        'pair': 'BNT_FCT',
        'maxLimit': 1895.22698531,
        'min': 1.67266897,
        'minerFee': 0.1
      },
      {
        'rate': '592.56879382',
        'limit': 212.99882997,
        'pair': 'FCT_SNT',
        'maxLimit': 212.99882997,
        'min': 0.00947395,
        'minerFee': 3
      },
      {
        'rate': '0.00156320',
        'limit': 132461.78775462,
        'pair': 'SNT_FCT',
        'maxLimit': 132461.78775462,
        'min': 119.77135802,
        'minerFee': 0.1
      },
      {
        'rate': '1.49330389',
        'limit': 212.99882997,
        'pair': 'FCT_NMR',
        'maxLimit': 212.99882997,
        'min': 0.00485844,
        'minerFee': 0.004
      },
      {
        'rate': '0.60123161',
        'limit': 344.40064816,
        'pair': 'NMR_FCT',
        'maxLimit': 344.40064816,
        'min': 0.30182999,
        'minerFee': 0.1
      },
      {
        'rate': '25.83597389',
        'limit': 212.99882997,
        'pair': 'FCT_EDG',
        'maxLimit': 212.99882997,
        'min': 0.02210589,
        'minerFee': 0.3
      },
      {
        'rate': '0.03647471',
        'limit': 5676.93376091,
        'pair': 'EDG_FCT',
        'maxLimit': 5676.93376091,
        'min': 5.22202605,
        'minerFee': 0.1
      },
      {
        'rate': '65.07330843',
        'limit': 212.99882997,
        'pair': 'FCT_CVC',
        'maxLimit': 212.99882997,
        'min': 0.0029183,
        'minerFee': 0.1
      },
      {
        'rate': '0.01445288',
        'limit': 14334.10006435,
        'pair': 'CVC_FCT',
        'maxLimit': 14334.10006435,
        'min': 13.15276573,
        'minerFee': 0.1
      },
      {
        'rate': '4.12716231',
        'limit': 167.37960117,
        'pair': 'FCT_MTL',
        'maxLimit': 167.37960117,
        'min': 0.00463268,
        'minerFee': 0.01
      },
      {
        'rate': '0.22931775',
        'limit': 902.95912056,
        'pair': 'MTL_FCT',
        'maxLimit': 902.95912056,
        'min': 0.83419147,
        'minerFee': 0.1
      },
      {
        'rate': '959.96144599',
        'limit': 212.99882997,
        'pair': 'FCT_FUN',
        'maxLimit': 212.99882997,
        'min': 0.00001968,
        'minerFee': 0.01
      },
      {
        'rate': '0.00097399',
        'limit': 212592.98817303,
        'pair': 'FUN_FCT',
        'maxLimit': 212592.98817303,
        'min': 194.0296,
        'minerFee': 0.1
      },
      {
        'rate': '489.77624795',
        'limit': 212.99882997,
        'pair': 'FCT_DNT',
        'maxLimit': 212.99882997,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00188385',
        'limit': 109915.10047724,
        'pair': 'DNT_FCT',
        'maxLimit': 109915.10047724,
        'min': 98.99469388,
        'minerFee': 0.1
      },
      {
        'rate': '52.56030694',
        'limit': 212.99882997,
        'pair': 'FCT_1ST',
        'maxLimit': 212.99882997,
        'min': 0.00036082,
        'minerFee': 0.01
      },
      {
        'rate': '0.01786058',
        'limit': 11593.37908983,
        'pair': '1ST_FCT',
        'maxLimit': 11593.37908983,
        'min': 10.62360929,
        'minerFee': 0.1
      },
      {
        'rate': '5.35836298',
        'limit': 106.49941498,
        'pair': 'FCT_SALT',
        'maxLimit': 106.49941498,
        'min': 0.01770415,
        'minerFee': 0.05
      },
      {
        'rate': '0.17527104',
        'limit': 590.6981482,
        'pair': 'SALT_FCT',
        'maxLimit': 590.6981482,
        'min': 1.08304457,
        'minerFee': 0.1
      },
      {
        'rate': '100.54925879',
        'limit': 212.99882997,
        'pair': 'FCT_XEM',
        'maxLimit': 212.99882997,
        'min': 0.07699004,
        'minerFee': 4
      },
      {
        'rate': '0.00952751',
        'limit': 21733.31814232,
        'pair': 'XEM_FCT',
        'maxLimit': 21733.31814232,
        'min': 20.31298157,
        'minerFee': 0.1
      },
      {
        'rate': '155.53490699',
        'limit': 212.99882997,
        'pair': 'FCT_RCN',
        'maxLimit': 212.99882997,
        'min': 0.02429219,
        'minerFee': 2
      },
      {
        'rate': '0.00601231',
        'limit': 34440.0648162,
        'pair': 'RCN_FCT',
        'maxLimit': 34440.0648162,
        'min': 31.43707064,
        'minerFee': 0.1
      },
      {
        'rate': '11.43388714',
        'limit': 212.99882997,
        'pair': 'FCT_NMC',
        'maxLimit': 212.99882997,
        'min': 0.00077488,
        'minerFee': 0.005
      },
      {
        'rate': '0.07675188',
        'limit': 496.85281567,
        'pair': 'NMC_FCT',
        'maxLimit': 496.85281567,
        'min': 2.30987619,
        'minerFee': 0.1
      },
      {
        'rate': '0.80162798',
        'limit': 212.99882997,
        'pair': 'FCT_REP',
        'maxLimit': 212.99882997,
        'min': 0.02351702,
        'minerFee': 0.01
      },
      {
        'rate': '1.16468055',
        'limit': 177.87635866,
        'pair': 'REP_FCT',
        'maxLimit': 177.87635866,
        'min': 0.16194505,
        'minerFee': 0.1
      },
      {
        'rate': '0.19608824',
        'limit': 212.99882997,
        'pair': 'FCT_GNO',
        'maxLimit': 212.99882997,
        'min': 0.09742147,
        'minerFee': 0.01
      },
      {
        'rate': '4.82479807',
        'limit': 42.93840538,
        'pair': 'GNO_FCT',
        'maxLimit': 42.93840538,
        'min': 0.03961379,
        'minerFee': 0.1
      },
      {
        'rate': '98.56799261',
        'limit': 212.99882997,
        'pair': 'FCT_ZRX',
        'maxLimit': 212.99882997,
        'min': 0.00009676,
        'minerFee': 0.005
      },
      {
        'rate': '0.00958446',
        'limit': 21615.10344113,
        'pair': 'ZRX_FCT',
        'maxLimit': 21615.10344113,
        'min': 19.91272578,
        'minerFee': 0.1
      },
      {
        'rate': '30.76495575',
        'limit': 817.30314556,
        'pair': 'MONA_NXT',
        'maxLimit': 817.30314556,
        'min': 0.06267594,
        'minerFee': 1
      },
      {
        'rate': '0.03102458',
        'limit': 25637.76504322,
        'pair': 'NXT_MONA',
        'maxLimit': 25637.76504322,
        'min': 12.43028515,
        'minerFee': 0.2
      },
      {
        'rate': '21.53729889',
        'limit': 817.30314556,
        'pair': 'MONA_POT',
        'maxLimit': 817.30314556,
        'min': 0.00090204,
        'minerFee': 0.01
      },
      {
        'rate': '0.04465077',
        'limit': 17813.82662907,
        'pair': 'POT_MONA',
        'maxLimit': 17813.82662907,
        'min': 8.70633609,
        'minerFee': 0.2
      },
      {
        'rate': '4467.45114285',
        'limit': 817.30314556,
        'pair': 'MONA_RDD',
        'maxLimit': 817.30314556,
        'min': 0.00000373,
        'minerFee': 0.01
      },
      {
        'rate': '0.00018466',
        'limit': 4305000.68880011,
        'pair': 'RDD_MONA',
        'maxLimit': 4305000.68880011,
        'min': 1805.94285714,
        'minerFee': 0.2
      },
      {
        'rate': '83.50375967',
        'limit': 817.30314556,
        'pair': 'MONA_START',
        'maxLimit': 817.30314556,
        'min': 0.00040436,
        'minerFee': 0.02
      },
      {
        'rate': '0.01000287',
        'limit': 79477.06633617,
        'pair': 'START_MONA',
        'maxLimit': 79477.06633617,
        'min': 33.75594126,
        'minerFee': 0.2
      },
      {
        'rate': '10.57561602',
        'limit': 178.2402364,
        'pair': 'MONA_VRC',
        'maxLimit': 817.30314556,
        'min': 0.00003502,
        'minerFee': 0.0002
      },
      {
        'rate': '0.08662491',
        'limit': 9177.49104318,
        'pair': 'VRC_MONA',
        'maxLimit': 9177.49104318,
        'min': 4.27297617,
        'minerFee': 0.2
      },
      {
        'rate': '1.12408907',
        'limit': 817.30314556,
        'pair': 'MONA_VTC',
        'maxLimit': 817.30314556,
        'min': 0.03446274,
        'minerFee': 0.02
      },
      {
        'rate': '0.85295292',
        'limit': 932.52639437,
        'pair': 'VTC_MONA',
        'maxLimit': 932.52639437,
        'min': 0.4544069,
        'minerFee': 0.2
      },
      {
        'rate': '62.10954915',
        'limit': 817.30314556,
        'pair': 'MONA_VOX',
        'maxLimit': 817.30314556,
        'min': 0.00030296,
        'minerFee': 0.01
      },
      {
        'rate': '0.01498892',
        'limit': 20936.54867898,
        'pair': 'VOX_MONA',
        'maxLimit': 20936.54867898,
        'min': 25.10744786,
        'minerFee': 0.2
      },
      {
        'rate': '947.64115151',
        'limit': 817.30314556,
        'pair': 'MONA_SC',
        'maxLimit': 817.30314556,
        'min': 0.02021804,
        'minerFee': 10
      },
      {
        'rate': '0.00100028',
        'limit': 794770.72652774,
        'pair': 'SC_MONA',
        'maxLimit': 794770.72652774,
        'min': 383.07878788,
        'minerFee': 0.2
      },
      {
        'rate': '20.85505701',
        'limit': 817.30314556,
        'pair': 'MONA_LBC',
        'maxLimit': 817.30314556,
        'min': 0.00184078,
        'minerFee': 0.02
      },
      {
        'rate': '0.04553617',
        'limit': 17458.63373582,
        'pair': 'LBC_MONA',
        'maxLimit': 17458.63373582,
        'min': 8.43054351,
        'minerFee': 0.2
      },
      {
        'rate': '1.06556351',
        'limit': 817.30314556,
        'pair': 'MONA_WAVES',
        'maxLimit': 817.30314556,
        'min': 0.00181266,
        'minerFee': 0.001
      },
      {
        'rate': '0.89681180',
        'limit': 886.47294297,
        'pair': 'WAVES_MONA',
        'maxLimit': 886.47294297,
        'min': 0.43074826,
        'minerFee': 0.2
      },
      {
        'rate': '2.78246801',
        'limit': 817.30314556,
        'pair': 'MONA_GAME',
        'maxLimit': 817.30314556,
        'min': 0.13610787,
        'minerFee': 0.2
      },
      {
        'rate': '0.33686698',
        'limit': 2361.17268725,
        'pair': 'GAME_MONA',
        'maxLimit': 2361.17268725,
        'min': 1.12479758,
        'minerFee': 0.2
      },
      {
        'rate': '1.96612228',
        'limit': 817.30314556,
        'pair': 'MONA_KMD',
        'maxLimit': 817.30314556,
        'min': 0.00197515,
        'minerFee': 0.002
      },
      {
        'rate': '0.48860207',
        'limit': 1627.08967371,
        'pair': 'KMD_MONA',
        'maxLimit': 1627.08967371,
        'min': 0.79479425,
        'minerFee': 0.2
      },
      {
        'rate': '38.55999753',
        'limit': 817.30314556,
        'pair': 'MONA_SNGLS',
        'maxLimit': 817.30314556,
        'min': 0.14883591,
        'minerFee': 3
      },
      {
        'rate': '0.02454552',
        'limit': 32388.7751647,
        'pair': 'SNGLS_MONA',
        'maxLimit': 32388.7751647,
        'min': 15.58766954,
        'minerFee': 0.2
      },
      {
        'rate': '16.82148387',
        'limit': 817.30314556,
        'pair': 'MONA_GNT',
        'maxLimit': 817.30314556,
        'min': 0.00113812,
        'minerFee': 0.01
      },
      {
        'rate': '0.05633695',
        'limit': 14118.6382138,
        'pair': 'GNT_MONA',
        'maxLimit': 14118.6382138,
        'min': 6.79655914,
        'minerFee': 0.2
      },
      {
        'rate': '3.36694207',
        'limit': 817.30314556,
        'pair': 'MONA_SWT',
        'maxLimit': 817.30314556,
        'min': 0.0533663,
        'minerFee': 0.1
      },
      {
        'rate': '0.26402979',
        'limit': 3011.02157862,
        'pair': 'SWT_MONA',
        'maxLimit': 3011.02157862,
        'min': 1.36106804,
        'minerFee': 0.2
      },
      {
        'rate': '10.36188137',
        'limit': 817.30314556,
        'pair': 'MONA_WINGS',
        'maxLimit': 817.30314556,
        'min': 0.00182864,
        'minerFee': 0.01
      },
      {
        'rate': '0.09047217',
        'limit': 8787.22524652,
        'pair': 'WINGS_MONA',
        'maxLimit': 8787.22524652,
        'min': 4.18873426,
        'minerFee': 0.2
      },
      {
        'rate': '13.99201700',
        'limit': 817.30314556,
        'pair': 'MONA_TRST',
        'maxLimit': 817.30314556,
        'min': 0.0013235,
        'minerFee': 0.01
      },
      {
        'rate': '0.06548037',
        'limit': 12141.03335152,
        'pair': 'TRST_MONA',
        'maxLimit': 12141.03335152,
        'min': 5.65619687,
        'minerFee': 0.2
      },
      {
        'rate': '9.50521519',
        'limit': 817.30314556,
        'pair': 'MONA_RLC',
        'maxLimit': 817.30314556,
        'min': 0.00195804,
        'minerFee': 0.01
      },
      {
        'rate': '0.09687401',
        'limit': 8206.52851665,
        'pair': 'RLC_MONA',
        'maxLimit': 8206.52851665,
        'min': 3.84243161,
        'minerFee': 0.2
      },
      {
        'rate': '27.21684769',
        'limit': 371.6592905,
        'pair': 'MONA_GUP',
        'maxLimit': 371.6592905,
        'min': 0.00069052,
        'minerFee': 0.01
      },
      {
        'rate': '0.03416367',
        'limit': 6670.4980368,
        'pair': 'GUP_MONA',
        'maxLimit': 6670.4980368,
        'min': 11.00226284,
        'minerFee': 0.2
      },
      {
        'rate': '2.67283401',
        'limit': 817.30314556,
        'pair': 'MONA_ANT',
        'maxLimit': 817.30314556,
        'min': 0.00715408,
        'minerFee': 0.01
      },
      {
        'rate': '0.35394796',
        'limit': 2246.09118367,
        'pair': 'ANT_MONA',
        'maxLimit': 2246.09118367,
        'min': 1.08047863,
        'minerFee': 0.2
      },
      {
        'rate': '0.10728013',
        'limit': 817.30314556,
        'pair': 'MONA_DCR',
        'maxLimit': 817.30314556,
        'min': 0.54122148,
        'minerFee': 0.03
      },
      {
        'rate': '8.92564425',
        'limit': 89.06913315,
        'pair': 'DCR_MONA',
        'maxLimit': 89.06913315,
        'min': 0.04336741,
        'minerFee': 0.2
      },
      {
        'rate': '32.27260887',
        'limit': 817.30314556,
        'pair': 'MONA_BAT',
        'maxLimit': 817.30314556,
        'min': 0.00059503,
        'minerFee': 0.01
      },
      {
        'rate': '0.02943923',
        'limit': 27004.75547533,
        'pair': 'BAT_MONA',
        'maxLimit': 27004.75547533,
        'min': 13.04602683,
        'minerFee': 0.2
      },
      {
        'rate': '2.15670055',
        'limit': 817.30314556,
        'pair': 'MONA_BNT',
        'maxLimit': 817.30314556,
        'min': 0.00847851,
        'minerFee': 0.01
      },
      {
        'rate': '0.41947450',
        'limit': 1895.22698531,
        'pair': 'BNT_MONA',
        'maxLimit': 1895.22698531,
        'min': 0.87183448,
        'minerFee': 0.2
      },
      {
        'rate': '154.43040987',
        'limit': 817.30314556,
        'pair': 'MONA_SNT',
        'maxLimit': 817.30314556,
        'min': 0.03639248,
        'minerFee': 3
      },
      {
        'rate': '0.00600172',
        'limit': 132461.78775462,
        'pair': 'SNT_MONA',
        'maxLimit': 132461.78775462,
        'min': 62.42765432,
        'minerFee': 0.2
      },
      {
        'rate': '0.38917258',
        'limit': 817.30314556,
        'pair': 'MONA_NMR',
        'maxLimit': 817.30314556,
        'min': 0.01866281,
        'minerFee': 0.004
      },
      {
        'rate': '2.30835627',
        'limit': 344.40064816,
        'pair': 'NMR_MONA',
        'maxLimit': 344.40064816,
        'min': 0.15732091,
        'minerFee': 0.2
      },
      {
        'rate': '6.73315922',
        'limit': 817.30314556,
        'pair': 'MONA_EDG',
        'maxLimit': 817.30314556,
        'min': 0.08491578,
        'minerFee': 0.3
      },
      {
        'rate': '0.14004028',
        'limit': 5676.93376091,
        'pair': 'EDG_MONA',
        'maxLimit': 5676.93376091,
        'min': 2.72184304,
        'minerFee': 0.2
      },
      {
        'rate': '16.95887093',
        'limit': 817.30314556,
        'pair': 'MONA_CVC',
        'maxLimit': 817.30314556,
        'min': 0.01121013,
        'minerFee': 0.1
      },
      {
        'rate': '0.05549013',
        'limit': 14334.10006435,
        'pair': 'CVC_MONA',
        'maxLimit': 14334.10006435,
        'min': 6.85553145,
        'minerFee': 0.2
      },
      {
        'rate': '1.07558712',
        'limit': 642.25646008,
        'pair': 'MONA_MTL',
        'maxLimit': 642.25646008,
        'min': 0.01779561,
        'minerFee': 0.01
      },
      {
        'rate': '0.88043786',
        'limit': 902.95912056,
        'pair': 'MTL_MONA',
        'maxLimit': 902.95912056,
        'min': 0.43480025,
        'minerFee': 0.2
      },
      {
        'rate': '250.17726399',
        'limit': 817.30314556,
        'pair': 'MONA_FUN',
        'maxLimit': 817.30314556,
        'min': 0.00007558,
        'minerFee': 0.01
      },
      {
        'rate': '0.00373953',
        'limit': 212592.98817303,
        'pair': 'FUN_MONA',
        'maxLimit': 212592.98817303,
        'min': 101.1328,
        'minerFee': 0.2
      },
      {
        'rate': '127.64146122',
        'limit': 817.30314556,
        'pair': 'MONA_DNT',
        'maxLimit': 817.30314556,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00723284',
        'limit': 109915.10047724,
        'pair': 'DNT_MONA',
        'maxLimit': 109915.10047724,
        'min': 51.59836735,
        'minerFee': 0.2
      },
      {
        'rate': '13.69783530',
        'limit': 817.30314556,
        'pair': 'MONA_1ST',
        'maxLimit': 817.30314556,
        'min': 0.00138602,
        'minerFee': 0.01
      },
      {
        'rate': '0.06857357',
        'limit': 11593.37908983,
        'pair': '1ST_MONA',
        'maxLimit': 11593.37908983,
        'min': 5.53727551,
        'minerFee': 0.2
      },
      {
        'rate': '1.39645253',
        'limit': 408.65157278,
        'pair': 'MONA_SALT',
        'maxLimit': 408.65157278,
        'min': 0.06800728,
        'minerFee': 0.05
      },
      {
        'rate': '0.67293202',
        'limit': 590.6981482,
        'pair': 'SALT_MONA',
        'maxLimit': 590.6981482,
        'min': 0.56450835,
        'minerFee': 0.2
      },
      {
        'rate': '26.20432160',
        'limit': 817.30314556,
        'pair': 'MONA_XEM',
        'maxLimit': 817.30314556,
        'min': 0.29574332,
        'minerFee': 4
      },
      {
        'rate': '0.03657975',
        'limit': 21733.31814232,
        'pair': 'XEM_MONA',
        'maxLimit': 21733.31814232,
        'min': 10.58760469,
        'minerFee': 0.2
      },
      {
        'rate': '40.53422942',
        'limit': 817.30314556,
        'pair': 'MONA_RCN',
        'maxLimit': 817.30314556,
        'min': 0.09331405,
        'minerFee': 2
      },
      {
        'rate': '0.02308356',
        'limit': 34440.0648162,
        'pair': 'RCN_MONA',
        'maxLimit': 34440.0648162,
        'min': 16.38574206,
        'minerFee': 0.2
      },
      {
        'rate': '2.97980571',
        'limit': 817.30314556,
        'pair': 'MONA_NMC',
        'maxLimit': 817.30314556,
        'min': 0.00297656,
        'minerFee': 0.005
      },
      {
        'rate': '0.29467969',
        'limit': 496.85281567,
        'pair': 'NMC_MONA',
        'maxLimit': 496.85281567,
        'min': 1.2039619,
        'minerFee': 0.2
      },
      {
        'rate': '0.20891369',
        'limit': 817.30314556,
        'pair': 'MONA_REP',
        'maxLimit': 817.30314556,
        'min': 0.0903364,
        'minerFee': 0.01
      },
      {
        'rate': '4.47165165',
        'limit': 177.87635866,
        'pair': 'REP_MONA',
        'maxLimit': 177.87635866,
        'min': 0.08440958,
        'minerFee': 0.2
      },
      {
        'rate': '0.05110290',
        'limit': 817.30314556,
        'pair': 'MONA_GNO',
        'maxLimit': 817.30314556,
        'min': 0.37422697,
        'minerFee': 0.01
      },
      {
        'rate': '18.52423505',
        'limit': 42.93840538,
        'pair': 'GNO_MONA',
        'maxLimit': 42.93840538,
        'min': 0.02064764,
        'minerFee': 0.2
      },
      {
        'rate': '25.68798029',
        'limit': 817.30314556,
        'pair': 'MONA_ZRX',
        'maxLimit': 817.30314556,
        'min': 0.0003717,
        'minerFee': 0.005
      },
      {
        'rate': '0.03679839',
        'limit': 21615.10344113,
        'pair': 'ZRX_MONA',
        'maxLimit': 21615.10344113,
        'min': 10.37898194,
        'minerFee': 0.2
      },
      {
        'rate': '0.68693181',
        'limit': 25637.76504322,
        'pair': 'NXT_POT',
        'maxLimit': 25637.76504322,
        'min': 0.02851524,
        'minerFee': 0.01
      },
      {
        'rate': '1.41221730',
        'limit': 17813.82662907,
        'pair': 'POT_NXT',
        'maxLimit': 17813.82662907,
        'min': 1.38774105,
        'minerFee': 1
      },
      {
        'rate': '142.48928571',
        'limit': 25637.76504322,
        'pair': 'NXT_RDD',
        'maxLimit': 25637.76504322,
        'min': 0.00011799,
        'minerFee': 0.01
      },
      {
        'rate': '0.00584070',
        'limit': 4305000.68880011,
        'pair': 'RDD_NXT',
        'maxLimit': 4305000.68880011,
        'min': 287.85714286,
        'minerFee': 1
      },
      {
        'rate': '2.66335113',
        'limit': 25637.76504322,
        'pair': 'NXT_START',
        'maxLimit': 25637.76504322,
        'min': 0.01278269,
        'minerFee': 0.02
      },
      {
        'rate': '0.31637168',
        'limit': 79477.06633617,
        'pair': 'START_NXT',
        'maxLimit': 79477.06633617,
        'min': 5.38050734,
        'minerFee': 1
      },
      {
        'rate': '0.33730902',
        'limit': 5591.17065121,
        'pair': 'NXT_VRC',
        'maxLimit': 25637.76504322,
        'min': 0.00110698,
        'minerFee': 0.0002
      },
      {
        'rate': '2.73977876',
        'limit': 9177.49104318,
        'pair': 'VRC_NXT',
        'maxLimit': 9177.49104318,
        'min': 0.68108839,
        'minerFee': 1
      },
      {
        'rate': '0.03585280',
        'limit': 25637.76504322,
        'pair': 'NXT_VTC',
        'maxLimit': 25637.76504322,
        'min': 1.08943953,
        'minerFee': 0.02
      },
      {
        'rate': '26.97724631',
        'limit': 932.52639437,
        'pair': 'VTC_NXT',
        'maxLimit': 932.52639437,
        'min': 0.07242991,
        'minerFee': 1
      },
      {
        'rate': '1.98098311',
        'limit': 25637.76504322,
        'pair': 'NXT_VOX',
        'maxLimit': 25637.76504322,
        'min': 0.00957719,
        'minerFee': 0.01
      },
      {
        'rate': '0.47407079',
        'limit': 20936.54867898,
        'pair': 'VOX_NXT',
        'maxLimit': 20936.54867898,
        'min': 4.0019861,
        'minerFee': 1
      },
      {
        'rate': '30.22500000',
        'limit': 25637.76504322,
        'pair': 'NXT_SC',
        'maxLimit': 25637.76504322,
        'min': 0.63913471,
        'minerFee': 10
      },
      {
        'rate': '0.03163716',
        'limit': 794770.72652774,
        'pair': 'SC_NXT',
        'maxLimit': 794770.72652774,
        'min': 61.06060606,
        'minerFee': 1
      },
      {
        'rate': '0.66517172',
        'limit': 25637.76504322,
        'pair': 'NXT_LBC',
        'maxLimit': 25637.76504322,
        'min': 0.05819076,
        'minerFee': 0.02
      },
      {
        'rate': '1.44022123',
        'limit': 17458.63373582,
        'pair': 'LBC_NXT',
        'maxLimit': 17458.63373582,
        'min': 1.34378126,
        'minerFee': 1
      },
      {
        'rate': '0.03398613',
        'limit': 25637.76504322,
        'pair': 'NXT_WAVES',
        'maxLimit': 25637.76504322,
        'min': 0.05730187,
        'minerFee': 0.001
      },
      {
        'rate': '28.36442477',
        'limit': 886.47294297,
        'pair': 'WAVES_NXT',
        'maxLimit': 886.47294297,
        'min': 0.06865885,
        'minerFee': 1
      },
      {
        'rate': '0.08874677',
        'limit': 25637.76504322,
        'pair': 'NXT_GAME',
        'maxLimit': 25637.76504322,
        'min': 4.30265487,
        'minerFee': 0.2
      },
      {
        'rate': '10.65444911',
        'limit': 2361.17268725,
        'pair': 'GAME_NXT',
        'maxLimit': 2361.17268725,
        'min': 0.17928641,
        'minerFee': 1
      },
      {
        'rate': '0.06270944',
        'limit': 25637.76504322,
        'pair': 'NXT_KMD',
        'maxLimit': 25637.76504322,
        'min': 0.06243854,
        'minerFee': 0.002
      },
      {
        'rate': '15.45353982',
        'limit': 1627.08967371,
        'pair': 'KMD_NXT',
        'maxLimit': 1627.08967371,
        'min': 0.12668574,
        'minerFee': 1
      },
      {
        'rate': '1.22987053',
        'limit': 25637.76504322,
        'pair': 'NXT_SNGLS',
        'maxLimit': 25637.76504322,
        'min': 4.70501475,
        'minerFee': 3
      },
      {
        'rate': '0.77632743',
        'limit': 32388.7751647,
        'pair': 'SNGLS_NXT',
        'maxLimit': 32388.7751647,
        'min': 2.48458693,
        'minerFee': 1
      },
      {
        'rate': '0.53652083',
        'limit': 25637.76504322,
        'pair': 'NXT_GNT',
        'maxLimit': 25637.76504322,
        'min': 0.03597837,
        'minerFee': 0.01
      },
      {
        'rate': '1.78182866',
        'limit': 14118.6382138,
        'pair': 'GNT_NXT',
        'maxLimit': 14118.6382138,
        'min': 1.08333333,
        'minerFee': 1
      },
      {
        'rate': '0.10738856',
        'limit': 25637.76504322,
        'pair': 'NXT_SWT',
        'maxLimit': 25637.76504322,
        'min': 1.68702065,
        'minerFee': 0.1
      },
      {
        'rate': '8.35075221',
        'limit': 3011.02157862,
        'pair': 'SWT_NXT',
        'maxLimit': 3011.02157862,
        'min': 0.2169466,
        'minerFee': 1
      },
      {
        'rate': '0.33049204',
        'limit': 25637.76504322,
        'pair': 'NXT_WINGS',
        'maxLimit': 25637.76504322,
        'min': 0.05780728,
        'minerFee': 0.01
      },
      {
        'rate': '2.86146017',
        'limit': 8787.22524652,
        'pair': 'WINGS_NXT',
        'maxLimit': 8787.22524652,
        'min': 0.6676607,
        'minerFee': 1
      },
      {
        'rate': '0.44627516',
        'limit': 25637.76504322,
        'pair': 'NXT_TRST',
        'maxLimit': 25637.76504322,
        'min': 0.04183874,
        'minerFee': 0.01
      },
      {
        'rate': '2.07101769',
        'limit': 12141.03335152,
        'pair': 'TRST_NXT',
        'maxLimit': 12141.03335152,
        'min': 0.901566,
        'minerFee': 1
      },
      {
        'rate': '0.30316869',
        'limit': 25637.76504322,
        'pair': 'NXT_RLC',
        'maxLimit': 25637.76504322,
        'min': 0.06189774,
        'minerFee': 0.01
      },
      {
        'rate': '3.06393805',
        'limit': 8206.52851665,
        'pair': 'RLC_NXT',
        'maxLimit': 8206.52851665,
        'min': 0.61246201,
        'minerFee': 1
      },
      {
        'rate': '0.86808093',
        'limit': 11658.48160496,
        'pair': 'NXT_GUP',
        'maxLimit': 11658.48160496,
        'min': 0.02182891,
        'minerFee': 0.01
      },
      {
        'rate': '1.08053097',
        'limit': 6670.4980368,
        'pair': 'GUP_NXT',
        'maxLimit': 6670.4980368,
        'min': 1.75369887,
        'minerFee': 1
      },
      {
        'rate': '0.08524999',
        'limit': 25637.76504322,
        'pair': 'NXT_ANT',
        'maxLimit': 25637.76504322,
        'min': 0.22615536,
        'minerFee': 0.01
      },
      {
        'rate': '11.19469026',
        'limit': 2246.09118367,
        'pair': 'ANT_NXT',
        'maxLimit': 2246.09118367,
        'min': 0.17222222,
        'minerFee': 1
      },
      {
        'rate': '0.00342169',
        'limit': 25637.76504322,
        'pair': 'NXT_DCR',
        'maxLimit': 25637.76504322,
        'min': 17.10914454,
        'minerFee': 0.03
      },
      {
        'rate': '282.30088495',
        'limit': 89.06913315,
        'pair': 'DCR_NXT',
        'maxLimit': 89.06913315,
        'min': 0.00691252,
        'minerFee': 1
      },
      {
        'rate': '1.02933436',
        'limit': 25637.76504322,
        'pair': 'NXT_BAT',
        'maxLimit': 25637.76504322,
        'min': 0.01881023,
        'minerFee': 0.01
      },
      {
        'rate': '0.93110619',
        'limit': 27004.75547533,
        'pair': 'BAT_NXT',
        'maxLimit': 27004.75547533,
        'min': 2.07946336,
        'minerFee': 1
      },
      {
        'rate': '0.06878793',
        'limit': 25637.76504322,
        'pair': 'NXT_BNT',
        'maxLimit': 25637.76504322,
        'min': 0.2680236,
        'minerFee': 0.01
      },
      {
        'rate': '13.26716814',
        'limit': 1895.22698531,
        'pair': 'BNT_NXT',
        'maxLimit': 1895.22698531,
        'min': 0.13896552,
        'minerFee': 1
      },
      {
        'rate': '4.92555555',
        'limit': 25637.76504322,
        'pair': 'NXT_SNT',
        'maxLimit': 25637.76504322,
        'min': 1.15044248,
        'minerFee': 3
      },
      {
        'rate': '0.18982300',
        'limit': 132461.78775462,
        'pair': 'SNT_NXT',
        'maxLimit': 132461.78775462,
        'min': 9.95061728,
        'minerFee': 1
      },
      {
        'rate': '0.01241265',
        'limit': 25637.76504322,
        'pair': 'NXT_NMR',
        'maxLimit': 25637.76504322,
        'min': 0.5899705,
        'minerFee': 0.004
      },
      {
        'rate': '73.00884955',
        'limit': 344.40064816,
        'pair': 'NMR_NXT',
        'maxLimit': 344.40064816,
        'min': 0.02507607,
        'minerFee': 1
      },
      {
        'rate': '0.21475401',
        'limit': 25637.76504322,
        'pair': 'NXT_EDG',
        'maxLimit': 25637.76504322,
        'min': 2.68436578,
        'minerFee': 0.3
      },
      {
        'rate': '4.42920353',
        'limit': 5676.93376091,
        'pair': 'EDG_NXT',
        'maxLimit': 5676.93376091,
        'min': 0.43384649,
        'minerFee': 1
      },
      {
        'rate': '0.54090292',
        'limit': 25637.76504322,
        'pair': 'NXT_CVC',
        'maxLimit': 25637.76504322,
        'min': 0.35437561,
        'minerFee': 0.1
      },
      {
        'rate': '1.75504523',
        'limit': 14334.10006435,
        'pair': 'CVC_NXT',
        'maxLimit': 14334.10006435,
        'min': 1.09273319,
        'minerFee': 1
      },
      {
        'rate': '0.03430583',
        'limit': 20146.77237147,
        'pair': 'NXT_MTL',
        'maxLimit': 20146.77237147,
        'min': 0.56255654,
        'minerFee': 0.01
      },
      {
        'rate': '27.84654867',
        'limit': 902.95912056,
        'pair': 'MTL_NXT',
        'maxLimit': 902.95912056,
        'min': 0.06930472,
        'minerFee': 1
      },
      {
        'rate': '7.97939999',
        'limit': 25637.76504322,
        'pair': 'NXT_FUN',
        'maxLimit': 25637.76504322,
        'min': 0.00238938,
        'minerFee': 0.01
      },
      {
        'rate': '0.11827433',
        'limit': 212592.98817303,
        'pair': 'FUN_NXT',
        'maxLimit': 212592.98817303,
        'min': 16.12,
        'minerFee': 1
      },
      {
        'rate': '4.07112244',
        'limit': 25637.76504322,
        'pair': 'NXT_DNT',
        'maxLimit': 25637.76504322,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.22876106',
        'limit': 109915.10047724,
        'pair': 'DNT_NXT',
        'maxLimit': 109915.10047724,
        'min': 8.2244898,
        'minerFee': 1
      },
      {
        'rate': '0.43689224',
        'limit': 25637.76504322,
        'pair': 'NXT_1ST',
        'maxLimit': 25637.76504322,
        'min': 0.04381514,
        'minerFee': 0.01
      },
      {
        'rate': '2.16884955',
        'limit': 11593.37908983,
        'pair': '1ST_NXT',
        'maxLimit': 11593.37908983,
        'min': 0.8826106,
        'minerFee': 1
      },
      {
        'rate': '0.04453983',
        'limit': 12818.88268593,
        'pair': 'NXT_SALT',
        'maxLimit': 12818.88268593,
        'min': 2.14985251,
        'minerFee': 0.05
      },
      {
        'rate': '21.28353982',
        'limit': 590.6981482,
        'pair': 'SALT_NXT',
        'maxLimit': 590.6981482,
        'min': 0.08997946,
        'minerFee': 1
      },
      {
        'rate': '0.83578622',
        'limit': 25637.76504322,
        'pair': 'NXT_XEM',
        'maxLimit': 25637.76504322,
        'min': 9.34906588,
        'minerFee': 4
      },
      {
        'rate': '1.15694690',
        'limit': 21733.31814232,
        'pair': 'XEM_NXT',
        'maxLimit': 21733.31814232,
        'min': 1.68760469,
        'minerFee': 1
      },
      {
        'rate': '1.29283862',
        'limit': 25637.76504322,
        'pair': 'NXT_RCN',
        'maxLimit': 25637.76504322,
        'min': 2.94985251,
        'minerFee': 2
      },
      {
        'rate': '0.73008849',
        'limit': 34440.0648162,
        'pair': 'RCN_NXT',
        'maxLimit': 34440.0648162,
        'min': 2.6117952,
        'minerFee': 1
      },
      {
        'rate': '0.09504083',
        'limit': 25637.76504322,
        'pair': 'NXT_NMC',
        'maxLimit': 25637.76504322,
        'min': 0.09409538,
        'minerFee': 0.005
      },
      {
        'rate': '9.32014724',
        'limit': 496.85281567,
        'pair': 'NMC_NXT',
        'maxLimit': 496.85281567,
        'min': 0.19190476,
        'minerFee': 1
      },
      {
        'rate': '0.00666329',
        'limit': 25637.76504322,
        'pair': 'NXT_REP',
        'maxLimit': 25637.76504322,
        'min': 2.85572271,
        'minerFee': 0.01
      },
      {
        'rate': '141.42966740',
        'limit': 177.87635866,
        'pair': 'REP_NXT',
        'maxLimit': 177.87635866,
        'min': 0.01345441,
        'minerFee': 1
      },
      {
        'rate': '0.00162992',
        'limit': 25637.76504322,
        'pair': 'NXT_GNO',
        'maxLimit': 25637.76504322,
        'min': 11.83009833,
        'minerFee': 0.01
      },
      {
        'rate': '585.88561971',
        'limit': 42.93840538,
        'pair': 'GNO_NXT',
        'maxLimit': 42.93840538,
        'min': 0.00329112,
        'minerFee': 1
      },
      {
        'rate': '0.81931752',
        'limit': 25637.76504322,
        'pair': 'NXT_ZRX',
        'maxLimit': 25637.76504322,
        'min': 0.01175025,
        'minerFee': 0.005
      },
      {
        'rate': '1.16386184',
        'limit': 21615.10344113,
        'pair': 'ZRX_NXT',
        'maxLimit': 21615.10344113,
        'min': 1.6543514,
        'minerFee': 1
      },
      {
        'rate': '205.07142857',
        'limit': 17813.82662907,
        'pair': 'POT_RDD',
        'maxLimit': 17813.82662907,
        'min': 0.00008264,
        'minerFee': 0.01
      },
      {
        'rate': '0.00408884',
        'limit': 4305000.68880011,
        'pair': 'RDD_POT',
        'maxLimit': 4305000.68880011,
        'min': 4.14285714,
        'minerFee': 0.01
      },
      {
        'rate': '3.83311081',
        'limit': 17813.82662907,
        'pair': 'POT_START',
        'maxLimit': 17813.82662907,
        'min': 0.00895317,
        'minerFee': 0.02
      },
      {
        'rate': '0.22147899',
        'limit': 79477.06633617,
        'pair': 'START_POT',
        'maxLimit': 79477.06633617,
        'min': 0.07743658,
        'minerFee': 0.01
      },
      {
        'rate': '0.48545715',
        'limit': 3884.89960765,
        'pair': 'POT_VRC',
        'maxLimit': 17813.82662907,
        'min': 0.00077534,
        'minerFee': 0.0002
      },
      {
        'rate': '1.91800809',
        'limit': 9177.49104318,
        'pair': 'VRC_POT',
        'maxLimit': 9177.49104318,
        'min': 0.00980226,
        'minerFee': 0.01
      },
      {
        'rate': '0.05159956',
        'limit': 17813.82662907,
        'pair': 'POT_VTC',
        'maxLimit': 17813.82662907,
        'min': 0.76305785,
        'minerFee': 0.02
      },
      {
        'rate': '18.88568181',
        'limit': 932.52639437,
        'pair': 'VTC_POT',
        'maxLimit': 932.52639437,
        'min': 0.00104242,
        'minerFee': 0.01
      },
      {
        'rate': '2.85104270',
        'limit': 17813.82662907,
        'pair': 'POT_VOX',
        'maxLimit': 17813.82662907,
        'min': 0.00670799,
        'minerFee': 0.01
      },
      {
        'rate': '0.33187775',
        'limit': 20936.54867898,
        'pair': 'VOX_POT',
        'maxLimit': 20936.54867898,
        'min': 0.05759682,
        'minerFee': 0.01
      },
      {
        'rate': '43.50000000',
        'limit': 17813.82662907,
        'pair': 'POT_SC',
        'maxLimit': 17813.82662907,
        'min': 0.4476584,
        'minerFee': 10
      },
      {
        'rate': '0.02214789',
        'limit': 794770.72652774,
        'pair': 'SC_POT',
        'maxLimit': 794770.72652774,
        'min': 0.87878788,
        'minerFee': 0.01
      },
      {
        'rate': '0.95731910',
        'limit': 17813.82662907,
        'pair': 'POT_LBC',
        'maxLimit': 17813.82662907,
        'min': 0.04075758,
        'minerFee': 0.02
      },
      {
        'rate': '1.00824053',
        'limit': 17458.63373582,
        'pair': 'LBC_POT',
        'maxLimit': 17458.63373582,
        'min': 0.01933978,
        'minerFee': 0.01
      },
      {
        'rate': '0.04891304',
        'limit': 17813.82662907,
        'pair': 'POT_WAVES',
        'maxLimit': 17813.82662907,
        'min': 0.04013499,
        'minerFee': 0.001
      },
      {
        'rate': '19.85678443',
        'limit': 886.47294297,
        'pair': 'WAVES_POT',
        'maxLimit': 886.47294297,
        'min': 0.00098814,
        'minerFee': 0.01
      },
      {
        'rate': '0.12772488',
        'limit': 17813.82662907,
        'pair': 'POT_GAME',
        'maxLimit': 17813.82662907,
        'min': 3.01363636,
        'minerFee': 0.2
      },
      {
        'rate': '7.45875000',
        'limit': 2361.17268725,
        'pair': 'GAME_POT',
        'maxLimit': 2361.17268725,
        'min': 0.0025803,
        'minerFee': 0.01
      },
      {
        'rate': '0.09025179',
        'limit': 17813.82662907,
        'pair': 'POT_KMD',
        'maxLimit': 17813.82662907,
        'min': 0.04373278,
        'minerFee': 0.002
      },
      {
        'rate': '10.81839703',
        'limit': 1627.08967371,
        'pair': 'KMD_POT',
        'maxLimit': 1627.08967371,
        'min': 0.00182327,
        'minerFee': 0.01
      },
      {
        'rate': '1.77003699',
        'limit': 17813.82662907,
        'pair': 'POT_SNGLS',
        'maxLimit': 17813.82662907,
        'min': 3.29545455,
        'minerFee': 3
      },
      {
        'rate': '0.54347537',
        'limit': 32388.7751647,
        'pair': 'SNGLS_POT',
        'maxLimit': 32388.7751647,
        'min': 0.03575832,
        'minerFee': 0.01
      },
      {
        'rate': '0.77216397',
        'limit': 17813.82662907,
        'pair': 'POT_GNT',
        'maxLimit': 17813.82662907,
        'min': 0.02519972,
        'minerFee': 0.01
      },
      {
        'rate': '1.24738636',
        'limit': 14118.6382138,
        'pair': 'GNT_POT',
        'maxLimit': 14118.6382138,
        'min': 0.0155914,
        'minerFee': 0.01
      },
      {
        'rate': '0.15455426',
        'limit': 17813.82662907,
        'pair': 'POT_SWT',
        'maxLimit': 17813.82662907,
        'min': 1.18161157,
        'minerFee': 0.1
      },
      {
        'rate': '5.84602324',
        'limit': 3011.02157862,
        'pair': 'SWT_POT',
        'maxLimit': 3011.02157862,
        'min': 0.00312231,
        'minerFee': 0.01
      },
      {
        'rate': '0.47564612',
        'limit': 17813.82662907,
        'pair': 'POT_WINGS',
        'maxLimit': 17813.82662907,
        'min': 0.04048898,
        'minerFee': 0.01
      },
      {
        'rate': '2.00319232',
        'limit': 8787.22524652,
        'pair': 'WINGS_POT',
        'maxLimit': 8787.22524652,
        'min': 0.00960901,
        'minerFee': 0.01
      },
      {
        'rate': '0.64228187',
        'limit': 17813.82662907,
        'pair': 'POT_TRST',
        'maxLimit': 17813.82662907,
        'min': 0.02930441,
        'minerFee': 0.01
      },
      {
        'rate': '1.44983557',
        'limit': 12141.03335152,
        'pair': 'TRST_POT',
        'maxLimit': 12141.03335152,
        'min': 0.01297539,
        'minerFee': 0.01
      },
      {
        'rate': '0.43632218',
        'limit': 17813.82662907,
        'pair': 'POT_RLC',
        'maxLimit': 17813.82662907,
        'min': 0.04335399,
        'minerFee': 0.01
      },
      {
        'rate': '2.14493887',
        'limit': 8206.52851665,
        'pair': 'RLC_POT',
        'maxLimit': 8206.52851665,
        'min': 0.00881459,
        'minerFee': 0.01
      },
      {
        'rate': '1.24934725',
        'limit': 8100.63463241,
        'pair': 'POT_GUP',
        'maxLimit': 8100.63463241,
        'min': 0.01528926,
        'minerFee': 0.01
      },
      {
        'rate': '0.75643595',
        'limit': 6670.4980368,
        'pair': 'GUP_POT',
        'maxLimit': 6670.4980368,
        'min': 0.02523934,
        'minerFee': 0.01
      },
      {
        'rate': '0.12269230',
        'limit': 17813.82662907,
        'pair': 'POT_ANT',
        'maxLimit': 17813.82662907,
        'min': 0.1584022,
        'minerFee': 0.01
      },
      {
        'rate': '7.83694903',
        'limit': 2246.09118367,
        'pair': 'ANT_POT',
        'maxLimit': 2246.09118367,
        'min': 0.00247863,
        'minerFee': 0.01
      },
      {
        'rate': '0.00492452',
        'limit': 17813.82662907,
        'pair': 'POT_DCR',
        'maxLimit': 17813.82662907,
        'min': 11.98347107,
        'minerFee': 0.03
      },
      {
        'rate': '197.62741046',
        'limit': 89.06913315,
        'pair': 'DCR_POT',
        'maxLimit': 89.06913315,
        'min': 0.00009949,
        'minerFee': 0.01
      },
      {
        'rate': '1.48142414',
        'limit': 17813.82662907,
        'pair': 'POT_BAT',
        'maxLimit': 17813.82662907,
        'min': 0.01317493,
        'minerFee': 0.01
      },
      {
        'rate': '0.65182971',
        'limit': 27004.75547533,
        'pair': 'BAT_POT',
        'maxLimit': 27004.75547533,
        'min': 0.02992776,
        'minerFee': 0.01
      },
      {
        'rate': '0.09900000',
        'limit': 17813.82662907,
        'pair': 'POT_BNT',
        'maxLimit': 17813.82662907,
        'min': 0.18772727,
        'minerFee': 0.01
      },
      {
        'rate': '9.28780681',
        'limit': 1895.22698531,
        'pair': 'BNT_POT',
        'maxLimit': 1895.22698531,
        'min': 0.002,
        'minerFee': 0.01
      },
      {
        'rate': '7.08888888',
        'limit': 17813.82662907,
        'pair': 'POT_SNT',
        'maxLimit': 17813.82662907,
        'min': 0.80578512,
        'minerFee': 3
      },
      {
        'rate': '0.13288739',
        'limit': 132461.78775462,
        'pair': 'SNT_POT',
        'maxLimit': 132461.78775462,
        'min': 0.14320988,
        'minerFee': 0.01
      },
      {
        'rate': '0.01786436',
        'limit': 17813.82662907,
        'pair': 'POT_NMR',
        'maxLimit': 17813.82662907,
        'min': 0.41322314,
        'minerFee': 0.004
      },
      {
        'rate': '51.11053719',
        'limit': 344.40064816,
        'pair': 'NMR_POT',
        'maxLimit': 344.40064816,
        'min': 0.0003609,
        'minerFee': 0.01
      },
      {
        'rate': '0.30907525',
        'limit': 17813.82662907,
        'pair': 'POT_EDG',
        'maxLimit': 17813.82662907,
        'min': 1.88016529,
        'minerFee': 0.3
      },
      {
        'rate': '3.10070592',
        'limit': 5676.93376091,
        'pair': 'EDG_POT',
        'maxLimit': 5676.93376091,
        'min': 0.00624394,
        'minerFee': 0.01
      },
      {
        'rate': '0.77847071',
        'limit': 17813.82662907,
        'pair': 'POT_CVC',
        'maxLimit': 17813.82662907,
        'min': 0.24820937,
        'minerFee': 0.1
      },
      {
        'rate': '1.22863636',
        'limit': 14334.10006435,
        'pair': 'CVC_POT',
        'maxLimit': 14334.10006435,
        'min': 0.01572668,
        'minerFee': 0.01
      },
      {
        'rate': '0.04937316',
        'limit': 13998.53321673,
        'pair': 'POT_MTL',
        'maxLimit': 13998.53321673,
        'min': 0.39402204,
        'minerFee': 0.01
      },
      {
        'rate': '19.49424035',
        'limit': 902.95912056,
        'pair': 'MTL_POT',
        'maxLimit': 902.95912056,
        'min': 0.00099744,
        'minerFee': 0.01
      },
      {
        'rate': '11.48400000',
        'limit': 17813.82662907,
        'pair': 'POT_FUN',
        'maxLimit': 17813.82662907,
        'min': 0.00167355,
        'minerFee': 0.01
      },
      {
        'rate': '0.08279907',
        'limit': 212592.98817303,
        'pair': 'FUN_POT',
        'maxLimit': 212592.98817303,
        'min': 0.232,
        'minerFee': 0.01
      },
      {
        'rate': '5.85918367',
        'limit': 17813.82662907,
        'pair': 'POT_DNT',
        'maxLimit': 17813.82662907,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.16014634',
        'limit': 109915.10047724,
        'pair': 'DNT_POT',
        'maxLimit': 109915.10047724,
        'min': 0.11836735,
        'minerFee': 0.01
      },
      {
        'rate': '0.62877792',
        'limit': 17813.82662907,
        'pair': 'POT_1ST',
        'maxLimit': 17813.82662907,
        'min': 0.03068871,
        'minerFee': 0.01
      },
      {
        'rate': '1.51832369',
        'limit': 11593.37908983,
        'pair': '1ST_POT',
        'maxLimit': 11593.37908983,
        'min': 0.01270258,
        'minerFee': 0.01
      },
      {
        'rate': '0.06410199',
        'limit': 8906.91331453,
        'pair': 'POT_SALT',
        'maxLimit': 8906.91331453,
        'min': 1.50578512,
        'minerFee': 0.05
      },
      {
        'rate': '14.89974380',
        'limit': 590.6981482,
        'pair': 'SALT_POT',
        'maxLimit': 590.6981482,
        'min': 0.00129499,
        'minerFee': 0.01
      },
      {
        'rate': '1.20286850',
        'limit': 17813.82662907,
        'pair': 'POT_XEM',
        'maxLimit': 17813.82662907,
        'min': 6.54820937,
        'minerFee': 4
      },
      {
        'rate': '0.80993164',
        'limit': 21733.31814232,
        'pair': 'XEM_POT',
        'maxLimit': 21733.31814232,
        'min': 0.02428811,
        'minerFee': 0.01
      },
      {
        'rate': '1.86066104',
        'limit': 17813.82662907,
        'pair': 'POT_RCN',
        'maxLimit': 17813.82662907,
        'min': 2.0661157,
        'minerFee': 2
      },
      {
        'rate': '0.51110537',
        'limit': 34440.0648162,
        'pair': 'RCN_POT',
        'maxLimit': 34440.0648162,
        'min': 0.03758911,
        'minerFee': 0.01
      },
      {
        'rate': '0.13678333',
        'limit': 17813.82662907,
        'pair': 'POT_NMC',
        'maxLimit': 17813.82662907,
        'min': 0.06590565,
        'minerFee': 0.005
      },
      {
        'rate': '6.52465909',
        'limit': 496.85281567,
        'pair': 'NMC_POT',
        'maxLimit': 496.85281567,
        'min': 0.0027619,
        'minerFee': 0.01
      },
      {
        'rate': '0.00958985',
        'limit': 17813.82662907,
        'pair': 'POT_REP',
        'maxLimit': 17813.82662907,
        'min': 2.00018595,
        'minerFee': 0.01
      },
      {
        'rate': '99.00920454',
        'limit': 177.87635866,
        'pair': 'REP_POT',
        'maxLimit': 177.87635866,
        'min': 0.00019364,
        'minerFee': 0.01
      },
      {
        'rate': '0.00234579',
        'limit': 17813.82662907,
        'pair': 'POT_GNO',
        'maxLimit': 17813.82662907,
        'min': 8.2859573,
        'minerFee': 0.01
      },
      {
        'rate': '410.15488636',
        'limit': 42.93840538,
        'pair': 'GNO_POT',
        'maxLimit': 42.93840538,
        'min': 0.00004737,
        'minerFee': 0.01
      },
      {
        'rate': '1.17916666',
        'limit': 17813.82662907,
        'pair': 'POT_ZRX',
        'maxLimit': 17813.82662907,
        'min': 0.00823003,
        'minerFee': 0.005
      },
      {
        'rate': '0.81477272',
        'limit': 21615.10344113,
        'pair': 'ZRX_POT',
        'maxLimit': 21615.10344113,
        'min': 0.02380952,
        'minerFee': 0.01
      },
      {
        'rate': '0.01585313',
        'limit': 4305000.68880011,
        'pair': 'RDD_START',
        'maxLimit': 4305000.68880011,
        'min': 1.85714286,
        'minerFee': 0.02
      },
      {
        'rate': '45.94107142',
        'limit': 79477.06633617,
        'pair': 'START_RDD',
        'maxLimit': 79477.06633617,
        'min': 0.00032043,
        'minerFee': 0.01
      },
      {
        'rate': '0.00200777',
        'limit': 938850.73851507,
        'pair': 'RDD_VRC',
        'maxLimit': 4305000.68880011,
        'min': 0.16082857,
        'minerFee': 0.0002
      },
      {
        'rate': '397.84967857',
        'limit': 9177.49104318,
        'pair': 'VRC_RDD',
        'maxLimit': 9177.49104318,
        'min': 0.00004056,
        'minerFee': 0.01
      },
      {
        'rate': '0.00021340',
        'limit': 4305000.68880011,
        'pair': 'RDD_VTC',
        'maxLimit': 4305000.68880011,
        'min': 158.28,
        'minerFee': 0.02
      },
      {
        'rate': '3917.43000000',
        'limit': 932.52639437,
        'pair': 'VTC_RDD',
        'maxLimit': 932.52639437,
        'min': 0.00000431,
        'minerFee': 0.01
      },
      {
        'rate': '0.01179145',
        'limit': 4305000.68880011,
        'pair': 'RDD_VOX',
        'maxLimit': 4305000.68880011,
        'min': 1.39142857,
        'minerFee': 0.01
      },
      {
        'rate': '68.84092857',
        'limit': 20936.54867898,
        'pair': 'VOX_RDD',
        'maxLimit': 20936.54867898,
        'min': 0.00023833,
        'minerFee': 0.01
      },
      {
        'rate': '0.17990909',
        'limit': 4305000.68880011,
        'pair': 'RDD_SC',
        'maxLimit': 4305000.68880011,
        'min': 92.85714286,
        'minerFee': 10
      },
      {
        'rate': '4.59410714',
        'limit': 794770.72652774,
        'pair': 'SC_RDD',
        'maxLimit': 794770.72652774,
        'min': 0.00363636,
        'minerFee': 0.01
      },
      {
        'rate': '0.00395931',
        'limit': 4305000.68880011,
        'pair': 'RDD_LBC',
        'maxLimit': 4305000.68880011,
        'min': 8.45428571,
        'minerFee': 0.02
      },
      {
        'rate': '209.13789285',
        'limit': 17458.63373582,
        'pair': 'LBC_RDD',
        'maxLimit': 17458.63373582,
        'min': 0.00008003,
        'minerFee': 0.01
      },
      {
        'rate': '0.00020229',
        'limit': 4305000.68880011,
        'pair': 'RDD_WAVES',
        'maxLimit': 4305000.68880011,
        'min': 8.32514286,
        'minerFee': 0.001
      },
      {
        'rate': '4118.86442857',
        'limit': 886.47294297,
        'pair': 'WAVES_RDD',
        'maxLimit': 886.47294297,
        'min': 0.00000409,
        'minerFee': 0.01
      },
      {
        'rate': '0.00052824',
        'limit': 4305000.68880011,
        'pair': 'RDD_GAME',
        'maxLimit': 4305000.68880011,
        'min': 625.11428571,
        'minerFee': 0.2
      },
      {
        'rate': '1547.15785714',
        'limit': 2361.17268725,
        'pair': 'GAME_RDD',
        'maxLimit': 2361.17268725,
        'min': 0.00001068,
        'minerFee': 0.01
      },
      {
        'rate': '0.00037326',
        'limit': 4305000.68880011,
        'pair': 'RDD_KMD',
        'maxLimit': 4305000.68880011,
        'min': 9.07142857,
        'minerFee': 0.002
      },
      {
        'rate': '2244.04464285',
        'limit': 1627.08967371,
        'pair': 'KMD_RDD',
        'maxLimit': 1627.08967371,
        'min': 0.00000754,
        'minerFee': 0.01
      },
      {
        'rate': '0.00732059',
        'limit': 4305000.68880011,
        'pair': 'RDD_SNGLS',
        'maxLimit': 4305000.68880011,
        'min': 683.57142857,
        'minerFee': 3
      },
      {
        'rate': '112.73232142',
        'limit': 32388.7751647,
        'pair': 'SNGLS_RDD',
        'maxLimit': 32388.7751647,
        'min': 0.00014797,
        'minerFee': 0.01
      },
      {
        'rate': '0.00319354',
        'limit': 4305000.68880011,
        'pair': 'RDD_GNT',
        'maxLimit': 4305000.68880011,
        'min': 5.22714286,
        'minerFee': 0.01
      },
      {
        'rate': '258.74357142',
        'limit': 14118.6382138,
        'pair': 'GNT_RDD',
        'maxLimit': 14118.6382138,
        'min': 0.00006452,
        'minerFee': 0.01
      },
      {
        'rate': '0.00063921',
        'limit': 4305000.68880011,
        'pair': 'RDD_SWT',
        'maxLimit': 4305000.68880011,
        'min': 245.1,
        'minerFee': 0.1
      },
      {
        'rate': '1212.63225000',
        'limit': 3011.02157862,
        'pair': 'SWT_RDD',
        'maxLimit': 3011.02157862,
        'min': 0.00001292,
        'minerFee': 0.01
      },
      {
        'rate': '0.00196719',
        'limit': 4305000.68880011,
        'pair': 'RDD_WINGS',
        'maxLimit': 4305000.68880011,
        'min': 8.39857143,
        'minerFee': 0.01
      },
      {
        'rate': '415.51932142',
        'limit': 8787.22524652,
        'pair': 'WINGS_RDD',
        'maxLimit': 8787.22524652,
        'min': 0.00003976,
        'minerFee': 0.01
      },
      {
        'rate': '0.00265637',
        'limit': 4305000.68880011,
        'pair': 'RDD_TRST',
        'maxLimit': 4305000.68880011,
        'min': 6.07857143,
        'minerFee': 0.01
      },
      {
        'rate': '300.73732142',
        'limit': 12141.03335152,
        'pair': 'TRST_RDD',
        'maxLimit': 12141.03335152,
        'min': 0.00005369,
        'minerFee': 0.01
      },
      {
        'rate': '0.00180455',
        'limit': 4305000.68880011,
        'pair': 'RDD_RLC',
        'maxLimit': 4305000.68880011,
        'min': 8.99285714,
        'minerFee': 0.01
      },
      {
        'rate': '444.92160714',
        'limit': 8206.52851665,
        'pair': 'RLC_RDD',
        'maxLimit': 8206.52851665,
        'min': 0.00003647,
        'minerFee': 0.01
      },
      {
        'rate': '0.00516710',
        'limit': 1957653.3695,
        'pair': 'RDD_GUP',
        'maxLimit': 1957653.3695,
        'min': 3.17142857,
        'minerFee': 0.01
      },
      {
        'rate': '156.90642857',
        'limit': 6670.4980368,
        'pair': 'GUP_RDD',
        'maxLimit': 6670.4980368,
        'min': 0.00010444,
        'minerFee': 0.01
      },
      {
        'rate': '0.00050743',
        'limit': 4305000.68880011,
        'pair': 'RDD_ANT',
        'maxLimit': 4305000.68880011,
        'min': 32.85714286,
        'minerFee': 0.01
      },
      {
        'rate': '1625.60714285',
        'limit': 2246.09118367,
        'pair': 'ANT_RDD',
        'maxLimit': 2246.09118367,
        'min': 0.00001026,
        'minerFee': 0.01
      },
      {
        'rate': '0.00002036',
        'limit': 4305000.68880011,
        'pair': 'RDD_DCR',
        'maxLimit': 4305000.68880011,
        'min': 2485.71428571,
        'minerFee': 0.03
      },
      {
        'rate': '40993.57142857',
        'limit': 89.06913315,
        'pair': 'DCR_RDD',
        'maxLimit': 89.06913315,
        'min': 4.1e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00612693',
        'limit': 4305000.68880011,
        'pair': 'RDD_BAT',
        'maxLimit': 4305000.68880011,
        'min': 2.73285714,
        'minerFee': 0.01
      },
      {
        'rate': '135.20810714',
        'limit': 27004.75547533,
        'pair': 'BAT_RDD',
        'maxLimit': 27004.75547533,
        'min': 0.00012384,
        'minerFee': 0.01
      },
      {
        'rate': '0.00040944',
        'limit': 4305000.68880011,
        'pair': 'RDD_BNT',
        'maxLimit': 4305000.68880011,
        'min': 38.94,
        'minerFee': 0.01
      },
      {
        'rate': '1926.55650000',
        'limit': 1895.22698531,
        'pair': 'BNT_RDD',
        'maxLimit': 1895.22698531,
        'min': 0.00000828,
        'minerFee': 0.01
      },
      {
        'rate': '0.02931851',
        'limit': 4305000.68880011,
        'pair': 'RDD_SNT',
        'maxLimit': 4305000.68880011,
        'min': 167.14285714,
        'minerFee': 3
      },
      {
        'rate': '27.56464285',
        'limit': 132461.78775462,
        'pair': 'SNT_RDD',
        'maxLimit': 132461.78775462,
        'min': 0.00059259,
        'minerFee': 0.01
      },
      {
        'rate': '0.00007388',
        'limit': 4305000.68880011,
        'pair': 'RDD_NMR',
        'maxLimit': 4305000.68880011,
        'min': 85.71428571,
        'minerFee': 0.004
      },
      {
        'rate': '10601.78571428',
        'limit': 344.40064816,
        'pair': 'NMR_RDD',
        'maxLimit': 344.40064816,
        'min': 0.00000149,
        'minerFee': 0.01
      },
      {
        'rate': '0.00127828',
        'limit': 4305000.68880011,
        'pair': 'RDD_EDG',
        'maxLimit': 4305000.68880011,
        'min': 390,
        'minerFee': 0.3
      },
      {
        'rate': '643.17500000',
        'limit': 5676.93376091,
        'pair': 'EDG_RDD',
        'maxLimit': 5676.93376091,
        'min': 0.00002584,
        'minerFee': 0.01
      },
      {
        'rate': '0.00321963',
        'limit': 4305000.68880011,
        'pair': 'RDD_CVC',
        'maxLimit': 4305000.68880011,
        'min': 51.48571429,
        'minerFee': 0.1
      },
      {
        'rate': '254.85428571',
        'limit': 14334.10006435,
        'pair': 'CVC_RDD',
        'maxLimit': 14334.10006435,
        'min': 0.00006508,
        'minerFee': 0.01
      },
      {
        'rate': '0.00020419',
        'limit': 3382978.86071017,
        'pair': 'RDD_MTL',
        'maxLimit': 3382978.86071017,
        'min': 81.73142857,
        'minerFee': 0.01
      },
      {
        'rate': '4043.66242857',
        'limit': 902.95912056,
        'pair': 'MTL_RDD',
        'maxLimit': 902.95912056,
        'min': 0.00000413,
        'minerFee': 0.01
      },
      {
        'rate': '0.04749599',
        'limit': 4305000.68880011,
        'pair': 'RDD_FUN',
        'maxLimit': 4305000.68880011,
        'min': 0.34714286,
        'minerFee': 0.01
      },
      {
        'rate': '17.17489285',
        'limit': 212592.98817303,
        'pair': 'FUN_RDD',
        'maxLimit': 212592.98817303,
        'min': 0.00096,
        'minerFee': 0.01
      },
      {
        'rate': '0.02423265',
        'limit': 4305000.68880011,
        'pair': 'RDD_DNT',
        'maxLimit': 4305000.68880011,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '33.21892857',
        'limit': 109915.10047724,
        'pair': 'DNT_RDD',
        'maxLimit': 109915.10047724,
        'min': 0.0004898,
        'minerFee': 0.01
      },
      {
        'rate': '0.00260052',
        'limit': 4305000.68880011,
        'pair': 'RDD_1ST',
        'maxLimit': 4305000.68880011,
        'min': 6.36571429,
        'minerFee': 0.01
      },
      {
        'rate': '314.94371428',
        'limit': 11593.37908983,
        'pair': '1ST_RDD',
        'maxLimit': 11593.37908983,
        'min': 0.00005256,
        'minerFee': 0.01
      },
      {
        'rate': '0.00026511',
        'limit': 2152504.05101262,
        'pair': 'RDD_SALT',
        'maxLimit': 2152504.05101262,
        'min': 312.34285714,
        'minerFee': 0.05
      },
      {
        'rate': '3090.63257142',
        'limit': 590.6981482,
        'pair': 'SALT_RDD',
        'maxLimit': 590.6981482,
        'min': 0.00000536,
        'minerFee': 0.01
      },
      {
        'rate': '0.00497487',
        'limit': 4305000.68880011,
        'pair': 'RDD_XEM',
        'maxLimit': 4305000.68880011,
        'min': 1358.28571429,
        'minerFee': 4
      },
      {
        'rate': '168.00296428',
        'limit': 21733.31814232,
        'pair': 'XEM_RDD',
        'maxLimit': 21733.31814232,
        'min': 0.0001005,
        'minerFee': 0.01
      },
      {
        'rate': '0.00769539',
        'limit': 4305000.68880011,
        'pair': 'RDD_RCN',
        'maxLimit': 4305000.68880011,
        'min': 428.57142857,
        'minerFee': 2
      },
      {
        'rate': '106.01785714',
        'limit': 34440.0648162,
        'pair': 'RCN_RDD',
        'maxLimit': 34440.0648162,
        'min': 0.00015554,
        'minerFee': 0.01
      },
      {
        'rate': '0.00056571',
        'limit': 4305000.68880011,
        'pair': 'RDD_NMC',
        'maxLimit': 4305000.68880011,
        'min': 13.67071429,
        'minerFee': 0.005
      },
      {
        'rate': '1353.40071428',
        'limit': 496.85281567,
        'pair': 'NMC_RDD',
        'maxLimit': 496.85281567,
        'min': 0.00001143,
        'minerFee': 0.01
      },
      {
        'rate': '0.00003966',
        'limit': 4305000.68880011,
        'pair': 'RDD_REP',
        'maxLimit': 4305000.68880011,
        'min': 414.89571429,
        'minerFee': 0.01
      },
      {
        'rate': '20537.33785714',
        'limit': 177.87635866,
        'pair': 'REP_RDD',
        'maxLimit': 177.87635866,
        'min': 8e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00000970',
        'limit': 4305000.68880011,
        'pair': 'RDD_GNO',
        'maxLimit': 4305000.68880011,
        'min': 1718.74428571,
        'minerFee': 0.01
      },
      {
        'rate': '85077.84214285',
        'limit': 42.93840538,
        'pair': 'GNO_RDD',
        'maxLimit': 42.93840538,
        'min': 2e-7,
        'minerFee': 0.01
      },
      {
        'rate': '0.00487684',
        'limit': 4305000.68880011,
        'pair': 'RDD_ZRX',
        'maxLimit': 4305000.68880011,
        'min': 1.70714286,
        'minerFee': 0.005
      },
      {
        'rate': '169.00714285',
        'limit': 21615.10344113,
        'pair': 'ZRX_RDD',
        'maxLimit': 21615.10344113,
        'min': 0.00009852,
        'minerFee': 0.01
      },
      {
        'rate': '0.10875443',
        'limit': 17332.62901874,
        'pair': 'START_VRC',
        'maxLimit': 79477.06633617,
        'min': 0.00300614,
        'minerFee': 0.0002
      },
      {
        'rate': '7.43644259',
        'limit': 9177.49104318,
        'pair': 'VRC_START',
        'maxLimit': 9177.49104318,
        'min': 0.00439412,
        'minerFee': 0.02
      },
      {
        'rate': '0.01155957',
        'limit': 79477.06633617,
        'pair': 'START_VTC',
        'maxLimit': 79477.06633617,
        'min': 2.95850467,
        'minerFee': 0.02
      },
      {
        'rate': '73.22299065',
        'limit': 932.52639437,
        'pair': 'VTC_START',
        'maxLimit': 932.52639437,
        'min': 0.00046729,
        'minerFee': 0.02
      },
      {
        'rate': '0.63870407',
        'limit': 79477.06633617,
        'pair': 'START_VOX',
        'maxLimit': 79477.06633617,
        'min': 0.02600801,
        'minerFee': 0.01
      },
      {
        'rate': '1.28674632',
        'limit': 20936.54867898,
        'pair': 'VOX_START',
        'maxLimit': 20936.54867898,
        'min': 0.02581927,
        'minerFee': 0.02
      },
      {
        'rate': '9.74507575',
        'limit': 79477.06633617,
        'pair': 'START_SC',
        'maxLimit': 79477.06633617,
        'min': 1.73564753,
        'minerFee': 10
      },
      {
        'rate': '0.08587116',
        'limit': 794770.72652774,
        'pair': 'SC_START',
        'maxLimit': 794770.72652774,
        'min': 0.39393939,
        'minerFee': 0.02
      },
      {
        'rate': '0.21446315',
        'limit': 79477.06633617,
        'pair': 'START_LBC',
        'maxLimit': 79477.06633617,
        'min': 0.15802403,
        'minerFee': 0.02
      },
      {
        'rate': '3.90911949',
        'limit': 17458.63373582,
        'pair': 'LBC_START',
        'maxLimit': 17458.63373582,
        'min': 0.00866956,
        'minerFee': 0.02
      },
      {
        'rate': '0.01095773',
        'limit': 79477.06633617,
        'pair': 'START_WAVES',
        'maxLimit': 79477.06633617,
        'min': 0.15561015,
        'minerFee': 0.001
      },
      {
        'rate': '76.98812016',
        'limit': 886.47294297,
        'pair': 'WAVES_START',
        'maxLimit': 886.47294297,
        'min': 0.00044296,
        'minerFee': 0.02
      },
      {
        'rate': '0.02861353',
        'limit': 79477.06633617,
        'pair': 'START_GAME',
        'maxLimit': 79477.06633617,
        'min': 11.68437917,
        'minerFee': 0.2
      },
      {
        'rate': '28.91883845',
        'limit': 2361.17268725,
        'pair': 'GAME_START',
        'maxLimit': 2361.17268725,
        'min': 0.00115669,
        'minerFee': 0.02
      },
      {
        'rate': '0.02021863',
        'limit': 79477.06633617,
        'pair': 'START_KMD',
        'maxLimit': 79477.06633617,
        'min': 0.16955941,
        'minerFee': 0.002
      },
      {
        'rate': '41.94475967',
        'limit': 1627.08967371,
        'pair': 'KMD_START',
        'maxLimit': 1627.08967371,
        'min': 0.00081733,
        'minerFee': 0.02
      },
      {
        'rate': '0.39653205',
        'limit': 79477.06633617,
        'pair': 'START_SNGLS',
        'maxLimit': 79477.06633617,
        'min': 12.77703605,
        'minerFee': 3
      },
      {
        'rate': '2.10714619',
        'limit': 32388.7751647,
        'pair': 'SNGLS_START',
        'maxLimit': 32388.7751647,
        'min': 0.01602959,
        'minerFee': 0.02
      },
      {
        'rate': '0.17298387',
        'limit': 79477.06633617,
        'pair': 'START_GNT',
        'maxLimit': 79477.06633617,
        'min': 0.0977036,
        'minerFee': 0.01
      },
      {
        'rate': '4.83632843',
        'limit': 14118.6382138,
        'pair': 'GNT_START',
        'maxLimit': 14118.6382138,
        'min': 0.00698925,
        'minerFee': 0.02
      },
      {
        'rate': '0.03462397',
        'limit': 79477.06633617,
        'pair': 'START_SWT',
        'maxLimit': 79477.06633617,
        'min': 4.58130841,
        'minerFee': 0.1
      },
      {
        'rate': '22.66602336',
        'limit': 3011.02157862,
        'pair': 'SWT_START',
        'maxLimit': 3011.02157862,
        'min': 0.00139966,
        'minerFee': 0.02
      },
      {
        'rate': '0.10655649',
        'limit': 79477.06633617,
        'pair': 'START_WINGS',
        'maxLimit': 79477.06633617,
        'min': 0.15698264,
        'minerFee': 0.01
      },
      {
        'rate': '7.76671628',
        'limit': 8787.22524652,
        'pair': 'WINGS_START',
        'maxLimit': 8787.22524652,
        'min': 0.00430749,
        'minerFee': 0.02
      },
      {
        'rate': '0.14388702',
        'limit': 79477.06633617,
        'pair': 'START_TRST',
        'maxLimit': 79477.06633617,
        'min': 0.11361816,
        'minerFee': 0.01
      },
      {
        'rate': '5.62125834',
        'limit': 12141.03335152,
        'pair': 'TRST_START',
        'maxLimit': 12141.03335152,
        'min': 0.00581655,
        'minerFee': 0.02
      },
      {
        'rate': '0.09774696',
        'limit': 79477.06633617,
        'pair': 'START_RLC',
        'maxLimit': 79477.06633617,
        'min': 0.16809079,
        'minerFee': 0.01
      },
      {
        'rate': '8.31629172',
        'limit': 8206.52851665,
        'pair': 'RLC_START',
        'maxLimit': 8206.52851665,
        'min': 0.00395137,
        'minerFee': 0.02
      },
      {
        'rate': '0.27988468',
        'limit': 36141.29297538,
        'pair': 'START_GUP',
        'maxLimit': 36141.29297538,
        'min': 0.05927904,
        'minerFee': 0.01
      },
      {
        'rate': '2.93283044',
        'limit': 6670.4980368,
        'pair': 'GUP_START',
        'maxLimit': 6670.4980368,
        'min': 0.01131419,
        'minerFee': 0.02
      },
      {
        'rate': '0.02748611',
        'limit': 79477.06633617,
        'pair': 'START_ANT',
        'maxLimit': 79477.06633617,
        'min': 0.6141522,
        'minerFee': 0.01
      },
      {
        'rate': '30.38518024',
        'limit': 2246.09118367,
        'pair': 'ANT_START',
        'maxLimit': 2246.09118367,
        'min': 0.00111111,
        'minerFee': 0.02
      },
      {
        'rate': '0.00110321',
        'limit': 79477.06633617,
        'pair': 'START_DCR',
        'maxLimit': 79477.06633617,
        'min': 46.46194927,
        'minerFee': 0.03
      },
      {
        'rate': '766.23497997',
        'limit': 89.06913315,
        'pair': 'DCR_START',
        'maxLimit': 89.06913315,
        'min': 0.0000446,
        'minerFee': 0.02
      },
      {
        'rate': '0.33187564',
        'limit': 79477.06633617,
        'pair': 'START_BAT',
        'maxLimit': 79477.06633617,
        'min': 0.05108144,
        'minerFee': 0.01
      },
      {
        'rate': '2.52725433',
        'limit': 27004.75547533,
        'pair': 'BAT_START',
        'maxLimit': 27004.75547533,
        'min': 0.01341589,
        'minerFee': 0.02
      },
      {
        'rate': '0.02217844',
        'limit': 79477.06633617,
        'pair': 'START_BNT',
        'maxLimit': 79477.06633617,
        'min': 0.72785047,
        'minerFee': 0.01
      },
      {
        'rate': '36.01040186',
        'limit': 1895.22698531,
        'pair': 'BNT_START',
        'maxLimit': 1895.22698531,
        'min': 0.00089655,
        'minerFee': 0.02
      },
      {
        'rate': '1.58808641',
        'limit': 79477.06633617,
        'pair': 'START_SNT',
        'maxLimit': 79477.06633617,
        'min': 3.12416555,
        'minerFee': 3
      },
      {
        'rate': '0.51522696',
        'limit': 132461.78775462,
        'pair': 'SNT_START',
        'maxLimit': 132461.78775462,
        'min': 0.06419753,
        'minerFee': 0.02
      },
      {
        'rate': '0.00400205',
        'limit': 79477.06633617,
        'pair': 'START_NMR',
        'maxLimit': 79477.06633617,
        'min': 1.60213618,
        'minerFee': 0.004
      },
      {
        'rate': '198.16421895',
        'limit': 344.40064816,
        'pair': 'NMR_START',
        'maxLimit': 344.40064816,
        'min': 0.00016178,
        'minerFee': 0.02
      },
      {
        'rate': '0.06924049',
        'limit': 79477.06633617,
        'pair': 'START_EDG',
        'maxLimit': 79477.06633617,
        'min': 7.28971963,
        'minerFee': 0.3
      },
      {
        'rate': '12.02196261',
        'limit': 5676.93376091,
        'pair': 'EDG_START',
        'maxLimit': 5676.93376091,
        'min': 0.00279901,
        'minerFee': 0.02
      },
      {
        'rate': '0.17439669',
        'limit': 79477.06633617,
        'pair': 'START_CVC',
        'maxLimit': 79477.06633617,
        'min': 0.9623498,
        'minerFee': 0.1
      },
      {
        'rate': '4.76363150',
        'limit': 14334.10006435,
        'pair': 'CVC_START',
        'maxLimit': 14334.10006435,
        'min': 0.00704989,
        'minerFee': 0.02
      },
      {
        'rate': '0.01106080',
        'limit': 62454.99435157,
        'pair': 'START_MTL',
        'maxLimit': 62454.99435157,
        'min': 1.52769025,
        'minerFee': 0.01
      },
      {
        'rate': '75.58247530',
        'limit': 902.95912056,
        'pair': 'MTL_START',
        'maxLimit': 902.95912056,
        'min': 0.00044713,
        'minerFee': 0.02
      },
      {
        'rate': '2.57269999',
        'limit': 79477.06633617,
        'pair': 'START_FUN',
        'maxLimit': 79477.06633617,
        'min': 0.00648865,
        'minerFee': 0.01
      },
      {
        'rate': '0.32102603',
        'limit': 212592.98817303,
        'pair': 'FUN_START',
        'maxLimit': 212592.98817303,
        'min': 0.104,
        'minerFee': 0.02
      },
      {
        'rate': '1.31260204',
        'limit': 79477.06633617,
        'pair': 'START_DNT',
        'maxLimit': 79477.06633617,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.62091455',
        'limit': 109915.10047724,
        'pair': 'DNT_START',
        'maxLimit': 109915.10047724,
        'min': 0.05306122,
        'minerFee': 0.02
      },
      {
        'rate': '0.14086180',
        'limit': 79477.06633617,
        'pair': 'START_1ST',
        'maxLimit': 79477.06633617,
        'min': 0.11898531,
        'minerFee': 0.01
      },
      {
        'rate': '5.88679839',
        'limit': 11593.37908983,
        'pair': '1ST_START',
        'maxLimit': 11593.37908983,
        'min': 0.00569426,
        'minerFee': 0.02
      },
      {
        'rate': '0.01436043',
        'limit': 39738.53632639,
        'pair': 'START_SALT',
        'maxLimit': 39738.53632639,
        'min': 5.83818425,
        'minerFee': 0.05
      },
      {
        'rate': '57.76883311',
        'limit': 590.6981482,
        'pair': 'SALT_START',
        'maxLimit': 590.6981482,
        'min': 0.00058051,
        'minerFee': 0.02
      },
      {
        'rate': '0.26947236',
        'limit': 79477.06633617,
        'pair': 'START_XEM',
        'maxLimit': 79477.06633617,
        'min': 25.38851802,
        'minerFee': 4
      },
      {
        'rate': '3.14024232',
        'limit': 21733.31814232,
        'pair': 'XEM_START',
        'maxLimit': 21733.31814232,
        'min': 0.01088777,
        'minerFee': 0.02
      },
      {
        'rate': '0.41683408',
        'limit': 79477.06633617,
        'pair': 'START_RCN',
        'maxLimit': 79477.06633617,
        'min': 8.01068091,
        'minerFee': 2
      },
      {
        'rate': '1.98164218',
        'limit': 34440.0648162,
        'pair': 'RCN_START',
        'maxLimit': 34440.0648162,
        'min': 0.01685029,
        'minerFee': 0.02
      },
      {
        'rate': '0.03064285',
        'limit': 79477.06633617,
        'pair': 'START_NMC',
        'maxLimit': 79477.06633617,
        'min': 0.25552737,
        'minerFee': 0.005
      },
      {
        'rate': '25.29720961',
        'limit': 496.85281567,
        'pair': 'NMC_START',
        'maxLimit': 496.85281567,
        'min': 0.0012381,
        'minerFee': 0.02
      },
      {
        'rate': '0.00214836',
        'limit': 79477.06633617,
        'pair': 'START_REP',
        'maxLimit': 79477.06633617,
        'min': 7.75506008,
        'minerFee': 0.01
      },
      {
        'rate': '383.87547396',
        'limit': 177.87635866,
        'pair': 'REP_START',
        'maxLimit': 177.87635866,
        'min': 0.0000868,
        'minerFee': 0.02
      },
      {
        'rate': '0.00052551',
        'limit': 79477.06633617,
        'pair': 'START_GNO',
        'maxLimit': 79477.06633617,
        'min': 32.12606142,
        'minerFee': 0.01
      },
      {
        'rate': '1590.24004005',
        'limit': 42.93840538,
        'pair': 'GNO_START',
        'maxLimit': 42.93840538,
        'min': 0.00002123,
        'minerFee': 0.02
      },
      {
        'rate': '0.26416256',
        'limit': 79477.06633617,
        'pair': 'START_ZRX',
        'maxLimit': 79477.06633617,
        'min': 0.03190921,
        'minerFee': 0.005
      },
      {
        'rate': '3.15901201',
        'limit': 21615.10344113,
        'pair': 'ZRX_START',
        'maxLimit': 21615.10344113,
        'min': 0.01067323,
        'minerFee': 0.02
      },
      {
        'rate': '0.10010595',
        'limit': 9177.49104318,
        'pair': 'VRC_VTC',
        'maxLimit': 9177.49104318,
        'min': 0.37450059,
        'minerFee': 0.02
      },
      {
        'rate': '9.27357089',
        'limit': 203.36851262,
        'pair': 'VTC_VRC',
        'maxLimit': 932.52639437,
        'min': 0.00004047,
        'minerFee': 0.0002
      },
      {
        'rate': '5.53117725',
        'limit': 9177.49104318,
        'pair': 'VRC_VOX',
        'maxLimit': 9177.49104318,
        'min': 0.00329221,
        'minerFee': 0.01
      },
      {
        'rate': '0.16296434',
        'limit': 11566.94955049,
        'pair': 'VOX_VRC',
        'maxLimit': 20936.54867898,
        'min': 0.00223595,
        'minerFee': 0.0002
      },
      {
        'rate': '84.39235606',
        'limit': 9177.49104318,
        'pair': 'VRC_SC',
        'maxLimit': 9177.49104318,
        'min': 0.21970593,
        'minerFee': 10
      },
      {
        'rate': '0.01087544',
        'limit': 173326.2901874,
        'pair': 'SC_VRC',
        'maxLimit': 794770.72652774,
        'min': 0.03411515,
        'minerFee': 0.0002
      },
      {
        'rate': '1.85725091',
        'limit': 9177.49104318,
        'pair': 'VRC_LBC',
        'maxLimit': 9177.49104318,
        'min': 0.02000338,
        'minerFee': 0.02
      },
      {
        'rate': '0.49508365',
        'limit': 3807.43793923,
        'pair': 'LBC_VRC',
        'maxLimit': 17458.63373582,
        'min': 0.00075078,
        'minerFee': 0.0002
      },
      {
        'rate': '0.09489395',
        'limit': 9177.49104318,
        'pair': 'VRC_WAVES',
        'maxLimit': 9177.49104318,
        'min': 0.01969782,
        'minerFee': 0.001
      },
      {
        'rate': '9.75042082',
        'limit': 193.32501994,
        'pair': 'WAVES_VRC',
        'maxLimit': 886.47294297,
        'min': 0.00003836,
        'minerFee': 0.0002
      },
      {
        'rate': '0.24779319',
        'limit': 9177.49104318,
        'pair': 'VRC_GAME',
        'maxLimit': 9177.49104318,
        'min': 1.47906033,
        'minerFee': 0.2
      },
      {
        'rate': '3.66252315',
        'limit': 514.93253175,
        'pair': 'GAME_VRC',
        'maxLimit': 2361.17268725,
        'min': 0.00010017,
        'minerFee': 0.0002
      },
      {
        'rate': '0.17509337',
        'limit': 9177.49104318,
        'pair': 'VRC_KMD',
        'maxLimit': 9177.49104318,
        'min': 0.02146358,
        'minerFee': 0.002
      },
      {
        'rate': '5.31223593',
        'limit': 354.84122401,
        'pair': 'KMD_VRC',
        'maxLimit': 1627.08967371,
        'min': 0.00007078,
        'minerFee': 0.0002
      },
      {
        'rate': '3.43396763',
        'limit': 9177.49104318,
        'pair': 'VRC_SNGLS',
        'maxLimit': 9177.49104318,
        'min': 1.61737367,
        'minerFee': 3
      },
      {
        'rate': '0.26686665',
        'limit': 7063.45383209,
        'pair': 'SNGLS_VRC',
        'maxLimit': 32388.7751647,
        'min': 0.00138816,
        'minerFee': 0.0002
      },
      {
        'rate': '1.49804032',
        'limit': 9177.49104318,
        'pair': 'VRC_GNT',
        'maxLimit': 9177.49104318,
        'min': 0.01236775,
        'minerFee': 0.01
      },
      {
        'rate': '0.61251301',
        'limit': 3079.04041054,
        'pair': 'GNT_VRC',
        'maxLimit': 14118.6382138,
        'min': 0.00060527,
        'minerFee': 0.0002
      },
      {
        'rate': '0.29984364',
        'limit': 9177.49104318,
        'pair': 'VRC_SWT',
        'maxLimit': 9177.49104318,
        'min': 0.57992226,
        'minerFee': 0.1
      },
      {
        'rate': '2.87061517',
        'limit': 656.65377759,
        'pair': 'SWT_VRC',
        'maxLimit': 3011.02157862,
        'min': 0.00012121,
        'minerFee': 0.0002
      },
      {
        'rate': '0.92277924',
        'limit': 9177.49104318,
        'pair': 'VRC_WINGS',
        'maxLimit': 9177.49104318,
        'min': 0.01987156,
        'minerFee': 0.01
      },
      {
        'rate': '0.98364204',
        'limit': 1916.34782483,
        'pair': 'WINGS_VRC',
        'maxLimit': 8787.22524652,
        'min': 0.00037303,
        'minerFee': 0.0002
      },
      {
        'rate': '1.24606163',
        'limit': 9177.49104318,
        'pair': 'VRC_TRST',
        'maxLimit': 9177.49104318,
        'min': 0.01438229,
        'minerFee': 0.01
      },
      {
        'rate': '0.71192327',
        'limit': 2647.75766444,
        'pair': 'TRST_VRC',
        'maxLimit': 12141.03335152,
        'min': 0.00050371,
        'minerFee': 0.0002
      },
      {
        'rate': '0.84648867',
        'limit': 9177.49104318,
        'pair': 'VRC_RLC',
        'maxLimit': 9177.49104318,
        'min': 0.02127767,
        'minerFee': 0.01
      },
      {
        'rate': '1.05324488',
        'limit': 1789.70752378,
        'pair': 'RLC_VRC',
        'maxLimit': 8206.52851665,
        'min': 0.00034219,
        'minerFee': 0.0002
      },
      {
        'rate': '2.42380134',
        'limit': 4173.35946598,
        'pair': 'VRC_GUP',
        'maxLimit': 4173.35946598,
        'min': 0.0075038,
        'minerFee': 0.01
      },
      {
        'rate': '0.37143822',
        'limit': 5074.86885684,
        'pair': 'GUP_VRC',
        'maxLimit': 6670.4980368,
        'min': 0.00097981,
        'minerFee': 0.0002
      },
      {
        'rate': '0.23802972',
        'limit': 9177.49104318,
        'pair': 'VRC_ANT',
        'maxLimit': 9177.49104318,
        'min': 0.0777421,
        'minerFee': 0.01
      },
      {
        'rate': '3.84823390',
        'limit': 489.83516792,
        'pair': 'ANT_VRC',
        'maxLimit': 2246.09118367,
        'min': 0.00009622,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00955385',
        'limit': 9177.49104318,
        'pair': 'VRC_DCR',
        'maxLimit': 9177.49104318,
        'min': 5.8813588,
        'minerFee': 0.03
      },
      {
        'rate': '97.04242014',
        'limit': 19.42449804,
        'pair': 'DCR_VRC',
        'maxLimit': 89.06913315,
        'min': 0.00000386,
        'minerFee': 0.0002
      },
      {
        'rate': '2.87404308',
        'limit': 9177.49104318,
        'pair': 'VRC_BAT',
        'maxLimit': 9177.49104318,
        'min': 0.00646611,
        'minerFee': 0.01
      },
      {
        'rate': '0.32007267',
        'limit': 5889.28847997,
        'pair': 'BAT_VRC',
        'maxLimit': 27004.75547533,
        'min': 0.00116182,
        'minerFee': 0.0002
      },
      {
        'rate': '0.19206536',
        'limit': 9177.49104318,
        'pair': 'VRC_BNT',
        'maxLimit': 9177.49104318,
        'min': 0.09213453,
        'minerFee': 0.01
      },
      {
        'rate': '4.56065911',
        'limit': 413.31751641,
        'pair': 'BNT_VRC',
        'maxLimit': 1895.22698531,
        'min': 0.00007764,
        'minerFee': 0.0002
      },
      {
        'rate': '13.75282839',
        'limit': 9177.49104318,
        'pair': 'VRC_SNT',
        'maxLimit': 9177.49104318,
        'min': 0.39547068,
        'minerFee': 3
      },
      {
        'rate': '0.06525266',
        'limit': 28887.71503123,
        'pair': 'SNT_VRC',
        'maxLimit': 132461.78775462,
        'min': 0.00555951,
        'minerFee': 0.0002
      },
      {
        'rate': '0.03465783',
        'limit': 9177.49104318,
        'pair': 'VRC_NMR',
        'maxLimit': 9177.49104318,
        'min': 0.20280548,
        'minerFee': 0.004
      },
      {
        'rate': '25.09717762',
        'limit': 75.10805908,
        'pair': 'NMR_VRC',
        'maxLimit': 344.40064816,
        'min': 0.00001401,
        'minerFee': 0.0002
      },
      {
        'rate': '0.59962272',
        'limit': 9177.49104318,
        'pair': 'VRC_EDG',
        'maxLimit': 9177.49104318,
        'min': 0.92276491,
        'minerFee': 0.3
      },
      {
        'rate': '1.52256210',
        'limit': 1238.04492991,
        'pair': 'EDG_VRC',
        'maxLimit': 5676.93376091,
        'min': 0.00024239,
        'minerFee': 0.0002
      },
      {
        'rate': '1.51027535',
        'limit': 9177.49104318,
        'pair': 'VRC_CVC',
        'maxLimit': 9177.49104318,
        'min': 0.12181849,
        'minerFee': 0.1
      },
      {
        'rate': '0.60330606',
        'limit': 3126.02909605,
        'pair': 'CVC_VRC',
        'maxLimit': 14334.10006435,
        'min': 0.00061052,
        'minerFee': 0.0002
      },
      {
        'rate': '0.09578660',
        'limit': 7211.89311219,
        'pair': 'VRC_MTL',
        'maxLimit': 7211.89311219,
        'min': 0.19338178,
        'minerFee': 0.01
      },
      {
        'rate': '9.57239817',
        'limit': 196.92038143,
        'pair': 'MTL_VRC',
        'maxLimit': 902.95912056,
        'min': 0.00003872,
        'minerFee': 0.0002
      },
      {
        'rate': '22.27958199',
        'limit': 9177.49104318,
        'pair': 'VRC_FUN',
        'maxLimit': 9177.49104318,
        'min': 0.00082136,
        'minerFee': 0.01
      },
      {
        'rate': '0.04065742',
        'limit': 46362.99943284,
        'pair': 'FUN_VRC',
        'maxLimit': 212592.98817303,
        'min': 0.0090064,
        'minerFee': 0.0002
      },
      {
        'rate': '11.36713367',
        'limit': 9177.49104318,
        'pair': 'VRC_DNT',
        'maxLimit': 9177.49104318,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.07863782',
        'limit': 23970.65715358,
        'pair': 'DNT_VRC',
        'maxLimit': 109915.10047724,
        'min': 0.0045951,
        'minerFee': 0.0002
      },
      {
        'rate': '1.21986322',
        'limit': 9177.49104318,
        'pair': 'VRC_1ST',
        'maxLimit': 9177.49104318,
        'min': 0.01506169,
        'minerFee': 0.01
      },
      {
        'rate': '0.74555348',
        'limit': 2528.32335327,
        'pair': '1ST_VRC',
        'maxLimit': 11593.37908983,
        'min': 0.00049312,
        'minerFee': 0.0002
      },
      {
        'rate': '0.12436133',
        'limit': 4588.74553422,
        'pair': 'VRC_SALT',
        'maxLimit': 4588.74553422,
        'min': 0.73902315,
        'minerFee': 0.05
      },
      {
        'rate': '7.31632922',
        'limit': 257.642903,
        'pair': 'SALT_VRC',
        'maxLimit': 590.6981482,
        'min': 0.00005027,
        'minerFee': 0.0002
      },
      {
        'rate': '2.33363065',
        'limit': 9177.49104318,
        'pair': 'VRC_XEM',
        'maxLimit': 9177.49104318,
        'min': 3.21379077,
        'minerFee': 4
      },
      {
        'rate': '0.39770660',
        'limit': 4739.67558358,
        'pair': 'XEM_VRC',
        'maxLimit': 21733.31814232,
        'min': 0.00094288,
        'minerFee': 0.0002
      },
      {
        'rate': '3.60978321',
        'limit': 9177.49104318,
        'pair': 'VRC_RCN',
        'maxLimit': 9177.49104318,
        'min': 1.01402738,
        'minerFee': 2
      },
      {
        'rate': '0.25097177',
        'limit': 7510.80590812,
        'pair': 'RCN_VRC',
        'maxLimit': 34440.0648162,
        'min': 0.00145924,
        'minerFee': 0.0002
      },
      {
        'rate': '0.26536714',
        'limit': 9177.49104318,
        'pair': 'VRC_NMC',
        'maxLimit': 9177.49104318,
        'min': 0.03234578,
        'minerFee': 0.005
      },
      {
        'rate': '3.20384983',
        'limit': 496.85281567,
        'pair': 'NMC_VRC',
        'maxLimit': 496.85281567,
        'min': 0.00010722,
        'minerFee': 0.0002
      },
      {
        'rate': '0.01860484',
        'limit': 9177.49104318,
        'pair': 'VRC_REP',
        'maxLimit': 9177.49104318,
        'min': 0.98166977,
        'minerFee': 0.01
      },
      {
        'rate': '48.61719511',
        'limit': 38.79187838,
        'pair': 'REP_VRC',
        'maxLimit': 177.87635866,
        'min': 0.00000752,
        'minerFee': 0.0002
      },
      {
        'rate': '0.00455097',
        'limit': 9177.49104318,
        'pair': 'VRC_GNO',
        'maxLimit': 9177.49104318,
        'min': 4.06665878,
        'minerFee': 0.01
      },
      {
        'rate': '201.40127606',
        'limit': 9.36415278,
        'pair': 'GNO_VRC',
        'maxLimit': 42.93840538,
        'min': 0.00000184,
        'minerFee': 0.0002
      },
      {
        'rate': '2.28764778',
        'limit': 9177.49104318,
        'pair': 'VRC_ZRX',
        'maxLimit': 9177.49104318,
        'min': 0.00403921,
        'minerFee': 0.005
      },
      {
        'rate': '0.40008365',
        'limit': 4713.89492141,
        'pair': 'ZRX_VRC',
        'maxLimit': 21615.10344113,
        'min': 0.0009243,
        'minerFee': 0.0002
      },
      {
        'rate': '54.46278053',
        'limit': 932.52639437,
        'pair': 'VTC_VOX',
        'maxLimit': 932.52639437,
        'min': 0.00035011,
        'minerFee': 0.01
      },
      {
        'rate': '0.01732158',
        'limit': 20936.54867898,
        'pair': 'VOX_VTC',
        'maxLimit': 20936.54867898,
        'min': 2.20051639,
        'minerFee': 0.02
      },
      {
        'rate': '830.97000000',
        'limit': 932.52639437,
        'pair': 'VTC_SC',
        'maxLimit': 932.52639437,
        'min': 0.02336449,
        'minerFee': 10
      },
      {
        'rate': '0.00115595',
        'limit': 794770.72652774,
        'pair': 'SC_VTC',
        'maxLimit': 794770.72652774,
        'min': 33.57454545,
        'minerFee': 0.02
      },
      {
        'rate': '18.28743581',
        'limit': 932.52639437,
        'pair': 'VTC_LBC',
        'maxLimit': 932.52639437,
        'min': 0.00212725,
        'minerFee': 0.02
      },
      {
        'rate': '0.05262276',
        'limit': 17458.63373582,
        'pair': 'LBC_VTC',
        'maxLimit': 17458.63373582,
        'min': 0.7388863,
        'minerFee': 0.02
      },
      {
        'rate': '0.93437406',
        'limit': 932.52639437,
        'pair': 'VTC_WAVES',
        'maxLimit': 932.52639437,
        'min': 0.00209475,
        'minerFee': 0.001
      },
      {
        'rate': '1.03637854',
        'limit': 886.47294297,
        'pair': 'WAVES_VTC',
        'maxLimit': 886.47294297,
        'min': 0.03775249,
        'minerFee': 0.02
      },
      {
        'rate': '2.43989767',
        'limit': 932.52639437,
        'pair': 'VTC_GAME',
        'maxLimit': 932.52639437,
        'min': 0.15728972,
        'minerFee': 0.2
      },
      {
        'rate': '0.38929205',
        'limit': 2361.17268725,
        'pair': 'GAME_VTC',
        'maxLimit': 2361.17268725,
        'min': 0.09858172,
        'minerFee': 0.02
      },
      {
        'rate': '1.72405834',
        'limit': 932.52639437,
        'pair': 'VTC_KMD',
        'maxLimit': 932.52639437,
        'min': 0.00228253,
        'minerFee': 0.002
      },
      {
        'rate': '0.56464099',
        'limit': 1627.08967371,
        'pair': 'KMD_VTC',
        'maxLimit': 1627.08967371,
        'min': 0.06965892,
        'minerFee': 0.02
      },
      {
        'rate': '33.81258939',
        'limit': 932.52639437,
        'pair': 'VTC_SNGLS',
        'maxLimit': 932.52639437,
        'min': 0.17199856,
        'minerFee': 3
      },
      {
        'rate': '0.02836542',
        'limit': 32388.7751647,
        'pair': 'SNGLS_VTC',
        'maxLimit': 32388.7751647,
        'min': 1.36616523,
        'minerFee': 0.02
      },
      {
        'rate': '14.75046209',
        'limit': 932.52639437,
        'pair': 'VTC_GNT',
        'maxLimit': 932.52639437,
        'min': 0.00131524,
        'minerFee': 0.01
      },
      {
        'rate': '0.06510442',
        'limit': 14118.6382138,
        'pair': 'GNT_VTC',
        'maxLimit': 14118.6382138,
        'min': 0.59567742,
        'minerFee': 0.02
      },
      {
        'rate': '2.95241279',
        'limit': 932.52639437,
        'pair': 'VTC_SWT',
        'maxLimit': 932.52639437,
        'min': 0.06167146,
        'minerFee': 0.1
      },
      {
        'rate': '0.30511954',
        'limit': 3011.02157862,
        'pair': 'SWT_VTC',
        'maxLimit': 3011.02157862,
        'min': 0.11928941,
        'minerFee': 0.02
      },
      {
        'rate': '9.08615308',
        'limit': 932.52639437,
        'pair': 'VTC_WINGS',
        'maxLimit': 932.52639437,
        'min': 0.00211323,
        'minerFee': 0.01
      },
      {
        'rate': '0.10455195',
        'limit': 8787.22524652,
        'pair': 'WINGS_VTC',
        'maxLimit': 8787.22524652,
        'min': 0.3671173,
        'minerFee': 0.02
      },
      {
        'rate': '12.26935570',
        'limit': 932.52639437,
        'pair': 'VTC_TRST',
        'maxLimit': 932.52639437,
        'min': 0.00152948,
        'minerFee': 0.01
      },
      {
        'rate': '0.07567078',
        'limit': 12141.03335152,
        'pair': 'TRST_VTC',
        'maxLimit': 12141.03335152,
        'min': 0.49573154,
        'minerFee': 0.02
      },
      {
        'rate': '8.33495744',
        'limit': 932.52639437,
        'pair': 'VTC_RLC',
        'maxLimit': 932.52639437,
        'min': 0.00226276,
        'minerFee': 0.01
      },
      {
        'rate': '0.11195008',
        'limit': 8206.52851665,
        'pair': 'RLC_VTC',
        'maxLimit': 8206.52851665,
        'min': 0.33676596,
        'minerFee': 0.02
      },
      {
        'rate': '23.86597911',
        'limit': 424.05574992,
        'pair': 'VTC_GUP',
        'maxLimit': 424.05574992,
        'min': 0.00079799,
        'minerFee': 0.01
      },
      {
        'rate': '0.03948040',
        'limit': 6670.4980368,
        'pair': 'GUP_VTC',
        'maxLimit': 6670.4980368,
        'min': 0.96428198,
        'minerFee': 0.02
      },
      {
        'rate': '2.34376153',
        'limit': 932.52639437,
        'pair': 'VTC_ANT',
        'maxLimit': 932.52639437,
        'min': 0.00826743,
        'minerFee': 0.01
      },
      {
        'rate': '0.40903127',
        'limit': 2246.09118367,
        'pair': 'ANT_VTC',
        'maxLimit': 2246.09118367,
        'min': 0.09469744,
        'minerFee': 0.02
      },
      {
        'rate': '0.09407207',
        'limit': 932.52639437,
        'pair': 'VTC_DCR',
        'maxLimit': 932.52639437,
        'min': 0.62544932,
        'minerFee': 0.03
      },
      {
        'rate': '10.31470165',
        'limit': 89.06913315,
        'pair': 'DCR_VTC',
        'maxLimit': 89.06913315,
        'min': 0.00380089,
        'minerFee': 0.02
      },
      {
        'rate': '28.29928792',
        'limit': 932.52639437,
        'pair': 'VTC_BAT',
        'maxLimit': 932.52639437,
        'min': 0.00068763,
        'minerFee': 0.01
      },
      {
        'rate': '0.03402073',
        'limit': 27004.75547533,
        'pair': 'BAT_VTC',
        'maxLimit': 27004.75547533,
        'min': 1.14340557,
        'minerFee': 0.02
      },
      {
        'rate': '1.89117310',
        'limit': 932.52639437,
        'pair': 'VTC_BNT',
        'maxLimit': 932.52639437,
        'min': 0.00979799,
        'minerFee': 0.01
      },
      {
        'rate': '0.48475540',
        'limit': 1895.22698531,
        'pair': 'BNT_VTC',
        'maxLimit': 1895.22698531,
        'min': 0.07641103,
        'minerFee': 0.02
      },
      {
        'rate': '135.41733333',
        'limit': 932.52639437,
        'pair': 'VTC_SNT',
        'maxLimit': 932.52639437,
        'min': 0.04205607,
        'minerFee': 3
      },
      {
        'rate': '0.00693574',
        'limit': 132461.78775462,
        'pair': 'SNT_VTC',
        'maxLimit': 132461.78775462,
        'min': 5.47140741,
        'minerFee': 0.02
      },
      {
        'rate': '0.34125865',
        'limit': 932.52639437,
        'pair': 'VTC_NMR',
        'maxLimit': 932.52639437,
        'min': 0.02156722,
        'minerFee': 0.004
      },
      {
        'rate': '2.66759525',
        'limit': 344.40064816,
        'pair': 'NMR_VTC',
        'maxLimit': 344.40064816,
        'min': 0.01378823,
        'minerFee': 0.02
      },
      {
        'rate': '5.90418990',
        'limit': 932.52639437,
        'pair': 'VTC_EDG',
        'maxLimit': 932.52639437,
        'min': 0.09813084,
        'minerFee': 0.3
      },
      {
        'rate': '0.16183411',
        'limit': 5676.93376091,
        'pair': 'EDG_VTC',
        'maxLimit': 5676.93376091,
        'min': 0.23855313,
        'minerFee': 0.02
      },
      {
        'rate': '14.87093817',
        'limit': 932.52639437,
        'pair': 'VTC_CVC',
        'maxLimit': 932.52639437,
        'min': 0.01295471,
        'minerFee': 0.1
      },
      {
        'rate': '0.06412580',
        'limit': 14334.10006435,
        'pair': 'CVC_VTC',
        'maxLimit': 14334.10006435,
        'min': 0.60084599,
        'minerFee': 0.02
      },
      {
        'rate': '0.94316359',
        'limit': 732.80165942,
        'pair': 'VTC_MTL',
        'maxLimit': 732.80165942,
        'min': 0.02056506,
        'minerFee': 0.01
      },
      {
        'rate': '1.01745639',
        'limit': 902.95912056,
        'pair': 'MTL_VTC',
        'maxLimit': 902.95912056,
        'min': 0.03810762,
        'minerFee': 0.02
      },
      {
        'rate': '219.37607999',
        'limit': 932.52639437,
        'pair': 'VTC_FUN',
        'maxLimit': 932.52639437,
        'min': 0.00008735,
        'minerFee': 0.01
      },
      {
        'rate': '0.00432150',
        'limit': 212592.98817303,
        'pair': 'FUN_VTC',
        'maxLimit': 212592.98817303,
        'min': 8.86368,
        'minerFee': 0.02
      },
      {
        'rate': '111.92657142',
        'limit': 932.52639437,
        'pair': 'VTC_DNT',
        'maxLimit': 932.52639437,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00835846',
        'limit': 109915.10047724,
        'pair': 'DNT_VTC',
        'maxLimit': 109915.10047724,
        'min': 4.52228571,
        'minerFee': 0.02
      },
      {
        'rate': '12.01139290',
        'limit': 932.52639437,
        'pair': 'VTC_1ST',
        'maxLimit': 932.52639437,
        'min': 0.00160173,
        'minerFee': 0.01
      },
      {
        'rate': '0.07924536',
        'limit': 11593.37908983,
        'pair': '1ST_VTC',
        'maxLimit': 11593.37908983,
        'min': 0.4853088,
        'minerFee': 0.02
      },
      {
        'rate': '1.22452487',
        'limit': 466.26319745,
        'pair': 'VTC_SALT',
        'maxLimit': 466.26319745,
        'min': 0.07859094,
        'minerFee': 0.05
      },
      {
        'rate': '0.77765736',
        'limit': 590.6981482,
        'pair': 'SALT_VTC',
        'maxLimit': 590.6981482,
        'min': 0.04947575,
        'minerFee': 0.02
      },
      {
        'rate': '22.97810678',
        'limit': 932.52639437,
        'pair': 'VTC_XEM',
        'maxLimit': 932.52639437,
        'min': 0.34176851,
        'minerFee': 4
      },
      {
        'rate': '0.04227249',
        'limit': 21733.31814232,
        'pair': 'XEM_VTC',
        'maxLimit': 21733.31814232,
        'min': 0.9279397,
        'minerFee': 0.02
      },
      {
        'rate': '35.54375891',
        'limit': 932.52639437,
        'pair': 'VTC_RCN',
        'maxLimit': 932.52639437,
        'min': 0.10783609,
        'minerFee': 2
      },
      {
        'rate': '0.02667595',
        'limit': 34440.0648162,
        'pair': 'RCN_VTC',
        'maxLimit': 34440.0648162,
        'min': 1.43611147,
        'minerFee': 0.02
      },
      {
        'rate': '2.61293900',
        'limit': 932.52639437,
        'pair': 'VTC_NMC',
        'maxLimit': 932.52639437,
        'min': 0.00343979,
        'minerFee': 0.005
      },
      {
        'rate': '0.34053936',
        'limit': 496.85281567,
        'pair': 'NMC_VTC',
        'maxLimit': 496.85281567,
        'min': 0.10552,
        'minerFee': 0.02
      },
      {
        'rate': '0.18319273',
        'limit': 932.52639437,
        'pair': 'VTC_REP',
        'maxLimit': 932.52639437,
        'min': 0.10439504,
        'minerFee': 0.01
      },
      {
        'rate': '5.16755445',
        'limit': 177.87635866,
        'pair': 'REP_VTC',
        'maxLimit': 177.87635866,
        'min': 0.00739799,
        'minerFee': 0.02
      },
      {
        'rate': '0.04481123',
        'limit': 932.52639437,
        'pair': 'VTC_GNO',
        'maxLimit': 932.52639437,
        'min': 0.43246621,
        'minerFee': 0.01
      },
      {
        'rate': '21.40707746',
        'limit': 42.93840538,
        'pair': 'GNO_VTC',
        'maxLimit': 42.93840538,
        'min': 0.00180964,
        'minerFee': 0.02
      },
      {
        'rate': '22.52533620',
        'limit': 932.52639437,
        'pair': 'VTC_ZRX',
        'maxLimit': 932.52639437,
        'min': 0.00042955,
        'minerFee': 0.005
      },
      {
        'rate': '0.04252516',
        'limit': 21615.10344113,
        'pair': 'ZRX_VTC',
        'maxLimit': 21615.10344113,
        'min': 0.90965517,
        'minerFee': 0.02
      },
      {
        'rate': '14.60262121',
        'limit': 20936.54867898,
        'pair': 'VOX_SC',
        'maxLimit': 20936.54867898,
        'min': 1.29096326,
        'minerFee': 10
      },
      {
        'rate': '0.06387040',
        'limit': 794770.72652774,
        'pair': 'SC_VOX',
        'maxLimit': 794770.72652774,
        'min': 0.29515152,
        'minerFee': 0.01
      },
      {
        'rate': '0.32136478',
        'limit': 20936.54867898,
        'pair': 'VOX_LBC',
        'maxLimit': 20936.54867898,
        'min': 0.11753724,
        'minerFee': 0.02
      },
      {
        'rate': '2.90757745',
        'limit': 17458.63373582,
        'pair': 'LBC_VOX',
        'maxLimit': 17458.63373582,
        'min': 0.0064955,
        'minerFee': 0.01
      },
      {
        'rate': '0.01641973',
        'limit': 20936.54867898,
        'pair': 'VOX_WAVES',
        'maxLimit': 20936.54867898,
        'min': 0.11574181,
        'minerFee': 0.001
      },
      {
        'rate': '57.26325918',
        'limit': 886.47294297,
        'pair': 'WAVES_VOX',
        'maxLimit': 886.47294297,
        'min': 0.00033188,
        'minerFee': 0.01
      },
      {
        'rate': '0.04287627',
        'limit': 20936.54867898,
        'pair': 'VOX_GAME',
        'maxLimit': 20936.54867898,
        'min': 8.69076465,
        'minerFee': 0.2
      },
      {
        'rate': '21.50964250',
        'limit': 2361.17268725,
        'pair': 'GAME_VOX',
        'maxLimit': 2361.17268725,
        'min': 0.00086663,
        'minerFee': 0.01
      },
      {
        'rate': '0.03029684',
        'limit': 20936.54867898,
        'pair': 'VOX_KMD',
        'maxLimit': 20936.54867898,
        'min': 0.12611718,
        'minerFee': 0.002
      },
      {
        'rate': '31.19823733',
        'limit': 1627.08967371,
        'pair': 'KMD_VOX',
        'maxLimit': 1627.08967371,
        'min': 0.00061237,
        'minerFee': 0.01
      },
      {
        'rate': '0.59418803',
        'limit': 20936.54867898,
        'pair': 'VOX_SNGLS',
        'maxLimit': 20936.54867898,
        'min': 9.50347567,
        'minerFee': 3
      },
      {
        'rate': '1.56728152',
        'limit': 32388.7751647,
        'pair': 'SNGLS_VOX',
        'maxLimit': 32388.7751647,
        'min': 0.01200986,
        'minerFee': 0.01
      },
      {
        'rate': '0.25920967',
        'limit': 20936.54867898,
        'pair': 'VOX_GNT',
        'maxLimit': 20936.54867898,
        'min': 0.0726713,
        'minerFee': 0.01
      },
      {
        'rate': '3.59722939',
        'limit': 14118.6382138,
        'pair': 'GNT_VOX',
        'maxLimit': 14118.6382138,
        'min': 0.00523656,
        'minerFee': 0.01
      },
      {
        'rate': '0.05188269',
        'limit': 20936.54867898,
        'pair': 'VOX_SWT',
        'maxLimit': 20936.54867898,
        'min': 3.40754717,
        'minerFee': 0.1
      },
      {
        'rate': '16.85883962',
        'limit': 3011.02157862,
        'pair': 'SWT_VOX',
        'maxLimit': 3011.02157862,
        'min': 0.00104866,
        'minerFee': 0.01
      },
      {
        'rate': '0.15967080',
        'limit': 20936.54867898,
        'pair': 'VOX_WINGS',
        'maxLimit': 20936.54867898,
        'min': 0.11676266,
        'minerFee': 0.01
      },
      {
        'rate': '5.77683267',
        'limit': 8787.22524652,
        'pair': 'WINGS_VOX',
        'maxLimit': 8787.22524652,
        'min': 0.0032273,
        'minerFee': 0.01
      },
      {
        'rate': '0.21560917',
        'limit': 20936.54867898,
        'pair': 'VOX_TRST',
        'maxLimit': 20936.54867898,
        'min': 0.08450844,
        'minerFee': 0.01
      },
      {
        'rate': '4.18105511',
        'limit': 12141.03335152,
        'pair': 'TRST_VOX',
        'maxLimit': 12141.03335152,
        'min': 0.00435794,
        'minerFee': 0.01
      },
      {
        'rate': '0.14647006',
        'limit': 20936.54867898,
        'pair': 'VOX_RLC',
        'maxLimit': 20936.54867898,
        'min': 0.12502483,
        'minerFee': 0.01
      },
      {
        'rate': '6.18560327',
        'limit': 8206.52851665,
        'pair': 'RLC_VOX',
        'maxLimit': 8206.52851665,
        'min': 0.00296049,
        'minerFee': 0.01
      },
      {
        'rate': '0.41939643',
        'limit': 20936.54867898,
        'pair': 'VOX_GUP',
        'maxLimit': 20936.54867898,
        'min': 0.04409136,
        'minerFee': 0.01
      },
      {
        'rate': '2.18142005',
        'limit': 6670.4980368,
        'pair': 'GUP_VOX',
        'maxLimit': 6670.4980368,
        'min': 0.00847694,
        'minerFee': 0.01
      },
      {
        'rate': '0.04118688',
        'limit': 20936.54867898,
        'pair': 'VOX_ANT',
        'maxLimit': 20936.54867898,
        'min': 0.45680238,
        'minerFee': 0.01
      },
      {
        'rate': '22.60029791',
        'limit': 2246.09118367,
        'pair': 'ANT_VOX',
        'maxLimit': 2246.09118367,
        'min': 0.00083248,
        'minerFee': 0.01
      },
      {
        'rate': '0.00165312',
        'limit': 20936.54867898,
        'pair': 'VOX_DCR',
        'maxLimit': 20936.54867898,
        'min': 34.55809335,
        'minerFee': 0.03
      },
      {
        'rate': '569.92055610',
        'limit': 89.06913315,
        'pair': 'DCR_VOX',
        'maxLimit': 89.06913315,
        'min': 0.00003341,
        'minerFee': 0.01
      },
      {
        'rate': '0.49730288',
        'limit': 20936.54867898,
        'pair': 'VOX_BAT',
        'maxLimit': 20936.54867898,
        'min': 0.03799404,
        'minerFee': 0.01
      },
      {
        'rate': '1.87975521',
        'limit': 27004.75547533,
        'pair': 'BAT_VOX',
        'maxLimit': 27004.75547533,
        'min': 0.0100516,
        'minerFee': 0.01
      },
      {
        'rate': '0.03323355',
        'limit': 20936.54867898,
        'pair': 'VOX_BNT',
        'maxLimit': 20936.54867898,
        'min': 0.54137041,
        'minerFee': 0.01
      },
      {
        'rate': '26.78430089',
        'limit': 1895.22698531,
        'pair': 'BNT_VOX',
        'maxLimit': 1895.22698531,
        'min': 0.00067172,
        'minerFee': 0.01
      },
      {
        'rate': '2.37968641',
        'limit': 20936.54867898,
        'pair': 'VOX_SNT',
        'maxLimit': 20936.54867898,
        'min': 2.32373386,
        'minerFee': 3
      },
      {
        'rate': '0.38322244',
        'limit': 132461.78775462,
        'pair': 'SNT_VOX',
        'maxLimit': 132461.78775462,
        'min': 0.04809877,
        'minerFee': 0.01
      },
      {
        'rate': '0.00599693',
        'limit': 20936.54867898,
        'pair': 'VOX_NMR',
        'maxLimit': 20936.54867898,
        'min': 1.19165839,
        'minerFee': 0.004
      },
      {
        'rate': '147.39324726',
        'limit': 344.40064816,
        'pair': 'NMR_VOX',
        'maxLimit': 344.40064816,
        'min': 0.00012121,
        'minerFee': 0.01
      },
      {
        'rate': '0.10375422',
        'limit': 20936.54867898,
        'pair': 'VOX_EDG',
        'maxLimit': 20936.54867898,
        'min': 5.42204568,
        'minerFee': 0.3
      },
      {
        'rate': '8.94185700',
        'limit': 5676.93376091,
        'pair': 'EDG_VOX',
        'maxLimit': 5676.93376091,
        'min': 0.0020971,
        'minerFee': 0.01
      },
      {
        'rate': '0.26132673',
        'limit': 20936.54867898,
        'pair': 'VOX_CVC',
        'maxLimit': 20936.54867898,
        'min': 0.71578947,
        'minerFee': 0.1
      },
      {
        'rate': '3.54315789',
        'limit': 14334.10006435,
        'pair': 'CVC_VOX',
        'maxLimit': 14334.10006435,
        'min': 0.005282,
        'minerFee': 0.01
      },
      {
        'rate': '0.01657419',
        'limit': 20936.54867898,
        'pair': 'VOX_MTL',
        'maxLimit': 20936.54867898,
        'min': 1.136286,
        'minerFee': 0.01
      },
      {
        'rate': '56.21774975',
        'limit': 902.95912056,
        'pair': 'MTL_VOX',
        'maxLimit': 902.95912056,
        'min': 0.000335,
        'minerFee': 0.01
      },
      {
        'rate': '3.85509199',
        'limit': 20936.54867898,
        'pair': 'VOX_FUN',
        'maxLimit': 20936.54867898,
        'min': 0.00482622,
        'minerFee': 0.01
      },
      {
        'rate': '0.23877706',
        'limit': 212592.98817303,
        'pair': 'FUN_VOX',
        'maxLimit': 212592.98817303,
        'min': 0.07792,
        'minerFee': 0.01
      },
      {
        'rate': '1.96688367',
        'limit': 20936.54867898,
        'pair': 'VOX_DNT',
        'maxLimit': 20936.54867898,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.46183217',
        'limit': 109915.10047724,
        'pair': 'DNT_VOX',
        'maxLimit': 109915.10047724,
        'min': 0.0397551,
        'minerFee': 0.01
      },
      {
        'rate': '0.21107599',
        'limit': 20936.54867898,
        'pair': 'VOX_1ST',
        'maxLimit': 20936.54867898,
        'min': 0.0885005,
        'minerFee': 0.01
      },
      {
        'rate': '4.37856206',
        'limit': 11593.37908983,
        'pair': '1ST_VOX',
        'maxLimit': 11593.37908983,
        'min': 0.00426632,
        'minerFee': 0.01
      },
      {
        'rate': '0.02151855',
        'limit': 20936.54867898,
        'pair': 'VOX_SALT',
        'maxLimit': 20936.54867898,
        'min': 4.34240318,
        'minerFee': 0.05
      },
      {
        'rate': '42.96807944',
        'limit': 590.6981482,
        'pair': 'SALT_VOX',
        'maxLimit': 590.6981482,
        'min': 0.00043494,
        'minerFee': 0.01
      },
      {
        'rate': '0.40379396',
        'limit': 20936.54867898,
        'pair': 'VOX_XEM',
        'maxLimit': 20936.54867898,
        'min': 18.88381331,
        'minerFee': 4
      },
      {
        'rate': '2.33569165',
        'limit': 21733.31814232,
        'pair': 'XEM_VOX',
        'maxLimit': 21733.31814232,
        'min': 0.00815745,
        'minerFee': 0.01
      },
      {
        'rate': '0.62460985',
        'limit': 20936.54867898,
        'pair': 'VOX_RCN',
        'maxLimit': 20936.54867898,
        'min': 5.95829196,
        'minerFee': 2
      },
      {
        'rate': '1.47393247',
        'limit': 34440.0648162,
        'pair': 'RCN_VOX',
        'maxLimit': 34440.0648162,
        'min': 0.01262476,
        'minerFee': 0.01
      },
      {
        'rate': '0.04591714',
        'limit': 20936.54867898,
        'pair': 'VOX_NMC',
        'maxLimit': 20936.54867898,
        'min': 0.19005958,
        'minerFee': 0.005
      },
      {
        'rate': '18.81589870',
        'limit': 496.85281567,
        'pair': 'NMC_VOX',
        'maxLimit': 496.85281567,
        'min': 0.00092762,
        'minerFee': 0.01
      },
      {
        'rate': '0.00321924',
        'limit': 20936.54867898,
        'pair': 'VOX_REP',
        'maxLimit': 20936.54867898,
        'min': 5.76816286,
        'minerFee': 0.01
      },
      {
        'rate': '285.52406156',
        'limit': 177.87635866,
        'pair': 'REP_VOX',
        'maxLimit': 177.87635866,
        'min': 0.00006504,
        'minerFee': 0.01
      },
      {
        'rate': '0.00078746',
        'limit': 20936.54867898,
        'pair': 'VOX_GNO',
        'maxLimit': 20936.54867898,
        'min': 23.89515392,
        'minerFee': 0.01
      },
      {
        'rate': '1182.81011916',
        'limit': 42.93840538,
        'pair': 'GNO_VOX',
        'maxLimit': 42.93840538,
        'min': 0.00001591,
        'minerFee': 0.01
      },
      {
        'rate': '0.39583743',
        'limit': 20936.54867898,
        'pair': 'VOX_ZRX',
        'maxLimit': 20936.54867898,
        'min': 0.02373386,
        'minerFee': 0.005
      },
      {
        'rate': '2.34965243',
        'limit': 21615.10344113,
        'pair': 'ZRX_VOX',
        'maxLimit': 21615.10344113,
        'min': 0.00799672,
        'minerFee': 0.01
      },
      {
        'rate': '0.02144631',
        'limit': 794770.72652774,
        'pair': 'SC_LBC',
        'maxLimit': 794770.72652774,
        'min': 1.79333333,
        'minerFee': 0.02
      },
      {
        'rate': '44.36258333',
        'limit': 17458.63373582,
        'pair': 'LBC_SC',
        'maxLimit': 17458.63373582,
        'min': 0.43347783,
        'minerFee': 10
      },
      {
        'rate': '0.00109577',
        'limit': 794770.72652774,
        'pair': 'SC_WAVES',
        'maxLimit': 794770.72652774,
        'min': 1.76593939,
        'minerFee': 0.001
      },
      {
        'rate': '873.69851515',
        'limit': 886.47294297,
        'pair': 'WAVES_SC',
        'maxLimit': 886.47294297,
        'min': 0.02214802,
        'minerFee': 10
      },
      {
        'rate': '0.00286135',
        'limit': 794770.72652774,
        'pair': 'SC_GAME',
        'maxLimit': 794770.72652774,
        'min': 132.6,
        'minerFee': 0.2
      },
      {
        'rate': '328.18500000',
        'limit': 2361.17268725,
        'pair': 'GAME_SC',
        'maxLimit': 2361.17268725,
        'min': 0.05783433,
        'minerFee': 10
      },
      {
        'rate': '0.00202186',
        'limit': 794770.72652774,
        'pair': 'SC_KMD',
        'maxLimit': 794770.72652774,
        'min': 1.92424242,
        'minerFee': 0.002
      },
      {
        'rate': '476.00946969',
        'limit': 1627.08967371,
        'pair': 'KMD_SC',
        'maxLimit': 1627.08967371,
        'min': 0.04086637,
        'minerFee': 10
      },
      {
        'rate': '0.03965320',
        'limit': 794770.72652774,
        'pair': 'SC_SNGLS',
        'maxLimit': 794770.72652774,
        'min': 145,
        'minerFee': 3
      },
      {
        'rate': '23.91291666',
        'limit': 32388.7751647,
        'pair': 'SNGLS_SC',
        'maxLimit': 32388.7751647,
        'min': 0.80147965,
        'minerFee': 10
      },
      {
        'rate': '0.01729838',
        'limit': 794770.72652774,
        'pair': 'SC_GNT',
        'maxLimit': 794770.72652774,
        'min': 1.10878788,
        'minerFee': 0.01
      },
      {
        'rate': '54.88500000',
        'limit': 14118.6382138,
        'pair': 'GNT_SC',
        'maxLimit': 14118.6382138,
        'min': 0.34946237,
        'minerFee': 10
      },
      {
        'rate': '0.00346239',
        'limit': 794770.72652774,
        'pair': 'SC_SWT',
        'maxLimit': 794770.72652774,
        'min': 51.99090909,
        'minerFee': 0.1
      },
      {
        'rate': '257.22502272',
        'limit': 3011.02157862,
        'pair': 'SWT_SC',
        'maxLimit': 3011.02157862,
        'min': 0.06998277,
        'minerFee': 10
      },
      {
        'rate': '0.01065564',
        'limit': 794770.72652774,
        'pair': 'SC_WINGS',
        'maxLimit': 794770.72652774,
        'min': 1.78151515,
        'minerFee': 0.01
      },
      {
        'rate': '88.14046212',
        'limit': 8787.22524652,
        'pair': 'WINGS_SC',
        'maxLimit': 8787.22524652,
        'min': 0.21537442,
        'minerFee': 10
      },
      {
        'rate': '0.01438870',
        'limit': 794770.72652774,
        'pair': 'SC_TRST',
        'maxLimit': 794770.72652774,
        'min': 1.28939394,
        'minerFee': 0.01
      },
      {
        'rate': '63.79276515',
        'limit': 12141.03335152,
        'pair': 'TRST_SC',
        'maxLimit': 12141.03335152,
        'min': 0.29082774,
        'minerFee': 10
      },
      {
        'rate': '0.00977469',
        'limit': 794770.72652774,
        'pair': 'SC_RLC',
        'maxLimit': 794770.72652774,
        'min': 1.90757576,
        'minerFee': 0.01
      },
      {
        'rate': '94.37731060',
        'limit': 8206.52851665,
        'pair': 'RLC_SC',
        'maxLimit': 8206.52851665,
        'min': 0.19756839,
        'minerFee': 10
      },
      {
        'rate': '0.02798846',
        'limit': 361412.92975385,
        'pair': 'SC_GUP',
        'maxLimit': 361412.92975385,
        'min': 0.67272727,
        'minerFee': 0.01
      },
      {
        'rate': '33.28318181',
        'limit': 6670.4980368,
        'pair': 'GUP_SC',
        'maxLimit': 6670.4980368,
        'min': 0.56570931,
        'minerFee': 10
      },
      {
        'rate': '0.00274861',
        'limit': 794770.72652774,
        'pair': 'SC_ANT',
        'maxLimit': 794770.72652774,
        'min': 6.96969697,
        'minerFee': 0.01
      },
      {
        'rate': '344.82575757',
        'limit': 2246.09118367,
        'pair': 'ANT_SC',
        'maxLimit': 2246.09118367,
        'min': 0.05555556,
        'minerFee': 10
      },
      {
        'rate': '0.00011032',
        'limit': 794770.72652774,
        'pair': 'SC_DCR',
        'maxLimit': 794770.72652774,
        'min': 527.27272727,
        'minerFee': 0.03
      },
      {
        'rate': '8695.60606060',
        'limit': 89.06913315,
        'pair': 'DCR_SC',
        'maxLimit': 89.06913315,
        'min': 0.00222985,
        'minerFee': 10
      },
      {
        'rate': '0.03318756',
        'limit': 794770.72652774,
        'pair': 'SC_BAT',
        'maxLimit': 794770.72652774,
        'min': 0.57969697,
        'minerFee': 0.01
      },
      {
        'rate': '28.68050757',
        'limit': 27004.75547533,
        'pair': 'BAT_SC',
        'maxLimit': 27004.75547533,
        'min': 0.67079463,
        'minerFee': 10
      },
      {
        'rate': '0.00221784',
        'limit': 794770.72652774,
        'pair': 'SC_BNT',
        'maxLimit': 794770.72652774,
        'min': 8.26,
        'minerFee': 0.01
      },
      {
        'rate': '408.66350000',
        'limit': 1895.22698531,
        'pair': 'BNT_SC',
        'maxLimit': 1895.22698531,
        'min': 0.04482759,
        'minerFee': 10
      },
      {
        'rate': '0.15880864',
        'limit': 794770.72652774,
        'pair': 'SC_SNT',
        'maxLimit': 794770.72652774,
        'min': 35.45454545,
        'minerFee': 3
      },
      {
        'rate': '5.84704545',
        'limit': 132461.78775462,
        'pair': 'SNT_SC',
        'maxLimit': 132461.78775462,
        'min': 3.20987654,
        'minerFee': 10
      },
      {
        'rate': '0.00040020',
        'limit': 794770.72652774,
        'pair': 'SC_NMR',
        'maxLimit': 794770.72652774,
        'min': 18.18181818,
        'minerFee': 0.004
      },
      {
        'rate': '2248.86363636',
        'limit': 344.40064816,
        'pair': 'NMR_SC',
        'maxLimit': 344.40064816,
        'min': 0.00808905,
        'minerFee': 10
      },
      {
        'rate': '0.00692404',
        'limit': 794770.72652774,
        'pair': 'SC_EDG',
        'maxLimit': 794770.72652774,
        'min': 82.72727273,
        'minerFee': 0.3
      },
      {
        'rate': '136.43106060',
        'limit': 5676.93376091,
        'pair': 'EDG_SC',
        'maxLimit': 5676.93376091,
        'min': 0.13995048,
        'minerFee': 10
      },
      {
        'rate': '0.01743966',
        'limit': 794770.72652774,
        'pair': 'SC_CVC',
        'maxLimit': 794770.72652774,
        'min': 10.92121212,
        'minerFee': 0.1
      },
      {
        'rate': '54.06000000',
        'limit': 14334.10006435,
        'pair': 'CVC_SC',
        'maxLimit': 14334.10006435,
        'min': 0.35249458,
        'minerFee': 10
      },
      {
        'rate': '0.00110608',
        'limit': 624549.94351572,
        'pair': 'SC_MTL',
        'maxLimit': 624549.94351572,
        'min': 17.3369697,
        'minerFee': 0.01
      },
      {
        'rate': '857.74657575',
        'limit': 902.95912056,
        'pair': 'MTL_SC',
        'maxLimit': 902.95912056,
        'min': 0.02235636,
        'minerFee': 10
      },
      {
        'rate': '0.25726999',
        'limit': 794770.72652774,
        'pair': 'SC_FUN',
        'maxLimit': 794770.72652774,
        'min': 0.07363636,
        'minerFee': 0.01
      },
      {
        'rate': '3.64315909',
        'limit': 212592.98817303,
        'pair': 'FUN_SC',
        'maxLimit': 212592.98817303,
        'min': 5.2,
        'minerFee': 10
      },
      {
        'rate': '0.13126020',
        'limit': 794770.72652774,
        'pair': 'SC_DNT',
        'maxLimit': 794770.72652774,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '7.04643939',
        'limit': 109915.10047724,
        'pair': 'DNT_SC',
        'maxLimit': 109915.10047724,
        'min': 2.65306122,
        'minerFee': 10
      },
      {
        'rate': '0.01408618',
        'limit': 794770.72652774,
        'pair': 'SC_1ST',
        'maxLimit': 794770.72652774,
        'min': 1.35030303,
        'minerFee': 0.01
      },
      {
        'rate': '66.80624242',
        'limit': 11593.37908983,
        'pair': '1ST_SC',
        'maxLimit': 11593.37908983,
        'min': 0.2847131,
        'minerFee': 10
      },
      {
        'rate': '0.00143604',
        'limit': 397385.36326387,
        'pair': 'SC_SALT',
        'maxLimit': 397385.36326387,
        'min': 66.25454545,
        'minerFee': 0.05
      },
      {
        'rate': '655.58872727',
        'limit': 590.6981482,
        'pair': 'SALT_SC',
        'maxLimit': 590.6981482,
        'min': 0.02902563,
        'minerFee': 10
      },
      {
        'rate': '0.02694723',
        'limit': 794770.72652774,
        'pair': 'SC_XEM',
        'maxLimit': 794770.72652774,
        'min': 288.12121212,
        'minerFee': 4
      },
      {
        'rate': '35.63699242',
        'limit': 21733.31814232,
        'pair': 'XEM_SC',
        'maxLimit': 21733.31814232,
        'min': 0.54438861,
        'minerFee': 10
      },
      {
        'rate': '0.04168340',
        'limit': 794770.72652774,
        'pair': 'SC_RCN',
        'maxLimit': 794770.72652774,
        'min': 90.90909091,
        'minerFee': 2
      },
      {
        'rate': '22.48863636',
        'limit': 34440.0648162,
        'pair': 'RCN_SC',
        'maxLimit': 34440.0648162,
        'min': 0.84251458,
        'minerFee': 10
      },
      {
        'rate': '0.00306428',
        'limit': 794770.72652774,
        'pair': 'SC_NMC',
        'maxLimit': 794770.72652774,
        'min': 2.89984848,
        'minerFee': 0.005
      },
      {
        'rate': '287.08500000',
        'limit': 496.85281567,
        'pair': 'NMC_SC',
        'maxLimit': 496.85281567,
        'min': 0.06190476,
        'minerFee': 10
      },
      {
        'rate': '0.00021483',
        'limit': 794770.72652774,
        'pair': 'SC_REP',
        'maxLimit': 794770.72652774,
        'min': 88.00818182,
        'minerFee': 0.01
      },
      {
        'rate': '4356.40500000',
        'limit': 177.87635866,
        'pair': 'REP_SC',
        'maxLimit': 177.87635866,
        'min': 0.00434013,
        'minerFee': 10
      },
      {
        'rate': '0.00005255',
        'limit': 794770.72652774,
        'pair': 'SC_GNO',
        'maxLimit': 794770.72652774,
        'min': 364.58212121,
        'minerFee': 0.01
      },
      {
        'rate': '18046.81499999',
        'limit': 42.93840538,
        'pair': 'GNO_SC',
        'maxLimit': 42.93840538,
        'min': 0.00106165,
        'minerFee': 10
      },
      {
        'rate': '0.02641625',
        'limit': 794770.72652774,
        'pair': 'SC_ZRX',
        'maxLimit': 794770.72652774,
        'min': 0.36212121,
        'minerFee': 0.005
      },
      {
        'rate': '35.85000000',
        'limit': 21615.10344113,
        'pair': 'ZRX_SC',
        'maxLimit': 21615.10344113,
        'min': 0.53366174,
        'minerFee': 10
      },
      {
        'rate': '0.04988296',
        'limit': 17458.63373582,
        'pair': 'LBC_WAVES',
        'maxLimit': 17458.63373582,
        'min': 0.03886362,
        'minerFee': 0.001
      },
      {
        'rate': '19.22777659',
        'limit': 886.47294297,
        'pair': 'WAVES_LBC',
        'maxLimit': 886.47294297,
        'min': 0.00201649,
        'minerFee': 0.02
      },
      {
        'rate': '0.13025760',
        'limit': 17458.63373582,
        'pair': 'LBC_GAME',
        'maxLimit': 17458.63373582,
        'min': 2.91817272,
        'minerFee': 0.2
      },
      {
        'rate': '7.22247749',
        'limit': 2361.17268725,
        'pair': 'GAME_LBC',
        'maxLimit': 2361.17268725,
        'min': 0.00526559,
        'minerFee': 0.02
      },
      {
        'rate': '0.09204144',
        'limit': 17458.63373582,
        'pair': 'LBC_KMD',
        'maxLimit': 17458.63373582,
        'min': 0.04234745,
        'minerFee': 0.002
      },
      {
        'rate': '10.47570023',
        'limit': 1627.08967371,
        'pair': 'KMD_LBC',
        'maxLimit': 1627.08967371,
        'min': 0.00372073,
        'minerFee': 0.02
      },
      {
        'rate': '1.80513594',
        'limit': 17458.63373582,
        'pair': 'LBC_SNGLS',
        'maxLimit': 17458.63373582,
        'min': 3.19106369,
        'minerFee': 3
      },
      {
        'rate': '0.52625958',
        'limit': 32388.7751647,
        'pair': 'SNGLS_LBC',
        'maxLimit': 32388.7751647,
        'min': 0.07297164,
        'minerFee': 0.02
      },
      {
        'rate': '0.78747580',
        'limit': 17458.63373582,
        'pair': 'LBC_GNT',
        'maxLimit': 17458.63373582,
        'min': 0.02440147,
        'minerFee': 0.01
      },
      {
        'rate': '1.20787262',
        'limit': 14118.6382138,
        'pair': 'GNT_LBC',
        'maxLimit': 14118.6382138,
        'min': 0.0318172,
        'minerFee': 0.02
      },
      {
        'rate': '0.15761899',
        'limit': 17458.63373582,
        'pair': 'LBC_SWT',
        'maxLimit': 17458.63373582,
        'min': 1.14418139,
        'minerFee': 0.1
      },
      {
        'rate': '5.66083744',
        'limit': 3011.02157862,
        'pair': 'SWT_LBC',
        'maxLimit': 3011.02157862,
        'min': 0.00637166,
        'minerFee': 0.02
      },
      {
        'rate': '0.48507794',
        'limit': 17458.63373582,
        'pair': 'LBC_WINGS',
        'maxLimit': 17458.63373582,
        'min': 0.0392064,
        'minerFee': 0.01
      },
      {
        'rate': '1.93973674',
        'limit': 8787.22524652,
        'pair': 'WINGS_LBC',
        'maxLimit': 8787.22524652,
        'min': 0.01960901,
        'minerFee': 0.02
      },
      {
        'rate': '0.65501800',
        'limit': 17458.63373582,
        'pair': 'LBC_TRST',
        'maxLimit': 17458.63373582,
        'min': 0.02837613,
        'minerFee': 0.01
      },
      {
        'rate': '1.40390880',
        'limit': 12141.03335152,
        'pair': 'TRST_LBC',
        'maxLimit': 12141.03335152,
        'min': 0.02647875,
        'minerFee': 0.02
      },
      {
        'rate': '0.44497424',
        'limit': 17458.63373582,
        'pair': 'LBC_RLC',
        'maxLimit': 17458.63373582,
        'min': 0.04198066,
        'minerFee': 0.01
      },
      {
        'rate': '2.07699316',
        'limit': 8206.52851665,
        'pair': 'RLC_LBC',
        'maxLimit': 8206.52851665,
        'min': 0.01798784,
        'minerFee': 0.02
      },
      {
        'rate': '1.27412119',
        'limit': 7939.1147124,
        'pair': 'LBC_GUP',
        'maxLimit': 7939.1147124,
        'min': 0.01480493,
        'minerFee': 0.01
      },
      {
        'rate': '0.73247415',
        'limit': 6670.4980368,
        'pair': 'GUP_LBC',
        'maxLimit': 6670.4980368,
        'min': 0.05150566,
        'minerFee': 0.02
      },
      {
        'rate': '0.12512523',
        'limit': 17458.63373582,
        'pair': 'LBC_ANT',
        'maxLimit': 17458.63373582,
        'min': 0.15338446,
        'minerFee': 0.01
      },
      {
        'rate': '7.58869623',
        'limit': 2246.09118367,
        'pair': 'ANT_LBC',
        'maxLimit': 2246.09118367,
        'min': 0.00505812,
        'minerFee': 0.02
      },
      {
        'rate': '0.00502217',
        'limit': 17458.63373582,
        'pair': 'LBC_DCR',
        'maxLimit': 17458.63373582,
        'min': 11.60386796,
        'minerFee': 0.03
      },
      {
        'rate': '191.36712237',
        'limit': 89.06913315,
        'pair': 'DCR_LBC',
        'maxLimit': 89.06913315,
        'min': 0.00020302,
        'minerFee': 0.02
      },
      {
        'rate': '1.51080005',
        'limit': 17458.63373582,
        'pair': 'LBC_BAT',
        'maxLimit': 17458.63373582,
        'min': 0.01275759,
        'minerFee': 0.01
      },
      {
        'rate': '0.63118156',
        'limit': 27004.75547533,
        'pair': 'BAT_LBC',
        'maxLimit': 27004.75547533,
        'min': 0.06107327,
        'minerFee': 0.02
      },
      {
        'rate': '0.10096312',
        'limit': 17458.63373582,
        'pair': 'LBC_BNT',
        'maxLimit': 17458.63373582,
        'min': 0.18178059,
        'minerFee': 0.01
      },
      {
        'rate': '8.99359486',
        'limit': 1895.22698531,
        'pair': 'BNT_LBC',
        'maxLimit': 1895.22698531,
        'min': 0.00408138,
        'minerFee': 0.02
      },
      {
        'rate': '7.22945802',
        'limit': 17458.63373582,
        'pair': 'LBC_SNT',
        'maxLimit': 17458.63373582,
        'min': 0.78026009,
        'minerFee': 3
      },
      {
        'rate': '0.12867789',
        'limit': 132461.78775462,
        'pair': 'SNT_LBC',
        'maxLimit': 132461.78775462,
        'min': 0.29224691,
        'minerFee': 0.02
      },
      {
        'rate': '0.01821860',
        'limit': 17458.63373582,
        'pair': 'LBC_NMR',
        'maxLimit': 17458.63373582,
        'min': 0.40013338,
        'minerFee': 0.004
      },
      {
        'rate': '49.49149716',
        'limit': 344.40064816,
        'pair': 'NMR_LBC',
        'maxLimit': 344.40064816,
        'min': 0.00073648,
        'minerFee': 0.02
      },
      {
        'rate': '0.31520405',
        'limit': 17458.63373582,
        'pair': 'LBC_EDG',
        'maxLimit': 17458.63373582,
        'min': 1.82060687,
        'minerFee': 0.3
      },
      {
        'rate': '3.00248416',
        'limit': 5676.93376091,
        'pair': 'EDG_LBC',
        'maxLimit': 5676.93376091,
        'min': 0.01274195,
        'minerFee': 0.02
      },
      {
        'rate': '0.79390740',
        'limit': 17458.63373582,
        'pair': 'LBC_CVC',
        'maxLimit': 17458.63373582,
        'min': 0.24034678,
        'minerFee': 0.1
      },
      {
        'rate': '1.18971657',
        'limit': 14334.10006435,
        'pair': 'CVC_LBC',
        'maxLimit': 14334.10006435,
        'min': 0.03209328,
        'minerFee': 0.02
      },
      {
        'rate': '0.05035220',
        'limit': 13719.41410224,
        'pair': 'LBC_MTL',
        'maxLimit': 13719.41410224,
        'min': 0.38154051,
        'minerFee': 0.01
      },
      {
        'rate': '18.87671690',
        'limit': 902.95912056,
        'pair': 'MTL_LBC',
        'maxLimit': 902.95912056,
        'min': 0.00203546,
        'minerFee': 0.02
      },
      {
        'rate': '11.71172199',
        'limit': 17458.63373582,
        'pair': 'LBC_FUN',
        'maxLimit': 17458.63373582,
        'min': 0.00162054,
        'minerFee': 0.01
      },
      {
        'rate': '0.08017622',
        'limit': 212592.98817303,
        'pair': 'FUN_LBC',
        'maxLimit': 212592.98817303,
        'min': 0.47344,
        'minerFee': 0.02
      },
      {
        'rate': '5.97536836',
        'limit': 17458.63373582,
        'pair': 'LBC_DNT',
        'maxLimit': 17458.63373582,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.15507335',
        'limit': 109915.10047724,
        'pair': 'DNT_LBC',
        'maxLimit': 109915.10047724,
        'min': 0.24155102,
        'minerFee': 0.02
      },
      {
        'rate': '0.64124627',
        'limit': 17458.63373582,
        'pair': 'LBC_1ST',
        'maxLimit': 17458.63373582,
        'min': 0.02971657,
        'minerFee': 0.01
      },
      {
        'rate': '1.47022740',
        'limit': 11593.37908983,
        'pair': '1ST_LBC',
        'maxLimit': 11593.37908983,
        'min': 0.02592203,
        'minerFee': 0.02
      },
      {
        'rate': '0.06537310',
        'limit': 8729.31686791,
        'pair': 'LBC_SALT',
        'maxLimit': 8729.31686791,
        'min': 1.45808603,
        'minerFee': 0.05
      },
      {
        'rate': '14.42776125',
        'limit': 590.6981482,
        'pair': 'SALT_LBC',
        'maxLimit': 590.6981482,
        'min': 0.00264267,
        'minerFee': 0.02
      },
      {
        'rate': '1.22672110',
        'limit': 17458.63373582,
        'pair': 'LBC_XEM',
        'maxLimit': 17458.63373582,
        'min': 6.34078026,
        'minerFee': 4
      },
      {
        'rate': '0.78427525',
        'limit': 21733.31814232,
        'pair': 'XEM_LBC',
        'maxLimit': 21733.31814232,
        'min': 0.04956449,
        'minerFee': 0.02
      },
      {
        'rate': '1.89755703',
        'limit': 17458.63373582,
        'pair': 'LBC_RCN',
        'maxLimit': 17458.63373582,
        'min': 2.00066689,
        'minerFee': 2
      },
      {
        'rate': '0.49491497',
        'limit': 34440.0648162,
        'pair': 'RCN_LBC',
        'maxLimit': 34440.0648162,
        'min': 0.07670771,
        'minerFee': 0.02
      },
      {
        'rate': '0.13949571',
        'limit': 17458.63373582,
        'pair': 'LBC_NMC',
        'maxLimit': 17458.63373582,
        'min': 0.06381794,
        'minerFee': 0.005
      },
      {
        'rate': '6.31797599',
        'limit': 496.85281567,
        'pair': 'NMC_LBC',
        'maxLimit': 496.85281567,
        'min': 0.00563619,
        'minerFee': 0.02
      },
      {
        'rate': '0.00978002',
        'limit': 17458.63373582,
        'pair': 'LBC_REP',
        'maxLimit': 17458.63373582,
        'min': 1.93682561,
        'minerFee': 0.01
      },
      {
        'rate': '95.87286762',
        'limit': 177.87635866,
        'pair': 'REP_LBC',
        'maxLimit': 177.87635866,
        'min': 0.00039515,
        'minerFee': 0.02
      },
      {
        'rate': '0.00239231',
        'limit': 17458.63373582,
        'pair': 'LBC_GNO',
        'maxLimit': 17458.63373582,
        'min': 8.02348116,
        'minerFee': 0.01
      },
      {
        'rate': '397.16231743',
        'limit': 42.93840538,
        'pair': 'GNO_LBC',
        'maxLimit': 42.93840538,
        'min': 0.00009666,
        'minerFee': 0.02
      },
      {
        'rate': '1.20254926',
        'limit': 17458.63373582,
        'pair': 'LBC_ZRX',
        'maxLimit': 17458.63373582,
        'min': 0.00796932,
        'minerFee': 0.005
      },
      {
        'rate': '0.78896298',
        'limit': 21615.10344113,
        'pair': 'ZRX_LBC',
        'maxLimit': 21615.10344113,
        'min': 0.04858785,
        'minerFee': 0.02
      },
      {
        'rate': '2.56535732',
        'limit': 886.47294297,
        'pair': 'WAVES_GAME',
        'maxLimit': 886.47294297,
        'min': 0.14910045,
        'minerFee': 0.2
      },
      {
        'rate': '0.36902361',
        'limit': 2361.17268725,
        'pair': 'GAME_WAVES',
        'maxLimit': 2361.17268725,
        'min': 0.00518516,
        'minerFee': 0.001
      },
      {
        'rate': '1.81270950',
        'limit': 886.47294297,
        'pair': 'WAVES_KMD',
        'maxLimit': 886.47294297,
        'min': 0.00216369,
        'minerFee': 0.002
      },
      {
        'rate': '0.53524303',
        'limit': 1627.08967371,
        'pair': 'KMD_WAVES',
        'maxLimit': 1627.08967371,
        'min': 0.00366389,
        'minerFee': 0.001
      },
      {
        'rate': '35.55123427',
        'limit': 886.47294297,
        'pair': 'WAVES_SNGLS',
        'maxLimit': 886.47294297,
        'min': 0.16304348,
        'minerFee': 3
      },
      {
        'rate': '0.02688858',
        'limit': 32388.7751647,
        'pair': 'SNGLS_WAVES',
        'maxLimit': 32388.7751647,
        'min': 0.07185697,
        'minerFee': 0.001
      },
      {
        'rate': '15.50893548',
        'limit': 886.47294297,
        'pair': 'WAVES_GNT',
        'maxLimit': 886.47294297,
        'min': 0.00124676,
        'minerFee': 0.01
      },
      {
        'rate': '0.06171476',
        'limit': 14118.6382138,
        'pair': 'GNT_WAVES',
        'maxLimit': 14118.6382138,
        'min': 0.03133118,
        'minerFee': 0.001
      },
      {
        'rate': '3.10422599',
        'limit': 886.47294297,
        'pair': 'WAVES_SWT',
        'maxLimit': 886.47294297,
        'min': 0.05846054,
        'minerFee': 0.1
      },
      {
        'rate': '0.28923353',
        'limit': 3011.02157862,
        'pair': 'SWT_WAVES',
        'maxLimit': 3011.02157862,
        'min': 0.00627433,
        'minerFee': 0.001
      },
      {
        'rate': '9.55336348',
        'limit': 886.47294297,
        'pair': 'WAVES_WINGS',
        'maxLimit': 886.47294297,
        'min': 0.0020032,
        'minerFee': 0.01
      },
      {
        'rate': '0.09910846',
        'limit': 8787.22524652,
        'pair': 'WINGS_WAVES',
        'maxLimit': 8787.22524652,
        'min': 0.01930948,
        'minerFee': 0.001
      },
      {
        'rate': '12.90024653',
        'limit': 886.47294297,
        'pair': 'WAVES_TRST',
        'maxLimit': 886.47294297,
        'min': 0.00144984,
        'minerFee': 0.01
      },
      {
        'rate': '0.07173099',
        'limit': 12141.03335152,
        'pair': 'TRST_WAVES',
        'maxLimit': 12141.03335152,
        'min': 0.02607427,
        'minerFee': 0.001
      },
      {
        'rate': '8.76354133',
        'limit': 886.47294297,
        'pair': 'WAVES_RLC',
        'maxLimit': 886.47294297,
        'min': 0.00214495,
        'minerFee': 0.01
      },
      {
        'rate': '0.10612141',
        'limit': 8206.52851665,
        'pair': 'RLC_WAVES',
        'maxLimit': 8206.52851665,
        'min': 0.01771307,
        'minerFee': 0.001
      },
      {
        'rate': '25.09316884',
        'limit': 403.11346753,
        'pair': 'WAVES_GUP',
        'maxLimit': 403.11346753,
        'min': 0.00075644,
        'minerFee': 0.01
      },
      {
        'rate': '0.03742486',
        'limit': 6670.4980368,
        'pair': 'GUP_WAVES',
        'maxLimit': 6670.4980368,
        'min': 0.05071889,
        'minerFee': 0.001
      },
      {
        'rate': '2.46427786',
        'limit': 886.47294297,
        'pair': 'WAVES_ANT',
        'maxLimit': 886.47294297,
        'min': 0.00783699,
        'minerFee': 0.01
      },
      {
        'rate': '0.38773510',
        'limit': 2246.09118367,
        'pair': 'ANT_WAVES',
        'maxLimit': 2246.09118367,
        'min': 0.00498085,
        'minerFee': 0.001
      },
      {
        'rate': '0.09890926',
        'limit': 886.47294297,
        'pair': 'WAVES_DCR',
        'maxLimit': 886.47294297,
        'min': 0.59288538,
        'minerFee': 0.03
      },
      {
        'rate': '9.77766798',
        'limit': 89.06913315,
        'pair': 'DCR_WAVES',
        'maxLimit': 89.06913315,
        'min': 0.00019992,
        'minerFee': 0.001
      },
      {
        'rate': '29.75443859',
        'limit': 886.47294297,
        'pair': 'WAVES_BAT',
        'maxLimit': 886.47294297,
        'min': 0.00065183,
        'minerFee': 0.01
      },
      {
        'rate': '0.03224944',
        'limit': 27004.75547533,
        'pair': 'BAT_WAVES',
        'maxLimit': 27004.75547533,
        'min': 0.06014035,
        'minerFee': 0.001
      },
      {
        'rate': '1.98841731',
        'limit': 886.47294297,
        'pair': 'WAVES_BNT',
        'maxLimit': 886.47294297,
        'min': 0.00928786,
        'minerFee': 0.01
      },
      {
        'rate': '0.45951667',
        'limit': 1895.22698531,
        'pair': 'BNT_WAVES',
        'maxLimit': 1895.22698531,
        'min': 0.00401903,
        'minerFee': 0.001
      },
      {
        'rate': '142.38049876',
        'limit': 886.47294297,
        'pair': 'WAVES_SNT',
        'maxLimit': 886.47294297,
        'min': 0.03986643,
        'minerFee': 3
      },
      {
        'rate': '0.00657463',
        'limit': 132461.78775462,
        'pair': 'SNT_WAVES',
        'maxLimit': 132461.78775462,
        'min': 0.28778272,
        'minerFee': 0.001
      },
      {
        'rate': '0.35880619',
        'limit': 886.47294297,
        'pair': 'WAVES_NMR',
        'maxLimit': 886.47294297,
        'min': 0.02044432,
        'minerFee': 0.004
      },
      {
        'rate': '2.52870723',
        'limit': 344.40064816,
        'pair': 'NMR_WAVES',
        'maxLimit': 344.40064816,
        'min': 0.00072523,
        'minerFee': 0.001
      },
      {
        'rate': '6.20778361',
        'limit': 886.47294297,
        'pair': 'WAVES_EDG',
        'maxLimit': 886.47294297,
        'min': 0.09302167,
        'minerFee': 0.3
      },
      {
        'rate': '0.15340823',
        'limit': 5676.93376091,
        'pair': 'EDG_WAVES',
        'maxLimit': 5676.93376091,
        'min': 0.01254731,
        'minerFee': 0.001
      },
      {
        'rate': '15.63560249',
        'limit': 886.47294297,
        'pair': 'WAVES_CVC',
        'maxLimit': 886.47294297,
        'min': 0.01228022,
        'minerFee': 0.1
      },
      {
        'rate': '0.06078710',
        'limit': 14334.10006435,
        'pair': 'CVC_WAVES',
        'maxLimit': 14334.10006435,
        'min': 0.03160304,
        'minerFee': 0.001
      },
      {
        'rate': '0.99166111',
        'limit': 696.61174975,
        'pair': 'WAVES_MTL',
        'maxLimit': 696.61174975,
        'min': 0.01949434,
        'minerFee': 0.01
      },
      {
        'rate': '0.96448265',
        'limit': 902.95912056,
        'pair': 'MTL_WAVES',
        'maxLimit': 902.95912056,
        'min': 0.00200437,
        'minerFee': 0.001
      },
      {
        'rate': '230.65640799',
        'limit': 886.47294297,
        'pair': 'WAVES_FUN',
        'maxLimit': 886.47294297,
        'min': 0.0000828,
        'minerFee': 0.01
      },
      {
        'rate': '0.00409650',
        'limit': 212592.98817303,
        'pair': 'FUN_WAVES',
        'maxLimit': 212592.98817303,
        'min': 0.466208,
        'minerFee': 0.001
      },
      {
        'rate': '117.68184081',
        'limit': 886.47294297,
        'pair': 'WAVES_DNT',
        'maxLimit': 886.47294297,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00792328',
        'limit': 109915.10047724,
        'pair': 'DNT_WAVES',
        'maxLimit': 109915.10047724,
        'min': 0.23786122,
        'minerFee': 0.001
      },
      {
        'rate': '12.62901927',
        'limit': 886.47294297,
        'pair': 'WAVES_1ST',
        'maxLimit': 886.47294297,
        'min': 0.00151833,
        'minerFee': 0.01
      },
      {
        'rate': '0.07511946',
        'limit': 11593.37908983,
        'pair': '1ST_WAVES',
        'maxLimit': 11593.37908983,
        'min': 0.02552606,
        'minerFee': 0.001
      },
      {
        'rate': '1.28748999',
        'limit': 443.23647148,
        'pair': 'WAVES_SALT',
        'maxLimit': 443.23647148,
        'min': 0.07449911,
        'minerFee': 0.05
      },
      {
        'rate': '0.73716873',
        'limit': 590.6981482,
        'pair': 'SALT_WAVES',
        'maxLimit': 590.6981482,
        'min': 0.0026023,
        'minerFee': 0.001
      },
      {
        'rate': '24.15964824',
        'limit': 886.47294297,
        'pair': 'WAVES_XEM',
        'maxLimit': 886.47294297,
        'min': 0.32397438,
        'minerFee': 4
      },
      {
        'rate': '0.04007158',
        'limit': 21733.31814232,
        'pair': 'XEM_WAVES',
        'maxLimit': 21733.31814232,
        'min': 0.04880737,
        'minerFee': 0.001
      },
      {
        'rate': '37.37142060',
        'limit': 886.47294297,
        'pair': 'WAVES_RCN',
        'maxLimit': 886.47294297,
        'min': 0.10222162,
        'minerFee': 2
      },
      {
        'rate': '0.02528707',
        'limit': 34440.0648162,
        'pair': 'RCN_WAVES',
        'maxLimit': 34440.0648162,
        'min': 0.07553597,
        'minerFee': 0.001
      },
      {
        'rate': '2.74729714',
        'limit': 886.47294297,
        'pair': 'WAVES_NMC',
        'maxLimit': 886.47294297,
        'min': 0.0032607,
        'minerFee': 0.005
      },
      {
        'rate': '0.32280922',
        'limit': 496.85281567,
        'pair': 'NMC_WAVES',
        'maxLimit': 496.85281567,
        'min': 0.0055501,
        'minerFee': 0.001
      },
      {
        'rate': '0.19261255',
        'limit': 886.47294297,
        'pair': 'WAVES_REP',
        'maxLimit': 886.47294297,
        'min': 0.09895972,
        'minerFee': 0.01
      },
      {
        'rate': '4.89850637',
        'limit': 177.87635866,
        'pair': 'REP_WAVES',
        'maxLimit': 177.87635866,
        'min': 0.00038912,
        'minerFee': 0.001
      },
      {
        'rate': '0.04711544',
        'limit': 886.47294297,
        'pair': 'WAVES_GNO',
        'maxLimit': 886.47294297,
        'min': 0.40994991,
        'minerFee': 0.01
      },
      {
        'rate': '20.29252061',
        'limit': 42.93840538,
        'pair': 'GNO_WAVES',
        'maxLimit': 42.93840538,
        'min': 0.00009518,
        'minerFee': 0.001
      },
      {
        'rate': '23.68359605',
        'limit': 886.47294297,
        'pair': 'WAVES_ZRX',
        'maxLimit': 886.47294297,
        'min': 0.00040718,
        'minerFee': 0.005
      },
      {
        'rate': '0.04031109',
        'limit': 21615.10344113,
        'pair': 'ZRX_WAVES',
        'maxLimit': 21615.10344113,
        'min': 0.04784565,
        'minerFee': 0.001
      },
      {
        'rate': '0.68090314',
        'limit': 2361.17268725,
        'pair': 'GAME_KMD',
        'maxLimit': 2361.17268725,
        'min': 0.00564997,
        'minerFee': 0.002
      },
      {
        'rate': '1.39766104',
        'limit': 1627.08967371,
        'pair': 'KMD_GAME',
        'maxLimit': 1627.08967371,
        'min': 0.27511238,
        'minerFee': 0.2
      },
      {
        'rate': '13.35401356',
        'limit': 2361.17268725,
        'pair': 'GAME_SNGLS',
        'maxLimit': 2361.17268725,
        'min': 0.42574962,
        'minerFee': 3
      },
      {
        'rate': '0.07021320',
        'limit': 32388.7751647,
        'pair': 'SNGLS_GAME',
        'maxLimit': 32388.7751647,
        'min': 5.39556104,
        'minerFee': 0.2
      },
      {
        'rate': '5.82557782',
        'limit': 2361.17268725,
        'pair': 'GAME_GNT',
        'maxLimit': 2361.17268725,
        'min': 0.00325563,
        'minerFee': 0.01
      },
      {
        'rate': '0.16115357',
        'limit': 14118.6382138,
        'pair': 'GNT_GAME',
        'maxLimit': 14118.6382138,
        'min': 2.35258065,
        'minerFee': 0.2
      },
      {
        'rate': '1.16603197',
        'limit': 2361.17268725,
        'pair': 'GAME_SWT',
        'maxLimit': 2361.17268725,
        'min': 0.15265593,
        'minerFee': 0.1
      },
      {
        'rate': '0.75526521',
        'limit': 3011.02157862,
        'pair': 'SWT_GAME',
        'maxLimit': 3011.02157862,
        'min': 0.47112403,
        'minerFee': 0.2
      },
      {
        'rate': '3.58850397',
        'limit': 2361.17268725,
        'pair': 'GAME_WINGS',
        'maxLimit': 2361.17268725,
        'min': 0.00523089,
        'minerFee': 0.01
      },
      {
        'rate': '0.25879840',
        'limit': 8787.22524652,
        'pair': 'WINGS_GAME',
        'maxLimit': 8787.22524652,
        'min': 1.4499006,
        'minerFee': 0.2
      },
      {
        'rate': '4.84568456',
        'limit': 2361.17268725,
        'pair': 'GAME_TRST',
        'maxLimit': 2361.17268725,
        'min': 0.00378592,
        'minerFee': 0.01
      },
      {
        'rate': '0.18730859',
        'limit': 12141.03335152,
        'pair': 'TRST_GAME',
        'maxLimit': 12141.03335152,
        'min': 1.95785235,
        'minerFee': 0.2
      },
      {
        'rate': '3.29182522',
        'limit': 2361.17268725,
        'pair': 'GAME_RLC',
        'maxLimit': 2361.17268725,
        'min': 0.00560103,
        'minerFee': 0.01
      },
      {
        'rate': '0.27711106',
        'limit': 8206.52851665,
        'pair': 'RLC_GAME',
        'maxLimit': 8206.52851665,
        'min': 1.3300304,
        'minerFee': 0.2
      },
      {
        'rate': '9.42567885',
        'limit': 1073.71636885,
        'pair': 'GAME_GUP',
        'maxLimit': 1073.71636885,
        'min': 0.00197526,
        'minerFee': 0.01
      },
      {
        'rate': '0.09772622',
        'limit': 6670.4980368,
        'pair': 'GUP_GAME',
        'maxLimit': 6670.4980368,
        'min': 3.80835509,
        'minerFee': 0.2
      },
      {
        'rate': '0.92565000',
        'limit': 2361.17268725,
        'pair': 'GAME_ANT',
        'maxLimit': 2361.17268725,
        'min': 0.02046445,
        'minerFee': 0.01
      },
      {
        'rate': '1.01247886',
        'limit': 2246.09118367,
        'pair': 'ANT_GAME',
        'maxLimit': 2246.09118367,
        'min': 0.374,
        'minerFee': 0.2
      },
      {
        'rate': '0.03715301',
        'limit': 2361.17268725,
        'pair': 'GAME_DCR',
        'maxLimit': 2361.17268725,
        'min': 1.54818044,
        'minerFee': 0.03
      },
      {
        'rate': '25.53207580',
        'limit': 89.06913315,
        'pair': 'DCR_GAME',
        'maxLimit': 89.06913315,
        'min': 0.01501132,
        'minerFee': 0.2
      },
      {
        'rate': '11.17657894',
        'limit': 2361.17268725,
        'pair': 'GAME_BAT',
        'maxLimit': 2361.17268725,
        'min': 0.00170211,
        'minerFee': 0.01
      },
      {
        'rate': '0.08421182',
        'limit': 27004.75547533,
        'pair': 'BAT_GAME',
        'maxLimit': 27004.75547533,
        'min': 4.51578947,
        'minerFee': 0.2
      },
      {
        'rate': '0.74690379',
        'limit': 2361.17268725,
        'pair': 'GAME_BNT',
        'maxLimit': 2361.17268725,
        'min': 0.02425305,
        'minerFee': 0.01
      },
      {
        'rate': '1.19991952',
        'limit': 1895.22698531,
        'pair': 'BNT_GAME',
        'maxLimit': 1895.22698531,
        'min': 0.30177931,
        'minerFee': 0.2
      },
      {
        'rate': '53.48200000',
        'limit': 2361.17268725,
        'pair': 'GAME_SNT',
        'maxLimit': 2361.17268725,
        'min': 0.10410179,
        'minerFee': 3
      },
      {
        'rate': '0.01716811',
        'limit': 132461.78775462,
        'pair': 'SNT_GAME',
        'maxLimit': 132461.78775462,
        'min': 21.60888889,
        'minerFee': 0.2
      },
      {
        'rate': '0.13477739',
        'limit': 2361.17268725,
        'pair': 'GAME_NMR',
        'maxLimit': 2361.17268725,
        'min': 0.05338553,
        'minerFee': 0.004
      },
      {
        'rate': '6.60312305',
        'limit': 344.40064816,
        'pair': 'NMR_GAME',
        'maxLimit': 344.40064816,
        'min': 0.05445551,
        'minerFee': 0.2
      },
      {
        'rate': '2.33181289',
        'limit': 2361.17268725,
        'pair': 'GAME_EDG',
        'maxLimit': 2361.17268725,
        'min': 0.24290417,
        'minerFee': 0.3
      },
      {
        'rate': '0.40058946',
        'limit': 5676.93376091,
        'pair': 'EDG_GAME',
        'maxLimit': 5676.93376091,
        'min': 0.94214663,
        'minerFee': 0.2
      },
      {
        'rate': '5.87315889',
        'limit': 2361.17268725,
        'pair': 'GAME_CVC',
        'maxLimit': 2361.17268725,
        'min': 0.03206691,
        'minerFee': 0.1
      },
      {
        'rate': '0.15873120',
        'limit': 14334.10006435,
        'pair': 'CVC_GAME',
        'maxLimit': 14334.10006435,
        'min': 2.37299349,
        'minerFee': 0.2
      },
      {
        'rate': '0.37249496',
        'limit': 1855.46626119,
        'pair': 'GAME_MTL',
        'maxLimit': 1855.46626119,
        'min': 0.05090488,
        'minerFee': 0.01
      },
      {
        'rate': '2.51851917',
        'limit': 902.95912056,
        'pair': 'MTL_GAME',
        'maxLimit': 902.95912056,
        'min': 0.15050302,
        'minerFee': 0.2
      },
      {
        'rate': '86.64084000',
        'limit': 2361.17268725,
        'pair': 'GAME_FUN',
        'maxLimit': 2361.17268725,
        'min': 0.00021621,
        'minerFee': 0.01
      },
      {
        'rate': '0.01069705',
        'limit': 212592.98817303,
        'pair': 'FUN_GAME',
        'maxLimit': 212592.98817303,
        'min': 35.0064,
        'minerFee': 0.2
      },
      {
        'rate': '44.20451020',
        'limit': 2361.17268725,
        'pair': 'GAME_DNT',
        'maxLimit': 2361.17268725,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.02068978',
        'limit': 109915.10047724,
        'pair': 'DNT_GAME',
        'maxLimit': 109915.10047724,
        'min': 17.86040816,
        'minerFee': 0.2
      },
      {
        'rate': '4.74380420',
        'limit': 2361.17268725,
        'pair': 'GAME_1ST',
        'maxLimit': 2361.17268725,
        'min': 0.00396477,
        'minerFee': 0.01
      },
      {
        'rate': '0.19615677',
        'limit': 11593.37908983,
        'pair': '1ST_GAME',
        'maxLimit': 11593.37908983,
        'min': 1.91668857,
        'minerFee': 0.2
      },
      {
        'rate': '0.48361637',
        'limit': 1180.58634362,
        'pair': 'GAME_SALT',
        'maxLimit': 1180.58634362,
        'min': 0.19453688,
        'minerFee': 0.05
      },
      {
        'rate': '1.92494243',
        'limit': 590.6981482,
        'pair': 'SALT_GAME',
        'maxLimit': 590.6981482,
        'min': 0.19540055,
        'minerFee': 0.2
      },
      {
        'rate': '9.07502072',
        'limit': 2361.17268725,
        'pair': 'GAME_XEM',
        'maxLimit': 2361.17268725,
        'min': 0.84598274,
        'minerFee': 4
      },
      {
        'rate': '0.10463748',
        'limit': 21733.31814232,
        'pair': 'XEM_GAME',
        'maxLimit': 21733.31814232,
        'min': 3.66482412,
        'minerFee': 0.2
      },
      {
        'rate': '14.03772521',
        'limit': 2361.17268725,
        'pair': 'GAME_RCN',
        'maxLimit': 2361.17268725,
        'min': 0.26692766,
        'minerFee': 2
      },
      {
        'rate': '0.06603123',
        'limit': 34440.0648162,
        'pair': 'RCN_GAME',
        'maxLimit': 34440.0648162,
        'min': 5.67180817,
        'minerFee': 0.2
      },
      {
        'rate': '1.03195949',
        'limit': 2361.17268725,
        'pair': 'GAME_NMC',
        'maxLimit': 2361.17268725,
        'min': 0.00851455,
        'minerFee': 0.005
      },
      {
        'rate': '0.84294020',
        'limit': 496.85281567,
        'pair': 'NMC_GAME',
        'maxLimit': 496.85281567,
        'min': 0.41674286,
        'minerFee': 0.2
      },
      {
        'rate': '0.07235051',
        'limit': 2361.17268725,
        'pair': 'GAME_REP',
        'maxLimit': 2361.17268725,
        'min': 0.25841,
        'minerFee': 0.01
      },
      {
        'rate': '12.79129504',
        'limit': 177.87635866,
        'pair': 'REP_GAME',
        'maxLimit': 177.87635866,
        'min': 0.02921777,
        'minerFee': 0.2
      },
      {
        'rate': '0.01769784',
        'limit': 2361.17268725,
        'pair': 'GAME_GNO',
        'maxLimit': 2361.17268725,
        'min': 1.07048759,
        'minerFee': 0.01
      },
      {
        'rate': '52.98913559',
        'limit': 42.93840538,
        'pair': 'GNO_GAME',
        'maxLimit': 42.93840538,
        'min': 0.00714703,
        'minerFee': 0.2
      },
      {
        'rate': '8.89620258',
        'limit': 2361.17268725,
        'pair': 'GAME_ZRX',
        'maxLimit': 2361.17268725,
        'min': 0.00106326,
        'minerFee': 0.005
      },
      {
        'rate': '0.10526292',
        'limit': 21615.10344113,
        'pair': 'ZRX_GAME',
        'maxLimit': 21615.10344113,
        'min': 3.59261084,
        'minerFee': 0.2
      },
      {
        'rate': '19.36906596',
        'limit': 1627.08967371,
        'pair': 'KMD_SNGLS',
        'maxLimit': 1627.08967371,
        'min': 0.30083933,
        'minerFee': 3
      },
      {
        'rate': '0.04961341',
        'limit': 32388.7751647,
        'pair': 'SNGLS_KMD',
        'maxLimit': 32388.7751647,
        'min': 0.0782984,
        'minerFee': 0.002
      },
      {
        'rate': '8.44959677',
        'limit': 1627.08967371,
        'pair': 'KMD_GNT',
        'maxLimit': 1627.08967371,
        'min': 0.00230046,
        'minerFee': 0.01
      },
      {
        'rate': '0.11387287',
        'limit': 14118.6382138,
        'pair': 'GNT_KMD',
        'maxLimit': 14118.6382138,
        'min': 0.03413978,
        'minerFee': 0.002
      },
      {
        'rate': '1.69124811',
        'limit': 1627.08967371,
        'pair': 'KMD_SWT',
        'maxLimit': 1627.08967371,
        'min': 0.10786835,
        'minerFee': 0.1
      },
      {
        'rate': '0.53367864',
        'limit': 3011.02157862,
        'pair': 'SWT_KMD',
        'maxLimit': 3011.02157862,
        'min': 0.00683678,
        'minerFee': 0.002
      },
      {
        'rate': '5.20487491',
        'limit': 1627.08967371,
        'pair': 'KMD_WINGS',
        'maxLimit': 1627.08967371,
        'min': 0.00369621,
        'minerFee': 0.01
      },
      {
        'rate': '0.18286977',
        'limit': 8787.22524652,
        'pair': 'WINGS_KMD',
        'maxLimit': 8787.22524652,
        'min': 0.02104042,
        'minerFee': 0.002
      },
      {
        'rate': '7.02832774',
        'limit': 1627.08967371,
        'pair': 'KMD_TRST',
        'maxLimit': 1627.08967371,
        'min': 0.00267518,
        'minerFee': 0.01
      },
      {
        'rate': '0.13235429',
        'limit': 12141.03335152,
        'pair': 'TRST_KMD',
        'maxLimit': 12141.03335152,
        'min': 0.02841163,
        'minerFee': 0.002
      },
      {
        'rate': '4.77456306',
        'limit': 1627.08967371,
        'pair': 'KMD_RLC',
        'maxLimit': 1627.08967371,
        'min': 0.00395775,
        'minerFee': 0.01
      },
      {
        'rate': '0.19580970',
        'limit': 8206.52851665,
        'pair': 'RLC_KMD',
        'maxLimit': 8206.52851665,
        'min': 0.01930091,
        'minerFee': 0.002
      },
      {
        'rate': '13.67129025',
        'limit': 739.90048611,
        'pair': 'KMD_GUP',
        'maxLimit': 739.90048611,
        'min': 0.00139574,
        'minerFee': 0.01
      },
      {
        'rate': '0.06905441',
        'limit': 6670.4980368,
        'pair': 'GUP_KMD',
        'maxLimit': 6670.4980368,
        'min': 0.05526545,
        'minerFee': 0.002
      },
      {
        'rate': '1.34259081',
        'limit': 1627.08967371,
        'pair': 'KMD_ANT',
        'maxLimit': 1627.08967371,
        'min': 0.01446041,
        'minerFee': 0.01
      },
      {
        'rate': '0.71542862',
        'limit': 2246.09118367,
        'pair': 'ANT_KMD',
        'maxLimit': 2246.09118367,
        'min': 0.00542735,
        'minerFee': 0.002
      },
      {
        'rate': '0.05388786',
        'limit': 1627.08967371,
        'pair': 'KMD_DCR',
        'maxLimit': 1627.08967371,
        'min': 1.09396121,
        'minerFee': 0.03
      },
      {
        'rate': '18.04124359',
        'limit': 89.06913315,
        'pair': 'DCR_KMD',
        'maxLimit': 89.06913315,
        'min': 0.00021784,
        'minerFee': 0.002
      },
      {
        'rate': '16.21084881',
        'limit': 1627.08967371,
        'pair': 'KMD_BAT',
        'maxLimit': 1627.08967371,
        'min': 0.00120273,
        'minerFee': 0.01
      },
      {
        'rate': '0.05950499',
        'limit': 27004.75547533,
        'pair': 'BAT_KMD',
        'maxLimit': 27004.75547533,
        'min': 0.06553148,
        'minerFee': 0.002
      },
      {
        'rate': '1.08333189',
        'limit': 1627.08967371,
        'pair': 'KMD_BNT',
        'maxLimit': 1627.08967371,
        'min': 0.01713747,
        'minerFee': 0.01
      },
      {
        'rate': '0.84787623',
        'limit': 1895.22698531,
        'pair': 'BNT_KMD',
        'maxLimit': 1895.22698531,
        'min': 0.00437931,
        'minerFee': 0.002
      },
      {
        'rate': '77.57191358',
        'limit': 1627.08967371,
        'pair': 'KMD_SNT',
        'maxLimit': 1627.08967371,
        'min': 0.07355946,
        'minerFee': 3
      },
      {
        'rate': '0.01213118',
        'limit': 132461.78775462,
        'pair': 'SNT_KMD',
        'maxLimit': 132461.78775462,
        'min': 0.31358025,
        'minerFee': 0.002
      },
      {
        'rate': '0.19548521',
        'limit': 1627.08967371,
        'pair': 'KMD_NMR',
        'maxLimit': 1627.08967371,
        'min': 0.0377228,
        'minerFee': 0.004
      },
      {
        'rate': '4.66583886',
        'limit': 344.40064816,
        'pair': 'NMR_KMD',
        'maxLimit': 344.40064816,
        'min': 0.00079024,
        'minerFee': 0.002
      },
      {
        'rate': '3.38213209',
        'limit': 1627.08967371,
        'pair': 'KMD_EDG',
        'maxLimit': 1627.08967371,
        'min': 0.17163874,
        'minerFee': 0.3
      },
      {
        'rate': '0.28306089',
        'limit': 5676.93376091,
        'pair': 'EDG_KMD',
        'maxLimit': 5676.93376091,
        'min': 0.01367209,
        'minerFee': 0.002
      },
      {
        'rate': '8.51860764',
        'limit': 1627.08967371,
        'pair': 'KMD_CVC',
        'maxLimit': 1627.08967371,
        'min': 0.02265883,
        'minerFee': 0.1
      },
      {
        'rate': '0.11216120',
        'limit': 14334.10006435,
        'pair': 'CVC_KMD',
        'maxLimit': 14334.10006435,
        'min': 0.03443601,
        'minerFee': 0.002
      },
      {
        'rate': '0.54027799',
        'limit': 1278.60618358,
        'pair': 'KMD_MTL',
        'maxLimit': 1278.60618358,
        'min': 0.03596995,
        'minerFee': 0.01
      },
      {
        'rate': '1.77961315',
        'limit': 902.95912056,
        'pair': 'MTL_KMD',
        'maxLimit': 902.95912056,
        'min': 0.00218404,
        'minerFee': 0.002
      },
      {
        'rate': '125.66649999',
        'limit': 1627.08967371,
        'pair': 'KMD_FUN',
        'maxLimit': 1627.08967371,
        'min': 0.00015278,
        'minerFee': 0.01
      },
      {
        'rate': '0.00755865',
        'limit': 212592.98817303,
        'pair': 'FUN_KMD',
        'maxLimit': 212592.98817303,
        'min': 0.508,
        'minerFee': 0.002
      },
      {
        'rate': '64.11556122',
        'limit': 1627.08967371,
        'pair': 'KMD_DNT',
        'maxLimit': 1627.08967371,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.01461962',
        'limit': 109915.10047724,
        'pair': 'DNT_KMD',
        'maxLimit': 109915.10047724,
        'min': 0.25918367,
        'minerFee': 0.002
      },
      {
        'rate': '6.88055738',
        'limit': 1627.08967371,
        'pair': 'KMD_1ST',
        'maxLimit': 1627.08967371,
        'min': 0.00280155,
        'minerFee': 0.01
      },
      {
        'rate': '0.13860651',
        'limit': 11593.37908983,
        'pair': '1ST_KMD',
        'maxLimit': 11593.37908983,
        'min': 0.02781428,
        'minerFee': 0.002
      },
      {
        'rate': '0.70145183',
        'limit': 813.54483818,
        'pair': 'KMD_SALT',
        'maxLimit': 813.54483818,
        'min': 0.13746188,
        'minerFee': 0.05
      },
      {
        'rate': '1.36018534',
        'limit': 590.6981482,
        'pair': 'SALT_KMD',
        'maxLimit': 590.6981482,
        'min': 0.00283558,
        'minerFee': 0.002
      },
      {
        'rate': '13.16268844',
        'limit': 1627.08967371,
        'pair': 'KMD_XEM',
        'maxLimit': 1627.08967371,
        'min': 0.59778064,
        'minerFee': 4
      },
      {
        'rate': '0.07393799',
        'limit': 21733.31814232,
        'pair': 'XEM_KMD',
        'maxLimit': 21733.31814232,
        'min': 0.05318258,
        'minerFee': 0.002
      },
      {
        'rate': '20.36074206',
        'limit': 1627.08967371,
        'pair': 'KMD_RCN',
        'maxLimit': 1627.08967371,
        'min': 0.188614,
        'minerFee': 2
      },
      {
        'rate': '0.04665838',
        'limit': 34440.0648162,
        'pair': 'RCN_KMD',
        'maxLimit': 34440.0648162,
        'min': 0.08230719,
        'minerFee': 0.002
      },
      {
        'rate': '1.49678571',
        'limit': 1627.08967371,
        'pair': 'KMD_NMC',
        'maxLimit': 1627.08967371,
        'min': 0.00601647,
        'minerFee': 0.005
      },
      {
        'rate': '0.59563075',
        'limit': 496.85281567,
        'pair': 'NMC_KMD',
        'maxLimit': 496.85281567,
        'min': 0.00604762,
        'minerFee': 0.002
      },
      {
        'rate': '0.10493940',
        'limit': 1627.08967371,
        'pair': 'KMD_REP',
        'maxLimit': 1627.08967371,
        'min': 0.18259533,
        'minerFee': 0.01
      },
      {
        'rate': '9.03846876',
        'limit': 177.87635866,
        'pair': 'REP_KMD',
        'maxLimit': 177.87635866,
        'min': 0.000424,
        'minerFee': 0.002
      },
      {
        'rate': '0.02566949',
        'limit': 1627.08967371,
        'pair': 'KMD_GNO',
        'maxLimit': 1627.08967371,
        'min': 0.75641822,
        'minerFee': 0.01
      },
      {
        'rate': '37.44270189',
        'limit': 42.93840538,
        'pair': 'GNO_KMD',
        'maxLimit': 42.93840538,
        'min': 0.00010372,
        'minerFee': 0.002
      },
      {
        'rate': '12.90332512',
        'limit': 1627.08967371,
        'pair': 'KMD_ZRX',
        'maxLimit': 1627.08967371,
        'min': 0.00075131,
        'minerFee': 0.005
      },
      {
        'rate': '0.07437993',
        'limit': 21615.10344113,
        'pair': 'ZRX_KMD',
        'maxLimit': 21615.10344113,
        'min': 0.05213465,
        'minerFee': 0.002
      },
      {
        'rate': '0.42447580',
        'limit': 32388.7751647,
        'pair': 'SNGLS_GNT',
        'maxLimit': 32388.7751647,
        'min': 0.04511714,
        'minerFee': 0.01
      },
      {
        'rate': '2.23329839',
        'limit': 14118.6382138,
        'pair': 'GNT_SNGLS',
        'maxLimit': 14118.6382138,
        'min': 2.57258065,
        'minerFee': 3
      },
      {
        'rate': '0.08496191',
        'limit': 32388.7751647,
        'pair': 'SNGLS_SWT',
        'maxLimit': 32388.7751647,
        'min': 2.11553637,
        'minerFee': 0.1
      },
      {
        'rate': '10.46661621',
        'limit': 3011.02157862,
        'pair': 'SWT_SNGLS',
        'maxLimit': 3011.02157862,
        'min': 0.51518088,
        'minerFee': 3
      },
      {
        'rate': '0.26147324',
        'limit': 32388.7751647,
        'pair': 'SNGLS_WINGS',
        'maxLimit': 32388.7751647,
        'min': 0.07249075,
        'minerFee': 0.01
      },
      {
        'rate': '3.58647996',
        'limit': 8787.22524652,
        'pair': 'WINGS_SNGLS',
        'maxLimit': 8787.22524652,
        'min': 1.58548708,
        'minerFee': 3
      },
      {
        'rate': '0.35307662',
        'limit': 32388.7751647,
        'pair': 'SNGLS_TRST',
        'maxLimit': 32388.7751647,
        'min': 0.05246609,
        'minerFee': 0.01
      },
      {
        'rate': '2.59575986',
        'limit': 12141.03335152,
        'pair': 'TRST_SNGLS',
        'maxLimit': 12141.03335152,
        'min': 2.1409396,
        'minerFee': 3
      },
      {
        'rate': '0.23985600',
        'limit': 32388.7751647,
        'pair': 'SNGLS_RLC',
        'maxLimit': 32388.7751647,
        'min': 0.07762022,
        'minerFee': 0.01
      },
      {
        'rate': '3.84026048',
        'limit': 8206.52851665,
        'pair': 'RLC_SNGLS',
        'maxLimit': 8206.52851665,
        'min': 1.45440729,
        'minerFee': 3
      },
      {
        'rate': '0.68679395',
        'limit': 14728.42660439,
        'pair': 'SNGLS_GUP',
        'maxLimit': 14728.42660439,
        'min': 0.02737361,
        'minerFee': 0.01
      },
      {
        'rate': '1.35430949',
        'limit': 6670.4980368,
        'pair': 'GUP_SNGLS',
        'maxLimit': 6670.4980368,
        'min': 4.16449086,
        'minerFee': 3
      },
      {
        'rate': '0.06744668',
        'limit': 32388.7751647,
        'pair': 'SNGLS_ANT',
        'maxLimit': 32388.7751647,
        'min': 0.28360049,
        'minerFee': 0.01
      },
      {
        'rate': '14.03113440',
        'limit': 2246.09118367,
        'pair': 'ANT_SNGLS',
        'maxLimit': 2246.09118367,
        'min': 0.40897436,
        'minerFee': 3
      },
      {
        'rate': '0.00270712',
        'limit': 32388.7751647,
        'pair': 'SNGLS_DCR',
        'maxLimit': 32388.7751647,
        'min': 21.45499383,
        'minerFee': 0.03
      },
      {
        'rate': '353.82860665',
        'limit': 89.06913315,
        'pair': 'DCR_SNGLS',
        'maxLimit': 89.06913315,
        'min': 0.01641509,
        'minerFee': 3
      },
      {
        'rate': '0.81437177',
        'limit': 32388.7751647,
        'pair': 'SNGLS_BAT',
        'maxLimit': 32388.7751647,
        'min': 0.02358816,
        'minerFee': 0.01
      },
      {
        'rate': '1.16702435',
        'limit': 27004.75547533,
        'pair': 'BAT_SNGLS',
        'maxLimit': 27004.75547533,
        'min': 4.9380805,
        'minerFee': 3
      },
      {
        'rate': '0.05442250',
        'limit': 32388.7751647,
        'pair': 'SNGLS_BNT',
        'maxLimit': 32388.7751647,
        'min': 0.33610358,
        'minerFee': 0.01
      },
      {
        'rate': '16.62872441',
        'limit': 1895.22698531,
        'pair': 'BNT_SNGLS',
        'maxLimit': 1895.22698531,
        'min': 0.33,
        'minerFee': 3
      },
      {
        'rate': '3.89691975',
        'limit': 32388.7751647,
        'pair': 'SNGLS_SNT',
        'maxLimit': 32388.7751647,
        'min': 1.44266338,
        'minerFee': 3
      },
      {
        'rate': '0.23791923',
        'limit': 132461.78775462,
        'pair': 'SNT_SNGLS',
        'maxLimit': 132461.78775462,
        'min': 23.62962963,
        'minerFee': 3
      },
      {
        'rate': '0.00982043',
        'limit': 32388.7751647,
        'pair': 'SNGLS_NMR',
        'maxLimit': 32388.7751647,
        'min': 0.73982737,
        'minerFee': 0.004
      },
      {
        'rate': '91.50739827',
        'limit': 344.40064816,
        'pair': 'NMR_SNGLS',
        'maxLimit': 344.40064816,
        'min': 0.05954788,
        'minerFee': 3
      },
      {
        'rate': '0.16990553',
        'limit': 32388.7751647,
        'pair': 'SNGLS_EDG',
        'maxLimit': 32388.7751647,
        'min': 3.36621455,
        'minerFee': 0.3
      },
      {
        'rate': '5.55144882',
        'limit': 5676.93376091,
        'pair': 'EDG_SNGLS',
        'maxLimit': 5676.93376091,
        'min': 1.03025083,
        'minerFee': 3
      },
      {
        'rate': '0.42794265',
        'limit': 32388.7751647,
        'pair': 'SNGLS_CVC',
        'maxLimit': 32388.7751647,
        'min': 0.44438964,
        'minerFee': 0.1
      },
      {
        'rate': '2.19972872',
        'limit': 14334.10006435,
        'pair': 'CVC_SNGLS',
        'maxLimit': 14334.10006435,
        'min': 2.59490239,
        'minerFee': 3
      },
      {
        'rate': '0.02714152',
        'limit': 25451.87857588,
        'pair': 'SNGLS_MTL',
        'maxLimit': 25451.87857588,
        'min': 0.70545006,
        'minerFee': 0.01
      },
      {
        'rate': '34.90214180',
        'limit': 902.95912056,
        'pair': 'MTL_SNGLS',
        'maxLimit': 902.95912056,
        'min': 0.16457721,
        'minerFee': 3
      },
      {
        'rate': '6.31301000',
        'limit': 32388.7751647,
        'pair': 'SNGLS_FUN',
        'maxLimit': 32388.7751647,
        'min': 0.0029963,
        'minerFee': 0.01
      },
      {
        'rate': '0.14824198',
        'limit': 212592.98817303,
        'pair': 'FUN_SNGLS',
        'maxLimit': 212592.98817303,
        'min': 38.28,
        'minerFee': 3
      },
      {
        'rate': '3.22092346',
        'limit': 32388.7751647,
        'pair': 'SNGLS_DNT',
        'maxLimit': 32388.7751647,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.28672318',
        'limit': 109915.10047724,
        'pair': 'DNT_SNGLS',
        'maxLimit': 109915.10047724,
        'min': 19.53061224,
        'minerFee': 3
      },
      {
        'rate': '0.34565319',
        'limit': 32388.7751647,
        'pair': 'SNGLS_1ST',
        'maxLimit': 32388.7751647,
        'min': 0.05494451,
        'minerFee': 0.01
      },
      {
        'rate': '2.71837977',
        'limit': 11593.37908983,
        'pair': '1ST_SNGLS',
        'maxLimit': 11593.37908983,
        'min': 2.09592641,
        'minerFee': 3
      },
      {
        'rate': '0.03523828',
        'limit': 16194.38784461,
        'pair': 'SNGLS_SALT',
        'maxLimit': 16194.38784461,
        'min': 2.69593095,
        'minerFee': 0.05
      },
      {
        'rate': '26.67623674',
        'limit': 590.6981482,
        'pair': 'SALT_SNGLS',
        'maxLimit': 590.6981482,
        'min': 0.21367331,
        'minerFee': 3
      },
      {
        'rate': '0.66124371',
        'limit': 32388.7751647,
        'pair': 'SNGLS_XEM',
        'maxLimit': 32388.7751647,
        'min': 11.72379778,
        'minerFee': 4
      },
      {
        'rate': '1.45008723',
        'limit': 21733.31814232,
        'pair': 'XEM_SNGLS',
        'maxLimit': 21733.31814232,
        'min': 4.00753769,
        'minerFee': 3
      },
      {
        'rate': '1.02284672',
        'limit': 32388.7751647,
        'pair': 'SNGLS_RCN',
        'maxLimit': 32388.7751647,
        'min': 3.69913687,
        'minerFee': 2
      },
      {
        'rate': '0.91507398',
        'limit': 34440.0648162,
        'pair': 'RCN_SNGLS',
        'maxLimit': 34440.0648162,
        'min': 6.2022035,
        'minerFee': 3
      },
      {
        'rate': '0.07519285',
        'limit': 32388.7751647,
        'pair': 'SNGLS_NMC',
        'maxLimit': 32388.7751647,
        'min': 0.1179963,
        'minerFee': 0.005
      },
      {
        'rate': '11.68163378',
        'limit': 496.85281567,
        'pair': 'NMC_SNGLS',
        'maxLimit': 496.85281567,
        'min': 0.45571429,
        'minerFee': 3
      },
      {
        'rate': '0.00527175',
        'limit': 32388.7751647,
        'pair': 'SNGLS_REP',
        'maxLimit': 32388.7751647,
        'min': 3.58109741,
        'minerFee': 0.01
      },
      {
        'rate': '177.26432182',
        'limit': 177.87635866,
        'pair': 'REP_SNGLS',
        'maxLimit': 177.87635866,
        'min': 0.03195006,
        'minerFee': 3
      },
      {
        'rate': '0.00128953',
        'limit': 32388.7751647,
        'pair': 'SNGLS_GNO',
        'maxLimit': 32388.7751647,
        'min': 14.83503083,
        'minerFee': 0.01
      },
      {
        'rate': '734.33402589',
        'limit': 42.93840538,
        'pair': 'GNO_SNGLS',
        'maxLimit': 42.93840538,
        'min': 0.00781538,
        'minerFee': 3
      },
      {
        'rate': '0.64821428',
        'limit': 32388.7751647,
        'pair': 'SNGLS_ZRX',
        'maxLimit': 32388.7751647,
        'min': 0.0147349,
        'minerFee': 0.005
      },
      {
        'rate': '1.45875462',
        'limit': 21615.10344113,
        'pair': 'ZRX_SNGLS',
        'maxLimit': 21615.10344113,
        'min': 3.92857143,
        'minerFee': 3
      },
      {
        'rate': '0.19500484',
        'limit': 14118.6382138,
        'pair': 'GNT_SWT',
        'maxLimit': 14118.6382138,
        'min': 0.92241935,
        'minerFee': 0.1
      },
      {
        'rate': '4.56597580',
        'limit': 3011.02157862,
        'pair': 'SWT_GNT',
        'maxLimit': 3011.02157862,
        'min': 0.00393949,
        'minerFee': 0.01
      },
      {
        'rate': '0.60013419',
        'limit': 14118.6382138,
        'pair': 'GNT_WINGS',
        'maxLimit': 14118.6382138,
        'min': 0.03160753,
        'minerFee': 0.01
      },
      {
        'rate': '1.56457258',
        'limit': 8787.22524652,
        'pair': 'WINGS_GNT',
        'maxLimit': 8787.22524652,
        'min': 0.01212392,
        'minerFee': 0.01
      },
      {
        'rate': '0.81038255',
        'limit': 14118.6382138,
        'pair': 'GNT_TRST',
        'maxLimit': 14118.6382138,
        'min': 0.02287634,
        'minerFee': 0.01
      },
      {
        'rate': '1.13237903',
        'limit': 12141.03335152,
        'pair': 'TRST_GNT',
        'maxLimit': 12141.03335152,
        'min': 0.01637136,
        'minerFee': 0.01
      },
      {
        'rate': '0.55051823',
        'limit': 14118.6382138,
        'pair': 'GNT_RLC',
        'maxLimit': 14118.6382138,
        'min': 0.03384409,
        'minerFee': 0.01
      },
      {
        'rate': '1.67528225',
        'limit': 8206.52851665,
        'pair': 'RLC_GNT',
        'maxLimit': 8206.52851665,
        'min': 0.01112158,
        'minerFee': 0.01
      },
      {
        'rate': '1.57633159',
        'limit': 6420.28981525,
        'pair': 'GNT_GUP',
        'maxLimit': 6420.28981525,
        'min': 0.01193548,
        'minerFee': 0.01
      },
      {
        'rate': '0.59080645',
        'limit': 6670.4980368,
        'pair': 'GUP_GNT',
        'maxLimit': 6670.4980368,
        'min': 0.03184508,
        'minerFee': 0.01
      },
      {
        'rate': '0.15480384',
        'limit': 14118.6382138,
        'pair': 'GNT_ANT',
        'maxLimit': 14118.6382138,
        'min': 0.12365591,
        'minerFee': 0.01
      },
      {
        'rate': '6.12096774',
        'limit': 2246.09118367,
        'pair': 'ANT_GNT',
        'maxLimit': 2246.09118367,
        'min': 0.00312735,
        'minerFee': 0.01
      },
      {
        'rate': '0.00621339',
        'limit': 14118.6382138,
        'pair': 'GNT_DCR',
        'maxLimit': 14118.6382138,
        'min': 9.35483871,
        'minerFee': 0.03
      },
      {
        'rate': '154.35483870',
        'limit': 89.06913315,
        'pair': 'DCR_GNT',
        'maxLimit': 89.06913315,
        'min': 0.00012552,
        'minerFee': 0.01
      },
      {
        'rate': '1.86914860',
        'limit': 14118.6382138,
        'pair': 'GNT_BAT',
        'maxLimit': 14118.6382138,
        'min': 0.01028495,
        'minerFee': 0.01
      },
      {
        'rate': '0.50910483',
        'limit': 27004.75547533,
        'pair': 'BAT_GNT',
        'maxLimit': 27004.75547533,
        'min': 0.03776058,
        'minerFee': 0.01
      },
      {
        'rate': '0.12491068',
        'limit': 14118.6382138,
        'pair': 'GNT_BNT',
        'maxLimit': 14118.6382138,
        'min': 0.14654839,
        'minerFee': 0.01
      },
      {
        'rate': '7.25414516',
        'limit': 1895.22698531,
        'pair': 'BNT_GNT',
        'maxLimit': 1895.22698531,
        'min': 0.00252345,
        'minerFee': 0.01
      },
      {
        'rate': '8.94422222',
        'limit': 14118.6382138,
        'pair': 'GNT_SNT',
        'maxLimit': 14118.6382138,
        'min': 0.62903226,
        'minerFee': 3
      },
      {
        'rate': '0.10379032',
        'limit': 132461.78775462,
        'pair': 'SNT_GNT',
        'maxLimit': 132461.78775462,
        'min': 0.18069136,
        'minerFee': 0.01
      },
      {
        'rate': '0.02253990',
        'limit': 14118.6382138,
        'pair': 'GNT_NMR',
        'maxLimit': 14118.6382138,
        'min': 0.32258065,
        'minerFee': 0.004
      },
      {
        'rate': '39.91935483',
        'limit': 344.40064816,
        'pair': 'NMR_GNT',
        'maxLimit': 344.40064816,
        'min': 0.00045535,
        'minerFee': 0.01
      },
      {
        'rate': '0.38996770',
        'limit': 14118.6382138,
        'pair': 'GNT_EDG',
        'maxLimit': 14118.6382138,
        'min': 1.46774194,
        'minerFee': 0.3
      },
      {
        'rate': '2.42177419',
        'limit': 5676.93376091,
        'pair': 'EDG_GNT',
        'maxLimit': 5676.93376091,
        'min': 0.00787814,
        'minerFee': 0.01
      },
      {
        'rate': '0.98221529',
        'limit': 14118.6382138,
        'pair': 'GNT_CVC',
        'maxLimit': 14118.6382138,
        'min': 0.19376344,
        'minerFee': 0.1
      },
      {
        'rate': '0.95961344',
        'limit': 14334.10006435,
        'pair': 'CVC_GNT',
        'maxLimit': 14334.10006435,
        'min': 0.01984273,
        'minerFee': 0.01
      },
      {
        'rate': '0.06229531',
        'limit': 11094.76532619,
        'pair': 'GNT_MTL',
        'maxLimit': 11094.76532619,
        'min': 0.3075914,
        'minerFee': 0.01
      },
      {
        'rate': '15.22577419',
        'limit': 902.95912056,
        'pair': 'MTL_GNT',
        'maxLimit': 902.95912056,
        'min': 0.00125849,
        'minerFee': 0.01
      },
      {
        'rate': '14.48963999',
        'limit': 14118.6382138,
        'pair': 'GNT_FUN',
        'maxLimit': 14118.6382138,
        'min': 0.00130645,
        'minerFee': 0.01
      },
      {
        'rate': '0.06466935',
        'limit': 212592.98817303,
        'pair': 'FUN_GNT',
        'maxLimit': 212592.98817303,
        'min': 0.29272,
        'minerFee': 0.01
      },
      {
        'rate': '7.39267346',
        'limit': 14118.6382138,
        'pair': 'GNT_DNT',
        'maxLimit': 14118.6382138,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.12508064',
        'limit': 109915.10047724,
        'pair': 'DNT_GNT',
        'maxLimit': 109915.10047724,
        'min': 0.14934694,
        'minerFee': 0.01
      },
      {
        'rate': '0.79334428',
        'limit': 14118.6382138,
        'pair': 'GNT_1ST',
        'maxLimit': 14118.6382138,
        'min': 0.02395699,
        'minerFee': 0.01
      },
      {
        'rate': '1.18587096',
        'limit': 11593.37908983,
        'pair': '1ST_GNT',
        'maxLimit': 11593.37908983,
        'min': 0.01602716,
        'minerFee': 0.01
      },
      {
        'rate': '0.08087903',
        'limit': 7059.3191069,
        'pair': 'GNT_SALT',
        'maxLimit': 7059.3191069,
        'min': 1.17548387,
        'minerFee': 0.05
      },
      {
        'rate': '11.63729032',
        'limit': 590.6981482,
        'pair': 'SALT_GNT',
        'maxLimit': 590.6981482,
        'min': 0.00163392,
        'minerFee': 0.01
      },
      {
        'rate': '1.51768823',
        'limit': 14118.6382138,
        'pair': 'GNT_XEM',
        'maxLimit': 14118.6382138,
        'min': 5.11182796,
        'minerFee': 4
      },
      {
        'rate': '0.63258870',
        'limit': 21733.31814232,
        'pair': 'XEM_GNT',
        'maxLimit': 21733.31814232,
        'min': 0.03064489,
        'minerFee': 0.01
      },
      {
        'rate': '2.34764095',
        'limit': 14118.6382138,
        'pair': 'GNT_RCN',
        'maxLimit': 14118.6382138,
        'min': 1.61290323,
        'minerFee': 2
      },
      {
        'rate': '0.39919354',
        'limit': 34440.0648162,
        'pair': 'RCN_GNT',
        'maxLimit': 34440.0648162,
        'min': 0.04742709,
        'minerFee': 0.01
      },
      {
        'rate': '0.17258283',
        'limit': 14118.6382138,
        'pair': 'GNT_NMC',
        'maxLimit': 14118.6382138,
        'min': 0.05144892,
        'minerFee': 0.005
      },
      {
        'rate': '5.09601599',
        'limit': 496.85281567,
        'pair': 'NMC_GNT',
        'maxLimit': 496.85281567,
        'min': 0.00348476,
        'minerFee': 0.01
      },
      {
        'rate': '0.01209975',
        'limit': 14118.6382138,
        'pair': 'GNT_REP',
        'maxLimit': 14118.6382138,
        'min': 1.56143548,
        'minerFee': 0.01
      },
      {
        'rate': '77.33009233',
        'limit': 177.87635866,
        'pair': 'REP_GNT',
        'maxLimit': 177.87635866,
        'min': 0.00024432,
        'minerFee': 0.01
      },
      {
        'rate': '0.00295975',
        'limit': 14118.6382138,
        'pair': 'GNT_GNO',
        'maxLimit': 14118.6382138,
        'min': 6.46839247,
        'minerFee': 0.01
      },
      {
        'rate': '320.34713723',
        'limit': 42.93840538,
        'pair': 'GNO_GNT',
        'maxLimit': 42.93840538,
        'min': 0.00005976,
        'minerFee': 0.01
      },
      {
        'rate': '1.48778304',
        'limit': 14118.6382138,
        'pair': 'GNT_ZRX',
        'maxLimit': 14118.6382138,
        'min': 0.00642473,
        'minerFee': 0.005
      },
      {
        'rate': '0.63636962',
        'limit': 21615.10344113,
        'pair': 'ZRX_GNT',
        'maxLimit': 21615.10344113,
        'min': 0.03004105,
        'minerFee': 0.01
      },
      {
        'rate': '2.81259965',
        'limit': 3011.02157862,
        'pair': 'SWT_WINGS',
        'maxLimit': 3011.02157862,
        'min': 0.00632967,
        'minerFee': 0.01
      },
      {
        'rate': '0.31316055',
        'limit': 8787.22524652,
        'pair': 'WINGS_SWT',
        'maxLimit': 8787.22524652,
        'min': 0.56848907,
        'minerFee': 0.1
      },
      {
        'rate': '3.79795335',
        'limit': 3011.02157862,
        'pair': 'SWT_TRST',
        'maxLimit': 3011.02157862,
        'min': 0.00458118,
        'minerFee': 0.01
      },
      {
        'rate': '0.22665388',
        'limit': 12141.03335152,
        'pair': 'TRST_SWT',
        'maxLimit': 12141.03335152,
        'min': 0.76765101,
        'minerFee': 0.1
      },
      {
        'rate': '2.58006861',
        'limit': 3011.02157862,
        'pair': 'SWT_RLC',
        'maxLimit': 3011.02157862,
        'min': 0.00677756,
        'minerFee': 0.01
      },
      {
        'rate': '0.33531990',
        'limit': 8206.52851665,
        'pair': 'RLC_SWT',
        'maxLimit': 8206.52851665,
        'min': 0.52148936,
        'minerFee': 0.1
      },
      {
        'rate': '7.38766383',
        'limit': 1369.22774576,
        'pair': 'SWT_GUP',
        'maxLimit': 1369.22774576,
        'min': 0.00239018,
        'minerFee': 0.01
      },
      {
        'rate': '0.11825419',
        'limit': 6670.4980368,
        'pair': 'GUP_SWT',
        'maxLimit': 6670.4980368,
        'min': 1.49321149,
        'minerFee': 0.1
      },
      {
        'rate': '0.72550647',
        'limit': 3011.02157862,
        'pair': 'SWT_ANT',
        'maxLimit': 3011.02157862,
        'min': 0.02476314,
        'minerFee': 0.01
      },
      {
        'rate': '1.22515611',
        'limit': 2246.09118367,
        'pair': 'ANT_SWT',
        'maxLimit': 2246.09118367,
        'min': 0.14664103,
        'minerFee': 0.1
      },
      {
        'rate': '0.02911981',
        'limit': 3011.02157862,
        'pair': 'SWT_DCR',
        'maxLimit': 3011.02157862,
        'min': 1.87338501,
        'minerFee': 0.03
      },
      {
        'rate': '30.89524117',
        'limit': 89.06913315,
        'pair': 'DCR_SWT',
        'maxLimit': 89.06913315,
        'min': 0.00588576,
        'minerFee': 0.1
      },
      {
        'rate': '8.75998529',
        'limit': 3011.02157862,
        'pair': 'SWT_BAT',
        'maxLimit': 3011.02157862,
        'min': 0.00205965,
        'minerFee': 0.01
      },
      {
        'rate': '0.10190102',
        'limit': 27004.75547533,
        'pair': 'BAT_SWT',
        'maxLimit': 27004.75547533,
        'min': 1.77058824,
        'minerFee': 0.1
      },
      {
        'rate': '0.58540867',
        'limit': 3011.02157862,
        'pair': 'SWT_BNT',
        'maxLimit': 3011.02157862,
        'min': 0.02934755,
        'minerFee': 0.01
      },
      {
        'rate': '1.45196979',
        'limit': 1895.22698531,
        'pair': 'BNT_SWT',
        'maxLimit': 1895.22698531,
        'min': 0.11832414,
        'minerFee': 0.1
      },
      {
        'rate': '41.91815185',
        'limit': 3011.02157862,
        'pair': 'SWT_SNT',
        'maxLimit': 3011.02157862,
        'min': 0.12596899,
        'minerFee': 3
      },
      {
        'rate': '0.02077438',
        'limit': 132461.78775462,
        'pair': 'SNT_SWT',
        'maxLimit': 132461.78775462,
        'min': 8.47259259,
        'minerFee': 0.1
      },
      {
        'rate': '0.10563590',
        'limit': 3011.02157862,
        'pair': 'SWT_NMR',
        'maxLimit': 3011.02157862,
        'min': 0.06459948,
        'minerFee': 0.004
      },
      {
        'rate': '7.99014857',
        'limit': 344.40064816,
        'pair': 'NMR_SWT',
        'maxLimit': 344.40064816,
        'min': 0.02135137,
        'minerFee': 0.1
      },
      {
        'rate': '1.82762961',
        'limit': 3011.02157862,
        'pair': 'SWT_EDG',
        'maxLimit': 3011.02157862,
        'min': 0.29392765,
        'minerFee': 0.3
      },
      {
        'rate': '0.48473568',
        'limit': 5676.93376091,
        'pair': 'EDG_SWT',
        'maxLimit': 5676.93376091,
        'min': 0.36940467,
        'minerFee': 0.1
      },
      {
        'rate': '4.60326776',
        'limit': 3011.02157862,
        'pair': 'SWT_CVC',
        'maxLimit': 3011.02157862,
        'min': 0.03880276,
        'minerFee': 0.1
      },
      {
        'rate': '0.19207364',
        'limit': 14334.10006435,
        'pair': 'CVC_SWT',
        'maxLimit': 14334.10006435,
        'min': 0.93042299,
        'minerFee': 0.1
      },
      {
        'rate': '0.29195431',
        'limit': 2366.13314265,
        'pair': 'SWT_MTL',
        'maxLimit': 2366.13314265,
        'min': 0.06159776,
        'minerFee': 0.01
      },
      {
        'rate': '3.04754920',
        'limit': 902.95912056,
        'pair': 'MTL_SWT',
        'maxLimit': 902.95912056,
        'min': 0.05901047,
        'minerFee': 0.1
      },
      {
        'rate': '67.90740600',
        'limit': 3011.02157862,
        'pair': 'SWT_FUN',
        'maxLimit': 3011.02157862,
        'min': 0.00026163,
        'minerFee': 0.01
      },
      {
        'rate': '0.01294404',
        'limit': 212592.98817303,
        'pair': 'FUN_SWT',
        'maxLimit': 212592.98817303,
        'min': 13.7256,
        'minerFee': 0.1
      },
      {
        'rate': '34.64663571',
        'limit': 3011.02157862,
        'pair': 'SWT_DNT',
        'maxLimit': 3011.02157862,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.02503579',
        'limit': 109915.10047724,
        'pair': 'DNT_SWT',
        'maxLimit': 109915.10047724,
        'min': 7.00285714,
        'minerFee': 0.1
      },
      {
        'rate': '3.71810151',
        'limit': 3011.02157862,
        'pair': 'SWT_1ST',
        'maxLimit': 3011.02157862,
        'min': 0.00479759,
        'minerFee': 0.01
      },
      {
        'rate': '0.23736068',
        'limit': 11593.37908983,
        'pair': '1ST_SWT',
        'maxLimit': 11593.37908983,
        'min': 0.75151117,
        'minerFee': 0.1
      },
      {
        'rate': '0.37904910',
        'limit': 1505.51078931,
        'pair': 'SWT_SALT',
        'maxLimit': 1505.51078931,
        'min': 0.23540052,
        'minerFee': 0.05
      },
      {
        'rate': '2.32928811',
        'limit': 590.6981482,
        'pair': 'SALT_SWT',
        'maxLimit': 590.6981482,
        'min': 0.07661427,
        'minerFee': 0.1
      },
      {
        'rate': '7.11282663',
        'limit': 3011.02157862,
        'pair': 'SWT_XEM',
        'maxLimit': 3011.02157862,
        'min': 1.02368648,
        'minerFee': 4
      },
      {
        'rate': '0.12661722',
        'limit': 21733.31814232,
        'pair': 'XEM_SWT',
        'maxLimit': 21733.31814232,
        'min': 1.43693467,
        'minerFee': 0.1
      },
      {
        'rate': '11.00249611',
        'limit': 3011.02157862,
        'pair': 'SWT_RCN',
        'maxLimit': 3011.02157862,
        'min': 0.32299742,
        'minerFee': 2
      },
      {
        'rate': '0.07990148',
        'limit': 34440.0648162,
        'pair': 'RCN_SWT',
        'maxLimit': 34440.0648162,
        'min': 2.22384964,
        'minerFee': 0.1
      },
      {
        'rate': '0.80883000',
        'limit': 3011.02157862,
        'pair': 'SWT_NMC',
        'maxLimit': 3011.02157862,
        'min': 0.01030308,
        'minerFee': 0.005
      },
      {
        'rate': '1.02000484',
        'limit': 496.85281567,
        'pair': 'NMC_SWT',
        'maxLimit': 496.85281567,
        'min': 0.1634,
        'minerFee': 0.1
      },
      {
        'rate': '0.05670694',
        'limit': 3011.02157862,
        'pair': 'SWT_REP',
        'maxLimit': 3011.02157862,
        'min': 0.31269057,
        'minerFee': 0.01
      },
      {
        'rate': '15.47818313',
        'limit': 177.87635866,
        'pair': 'REP_SWT',
        'maxLimit': 177.87635866,
        'min': 0.01145595,
        'minerFee': 0.1
      },
      {
        'rate': '0.01387122',
        'limit': 3011.02157862,
        'pair': 'SWT_GNO',
        'maxLimit': 3011.02157862,
        'min': 1.29534991,
        'minerFee': 0.01
      },
      {
        'rate': '64.11982073',
        'limit': 42.93840538,
        'pair': 'GNO_SWT',
        'maxLimit': 42.93840538,
        'min': 0.00280227,
        'minerFee': 0.1
      },
      {
        'rate': '6.97267241',
        'limit': 3011.02157862,
        'pair': 'SWT_ZRX',
        'maxLimit': 3011.02157862,
        'min': 0.00128661,
        'minerFee': 0.005
      },
      {
        'rate': '0.12737403',
        'limit': 21615.10344113,
        'pair': 'ZRX_SWT',
        'maxLimit': 21615.10344113,
        'min': 1.40862069,
        'minerFee': 0.1
      },
      {
        'rate': '1.30140279',
        'limit': 8787.22524652,
        'pair': 'WINGS_TRST',
        'maxLimit': 8787.22524652,
        'min': 0.01409874,
        'minerFee': 0.01
      },
      {
        'rate': '0.69753520',
        'limit': 12141.03335152,
        'pair': 'TRST_WINGS',
        'maxLimit': 12141.03335152,
        'min': 0.02630425,
        'minerFee': 0.01
      },
      {
        'rate': '0.88408366',
        'limit': 8787.22524652,
        'pair': 'WINGS_RLC',
        'maxLimit': 8787.22524652,
        'min': 0.02085818,
        'minerFee': 0.01
      },
      {
        'rate': '1.03195866',
        'limit': 8206.52851665,
        'pair': 'RLC_WINGS',
        'maxLimit': 8206.52851665,
        'min': 0.0178693,
        'minerFee': 0.01
      },
      {
        'rate': '2.53144930',
        'limit': 3995.89053138,
        'pair': 'WINGS_GUP',
        'maxLimit': 3995.89053138,
        'min': 0.00735586,
        'minerFee': 0.01
      },
      {
        'rate': '0.36393141',
        'limit': 6670.4980368,
        'pair': 'GUP_WINGS',
        'maxLimit': 6670.4980368,
        'min': 0.05116623,
        'minerFee': 0.01
      },
      {
        'rate': '0.24860130',
        'limit': 8787.22524652,
        'pair': 'WINGS_ANT',
        'maxLimit': 8787.22524652,
        'min': 0.07620941,
        'minerFee': 0.01
      },
      {
        'rate': '3.77046056',
        'limit': 2246.09118367,
        'pair': 'ANT_WINGS',
        'maxLimit': 2246.09118367,
        'min': 0.00502479,
        'minerFee': 0.01
      },
      {
        'rate': '0.00997816',
        'limit': 8787.22524652,
        'pair': 'WINGS_DCR',
        'maxLimit': 8787.22524652,
        'min': 5.76540755,
        'minerFee': 0.03
      },
      {
        'rate': '95.08117958',
        'limit': 89.06913315,
        'pair': 'DCR_WINGS',
        'maxLimit': 89.06913315,
        'min': 0.00020168,
        'minerFee': 0.01
      },
      {
        'rate': '3.00168756',
        'limit': 8787.22524652,
        'pair': 'WINGS_BAT',
        'maxLimit': 8787.22524652,
        'min': 0.00633863,
        'minerFee': 0.01
      },
      {
        'rate': '0.31360395',
        'limit': 27004.75547533,
        'pair': 'BAT_WINGS',
        'maxLimit': 27004.75547533,
        'min': 0.06067079,
        'minerFee': 0.01
      },
      {
        'rate': '0.20059553',
        'limit': 8787.22524652,
        'pair': 'WINGS_BNT',
        'maxLimit': 8787.22524652,
        'min': 0.09031809,
        'minerFee': 0.01
      },
      {
        'rate': '4.46848757',
        'limit': 1895.22698531,
        'pair': 'BNT_WINGS',
        'maxLimit': 1895.22698531,
        'min': 0.00405448,
        'minerFee': 0.01
      },
      {
        'rate': '14.36363086',
        'limit': 8787.22524652,
        'pair': 'WINGS_SNT',
        'maxLimit': 8787.22524652,
        'min': 0.38767396,
        'minerFee': 3
      },
      {
        'rate': '0.06393389',
        'limit': 132461.78775462,
        'pair': 'SNT_WINGS',
        'maxLimit': 132461.78775462,
        'min': 0.29032099,
        'minerFee': 0.01
      },
      {
        'rate': '0.03619708',
        'limit': 8787.22524652,
        'pair': 'WINGS_NMR',
        'maxLimit': 8787.22524652,
        'min': 0.19880716,
        'minerFee': 0.004
      },
      {
        'rate': '24.58996023',
        'limit': 344.40064816,
        'pair': 'NMR_WINGS',
        'maxLimit': 344.40064816,
        'min': 0.00073162,
        'minerFee': 0.01
      },
      {
        'rate': '0.62625368',
        'limit': 8787.22524652,
        'pair': 'WINGS_EDG',
        'maxLimit': 8787.22524652,
        'min': 0.90457256,
        'minerFee': 0.3
      },
      {
        'rate': '1.49179092',
        'limit': 5676.93376091,
        'pair': 'EDG_WINGS',
        'maxLimit': 5676.93376091,
        'min': 0.01265798,
        'minerFee': 0.01
      },
      {
        'rate': '1.57735100',
        'limit': 8787.22524652,
        'pair': 'WINGS_CVC',
        'maxLimit': 8787.22524652,
        'min': 0.11941683,
        'minerFee': 0.1
      },
      {
        'rate': '0.59111332',
        'limit': 14334.10006435,
        'pair': 'CVC_WINGS',
        'maxLimit': 14334.10006435,
        'min': 0.03188178,
        'minerFee': 0.01
      },
      {
        'rate': '0.10004076',
        'limit': 6905.21284717,
        'pair': 'WINGS_MTL',
        'maxLimit': 6905.21284717,
        'min': 0.18956925,
        'minerFee': 0.01
      },
      {
        'rate': '9.37893870',
        'limit': 902.95912056,
        'pair': 'MTL_WINGS',
        'maxLimit': 902.95912056,
        'min': 0.00202205,
        'minerFee': 0.01
      },
      {
        'rate': '23.26908200',
        'limit': 8787.22524652,
        'pair': 'WINGS_FUN',
        'maxLimit': 8787.22524652,
        'min': 0.00080517,
        'minerFee': 0.01
      },
      {
        'rate': '0.03983573',
        'limit': 212592.98817303,
        'pair': 'FUN_WINGS',
        'maxLimit': 212592.98817303,
        'min': 0.47032,
        'minerFee': 0.01
      },
      {
        'rate': '11.87198061',
        'limit': 8787.22524652,
        'pair': 'WINGS_DNT',
        'maxLimit': 8787.22524652,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.07704854',
        'limit': 109915.10047724,
        'pair': 'DNT_WINGS',
        'maxLimit': 109915.10047724,
        'min': 0.23995918,
        'minerFee': 0.01
      },
      {
        'rate': '1.27404084',
        'limit': 8787.22524652,
        'pair': 'WINGS_1ST',
        'maxLimit': 8787.22524652,
        'min': 0.01476474,
        'minerFee': 0.01
      },
      {
        'rate': '0.73048575',
        'limit': 11593.37908983,
        'pair': '1ST_WINGS',
        'maxLimit': 11593.37908983,
        'min': 0.0257512,
        'minerFee': 0.01
      },
      {
        'rate': '0.12988457',
        'limit': 4393.61262326,
        'pair': 'WINGS_SALT',
        'maxLimit': 4393.61262326,
        'min': 0.72445328,
        'minerFee': 0.05
      },
      {
        'rate': '7.16846520',
        'limit': 590.6981482,
        'pair': 'SALT_WINGS',
        'maxLimit': 590.6981482,
        'min': 0.00262526,
        'minerFee': 0.01
      },
      {
        'rate': '2.43727386',
        'limit': 8787.22524652,
        'pair': 'WINGS_XEM',
        'maxLimit': 8787.22524652,
        'min': 3.15043075,
        'minerFee': 4
      },
      {
        'rate': '0.38966890',
        'limit': 21733.31814232,
        'pair': 'XEM_WINGS',
        'maxLimit': 21733.31814232,
        'min': 0.04923786,
        'minerFee': 0.01
      },
      {
        'rate': '3.77010401',
        'limit': 8787.22524652,
        'pair': 'WINGS_RCN',
        'maxLimit': 8787.22524652,
        'min': 0.99403579,
        'minerFee': 2
      },
      {
        'rate': '0.24589960',
        'limit': 34440.0648162,
        'pair': 'RCN_WINGS',
        'maxLimit': 34440.0648162,
        'min': 0.0762022,
        'minerFee': 0.01
      },
      {
        'rate': '0.27715285',
        'limit': 8787.22524652,
        'pair': 'WINGS_NMC',
        'maxLimit': 8787.22524652,
        'min': 0.03170808,
        'minerFee': 0.005
      },
      {
        'rate': '3.13910039',
        'limit': 496.85281567,
        'pair': 'NMC_WINGS',
        'maxLimit': 496.85281567,
        'min': 0.00559905,
        'minerFee': 0.01
      },
      {
        'rate': '0.01943114',
        'limit': 8787.22524652,
        'pair': 'WINGS_REP',
        'maxLimit': 8787.22524652,
        'min': 0.9623161,
        'minerFee': 0.01
      },
      {
        'rate': '47.63464711',
        'limit': 177.87635866,
        'pair': 'REP_WINGS',
        'maxLimit': 177.87635866,
        'min': 0.00039255,
        'minerFee': 0.01
      },
      {
        'rate': '0.00475310',
        'limit': 8787.22524652,
        'pair': 'WINGS_GNO',
        'maxLimit': 8787.22524652,
        'min': 3.98648443,
        'minerFee': 0.01
      },
      {
        'rate': '197.33097912',
        'limit': 42.93840538,
        'pair': 'GNO_WINGS',
        'maxLimit': 42.93840538,
        'min': 0.00009602,
        'minerFee': 0.01
      },
      {
        'rate': '2.38924876',
        'limit': 8787.22524652,
        'pair': 'WINGS_ZRX',
        'maxLimit': 8787.22524652,
        'min': 0.00395958,
        'minerFee': 0.005
      },
      {
        'rate': '0.39199801',
        'limit': 21615.10344113,
        'pair': 'ZRX_WINGS',
        'maxLimit': 21615.10344113,
        'min': 0.04826765,
        'minerFee': 0.01
      },
      {
        'rate': '0.63986664',
        'limit': 12141.03335152,
        'pair': 'TRST_RLC',
        'maxLimit': 12141.03335152,
        'min': 0.02816555,
        'minerFee': 0.01
      },
      {
        'rate': '1.39349049',
        'limit': 8206.52851665,
        'pair': 'RLC_TRST',
        'maxLimit': 8206.52851665,
        'min': 0.01293313,
        'minerFee': 0.01
      },
      {
        'rate': '1.83216818',
        'limit': 5520.99657673,
        'pair': 'TRST_GUP',
        'maxLimit': 5520.99657673,
        'min': 0.00993289,
        'minerFee': 0.01
      },
      {
        'rate': '0.49142953',
        'limit': 6670.4980368,
        'pair': 'GUP_TRST',
        'maxLimit': 6670.4980368,
        'min': 0.0370322,
        'minerFee': 0.01
      },
      {
        'rate': '0.17992831',
        'limit': 12141.03335152,
        'pair': 'TRST_ANT',
        'maxLimit': 12141.03335152,
        'min': 0.10290828,
        'minerFee': 0.01
      },
      {
        'rate': '5.09138702',
        'limit': 2246.09118367,
        'pair': 'ANT_TRST',
        'maxLimit': 2246.09118367,
        'min': 0.00363675,
        'minerFee': 0.01
      },
      {
        'rate': '0.00722182',
        'limit': 12141.03335152,
        'pair': 'TRST_DCR',
        'maxLimit': 12141.03335152,
        'min': 7.7852349,
        'minerFee': 0.03
      },
      {
        'rate': '128.39149888',
        'limit': 89.06913315,
        'pair': 'DCR_TRST',
        'maxLimit': 89.06913315,
        'min': 0.00014597,
        'minerFee': 0.01
      },
      {
        'rate': '2.17250902',
        'limit': 12141.03335152,
        'pair': 'TRST_BAT',
        'maxLimit': 12141.03335152,
        'min': 0.00855928,
        'minerFee': 0.01
      },
      {
        'rate': '0.42347058',
        'limit': 27004.75547533,
        'pair': 'BAT_TRST',
        'maxLimit': 27004.75547533,
        'min': 0.04391125,
        'minerFee': 0.01
      },
      {
        'rate': '0.14518353',
        'limit': 12141.03335152,
        'pair': 'TRST_BNT',
        'maxLimit': 12141.03335152,
        'min': 0.12195973,
        'minerFee': 0.01
      },
      {
        'rate': '6.03395771',
        'limit': 1895.22698531,
        'pair': 'BNT_TRST',
        'maxLimit': 1895.22698531,
        'min': 0.00293448,
        'minerFee': 0.01
      },
      {
        'rate': '10.39585802',
        'limit': 12141.03335152,
        'pair': 'TRST_SNT',
        'maxLimit': 12141.03335152,
        'min': 0.52348993,
        'minerFee': 3
      },
      {
        'rate': '0.08633221',
        'limit': 132461.78775462,
        'pair': 'SNT_TRST',
        'maxLimit': 132461.78775462,
        'min': 0.21012346,
        'minerFee': 0.01
      },
      {
        'rate': '0.02619809',
        'limit': 12141.03335152,
        'pair': 'TRST_NMR',
        'maxLimit': 12141.03335152,
        'min': 0.26845638,
        'minerFee': 0.004
      },
      {
        'rate': '33.20469798',
        'limit': 344.40064816,
        'pair': 'NMR_TRST',
        'maxLimit': 344.40064816,
        'min': 0.00052952,
        'minerFee': 0.01
      },
      {
        'rate': '0.45325896',
        'limit': 12141.03335152,
        'pair': 'TRST_EDG',
        'maxLimit': 12141.03335152,
        'min': 1.22147651,
        'minerFee': 0.3
      },
      {
        'rate': '2.01441834',
        'limit': 5676.93376091,
        'pair': 'EDG_TRST',
        'maxLimit': 5676.93376091,
        'min': 0.00916137,
        'minerFee': 0.01
      },
      {
        'rate': '1.14162757',
        'limit': 12141.03335152,
        'pair': 'TRST_CVC',
        'maxLimit': 12141.03335152,
        'min': 0.1612528,
        'minerFee': 0.1
      },
      {
        'rate': '0.79820134',
        'limit': 14334.10006435,
        'pair': 'CVC_TRST',
        'maxLimit': 14334.10006435,
        'min': 0.02307484,
        'minerFee': 0.01
      },
      {
        'rate': '0.07240575',
        'limit': 9540.7159409,
        'pair': 'TRST_MTL',
        'maxLimit': 9540.7159409,
        'min': 0.2559821,
        'minerFee': 0.01
      },
      {
        'rate': '12.66471454',
        'limit': 902.95912056,
        'pair': 'MTL_TRST',
        'maxLimit': 902.95912056,
        'min': 0.00146348,
        'minerFee': 0.01
      },
      {
        'rate': '16.84128999',
        'limit': 12141.03335152,
        'pair': 'TRST_FUN',
        'maxLimit': 12141.03335152,
        'min': 0.00108725,
        'minerFee': 0.01
      },
      {
        'rate': '0.05379161',
        'limit': 212592.98817303,
        'pair': 'FUN_TRST',
        'maxLimit': 212592.98817303,
        'min': 0.3404,
        'minerFee': 0.01
      },
      {
        'rate': '8.59249489',
        'limit': 12141.03335152,
        'pair': 'TRST_DNT',
        'maxLimit': 12141.03335152,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.10404138',
        'limit': 109915.10047724,
        'pair': 'DNT_TRST',
        'maxLimit': 109915.10047724,
        'min': 0.17367347,
        'minerFee': 0.01
      },
      {
        'rate': '0.92210304',
        'limit': 12141.03335152,
        'pair': 'TRST_1ST',
        'maxLimit': 12141.03335152,
        'min': 0.01993736,
        'minerFee': 0.01
      },
      {
        'rate': '0.98640089',
        'limit': 11593.37908983,
        'pair': '1ST_TRST',
        'maxLimit': 11593.37908983,
        'min': 0.01863776,
        'minerFee': 0.01
      },
      {
        'rate': '0.09400559',
        'limit': 6070.51671261,
        'pair': 'TRST_SALT',
        'maxLimit': 6070.51671261,
        'min': 0.97825503,
        'minerFee': 0.05
      },
      {
        'rate': '9.67983355',
        'limit': 590.6981482,
        'pair': 'SALT_TRST',
        'maxLimit': 590.6981482,
        'min': 0.00190006,
        'minerFee': 0.01
      },
      {
        'rate': '1.76400753',
        'limit': 12141.03335152,
        'pair': 'TRST_XEM',
        'maxLimit': 12141.03335152,
        'min': 4.2541387,
        'minerFee': 4
      },
      {
        'rate': '0.52618378',
        'limit': 21733.31814232,
        'pair': 'XEM_TRST',
        'maxLimit': 21733.31814232,
        'min': 0.03563652,
        'minerFee': 0.01
      },
      {
        'rate': '2.72866007',
        'limit': 12141.03335152,
        'pair': 'TRST_RCN',
        'maxLimit': 12141.03335152,
        'min': 1.34228188,
        'minerFee': 2
      },
      {
        'rate': '0.33204697',
        'limit': 34440.0648162,
        'pair': 'RCN_TRST',
        'maxLimit': 34440.0648162,
        'min': 0.0551523,
        'minerFee': 0.01
      },
      {
        'rate': '0.20059285',
        'limit': 12141.03335152,
        'pair': 'TRST_NMC',
        'maxLimit': 12141.03335152,
        'min': 0.04281655,
        'minerFee': 0.005
      },
      {
        'rate': '4.23883892',
        'limit': 496.85281567,
        'pair': 'NMC_TRST',
        'maxLimit': 496.85281567,
        'min': 0.00405238,
        'minerFee': 0.01
      },
      {
        'rate': '0.01406353',
        'limit': 12141.03335152,
        'pair': 'TRST_REP',
        'maxLimit': 12141.03335152,
        'min': 1.29944966,
        'minerFee': 0.01
      },
      {
        'rate': '64.32275838',
        'limit': 177.87635866,
        'pair': 'REP_TRST',
        'maxLimit': 177.87635866,
        'min': 0.00028411,
        'minerFee': 0.01
      },
      {
        'rate': '0.00344011',
        'limit': 12141.03335152,
        'pair': 'TRST_GNO',
        'maxLimit': 12141.03335152,
        'min': 5.38309172,
        'minerFee': 0.01
      },
      {
        'rate': '266.46304026',
        'limit': 42.93840538,
        'pair': 'GNO_TRST',
        'maxLimit': 42.93840538,
        'min': 0.0000695,
        'minerFee': 0.01
      },
      {
        'rate': '1.72924876',
        'limit': 12141.03335152,
        'pair': 'TRST_ZRX',
        'maxLimit': 12141.03335152,
        'min': 0.00534676,
        'minerFee': 0.005
      },
      {
        'rate': '0.52932885',
        'limit': 21615.10344113,
        'pair': 'ZRX_TRST',
        'maxLimit': 21615.10344113,
        'min': 0.03493432,
        'minerFee': 0.01
      },
      {
        'rate': '2.71057550',
        'limit': 3731.82532708,
        'pair': 'RLC_GUP',
        'maxLimit': 3731.82532708,
        'min': 0.00674772,
        'minerFee': 0.01
      },
      {
        'rate': '0.33384346',
        'limit': 6670.4980368,
        'pair': 'GUP_RLC',
        'maxLimit': 6670.4980368,
        'min': 0.05478677,
        'minerFee': 0.01
      },
      {
        'rate': '0.26619241',
        'limit': 8206.52851665,
        'pair': 'RLC_ANT',
        'maxLimit': 8206.52851665,
        'min': 0.06990881,
        'minerFee': 0.01
      },
      {
        'rate': '3.45873860',
        'limit': 2246.09118367,
        'pair': 'ANT_RLC',
        'maxLimit': 2246.09118367,
        'min': 0.00538034,
        'minerFee': 0.01
      },
      {
        'rate': '0.01068422',
        'limit': 8206.52851665,
        'pair': 'RLC_DCR',
        'maxLimit': 8206.52851665,
        'min': 5.2887538,
        'minerFee': 0.03
      },
      {
        'rate': '87.22036474',
        'limit': 89.06913315,
        'pair': 'DCR_RLC',
        'maxLimit': 89.06913315,
        'min': 0.00021595,
        'minerFee': 0.01
      },
      {
        'rate': '3.21408797',
        'limit': 8206.52851665,
        'pair': 'RLC_BAT',
        'maxLimit': 8206.52851665,
        'min': 0.00581459,
        'minerFee': 0.01
      },
      {
        'rate': '0.28767682',
        'limit': 27004.75547533,
        'pair': 'BAT_RLC',
        'maxLimit': 27004.75547533,
        'min': 0.06496388,
        'minerFee': 0.01
      },
      {
        'rate': '0.21478974',
        'limit': 8206.52851665,
        'pair': 'RLC_BNT',
        'maxLimit': 8206.52851665,
        'min': 0.08285106,
        'minerFee': 0.01
      },
      {
        'rate': '4.09905638',
        'limit': 1895.22698531,
        'pair': 'BNT_RLC',
        'maxLimit': 1895.22698531,
        'min': 0.00434138,
        'minerFee': 0.01
      },
      {
        'rate': '15.38000617',
        'limit': 8206.52851665,
        'pair': 'RLC_SNT',
        'maxLimit': 8206.52851665,
        'min': 0.3556231,
        'minerFee': 3
      },
      {
        'rate': '0.05864817',
        'limit': 132461.78775462,
        'pair': 'SNT_RLC',
        'maxLimit': 132461.78775462,
        'min': 0.3108642,
        'minerFee': 0.01
      },
      {
        'rate': '0.03875840',
        'limit': 8206.52851665,
        'pair': 'RLC_NMR',
        'maxLimit': 8206.52851665,
        'min': 0.18237082,
        'minerFee': 0.004
      },
      {
        'rate': '22.55699088',
        'limit': 344.40064816,
        'pair': 'NMR_RLC',
        'maxLimit': 344.40064816,
        'min': 0.00078339,
        'minerFee': 0.01
      },
      {
        'rate': '0.67056760',
        'limit': 8206.52851665,
        'pair': 'RLC_EDG',
        'maxLimit': 8206.52851665,
        'min': 0.82978723,
        'minerFee': 0.3
      },
      {
        'rate': '1.36845744',
        'limit': 5676.93376091,
        'pair': 'EDG_RLC',
        'maxLimit': 5676.93376091,
        'min': 0.01355367,
        'minerFee': 0.01
      },
      {
        'rate': '1.68896488',
        'limit': 8206.52851665,
        'pair': 'RLC_CVC',
        'maxLimit': 8206.52851665,
        'min': 0.10954407,
        'minerFee': 0.1
      },
      {
        'rate': '0.54224316',
        'limit': 14334.10006435,
        'pair': 'CVC_RLC',
        'maxLimit': 14334.10006435,
        'min': 0.03413774,
        'minerFee': 0.01
      },
      {
        'rate': '0.10711968',
        'limit': 6448.88742312,
        'pair': 'RLC_MTL',
        'maxLimit': 6448.88742312,
        'min': 0.17389666,
        'minerFee': 0.01
      },
      {
        'rate': '8.60353708',
        'limit': 902.95912056,
        'pair': 'MTL_RLC',
        'maxLimit': 902.95912056,
        'min': 0.00216513,
        'minerFee': 0.01
      },
      {
        'rate': '24.91560999',
        'limit': 8206.52851665,
        'pair': 'RLC_FUN',
        'maxLimit': 8206.52851665,
        'min': 0.0007386,
        'minerFee': 0.01
      },
      {
        'rate': '0.03654232',
        'limit': 212592.98817303,
        'pair': 'FUN_RLC',
        'maxLimit': 212592.98817303,
        'min': 0.5036,
        'minerFee': 0.01
      },
      {
        'rate': '12.71204591',
        'limit': 8206.52851665,
        'pair': 'RLC_DNT',
        'maxLimit': 8206.52851665,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.07067857',
        'limit': 109915.10047724,
        'pair': 'DNT_RLC',
        'maxLimit': 109915.10047724,
        'min': 0.25693878,
        'minerFee': 0.01
      },
      {
        'rate': '1.36419240',
        'limit': 8206.52851665,
        'pair': 'RLC_1ST',
        'maxLimit': 8206.52851665,
        'min': 0.01354407,
        'minerFee': 0.01
      },
      {
        'rate': '0.67009300',
        'limit': 11593.37908983,
        'pair': '1ST_RLC',
        'maxLimit': 11593.37908983,
        'min': 0.02757337,
        'minerFee': 0.01
      },
      {
        'rate': '0.13907525',
        'limit': 4103.26427516,
        'pair': 'RLC_SALT',
        'maxLimit': 4103.26427516,
        'min': 0.66455927,
        'minerFee': 0.05
      },
      {
        'rate': '6.57581398',
        'limit': 590.6981482,
        'pair': 'SALT_RLC',
        'maxLimit': 590.6981482,
        'min': 0.00281102,
        'minerFee': 0.01
      },
      {
        'rate': '2.60973618',
        'limit': 8206.52851665,
        'pair': 'RLC_XEM',
        'maxLimit': 8206.52851665,
        'min': 2.8899696,
        'minerFee': 4
      },
      {
        'rate': '0.35745311',
        'limit': 21733.31814232,
        'pair': 'XEM_RLC',
        'maxLimit': 21733.31814232,
        'min': 0.05272194,
        'minerFee': 0.01
      },
      {
        'rate': '4.03687783',
        'limit': 8206.52851665,
        'pair': 'RLC_RCN',
        'maxLimit': 8206.52851665,
        'min': 0.9118541,
        'minerFee': 2
      },
      {
        'rate': '0.22556990',
        'limit': 34440.0648162,
        'pair': 'RCN_RLC',
        'maxLimit': 34440.0648162,
        'min': 0.0815943,
        'minerFee': 0.01
      },
      {
        'rate': '0.29676428',
        'limit': 8206.52851665,
        'pair': 'RLC_NMC',
        'maxLimit': 8206.52851665,
        'min': 0.02908663,
        'minerFee': 0.005
      },
      {
        'rate': '2.87957598',
        'limit': 496.85281567,
        'pair': 'NMC_RLC',
        'maxLimit': 496.85281567,
        'min': 0.00599524,
        'minerFee': 0.01
      },
      {
        'rate': '0.02080609',
        'limit': 8206.52851665,
        'pair': 'RLC_REP',
        'maxLimit': 8206.52851665,
        'min': 0.88275684,
        'minerFee': 0.01
      },
      {
        'rate': '43.69646352',
        'limit': 177.87635866,
        'pair': 'REP_RLC',
        'maxLimit': 177.87635866,
        'min': 0.00042033,
        'minerFee': 0.01
      },
      {
        'rate': '0.00508943',
        'limit': 8206.52851665,
        'pair': 'RLC_GNO',
        'maxLimit': 8206.52851665,
        'min': 3.65690274,
        'minerFee': 0.01
      },
      {
        'rate': '181.01668541',
        'limit': 42.93840538,
        'pair': 'GNO_RLC',
        'maxLimit': 42.93840538,
        'min': 0.00010282,
        'minerFee': 0.01
      },
      {
        'rate': '2.55831280',
        'limit': 8206.52851665,
        'pair': 'RLC_ZRX',
        'maxLimit': 8206.52851665,
        'min': 0.00363222,
        'minerFee': 0.005
      },
      {
        'rate': '0.35958966',
        'limit': 21615.10344113,
        'pair': 'ZRX_RLC',
        'maxLimit': 21615.10344113,
        'min': 0.05168309,
        'minerFee': 0.01
      },
      {
        'rate': '0.09387564',
        'limit': 6670.4980368,
        'pair': 'GUP_ANT',
        'maxLimit': 6670.4980368,
        'min': 0.20017406,
        'minerFee': 0.01
      },
      {
        'rate': '9.90361183',
        'limit': 1021.3843667,
        'pair': 'ANT_GUP',
        'maxLimit': 1021.3843667,
        'min': 0.00189744,
        'minerFee': 0.01
      },
      {
        'rate': '0.00376790',
        'limit': 6670.4980368,
        'pair': 'GUP_DCR',
        'maxLimit': 6670.4980368,
        'min': 15.14360313,
        'minerFee': 0.03
      },
      {
        'rate': '249.74325500',
        'limit': 40.50317316,
        'pair': 'DCR_GUP',
        'maxLimit': 40.50317316,
        'min': 0.00007616,
        'minerFee': 0.01
      },
      {
        'rate': '1.13348297',
        'limit': 6670.4980368,
        'pair': 'GUP_BAT',
        'maxLimit': 6670.4980368,
        'min': 0.01664926,
        'minerFee': 0.01
      },
      {
        'rate': '0.82372214',
        'limit': 12280.1047747,
        'pair': 'BAT_GUP',
        'maxLimit': 12280.1047747,
        'min': 0.02291022,
        'minerFee': 0.01
      },
      {
        'rate': '0.07574793',
        'limit': 6670.4980368,
        'pair': 'GUP_BNT',
        'maxLimit': 6670.4980368,
        'min': 0.23723238,
        'minerFee': 0.01
      },
      {
        'rate': '11.73707180',
        'limit': 861.83287233,
        'pair': 'BNT_GUP',
        'maxLimit': 861.83287233,
        'min': 0.00153103,
        'minerFee': 0.01
      },
      {
        'rate': '5.42392592',
        'limit': 6670.4980368,
        'pair': 'GUP_SNT',
        'maxLimit': 6670.4980368,
        'min': 1.01827676,
        'minerFee': 3
      },
      {
        'rate': '0.16793080',
        'limit': 60235.48829231,
        'pair': 'SNT_GUP',
        'maxLimit': 60235.48829231,
        'min': 0.10962963,
        'minerFee': 0.01
      },
      {
        'rate': '0.01366857',
        'limit': 6670.4980368,
        'pair': 'GUP_NMR',
        'maxLimit': 6670.4980368,
        'min': 0.52219321,
        'minerFee': 0.004
      },
      {
        'rate': '64.58877284',
        'limit': 156.61226956,
        'pair': 'NMR_GUP',
        'maxLimit': 156.61226956,
        'min': 0.00027627,
        'minerFee': 0.01
      },
      {
        'rate': '0.23648293',
        'limit': 6670.4980368,
        'pair': 'GUP_EDG',
        'maxLimit': 6670.4980368,
        'min': 2.37597911,
        'minerFee': 0.3
      },
      {
        'rate': '3.91838555',
        'limit': 2581.52092681,
        'pair': 'EDG_GUP',
        'maxLimit': 2581.52092681,
        'min': 0.00477985,
        'minerFee': 0.01
      },
      {
        'rate': '0.59563177',
        'limit': 6670.4980368,
        'pair': 'GUP_CVC',
        'maxLimit': 6670.4980368,
        'min': 0.31366406,
        'minerFee': 0.1
      },
      {
        'rate': '1.55263707',
        'limit': 6518.26871088,
        'pair': 'CVC_GUP',
        'maxLimit': 6518.26871088,
        'min': 0.01203905,
        'minerFee': 0.01
      },
      {
        'rate': '0.03777691',
        'limit': 6670.4980368,
        'pair': 'GUP_MTL',
        'maxLimit': 6670.4980368,
        'min': 0.49792863,
        'minerFee': 0.01
      },
      {
        'rate': '24.63501914',
        'limit': 410.61036905,
        'pair': 'MTL_GUP',
        'maxLimit': 410.61036905,
        'min': 0.00076356,
        'minerFee': 0.01
      },
      {
        'rate': '8.78675999',
        'limit': 6670.4980368,
        'pair': 'GUP_FUN',
        'maxLimit': 6670.4980368,
        'min': 0.00211488,
        'minerFee': 0.01
      },
      {
        'rate': '0.10463381',
        'limit': 96674.24046914,
        'pair': 'FUN_GUP',
        'maxLimit': 96674.24046914,
        'min': 0.1776,
        'minerFee': 0.01
      },
      {
        'rate': '4.48304081',
        'limit': 6670.4980368,
        'pair': 'GUP_DNT',
        'maxLimit': 6670.4980368,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.20237815',
        'limit': 49982.63922128,
        'pair': 'DNT_GUP',
        'maxLimit': 49982.63922128,
        'min': 0.09061224,
        'minerFee': 0.01
      },
      {
        'rate': '0.48109724',
        'limit': 6670.4980368,
        'pair': 'GUP_1ST',
        'maxLimit': 6670.4980368,
        'min': 0.03878155,
        'minerFee': 0.01
      },
      {
        'rate': '1.91871714',
        'limit': 5271.95700943,
        'pair': '1ST_GUP',
        'maxLimit': 5271.95700943,
        'min': 0.00972405,
        'minerFee': 0.01
      },
      {
        'rate': '0.04904639',
        'limit': 6670.4980368,
        'pair': 'GUP_SALT',
        'maxLimit': 6670.4980368,
        'min': 1.90287206,
        'minerFee': 0.05
      },
      {
        'rate': '18.82891906',
        'limit': 537.22650096,
        'pair': 'SALT_GUP',
        'maxLimit': 537.22650096,
        'min': 0.00099134,
        'minerFee': 0.01
      },
      {
        'rate': '0.92035175',
        'limit': 6670.4980368,
        'pair': 'GUP_XEM',
        'maxLimit': 6670.4980368,
        'min': 8.27502176,
        'minerFee': 4
      },
      {
        'rate': '1.02351675',
        'limit': 9882.97872697,
        'pair': 'XEM_GUP',
        'maxLimit': 9882.97872697,
        'min': 0.01859296,
        'minerFee': 0.01
      },
      {
        'rate': '1.42364873',
        'limit': 6670.4980368,
        'pair': 'GUP_RCN',
        'maxLimit': 6670.4980368,
        'min': 2.61096606,
        'minerFee': 2
      },
      {
        'rate': '0.64588772',
        'limit': 15661.226956,
        'pair': 'RCN_GUP',
        'maxLimit': 15661.226956,
        'min': 0.02877511,
        'minerFee': 0.01
      },
      {
        'rate': '0.10465714',
        'limit': 6670.4980368,
        'pair': 'GUP_NMC',
        'maxLimit': 6670.4980368,
        'min': 0.08328547,
        'minerFee': 0.005
      },
      {
        'rate': '8.24526109',
        'limit': 496.85281567,
        'pair': 'NMC_GUP',
        'maxLimit': 496.85281567,
        'min': 0.00211429,
        'minerFee': 0.01
      },
      {
        'rate': '0.00733749',
        'limit': 6670.4980368,
        'pair': 'GUP_REP',
        'maxLimit': 6670.4980368,
        'min': 2.52765013,
        'minerFee': 0.01
      },
      {
        'rate': '125.11868146',
        'limit': 80.88724683,
        'pair': 'REP_GUP',
        'maxLimit': 80.88724683,
        'min': 0.00014823,
        'minerFee': 0.01
      },
      {
        'rate': '0.00179484',
        'limit': 6670.4980368,
        'pair': 'GUP_GNO',
        'maxLimit': 6670.4980368,
        'min': 10.47102698,
        'minerFee': 0.01
      },
      {
        'rate': '518.31583550',
        'limit': 19.52575047,
        'pair': 'GNO_GUP',
        'maxLimit': 19.52575047,
        'min': 0.00003626,
        'minerFee': 0.01
      },
      {
        'rate': '0.90221674',
        'limit': 6670.4980368,
        'pair': 'GUP_ZRX',
        'maxLimit': 6670.4980368,
        'min': 0.01040035,
        'minerFee': 0.005
      },
      {
        'rate': '1.02963446',
        'limit': 9829.22193891,
        'pair': 'ZRX_GUP',
        'maxLimit': 9829.22193891,
        'min': 0.0182266,
        'minerFee': 0.01
      },
      {
        'rate': '0.03903687',
        'limit': 2246.09118367,
        'pair': 'ANT_DCR',
        'maxLimit': 2246.09118367,
        'min': 1.48717949,
        'minerFee': 0.03
      },
      {
        'rate': '24.52606837',
        'limit': 89.06913315,
        'pair': 'DCR_ANT',
        'maxLimit': 89.06913315,
        'min': 0.00078902,
        'minerFee': 0.01
      },
      {
        'rate': '11.74329205',
        'limit': 2246.09118367,
        'pair': 'ANT_BAT',
        'maxLimit': 2246.09118367,
        'min': 0.00163504,
        'minerFee': 0.01
      },
      {
        'rate': '0.08089373',
        'limit': 27004.75547533,
        'pair': 'BAT_ANT',
        'maxLimit': 27004.75547533,
        'min': 0.2373581,
        'minerFee': 0.01
      },
      {
        'rate': '0.78477586',
        'limit': 2246.09118367,
        'pair': 'ANT_BNT',
        'maxLimit': 2246.09118367,
        'min': 0.02329744,
        'minerFee': 0.01
      },
      {
        'rate': '1.15264064',
        'limit': 1895.22698531,
        'pair': 'BNT_ANT',
        'maxLimit': 1895.22698531,
        'min': 0.01586207,
        'minerFee': 0.01
      },
      {
        'rate': '56.19382716',
        'limit': 2246.09118367,
        'pair': 'ANT_SNT',
        'maxLimit': 2246.09118367,
        'min': 0.1,
        'minerFee': 3
      },
      {
        'rate': '0.01649166',
        'limit': 132461.78775462,
        'pair': 'SNT_ANT',
        'maxLimit': 132461.78775462,
        'min': 1.13580247,
        'minerFee': 0.01
      },
      {
        'rate': '0.14161133',
        'limit': 2246.09118367,
        'pair': 'ANT_NMR',
        'maxLimit': 2246.09118367,
        'min': 0.05128205,
        'minerFee': 0.004
      },
      {
        'rate': '6.34294871',
        'limit': 344.40064816,
        'pair': 'NMR_ANT',
        'maxLimit': 344.40064816,
        'min': 0.00286228,
        'minerFee': 0.01
      },
      {
        'rate': '2.45004844',
        'limit': 2246.09118367,
        'pair': 'ANT_EDG',
        'maxLimit': 2246.09118367,
        'min': 0.23333333,
        'minerFee': 0.3
      },
      {
        'rate': '0.38480555',
        'limit': 5676.93376091,
        'pair': 'EDG_ANT',
        'maxLimit': 5676.93376091,
        'min': 0.04952094,
        'minerFee': 0.01
      },
      {
        'rate': '6.17095986',
        'limit': 2246.09118367,
        'pair': 'ANT_CVC',
        'maxLimit': 2246.09118367,
        'min': 0.03080342,
        'minerFee': 0.1
      },
      {
        'rate': '0.15247692',
        'limit': 14334.10006435,
        'pair': 'CVC_ANT',
        'maxLimit': 14334.10006435,
        'min': 0.12472885,
        'minerFee': 0.01
      },
      {
        'rate': '0.39138248',
        'limit': 1765.03244907,
        'pair': 'ANT_MTL',
        'maxLimit': 1765.03244907,
        'min': 0.04889915,
        'minerFee': 0.01
      },
      {
        'rate': '2.41928521',
        'limit': 902.95912056,
        'pair': 'MTL_ANT',
        'maxLimit': 902.95912056,
        'min': 0.00791071,
        'minerFee': 0.01
      },
      {
        'rate': '91.03399999',
        'limit': 2246.09118367,
        'pair': 'ANT_FUN',
        'maxLimit': 2246.09118367,
        'min': 0.00020769,
        'minerFee': 0.01
      },
      {
        'rate': '0.01027557',
        'limit': 212592.98817303,
        'pair': 'FUN_ANT',
        'maxLimit': 212592.98817303,
        'min': 1.84,
        'minerFee': 0.01
      },
      {
        'rate': '46.44591836',
        'limit': 2246.09118367,
        'pair': 'ANT_DNT',
        'maxLimit': 2246.09118367,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.01987457',
        'limit': 109915.10047724,
        'pair': 'DNT_ANT',
        'maxLimit': 109915.10047724,
        'min': 0.93877551,
        'minerFee': 0.01
      },
      {
        'rate': '4.98434077',
        'limit': 2246.09118367,
        'pair': 'ANT_1ST',
        'maxLimit': 2246.09118367,
        'min': 0.00380855,
        'minerFee': 0.01
      },
      {
        'rate': '0.18842786',
        'limit': 11593.37908983,
        'pair': '1ST_ANT',
        'maxLimit': 11593.37908983,
        'min': 0.10074463,
        'minerFee': 0.01
      },
      {
        'rate': '0.50813834',
        'limit': 1123.04559183,
        'pair': 'ANT_SALT',
        'maxLimit': 1123.04559183,
        'min': 0.18687179,
        'minerFee': 0.05
      },
      {
        'rate': '1.84909641',
        'limit': 590.6981482,
        'pair': 'SALT_ANT',
        'maxLimit': 590.6981482,
        'min': 0.01027061,
        'minerFee': 0.01
      },
      {
        'rate': '9.53517587',
        'limit': 2246.09118367,
        'pair': 'ANT_XEM',
        'maxLimit': 2246.09118367,
        'min': 0.81264957,
        'minerFee': 4
      },
      {
        'rate': '0.10051459',
        'limit': 21733.31814232,
        'pair': 'XEM_ANT',
        'maxLimit': 21733.31814232,
        'min': 0.19262982,
        'minerFee': 0.01
      },
      {
        'rate': '14.74951393',
        'limit': 2246.09118367,
        'pair': 'ANT_RCN',
        'maxLimit': 2246.09118367,
        'min': 0.25641026,
        'minerFee': 2
      },
      {
        'rate': '0.06342948',
        'limit': 34440.0648162,
        'pair': 'RCN_ANT',
        'maxLimit': 34440.0648162,
        'min': 0.29812054,
        'minerFee': 0.01
      },
      {
        'rate': '1.08428571',
        'limit': 2246.09118367,
        'pair': 'ANT_NMC',
        'maxLimit': 2246.09118367,
        'min': 0.00817906,
        'minerFee': 0.005
      },
      {
        'rate': '0.80972692',
        'limit': 496.85281567,
        'pair': 'NMC_ANT',
        'maxLimit': 496.85281567,
        'min': 0.02190476,
        'minerFee': 0.01
      },
      {
        'rate': '0.07601909',
        'limit': 2246.09118367,
        'pair': 'ANT_REP',
        'maxLimit': 2246.09118367,
        'min': 0.24822821,
        'minerFee': 0.01
      },
      {
        'rate': '12.28729615',
        'limit': 177.87635866,
        'pair': 'REP_ANT',
        'maxLimit': 177.87635866,
        'min': 0.00153574,
        'minerFee': 0.01
      },
      {
        'rate': '0.01859522',
        'limit': 2246.09118367,
        'pair': 'ANT_GNO',
        'maxLimit': 2246.09118367,
        'min': 1.02830855,
        'minerFee': 0.01
      },
      {
        'rate': '50.90127307',
        'limit': 42.93840538,
        'pair': 'GNO_ANT',
        'maxLimit': 42.93840538,
        'min': 0.00037566,
        'minerFee': 0.01
      },
      {
        'rate': '9.34729064',
        'limit': 2246.09118367,
        'pair': 'ANT_ZRX',
        'maxLimit': 2246.09118367,
        'min': 0.00102137,
        'minerFee': 0.005
      },
      {
        'rate': '0.10111538',
        'limit': 21615.10344113,
        'pair': 'ZRX_ANT',
        'maxLimit': 21615.10344113,
        'min': 0.18883415,
        'minerFee': 0.01
      },
      {
        'rate': '296.13519091',
        'limit': 89.06913315,
        'pair': 'DCR_BAT',
        'maxLimit': 89.06913315,
        'min': 0.00006563,
        'minerFee': 0.01
      },
      {
        'rate': '0.00324684',
        'limit': 27004.75547533,
        'pair': 'BAT_DCR',
        'maxLimit': 27004.75547533,
        'min': 17.95665635,
        'minerFee': 0.03
      },
      {
        'rate': '19.79000000',
        'limit': 89.06913315,
        'pair': 'DCR_BNT',
        'maxLimit': 89.06913315,
        'min': 0.00093509,
        'minerFee': 0.01
      },
      {
        'rate': '0.04626379',
        'limit': 1895.22698531,
        'pair': 'BNT_DCR',
        'maxLimit': 1895.22698531,
        'min': 1.2,
        'minerFee': 0.03
      },
      {
        'rate': '1417.06172839',
        'limit': 89.06913315,
        'pair': 'DCR_SNT',
        'maxLimit': 89.06913315,
        'min': 0.00401372,
        'minerFee': 3
      },
      {
        'rate': '0.00066192',
        'limit': 132461.78775462,
        'pair': 'SNT_DCR',
        'maxLimit': 132461.78775462,
        'min': 85.92592593,
        'minerFee': 0.03
      },
      {
        'rate': '3.57106856',
        'limit': 89.06913315,
        'pair': 'DCR_NMR',
        'maxLimit': 89.06913315,
        'min': 0.00205832,
        'minerFee': 0.004
      },
      {
        'rate': '0.25458833',
        'limit': 344.40064816,
        'pair': 'NMR_DCR',
        'maxLimit': 344.40064816,
        'min': 0.21653776,
        'minerFee': 0.03
      },
      {
        'rate': '61.78383033',
        'limit': 89.06913315,
        'pair': 'DCR_EDG',
        'maxLimit': 89.06913315,
        'min': 0.00936535,
        'minerFee': 0.3
      },
      {
        'rate': '0.01544502',
        'limit': 5676.93376091,
        'pair': 'EDG_DCR',
        'maxLimit': 5676.93376091,
        'min': 3.74636667,
        'minerFee': 0.03
      },
      {
        'rate': '155.61550976',
        'limit': 89.06913315,
        'pair': 'DCR_CVC',
        'maxLimit': 89.06913315,
        'min': 0.00123636,
        'minerFee': 0.1
      },
      {
        'rate': '0.00612000',
        'limit': 14334.10006435,
        'pair': 'CVC_DCR',
        'maxLimit': 14334.10006435,
        'min': 9.43600868,
        'minerFee': 0.03
      },
      {
        'rate': '9.86964522',
        'limit': 69.99266608,
        'pair': 'DCR_MTL',
        'maxLimit': 69.99266608,
        'min': 0.00196268,
        'minerFee': 0.01
      },
      {
        'rate': '0.09710338',
        'limit': 902.95912056,
        'pair': 'MTL_DCR',
        'maxLimit': 902.95912056,
        'min': 0.59846257,
        'minerFee': 0.03
      },
      {
        'rate': '2295.64000000',
        'limit': 89.06913315,
        'pair': 'DCR_FUN',
        'maxLimit': 89.06913315,
        'min': 0.00000834,
        'minerFee': 0.01
      },
      {
        'rate': '0.00041243',
        'limit': 212592.98817303,
        'pair': 'FUN_DCR',
        'maxLimit': 212592.98817303,
        'min': 139.2,
        'minerFee': 0.03
      },
      {
        'rate': '1171.24489795',
        'limit': 89.06913315,
        'pair': 'DCR_DNT',
        'maxLimit': 89.06913315,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00079771',
        'limit': 109915.10047724,
        'pair': 'DNT_DCR',
        'maxLimit': 109915.10047724,
        'min': 71.02040816,
        'minerFee': 0.03
      },
      {
        'rate': '125.69207183',
        'limit': 89.06913315,
        'pair': 'DCR_1ST',
        'maxLimit': 89.06913315,
        'min': 0.00015286,
        'minerFee': 0.01
      },
      {
        'rate': '0.00756297',
        'limit': 11593.37908983,
        'pair': '1ST_DCR',
        'maxLimit': 11593.37908983,
        'min': 7.62155059,
        'minerFee': 0.03
      },
      {
        'rate': '12.81392337',
        'limit': 44.53456657,
        'pair': 'DCR_SALT',
        'maxLimit': 44.53456657,
        'min': 0.00750051,
        'minerFee': 0.05
      },
      {
        'rate': '0.07421759',
        'limit': 590.6981482,
        'pair': 'SALT_DCR',
        'maxLimit': 590.6981482,
        'min': 0.77699384,
        'minerFee': 0.03
      },
      {
        'rate': '240.45226130',
        'limit': 89.06913315,
        'pair': 'DCR_XEM',
        'maxLimit': 89.06913315,
        'min': 0.0326175,
        'minerFee': 4
      },
      {
        'rate': '0.00403437',
        'limit': 21733.31814232,
        'pair': 'XEM_DCR',
        'maxLimit': 21733.31814232,
        'min': 14.57286432,
        'minerFee': 0.03
      },
      {
        'rate': '371.94426441',
        'limit': 89.06913315,
        'pair': 'DCR_RCN',
        'maxLimit': 89.06913315,
        'min': 0.0102916,
        'minerFee': 2
      },
      {
        'rate': '0.00254588',
        'limit': 34440.0648162,
        'pair': 'RCN_DCR',
        'maxLimit': 34440.0648162,
        'min': 22.55346727,
        'minerFee': 0.03
      },
      {
        'rate': '27.34285714',
        'limit': 89.06913315,
        'pair': 'DCR_NMC',
        'maxLimit': 89.06913315,
        'min': 0.00032828,
        'minerFee': 0.005
      },
      {
        'rate': '0.03250018',
        'limit': 496.85281567,
        'pair': 'NMC_DCR',
        'maxLimit': 496.85281567,
        'min': 1.65714286,
        'minerFee': 0.03
      },
      {
        'rate': '1.91700330',
        'limit': 89.06913315,
        'pair': 'DCR_REP',
        'maxLimit': 89.06913315,
        'min': 0.00996319,
        'minerFee': 0.01
      },
      {
        'rate': '0.49317792',
        'limit': 177.87635866,
        'pair': 'REP_DCR',
        'maxLimit': 177.87635866,
        'min': 0.11618202,
        'minerFee': 0.03
      },
      {
        'rate': '0.46892302',
        'limit': 89.06913315,
        'pair': 'DCR_GNO',
        'maxLimit': 89.06913315,
        'min': 0.04127345,
        'minerFee': 0.01
      },
      {
        'rate': '2.04303566',
        'limit': 42.93840538,
        'pair': 'GNO_DCR',
        'maxLimit': 42.93840538,
        'min': 0.02841958,
        'minerFee': 0.03
      },
      {
        'rate': '235.71428571',
        'limit': 89.06913315,
        'pair': 'DCR_ZRX',
        'maxLimit': 89.06913315,
        'min': 0.00004099,
        'minerFee': 0.005
      },
      {
        'rate': '0.00405849',
        'limit': 21615.10344113,
        'pair': 'ZRX_DCR',
        'maxLimit': 21615.10344113,
        'min': 14.28571429,
        'minerFee': 0.03
      },
      {
        'rate': '0.06527287',
        'limit': 27004.75547533,
        'pair': 'BAT_BNT',
        'maxLimit': 27004.75547533,
        'min': 0.28130031,
        'minerFee': 0.01
      },
      {
        'rate': '13.91733281',
        'limit': 1895.22698531,
        'pair': 'BNT_BAT',
        'maxLimit': 1895.22698531,
        'min': 0.00131931,
        'minerFee': 0.01
      },
      {
        'rate': '4.67386049',
        'limit': 27004.75547533,
        'pair': 'BAT_SNT',
        'maxLimit': 27004.75547533,
        'min': 1.20743034,
        'minerFee': 3
      },
      {
        'rate': '0.19912538',
        'limit': 132461.78775462,
        'pair': 'SNT_BAT',
        'maxLimit': 132461.78775462,
        'min': 0.09446914,
        'minerFee': 0.01
      },
      {
        'rate': '0.01177836',
        'limit': 27004.75547533,
        'pair': 'BAT_NMR',
        'maxLimit': 27004.75547533,
        'min': 0.61919505,
        'minerFee': 0.004
      },
      {
        'rate': '76.58668730',
        'limit': 344.40064816,
        'pair': 'NMR_BAT',
        'maxLimit': 344.40064816,
        'min': 0.00023807,
        'minerFee': 0.01
      },
      {
        'rate': '0.20378011',
        'limit': 27004.75547533,
        'pair': 'BAT_EDG',
        'maxLimit': 27004.75547533,
        'min': 2.81733746,
        'minerFee': 0.3
      },
      {
        'rate': '4.64625902',
        'limit': 5676.93376091,
        'pair': 'EDG_BAT',
        'maxLimit': 5676.93376091,
        'min': 0.00411885,
        'minerFee': 0.01
      },
      {
        'rate': '0.51326287',
        'limit': 27004.75547533,
        'pair': 'BAT_CVC',
        'maxLimit': 27004.75547533,
        'min': 0.37192982,
        'minerFee': 0.1
      },
      {
        'rate': '1.84105263',
        'limit': 14334.10006435,
        'pair': 'CVC_BAT',
        'maxLimit': 14334.10006435,
        'min': 0.01037419,
        'minerFee': 0.01
      },
      {
        'rate': '0.03255281',
        'limit': 21220.98605777,
        'pair': 'BAT_MTL',
        'maxLimit': 21220.98605777,
        'min': 0.59042312,
        'minerFee': 0.01
      },
      {
        'rate': '29.21118369',
        'limit': 902.95912056,
        'pair': 'MTL_BAT',
        'maxLimit': 902.95912056,
        'min': 0.00065796,
        'minerFee': 0.01
      },
      {
        'rate': '7.57165400',
        'limit': 27004.75547533,
        'pair': 'BAT_FUN',
        'maxLimit': 27004.75547533,
        'min': 0.00250774,
        'minerFee': 0.01
      },
      {
        'rate': '0.12407043',
        'limit': 212592.98817303,
        'pair': 'FUN_BAT',
        'maxLimit': 212592.98817303,
        'min': 0.15304,
        'minerFee': 0.01
      },
      {
        'rate': '3.86308877',
        'limit': 27004.75547533,
        'pair': 'BAT_DNT',
        'maxLimit': 27004.75547533,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.23997162',
        'limit': 109915.10047724,
        'pair': 'DNT_BAT',
        'maxLimit': 109915.10047724,
        'min': 0.07808163,
        'minerFee': 0.01
      },
      {
        'rate': '0.41456712',
        'limit': 27004.75547533,
        'pair': 'BAT_1ST',
        'maxLimit': 27004.75547533,
        'min': 0.04598555,
        'minerFee': 0.01
      },
      {
        'rate': '2.27513519',
        'limit': 11593.37908983,
        'pair': '1ST_BAT',
        'maxLimit': 11593.37908983,
        'min': 0.00837933,
        'minerFee': 0.01
      },
      {
        'rate': '0.04226385',
        'limit': 13502.37773766,
        'pair': 'BAT_SALT',
        'maxLimit': 13502.37773766,
        'min': 2.25634675,
        'minerFee': 0.05
      },
      {
        'rate': '22.32655108',
        'limit': 590.6981482,
        'pair': 'SALT_BAT',
        'maxLimit': 590.6981482,
        'min': 0.00085425,
        'minerFee': 0.01
      },
      {
        'rate': '0.79307788',
        'limit': 27004.75547533,
        'pair': 'BAT_XEM',
        'maxLimit': 27004.75547533,
        'min': 9.8121775,
        'minerFee': 4
      },
      {
        'rate': '1.21364370',
        'limit': 21733.31814232,
        'pair': 'XEM_BAT',
        'maxLimit': 21733.31814232,
        'min': 0.01602178,
        'minerFee': 0.01
      },
      {
        'rate': '1.22677478',
        'limit': 27004.75547533,
        'pair': 'BAT_RCN',
        'maxLimit': 27004.75547533,
        'min': 3.09597523,
        'minerFee': 2
      },
      {
        'rate': '0.76586687',
        'limit': 34440.0648162,
        'pair': 'RCN_BAT',
        'maxLimit': 34440.0648162,
        'min': 0.02479585,
        'minerFee': 0.01
      },
      {
        'rate': '0.09018428',
        'limit': 27004.75547533,
        'pair': 'BAT_NMC',
        'maxLimit': 27004.75547533,
        'min': 0.09875645,
        'minerFee': 0.005
      },
      {
        'rate': '9.77688854',
        'limit': 496.85281567,
        'pair': 'NMC_BAT',
        'maxLimit': 496.85281567,
        'min': 0.0018219,
        'minerFee': 0.01
      },
      {
        'rate': '0.00632280',
        'limit': 27004.75547533,
        'pair': 'BAT_REP',
        'maxLimit': 27004.75547533,
        'min': 2.99718266,
        'minerFee': 0.01
      },
      {
        'rate': '148.36054179',
        'limit': 177.87635866,
        'pair': 'REP_BAT',
        'maxLimit': 177.87635866,
        'min': 0.00012773,
        'minerFee': 0.01
      },
      {
        'rate': '0.00154663',
        'limit': 27004.75547533,
        'pair': 'BAT_GNO',
        'maxLimit': 27004.75547533,
        'min': 12.41610939,
        'minerFee': 0.01
      },
      {
        'rate': '614.59741486',
        'limit': 42.93840538,
        'pair': 'GNO_BAT',
        'maxLimit': 42.93840538,
        'min': 0.00003125,
        'minerFee': 0.01
      },
      {
        'rate': '0.77745073',
        'limit': 27004.75547533,
        'pair': 'BAT_ZRX',
        'maxLimit': 27004.75547533,
        'min': 0.0123323,
        'minerFee': 0.005
      },
      {
        'rate': '1.22089783',
        'limit': 21615.10344113,
        'pair': 'ZRX_BAT',
        'maxLimit': 21615.10344113,
        'min': 0.01570608,
        'minerFee': 0.01
      },
      {
        'rate': '66.59701481',
        'limit': 1895.22698531,
        'pair': 'BNT_SNT',
        'maxLimit': 1895.22698531,
        'min': 0.08068966,
        'minerFee': 3
      },
      {
        'rate': '0.01330706',
        'limit': 132461.78775462,
        'pair': 'SNT_BNT',
        'maxLimit': 132461.78775462,
        'min': 1.34607407,
        'minerFee': 0.01
      },
      {
        'rate': '0.16782790',
        'limit': 1895.22698531,
        'pair': 'BNT_NMR',
        'maxLimit': 1895.22698531,
        'min': 0.04137931,
        'minerFee': 0.004
      },
      {
        'rate': '5.11810344',
        'limit': 344.40064816,
        'pair': 'NMR_BNT',
        'maxLimit': 344.40064816,
        'min': 0.00339218,
        'minerFee': 0.01
      },
      {
        'rate': '2.90362697',
        'limit': 1895.22698531,
        'pair': 'BNT_EDG',
        'maxLimit': 1895.22698531,
        'min': 0.18827586,
        'minerFee': 0.3
      },
      {
        'rate': '0.31049827',
        'limit': 5676.93376091,
        'pair': 'EDG_BNT',
        'maxLimit': 5676.93376091,
        'min': 0.05868877,
        'minerFee': 0.01
      },
      {
        'rate': '7.31339235',
        'limit': 1895.22698531,
        'pair': 'BNT_CVC',
        'maxLimit': 1895.22698531,
        'min': 0.02485517,
        'minerFee': 0.1
      },
      {
        'rate': '0.12303310',
        'limit': 14334.10006435,
        'pair': 'CVC_BNT',
        'maxLimit': 14334.10006435,
        'min': 0.14781996,
        'minerFee': 0.01
      },
      {
        'rate': '0.46383929',
        'limit': 1489.31492877,
        'pair': 'BNT_MTL',
        'maxLimit': 1489.31492877,
        'min': 0.03945655,
        'minerFee': 0.01
      },
      {
        'rate': '1.95211289',
        'limit': 902.95912056,
        'pair': 'MTL_BNT',
        'maxLimit': 902.95912056,
        'min': 0.00937523,
        'minerFee': 0.01
      },
      {
        'rate': '107.88716400',
        'limit': 1895.22698531,
        'pair': 'BNT_FUN',
        'maxLimit': 1895.22698531,
        'min': 0.00016759,
        'minerFee': 0.01
      },
      {
        'rate': '0.00829132',
        'limit': 212592.98817303,
        'pair': 'FUN_BNT',
        'maxLimit': 212592.98817303,
        'min': 2.18064,
        'minerFee': 0.01
      },
      {
        'rate': '55.04447142',
        'limit': 1895.22698531,
        'pair': 'BNT_DNT',
        'maxLimit': 1895.22698531,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.01603672',
        'limit': 109915.10047724,
        'pair': 'DNT_BNT',
        'maxLimit': 109915.10047724,
        'min': 1.11257143,
        'minerFee': 0.01
      },
      {
        'rate': '5.90709395',
        'limit': 1895.22698531,
        'pair': 'BNT_1ST',
        'maxLimit': 1895.22698531,
        'min': 0.0030731,
        'minerFee': 0.01
      },
      {
        'rate': '0.15204179',
        'limit': 11593.37908983,
        'pair': '1ST_BNT',
        'maxLimit': 11593.37908983,
        'min': 0.11939553,
        'minerFee': 0.01
      },
      {
        'rate': '0.60221021',
        'limit': 947.61349373,
        'pair': 'BNT_SALT',
        'maxLimit': 947.61349373,
        'min': 0.15078621,
        'minerFee': 0.05
      },
      {
        'rate': '1.49202951',
        'limit': 590.6981482,
        'pair': 'SALT_BNT',
        'maxLimit': 590.6981482,
        'min': 0.01217201,
        'minerFee': 0.01
      },
      {
        'rate': '11.30042713',
        'limit': 1895.22698531,
        'pair': 'BNT_XEM',
        'maxLimit': 1895.22698531,
        'min': 0.65572414,
        'minerFee': 4
      },
      {
        'rate': '0.08110487',
        'limit': 21733.31814232,
        'pair': 'XEM_BNT',
        'maxLimit': 21733.31814232,
        'min': 0.22829146,
        'minerFee': 0.01
      },
      {
        'rate': '17.48009786',
        'limit': 1895.22698531,
        'pair': 'BNT_RCN',
        'maxLimit': 1895.22698531,
        'min': 0.20689655,
        'minerFee': 2
      },
      {
        'rate': '0.05118103',
        'limit': 34440.0648162,
        'pair': 'RCN_BNT',
        'maxLimit': 34440.0648162,
        'min': 0.35331173,
        'minerFee': 0.01
      },
      {
        'rate': '1.28502000',
        'limit': 1895.22698531,
        'pair': 'BNT_NMC',
        'maxLimit': 1895.22698531,
        'min': 0.00659966,
        'minerFee': 0.005
      },
      {
        'rate': '0.65336586',
        'limit': 496.85281567,
        'pair': 'NMC_BNT',
        'maxLimit': 496.85281567,
        'min': 0.02596,
        'minerFee': 0.01
      },
      {
        'rate': '0.09009254',
        'limit': 1895.22698531,
        'pair': 'BNT_REP',
        'maxLimit': 1895.22698531,
        'min': 0.20029448,
        'minerFee': 0.01
      },
      {
        'rate': '9.91457689',
        'limit': 177.87635866,
        'pair': 'REP_BNT',
        'maxLimit': 177.87635866,
        'min': 0.00182005,
        'minerFee': 0.01
      },
      {
        'rate': '0.02203776',
        'limit': 1895.22698531,
        'pair': 'BNT_GNO',
        'maxLimit': 1895.22698531,
        'min': 0.82973862,
        'minerFee': 0.01
      },
      {
        'rate': '41.07206172',
        'limit': 42.93840538,
        'pair': 'GNO_BNT',
        'maxLimit': 42.93840538,
        'min': 0.00044521,
        'minerFee': 0.01
      },
      {
        'rate': '11.07775862',
        'limit': 1895.22698531,
        'pair': 'BNT_ZRX',
        'maxLimit': 1895.22698531,
        'min': 0.00082414,
        'minerFee': 0.005
      },
      {
        'rate': '0.08158965',
        'limit': 21615.10344113,
        'pair': 'ZRX_BNT',
        'maxLimit': 21615.10344113,
        'min': 0.2237931,
        'minerFee': 0.01
      },
      {
        'rate': '0.00240123',
        'limit': 132461.78775462,
        'pair': 'SNT_NMR',
        'maxLimit': 132461.78775462,
        'min': 2.96296296,
        'minerFee': 0.004
      },
      {
        'rate': '366.48148148',
        'limit': 344.40064816,
        'pair': 'NMR_SNT',
        'maxLimit': 344.40064816,
        'min': 0.0145603,
        'minerFee': 3
      },
      {
        'rate': '0.04154429',
        'limit': 132461.78775462,
        'pair': 'SNT_EDG',
        'maxLimit': 132461.78775462,
        'min': 13.48148148,
        'minerFee': 0.3
      },
      {
        'rate': '22.23320987',
        'limit': 5676.93376091,
        'pair': 'EDG_SNT',
        'maxLimit': 5676.93376091,
        'min': 0.25191086,
        'minerFee': 3
      },
      {
        'rate': '0.10463801',
        'limit': 132461.78775462,
        'pair': 'SNT_CVC',
        'maxLimit': 132461.78775462,
        'min': 1.77975309,
        'minerFee': 0.1
      },
      {
        'rate': '8.80977777',
        'limit': 14334.10006435,
        'pair': 'CVC_SNT',
        'maxLimit': 14334.10006435,
        'min': 0.63449024,
        'minerFee': 3
      },
      {
        'rate': '0.00663648',
        'limit': 104091.65725262,
        'pair': 'SNT_MTL',
        'maxLimit': 104091.65725262,
        'min': 2.82528395,
        'minerFee': 0.01
      },
      {
        'rate': '139.78092345',
        'limit': 902.95912056,
        'pair': 'MTL_SNT',
        'maxLimit': 902.95912056,
        'min': 0.04024145,
        'minerFee': 3
      },
      {
        'rate': '1.54362000',
        'limit': 132461.78775462,
        'pair': 'SNT_FUN',
        'maxLimit': 132461.78775462,
        'min': 0.012,
        'minerFee': 0.01
      },
      {
        'rate': '0.59370000',
        'limit': 212592.98817303,
        'pair': 'FUN_SNT',
        'maxLimit': 212592.98817303,
        'min': 9.36,
        'minerFee': 3
      },
      {
        'rate': '0.78756122',
        'limit': 132461.78775462,
        'pair': 'SNT_DNT',
        'maxLimit': 132461.78775462,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '1.14830864',
        'limit': 109915.10047724,
        'pair': 'DNT_SNT',
        'maxLimit': 109915.10047724,
        'min': 4.7755102,
        'minerFee': 3
      },
      {
        'rate': '0.08451708',
        'limit': 132461.78775462,
        'pair': 'SNT_1ST',
        'maxLimit': 132461.78775462,
        'min': 0.22004938,
        'minerFee': 0.01
      },
      {
        'rate': '10.88694320',
        'limit': 11593.37908983,
        'pair': '1ST_SNT',
        'maxLimit': 11593.37908983,
        'min': 0.51248357,
        'minerFee': 3
      },
      {
        'rate': '0.00861625',
        'limit': 66230.89387731,
        'pair': 'SNT_SALT',
        'maxLimit': 66230.89387731,
        'min': 10.79703704,
        'minerFee': 0.05
      },
      {
        'rate': '106.83668148',
        'limit': 590.6981482,
        'pair': 'SALT_SNT',
        'maxLimit': 590.6981482,
        'min': 0.05224614,
        'minerFee': 3
      },
      {
        'rate': '0.16168341',
        'limit': 132461.78775462,
        'pair': 'SNT_XEM',
        'maxLimit': 132461.78775462,
        'min': 46.95308642,
        'minerFee': 4
      },
      {
        'rate': '5.80750987',
        'limit': 21733.31814232,
        'pair': 'XEM_SNT',
        'maxLimit': 21733.31814232,
        'min': 0.9798995,
        'minerFee': 3
      },
      {
        'rate': '0.25010045',
        'limit': 132461.78775462,
        'pair': 'SNT_RCN',
        'maxLimit': 132461.78775462,
        'min': 14.81481481,
        'minerFee': 2
      },
      {
        'rate': '3.66481481',
        'limit': 34440.0648162,
        'pair': 'RCN_SNT',
        'maxLimit': 34440.0648162,
        'min': 1.51652625,
        'minerFee': 3
      },
      {
        'rate': '0.01838571',
        'limit': 132461.78775462,
        'pair': 'SNT_NMC',
        'maxLimit': 132461.78775462,
        'min': 0.4725679,
        'minerFee': 0.005
      },
      {
        'rate': '46.78422222',
        'limit': 496.85281567,
        'pair': 'NMC_SNT',
        'maxLimit': 496.85281567,
        'min': 0.11142857,
        'minerFee': 3
      },
      {
        'rate': '0.00128901',
        'limit': 132461.78775462,
        'pair': 'SNT_REP',
        'maxLimit': 132461.78775462,
        'min': 14.34207407,
        'minerFee': 0.01
      },
      {
        'rate': '709.93266666',
        'limit': 177.87635866,
        'pair': 'REP_SNT',
        'maxLimit': 177.87635866,
        'min': 0.00781224,
        'minerFee': 3
      },
      {
        'rate': '0.00031531',
        'limit': 132461.78775462,
        'pair': 'SNT_GNO',
        'maxLimit': 132461.78775462,
        'min': 59.41338272,
        'minerFee': 0.01
      },
      {
        'rate': '2940.96244444',
        'limit': 42.93840538,
        'pair': 'GNO_SNT',
        'maxLimit': 42.93840538,
        'min': 0.00191097,
        'minerFee': 3
      },
      {
        'rate': '0.15849753',
        'limit': 132461.78775462,
        'pair': 'SNT_ZRX',
        'maxLimit': 132461.78775462,
        'min': 0.05901235,
        'minerFee': 0.005
      },
      {
        'rate': '5.84222222',
        'limit': 21615.10344113,
        'pair': 'ZRX_SNT',
        'maxLimit': 21615.10344113,
        'min': 0.96059113,
        'minerFee': 3
      },
      {
        'rate': '15.97857681',
        'limit': 344.40064816,
        'pair': 'NMR_EDG',
        'maxLimit': 344.40064816,
        'min': 0.03397403,
        'minerFee': 0.3
      },
      {
        'rate': '0.05602883',
        'limit': 5676.93376091,
        'pair': 'EDG_NMR',
        'maxLimit': 5676.93376091,
        'min': 0.12918506,
        'minerFee': 0.004
      },
      {
        'rate': '40.24539045',
        'limit': 344.40064816,
        'pair': 'NMR_CVC',
        'maxLimit': 344.40064816,
        'min': 0.00448507,
        'minerFee': 0.1
      },
      {
        'rate': '0.02220109',
        'limit': 14334.10006435,
        'pair': 'CVC_NMR',
        'maxLimit': 14334.10006435,
        'min': 0.32537961,
        'minerFee': 0.004
      },
      {
        'rate': '2.55249445',
        'limit': 270.63830886,
        'pair': 'NMR_MTL',
        'maxLimit': 270.63830886,
        'min': 0.00711986,
        'minerFee': 0.01
      },
      {
        'rate': '0.35225512',
        'limit': 902.95912056,
        'pair': 'MTL_NMR',
        'maxLimit': 902.95912056,
        'min': 0.02063664,
        'minerFee': 0.004
      },
      {
        'rate': '593.69999999',
        'limit': 344.40064816,
        'pair': 'NMR_FUN',
        'maxLimit': 344.40064816,
        'min': 0.00003024,
        'minerFee': 0.01
      },
      {
        'rate': '0.00149615',
        'limit': 212592.98817303,
        'pair': 'FUN_NMR',
        'maxLimit': 212592.98817303,
        'min': 4.8,
        'minerFee': 0.004
      },
      {
        'rate': '302.90816326',
        'limit': 344.40064816,
        'pair': 'NMR_DNT',
        'maxLimit': 344.40064816,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00289379',
        'limit': 109915.10047724,
        'pair': 'DNT_NMR',
        'maxLimit': 109915.10047724,
        'min': 2.44897959,
        'minerFee': 0.004
      },
      {
        'rate': '32.50657030',
        'limit': 344.40064816,
        'pair': 'NMR_1ST',
        'maxLimit': 344.40064816,
        'min': 0.00055454,
        'minerFee': 0.01
      },
      {
        'rate': '0.02743565',
        'limit': 11593.37908983,
        'pair': '1ST_NMR',
        'maxLimit': 11593.37908983,
        'min': 0.26281209,
        'minerFee': 0.004
      },
      {
        'rate': '3.31394569',
        'limit': 172.20032408,
        'pair': 'NMR_SALT',
        'maxLimit': 172.20032408,
        'min': 0.02720909,
        'minerFee': 0.05
      },
      {
        'rate': '0.26923394',
        'limit': 590.6981482,
        'pair': 'SALT_NMR',
        'maxLimit': 590.6981482,
        'min': 0.02679289,
        'minerFee': 0.004
      },
      {
        'rate': '62.18592964',
        'limit': 344.40064816,
        'pair': 'NMR_XEM',
        'maxLimit': 344.40064816,
        'min': 0.1183242,
        'minerFee': 4
      },
      {
        'rate': '0.01463522',
        'limit': 21733.31814232,
        'pair': 'XEM_NMR',
        'maxLimit': 21733.31814232,
        'min': 0.50251256,
        'minerFee': 0.004
      },
      {
        'rate': '96.19248217',
        'limit': 344.40064816,
        'pair': 'NMR_RCN',
        'maxLimit': 344.40064816,
        'min': 0.0373341,
        'minerFee': 2
      },
      {
        'rate': '0.00923552',
        'limit': 34440.0648162,
        'pair': 'RCN_NMR',
        'maxLimit': 34440.0648162,
        'min': 0.77770577,
        'minerFee': 0.004
      },
      {
        'rate': '7.07142857',
        'limit': 344.40064816,
        'pair': 'NMR_NMC',
        'maxLimit': 344.40064816,
        'min': 0.0011909,
        'minerFee': 0.005
      },
      {
        'rate': '0.11789865',
        'limit': 496.85281567,
        'pair': 'NMC_NMR',
        'maxLimit': 496.85281567,
        'min': 0.05714286,
        'minerFee': 0.004
      },
      {
        'rate': '0.49577671',
        'limit': 344.40064816,
        'pair': 'NMR_REP',
        'maxLimit': 344.40064816,
        'min': 0.03614277,
        'minerFee': 0.01
      },
      {
        'rate': '1.78906689',
        'limit': 177.87635866,
        'pair': 'REP_NMR',
        'maxLimit': 177.87635866,
        'min': 0.00400628,
        'minerFee': 0.004
      },
      {
        'rate': '0.12127319',
        'limit': 344.40064816,
        'pair': 'NMR_GNO',
        'maxLimit': 344.40064816,
        'min': 0.14972479,
        'minerFee': 0.01
      },
      {
        'rate': '7.41137688',
        'limit': 42.93840538,
        'pair': 'GNO_NMR',
        'maxLimit': 42.93840538,
        'min': 0.00097999,
        'minerFee': 0.004
      },
      {
        'rate': '60.96059113',
        'limit': 344.40064816,
        'pair': 'NMR_ZRX',
        'maxLimit': 344.40064816,
        'min': 0.00014871,
        'minerFee': 0.005
      },
      {
        'rate': '0.01472270',
        'limit': 21615.10344113,
        'pair': 'ZRX_NMR',
        'maxLimit': 21615.10344113,
        'min': 0.49261084,
        'minerFee': 0.004
      },
      {
        'rate': '2.44155368',
        'limit': 5676.93376091,
        'pair': 'EDG_CVC',
        'maxLimit': 5676.93376091,
        'min': 0.07759716,
        'minerFee': 0.1
      },
      {
        'rate': '0.38410593',
        'limit': 14334.10006435,
        'pair': 'CVC_EDG',
        'maxLimit': 14334.10006435,
        'min': 1.48047722,
        'minerFee': 0.3
      },
      {
        'rate': '0.15485133',
        'limit': 4461.07102511,
        'pair': 'EDG_MTL',
        'maxLimit': 4461.07102511,
        'min': 0.12318226,
        'minerFee': 0.01
      },
      {
        'rate': '6.09444224',
        'limit': 902.95912056,
        'pair': 'MTL_EDG',
        'maxLimit': 902.95912056,
        'min': 0.09389671,
        'minerFee': 0.3
      },
      {
        'rate': '36.01780000',
        'limit': 5676.93376091,
        'pair': 'EDG_FUN',
        'maxLimit': 5676.93376091,
        'min': 0.0005232,
        'minerFee': 0.01
      },
      {
        'rate': '0.02588529',
        'limit': 212592.98817303,
        'pair': 'FUN_EDG',
        'maxLimit': 212592.98817303,
        'min': 21.84,
        'minerFee': 0.3
      },
      {
        'rate': '18.37642857',
        'limit': 5676.93376091,
        'pair': 'EDG_DNT',
        'maxLimit': 5676.93376091,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.05006620',
        'limit': 109915.10047724,
        'pair': 'DNT_EDG',
        'maxLimit': 109915.10047724,
        'min': 11.14285714,
        'minerFee': 0.3
      },
      {
        'rate': '1.97206526',
        'limit': 5676.93376091,
        'pair': 'EDG_1ST',
        'maxLimit': 5676.93376091,
        'min': 0.00959414,
        'minerFee': 0.01
      },
      {
        'rate': '0.47467025',
        'limit': 11593.37908983,
        'pair': '1ST_EDG',
        'maxLimit': 11593.37908983,
        'min': 1.19579501,
        'minerFee': 0.3
      },
      {
        'rate': '0.20104603',
        'limit': 2838.46688046,
        'pair': 'EDG_SALT',
        'maxLimit': 2838.46688046,
        'min': 0.47075035,
        'minerFee': 0.05
      },
      {
        'rate': '4.65807471',
        'limit': 590.6981482,
        'pair': 'SALT_EDG',
        'maxLimit': 590.6981482,
        'min': 0.12190765,
        'minerFee': 0.3
      },
      {
        'rate': '3.77261306',
        'limit': 5676.93376091,
        'pair': 'EDG_XEM',
        'maxLimit': 5676.93376091,
        'min': 2.04715255,
        'minerFee': 4
      },
      {
        'rate': '0.25320718',
        'limit': 21733.31814232,
        'pair': 'XEM_EDG',
        'maxLimit': 21733.31814232,
        'min': 2.28643216,
        'minerFee': 0.3
      },
      {
        'rate': '5.83567725',
        'limit': 5676.93376091,
        'pair': 'EDG_RCN',
        'maxLimit': 5676.93376091,
        'min': 0.64592529,
        'minerFee': 2
      },
      {
        'rate': '0.15978576',
        'limit': 34440.0648162,
        'pair': 'RCN_EDG',
        'maxLimit': 34440.0648162,
        'min': 3.53856124,
        'minerFee': 0.3
      },
      {
        'rate': '0.42899999',
        'limit': 5676.93376091,
        'pair': 'EDG_NMC',
        'maxLimit': 5676.93376091,
        'min': 0.02060394,
        'minerFee': 0.005
      },
      {
        'rate': '2.03979007',
        'limit': 496.85281567,
        'pair': 'NMC_EDG',
        'maxLimit': 496.85281567,
        'min': 0.26,
        'minerFee': 0.3
      },
      {
        'rate': '0.03007712',
        'limit': 5676.93376091,
        'pair': 'EDG_REP',
        'maxLimit': 5676.93376091,
        'min': 0.62531381,
        'minerFee': 0.01
      },
      {
        'rate': '30.95303369',
        'limit': 177.87635866,
        'pair': 'REP_EDG',
        'maxLimit': 177.87635866,
        'min': 0.01822856,
        'minerFee': 0.3
      },
      {
        'rate': '0.00735724',
        'limit': 5676.93376091,
        'pair': 'EDG_GNO',
        'maxLimit': 5676.93376091,
        'min': 2.59042093,
        'minerFee': 0.01
      },
      {
        'rate': '128.22583593',
        'limit': 42.93840538,
        'pair': 'GNO_EDG',
        'maxLimit': 42.93840538,
        'min': 0.00445893,
        'minerFee': 0.3
      },
      {
        'rate': '3.69827586',
        'limit': 5676.93376091,
        'pair': 'EDG_ZRX',
        'maxLimit': 5676.93376091,
        'min': 0.00257294,
        'minerFee': 0.005
      },
      {
        'rate': '0.25472063',
        'limit': 21615.10344113,
        'pair': 'ZRX_EDG',
        'maxLimit': 21615.10344113,
        'min': 2.24137931,
        'minerFee': 0.3
      },
      {
        'rate': '0.06135892',
        'limit': 11264.0805573,
        'pair': 'CVC_MTL',
        'maxLimit': 11264.0805573,
        'min': 0.3102603,
        'minerFee': 0.01
      },
      {
        'rate': '15.35012852',
        'limit': 902.95912056,
        'pair': 'MTL_CVC',
        'maxLimit': 902.95912056,
        'min': 0.01239574,
        'minerFee': 0.1
      },
      {
        'rate': '14.27184000',
        'limit': 14334.10006435,
        'pair': 'CVC_FUN',
        'maxLimit': 14334.10006435,
        'min': 0.00131779,
        'minerFee': 0.01
      },
      {
        'rate': '0.06519753',
        'limit': 212592.98817303,
        'pair': 'FUN_CVC',
        'maxLimit': 212592.98817303,
        'min': 2.8832,
        'minerFee': 0.1
      },
      {
        'rate': '7.28155102',
        'limit': 14334.10006435,
        'pair': 'CVC_DNT',
        'maxLimit': 14334.10006435,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.12610222',
        'limit': 109915.10047724,
        'pair': 'DNT_CVC',
        'maxLimit': 109915.10047724,
        'min': 1.47102041,
        'minerFee': 0.1
      },
      {
        'rate': '0.78141918',
        'limit': 14334.10006435,
        'pair': 'CVC_1ST',
        'maxLimit': 14334.10006435,
        'min': 0.02416486,
        'minerFee': 0.01
      },
      {
        'rate': '1.19555639',
        'limit': 11593.37908983,
        'pair': '1ST_CVC',
        'maxLimit': 11593.37908983,
        'min': 0.15786246,
        'minerFee': 0.1
      },
      {
        'rate': '0.07966330',
        'limit': 7167.05011436,
        'pair': 'CVC_SALT',
        'maxLimit': 7167.05011436,
        'min': 1.1856833,
        'minerFee': 0.05
      },
      {
        'rate': '11.73233622',
        'limit': 590.6981482,
        'pair': 'SALT_CVC',
        'maxLimit': 590.6981482,
        'min': 0.0160936,
        'minerFee': 0.1
      },
      {
        'rate': '1.49487520',
        'limit': 14334.10006435,
        'pair': 'CVC_XEM',
        'maxLimit': 14334.10006435,
        'min': 5.15618221,
        'minerFee': 4
      },
      {
        'rate': '0.63775528',
        'limit': 21733.31814232,
        'pair': 'XEM_CVC',
        'maxLimit': 21733.31814232,
        'min': 0.30184255,
        'minerFee': 0.1
      },
      {
        'rate': '2.31235255',
        'limit': 14334.10006435,
        'pair': 'CVC_RCN',
        'maxLimit': 14334.10006435,
        'min': 1.62689805,
        'minerFee': 2
      },
      {
        'rate': '0.40245390',
        'limit': 34440.0648162,
        'pair': 'RCN_CVC',
        'maxLimit': 34440.0648162,
        'min': 0.46714193,
        'minerFee': 0.1
      },
      {
        'rate': '0.16998866',
        'limit': 14334.10006435,
        'pair': 'CVC_NMC',
        'maxLimit': 14334.10006435,
        'min': 0.05189534,
        'minerFee': 0.005
      },
      {
        'rate': '5.13763828',
        'limit': 496.85281567,
        'pair': 'NMC_CVC',
        'maxLimit': 496.85281567,
        'min': 0.03432381,
        'minerFee': 0.1
      },
      {
        'rate': '0.01191787',
        'limit': 14334.10006435,
        'pair': 'CVC_REP',
        'maxLimit': 14334.10006435,
        'min': 1.57498373,
        'minerFee': 0.01
      },
      {
        'rate': '77.96169468',
        'limit': 177.87635866,
        'pair': 'REP_CVC',
        'maxLimit': 177.87635866,
        'min': 0.00240644,
        'minerFee': 0.1
      },
      {
        'rate': '0.00291526',
        'limit': 14334.10006435,
        'pair': 'CVC_GNO',
        'maxLimit': 14334.10006435,
        'min': 6.52451735,
        'minerFee': 0.01
      },
      {
        'rate': '322.96360900',
        'limit': 42.93840538,
        'pair': 'GNO_CVC',
        'maxLimit': 42.93840538,
        'min': 0.00058864,
        'minerFee': 0.1
      },
      {
        'rate': '1.46541954',
        'limit': 14334.10006435,
        'pair': 'CVC_ZRX',
        'maxLimit': 14334.10006435,
        'min': 0.00648048,
        'minerFee': 0.005
      },
      {
        'rate': '0.64156724',
        'limit': 21615.10344113,
        'pair': 'ZRX_CVC',
        'maxLimit': 21615.10344113,
        'min': 0.29589491,
        'minerFee': 0.1
      },
      {
        'rate': '226.44509599',
        'limit': 902.95912056,
        'pair': 'MTL_FUN',
        'maxLimit': 902.95912056,
        'min': 0.00008358,
        'minerFee': 0.01
      },
      {
        'rate': '0.00413504',
        'limit': 167060.68447951,
        'pair': 'FUN_MTL',
        'maxLimit': 167060.68447951,
        'min': 4.57696,
        'minerFee': 0.01
      },
      {
        'rate': '115.53321224',
        'limit': 902.95912056,
        'pair': 'MTL_DNT',
        'maxLimit': 902.95912056,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00799781',
        'limit': 86373.92835856,
        'pair': 'DNT_MTL',
        'maxLimit': 86373.92835856,
        'min': 2.33518367,
        'minerFee': 0.01
      },
      {
        'rate': '12.39843933',
        'limit': 902.95912056,
        'pair': 'MTL_1ST',
        'maxLimit': 902.95912056,
        'min': 0.00153261,
        'minerFee': 0.01
      },
      {
        'rate': '0.07582610',
        'limit': 9110.35599832,
        'pair': '1ST_MTL',
        'maxLimit': 9110.35599832,
        'min': 0.25060009,
        'minerFee': 0.01
      },
      {
        'rate': '1.26398307',
        'limit': 451.47956044,
        'pair': 'MTL_SALT',
        'maxLimit': 451.47956044,
        'min': 0.07519992,
        'minerFee': 0.05
      },
      {
        'rate': '0.74410318',
        'limit': 590.6981482,
        'pair': 'SALT_MTL',
        'maxLimit': 590.6981482,
        'min': 0.02554791,
        'minerFee': 0.01
      },
      {
        'rate': '23.71854271',
        'limit': 902.95912056,
        'pair': 'MTL_XEM',
        'maxLimit': 902.95912056,
        'min': 0.32702196,
        'minerFee': 4
      },
      {
        'rate': '0.04044852',
        'limit': 17078.56387401,
        'pair': 'XEM_MTL',
        'maxLimit': 17078.56387401,
        'min': 0.47916248,
        'minerFee': 0.01
      },
      {
        'rate': '36.68909526',
        'limit': 902.95912056,
        'pair': 'MTL_RCN',
        'maxLimit': 902.95912056,
        'min': 0.1031832,
        'minerFee': 2
      },
      {
        'rate': '0.02552494',
        'limit': 27063.83088568,
        'pair': 'RCN_MTL',
        'maxLimit': 27063.83088568,
        'min': 0.74156837,
        'minerFee': 0.01
      },
      {
        'rate': '2.69713714',
        'limit': 902.95912056,
        'pair': 'MTL_NMC',
        'maxLimit': 902.95912056,
        'min': 0.00329137,
        'minerFee': 0.005
      },
      {
        'rate': '0.32584584',
        'limit': 496.85281567,
        'pair': 'NMC_MTL',
        'maxLimit': 496.85281567,
        'min': 0.05448762,
        'minerFee': 0.01
      },
      {
        'rate': '0.18909585',
        'limit': 902.95912056,
        'pair': 'MTL_REP',
        'maxLimit': 902.95912056,
        'min': 0.09989063,
        'minerFee': 0.01
      },
      {
        'rate': '4.94458597',
        'limit': 139.77951888,
        'pair': 'REP_MTL',
        'maxLimit': 139.77951888,
        'min': 0.00382012,
        'minerFee': 0.01
      },
      {
        'rate': '0.04625521',
        'limit': 902.95912056,
        'pair': 'MTL_GNO',
        'maxLimit': 902.95912056,
        'min': 0.41380626,
        'minerFee': 0.01
      },
      {
        'rate': '20.48340968',
        'limit': 33.74203121,
        'pair': 'GNO_MTL',
        'maxLimit': 33.74203121,
        'min': 0.00093445,
        'minerFee': 0.01
      },
      {
        'rate': '23.25118226',
        'limit': 902.95912056,
        'pair': 'MTL_ZRX',
        'maxLimit': 902.95912056,
        'min': 0.00041101,
        'minerFee': 0.005
      },
      {
        'rate': '0.04069029',
        'limit': 16985.66791988,
        'pair': 'ZRX_MTL',
        'maxLimit': 16985.66791988,
        'min': 0.46972085,
        'minerFee': 0.01
      },
      {
        'rate': '0.49071122',
        'limit': 212592.98817303,
        'pair': 'FUN_DNT',
        'maxLimit': 212592.98817303,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '1.86025999',
        'limit': 109915.10047724,
        'pair': 'DNT_FUN',
        'maxLimit': 109915.10047724,
        'min': 0.00991837,
        'minerFee': 0.01
      },
      {
        'rate': '0.05266064',
        'limit': 212592.98817303,
        'pair': 'FUN_1ST',
        'maxLimit': 212592.98817303,
        'min': 0.35648,
        'minerFee': 0.01
      },
      {
        'rate': '17.63684799',
        'limit': 11593.37908983,
        'pair': '1ST_FUN',
        'maxLimit': 11593.37908983,
        'min': 0.00106439,
        'minerFee': 0.01
      },
      {
        'rate': '0.00536859',
        'limit': 106296.4963463,
        'pair': 'FUN_SALT',
        'maxLimit': 106296.4963463,
        'min': 17.4912,
        'minerFee': 0.05
      },
      {
        'rate': '173.07542400',
        'limit': 590.6981482,
        'pair': 'SALT_FUN',
        'maxLimit': 590.6981482,
        'min': 0.00010851,
        'minerFee': 0.01
      },
      {
        'rate': '0.10074120',
        'limit': 212592.98817303,
        'pair': 'FUN_XEM',
        'maxLimit': 212592.98817303,
        'min': 76.064,
        'minerFee': 4
      },
      {
        'rate': '9.40816600',
        'limit': 21733.31814232,
        'pair': 'XEM_FUN',
        'maxLimit': 21733.31814232,
        'min': 0.00203518,
        'minerFee': 0.01
      },
      {
        'rate': '0.15583182',
        'limit': 212592.98817303,
        'pair': 'FUN_RCN',
        'maxLimit': 212592.98817303,
        'min': 24,
        'minerFee': 2
      },
      {
        'rate': '5.93699999',
        'limit': 34440.0648162,
        'pair': 'RCN_FUN',
        'maxLimit': 34440.0648162,
        'min': 0.00314971,
        'minerFee': 0.01
      },
      {
        'rate': '0.01145571',
        'limit': 212592.98817303,
        'pair': 'FUN_NMC',
        'maxLimit': 212592.98817303,
        'min': 0.76556,
        'minerFee': 0.005
      },
      {
        'rate': '75.79044000',
        'limit': 496.85281567,
        'pair': 'NMC_FUN',
        'maxLimit': 496.85281567,
        'min': 0.00023143,
        'minerFee': 0.01
      },
      {
        'rate': '0.00080315',
        'limit': 212592.98817303,
        'pair': 'FUN_REP',
        'maxLimit': 212592.98817303,
        'min': 23.23416,
        'minerFee': 0.01
      },
      {
        'rate': '1150.09091999',
        'limit': 177.87635866,
        'pair': 'REP_FUN',
        'maxLimit': 177.87635866,
        'min': 0.00001623,
        'minerFee': 0.01
      },
      {
        'rate': '0.00019646',
        'limit': 212592.98817303,
        'pair': 'FUN_GNO',
        'maxLimit': 212592.98817303,
        'min': 96.24968,
        'minerFee': 0.01
      },
      {
        'rate': '4764.35915999',
        'limit': 42.93840538,
        'pair': 'GNO_FUN',
        'maxLimit': 42.93840538,
        'min': 0.00000397,
        'minerFee': 0.01
      },
      {
        'rate': '0.09875615',
        'limit': 212592.98817303,
        'pair': 'FUN_ZRX',
        'maxLimit': 212592.98817303,
        'min': 0.0956,
        'minerFee': 0.005
      },
      {
        'rate': '9.46440000',
        'limit': 21615.10344113,
        'pair': 'ZRX_FUN',
        'maxLimit': 21615.10344113,
        'min': 0.00199507,
        'minerFee': 0.01
      },
      {
        'rate': '0.10185392',
        'limit': 109915.10047724,
        'pair': 'DNT_1ST',
        'maxLimit': 109915.10047724,
        'min': 0.18187755,
        'minerFee': 0.01
      },
      {
        'rate': '8.99839183',
        'limit': 11593.37908983,
        'pair': '1ST_DNT',
        'maxLimit': 11593.37908983,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.01038369',
        'limit': 54957.55023862,
        'pair': 'DNT_SALT',
        'maxLimit': 54957.55023862,
        'min': 8.92408163,
        'minerFee': 0.05
      },
      {
        'rate': '88.30378775',
        'limit': 590.6981482,
        'pair': 'SALT_DNT',
        'maxLimit': 590.6981482,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.19484924',
        'limit': 109915.10047724,
        'pair': 'DNT_XEM',
        'maxLimit': 109915.10047724,
        'min': 38.80816327,
        'minerFee': 4
      },
      {
        'rate': '4.80008469',
        'limit': 21733.31814232,
        'pair': 'XEM_DNT',
        'maxLimit': 21733.31814232,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.30140311',
        'limit': 109915.10047724,
        'pair': 'DNT_RCN',
        'maxLimit': 109915.10047724,
        'min': 12.24489796,
        'minerFee': 2
      },
      {
        'rate': '3.02908163',
        'limit': 34440.0648162,
        'pair': 'RCN_DNT',
        'maxLimit': 34440.0648162,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.02215714',
        'limit': 109915.10047724,
        'pair': 'DNT_NMC',
        'maxLimit': 109915.10047724,
        'min': 0.39059184,
        'minerFee': 0.005
      },
      {
        'rate': '38.66859183',
        'limit': 496.85281567,
        'pair': 'NMC_DNT',
        'maxLimit': 496.85281567,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00155343',
        'limit': 109915.10047724,
        'pair': 'DNT_REP',
        'maxLimit': 109915.10047724,
        'min': 11.85416327,
        'minerFee': 0.01
      },
      {
        'rate': '586.78108163',
        'limit': 177.87635866,
        'pair': 'REP_DNT',
        'maxLimit': 177.87635866,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.00037998',
        'limit': 109915.10047724,
        'pair': 'DNT_GNO',
        'maxLimit': 109915.10047724,
        'min': 49.10697959,
        'minerFee': 0.01
      },
      {
        'rate': '2430.79548979',
        'limit': 42.93840538,
        'pair': 'GNO_DNT',
        'maxLimit': 42.93840538,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.19100985',
        'limit': 109915.10047724,
        'pair': 'DNT_ZRX',
        'maxLimit': 109915.10047724,
        'min': 0.04877551,
        'minerFee': 0.005
      },
      {
        'rate': '4.82877551',
        'limit': 21615.10344113,
        'pair': 'ZRX_DNT',
        'maxLimit': 21615.10344113,
        'min': 0,
        'minerFee': 0
      },
      {
        'rate': '0.09844628',
        'limit': 5796.68954492,
        'pair': '1ST_SALT',
        'maxLimit': 5796.68954492,
        'min': 0.95768725,
        'minerFee': 0.05
      },
      {
        'rate': '9.47631537',
        'limit': 590.6981482,
        'pair': 'SALT_1ST',
        'maxLimit': 590.6981482,
        'min': 0.00198982,
        'minerFee': 0.01
      },
      {
        'rate': '1.84733668',
        'limit': 11593.37908983,
        'pair': '1ST_XEM',
        'maxLimit': 11593.37908983,
        'min': 4.16469558,
        'minerFee': 4
      },
      {
        'rate': '0.51512078',
        'limit': 21733.31814232,
        'pair': 'XEM_1ST',
        'maxLimit': 21733.31814232,
        'min': 0.03731993,
        'minerFee': 0.01
      },
      {
        'rate': '2.85755800',
        'limit': 11593.37908983,
        'pair': '1ST_RCN',
        'maxLimit': 11593.37908983,
        'min': 1.31406045,
        'minerFee': 2
      },
      {
        'rate': '0.32506570',
        'limit': 34440.0648162,
        'pair': 'RCN_1ST',
        'maxLimit': 34440.0648162,
        'min': 0.05775762,
        'minerFee': 0.01
      },
      {
        'rate': '0.21006857',
        'limit': 11593.37908983,
        'pair': '1ST_NMC',
        'maxLimit': 11593.37908983,
        'min': 0.04191634,
        'minerFee': 0.005
      },
      {
        'rate': '4.14971747',
        'limit': 496.85281567,
        'pair': 'NMC_1ST',
        'maxLimit': 496.85281567,
        'min': 0.00424381,
        'minerFee': 0.01
      },
      {
        'rate': '0.01472787',
        'limit': 11593.37908983,
        'pair': '1ST_REP',
        'maxLimit': 11593.37908983,
        'min': 1.27212878,
        'minerFee': 0.01
      },
      {
        'rate': '62.97037450',
        'limit': 177.87635866,
        'pair': 'REP_1ST',
        'maxLimit': 177.87635866,
        'min': 0.00029753,
        'minerFee': 0.01
      },
      {
        'rate': '0.00360262',
        'limit': 11593.37908983,
        'pair': '1ST_GNO',
        'maxLimit': 11593.37908983,
        'min': 5.2699124,
        'minerFee': 0.01
      },
      {
        'rate': '260.86066360',
        'limit': 42.93840538,
        'pair': 'GNO_1ST',
        'maxLimit': 42.93840538,
        'min': 0.00007278,
        'minerFee': 0.01
      },
      {
        'rate': '1.81093596',
        'limit': 11593.37908983,
        'pair': '1ST_ZRX',
        'maxLimit': 11593.37908983,
        'min': 0.00523434,
        'minerFee': 0.005
      },
      {
        'rate': '0.51819973',
        'limit': 21615.10344113,
        'pair': 'ZRX_1ST',
        'maxLimit': 21615.10344113,
        'min': 0.03658456,
        'minerFee': 0.01
      },
      {
        'rate': '18.12844221',
        'limit': 590.6981482,
        'pair': 'SALT_XEM',
        'maxLimit': 590.6981482,
        'min': 0.42457801,
        'minerFee': 4
      },
      {
        'rate': '0.05251499',
        'limit': 10866.65907116,
        'pair': 'XEM_SALT',
        'maxLimit': 10866.65907116,
        'min': 1.83115578,
        'minerFee': 0.05
      },
      {
        'rate': '28.04203240',
        'limit': 590.6981482,
        'pair': 'SALT_RCN',
        'maxLimit': 590.6981482,
        'min': 0.13396445,
        'minerFee': 2
      },
      {
        'rate': '0.03313945',
        'limit': 17220.0324081,
        'pair': 'RCN_SALT',
        'maxLimit': 17220.0324081,
        'min': 2.83395982,
        'minerFee': 0.05
      },
      {
        'rate': '2.06146285',
        'limit': 590.6981482,
        'pair': 'SALT_NMC',
        'maxLimit': 590.6981482,
        'min': 0.00427324,
        'minerFee': 0.005
      },
      {
        'rate': '0.42305104',
        'limit': 496.85281567,
        'pair': 'NMC_SALT',
        'maxLimit': 496.85281567,
        'min': 0.20822857,
        'minerFee': 0.05
      },
      {
        'rate': '0.14452882',
        'limit': 590.6981482,
        'pair': 'SALT_REP',
        'maxLimit': 590.6981482,
        'min': 0.12968965,
        'minerFee': 0.01
      },
      {
        'rate': '6.41963762',
        'limit': 88.93817934,
        'pair': 'REP_SALT',
        'maxLimit': 88.93817934,
        'min': 0.01459887,
        'minerFee': 0.05
      },
      {
        'rate': '0.03535356',
        'limit': 590.6981482,
        'pair': 'SALT_GNO',
        'maxLimit': 590.6981482,
        'min': 0.5372515,
        'minerFee': 0.01
      },
      {
        'rate': '26.59394904',
        'limit': 21.46920269,
        'pair': 'GNO_SALT',
        'maxLimit': 21.46920269,
        'min': 0.00357107,
        'minerFee': 0.05
      },
      {
        'rate': '17.77123152',
        'limit': 590.6981482,
        'pair': 'SALT_ZRX',
        'maxLimit': 590.6981482,
        'min': 0.00053363,
        'minerFee': 0.005
      },
      {
        'rate': '0.05282888',
        'limit': 10807.55172057,
        'pair': 'ZRX_SALT',
        'maxLimit': 10807.55172057,
        'min': 1.79507389,
        'minerFee': 0.05
      },
      {
        'rate': '1.52433020',
        'limit': 21733.31814232,
        'pair': 'XEM_RCN',
        'maxLimit': 21733.31814232,
        'min': 2.51256281,
        'minerFee': 2
      },
      {
        'rate': '0.62185929',
        'limit': 34440.0648162,
        'pair': 'RCN_XEM',
        'maxLimit': 34440.0648162,
        'min': 12.32404407,
        'minerFee': 4
      },
      {
        'rate': '0.11205857',
        'limit': 21733.31814232,
        'pair': 'XEM_NMC',
        'maxLimit': 21733.31814232,
        'min': 0.08014657,
        'minerFee': 0.005
      },
      {
        'rate': '7.93851737',
        'limit': 496.85281567,
        'pair': 'NMC_XEM',
        'maxLimit': 496.85281567,
        'min': 0.90552381,
        'minerFee': 4
      },
      {
        'rate': '0.00785640',
        'limit': 21733.31814232,
        'pair': 'XEM_REP',
        'maxLimit': 21733.31814232,
        'min': 2.43238693,
        'minerFee': 0.01
      },
      {
        'rate': '120.46396293',
        'limit': 177.87635866,
        'pair': 'REP_XEM',
        'maxLimit': 177.87635866,
        'min': 0.06348613,
        'minerFee': 4
      },
      {
        'rate': '0.00192177',
        'limit': 21733.31814232,
        'pair': 'XEM_GNO',
        'maxLimit': 21733.31814232,
        'min': 10.07639028,
        'minerFee': 0.01
      },
      {
        'rate': '499.03322885',
        'limit': 42.93840538,
        'pair': 'GNO_XEM',
        'maxLimit': 42.93840538,
        'min': 0.0155295,
        'minerFee': 4
      },
      {
        'rate': '0.96602216',
        'limit': 21733.31814232,
        'pair': 'XEM_ZRX',
        'maxLimit': 21733.31814232,
        'min': 0.01000838,
        'minerFee': 0.005
      },
      {
        'rate': '0.99132956',
        'limit': 21615.10344113,
        'pair': 'ZRX_XEM',
        'maxLimit': 21615.10344113,
        'min': 7.80623974,
        'minerFee': 4
      },
      {
        'rate': '0.07071428',
        'limit': 34440.0648162,
        'pair': 'RCN_NMC',
        'maxLimit': 34440.0648162,
        'min': 0.12403759,
        'minerFee': 0.005
      },
      {
        'rate': '12.27972132',
        'limit': 496.85281567,
        'pair': 'NMC_RCN',
        'maxLimit': 496.85281567,
        'min': 0.28571429,
        'minerFee': 2
      },
      {
        'rate': '0.00495776',
        'limit': 34440.0648162,
        'pair': 'RCN_REP',
        'maxLimit': 34440.0648162,
        'min': 3.76444588,
        'minerFee': 0.01
      },
      {
        'rate': '186.34007128',
        'limit': 177.87635866,
        'pair': 'REP_RCN',
        'maxLimit': 177.87635866,
        'min': 0.02003138,
        'minerFee': 2
      },
      {
        'rate': '0.00121273',
        'limit': 34440.0648162,
        'pair': 'RCN_GNO',
        'maxLimit': 34440.0648162,
        'min': 15.59456902,
        'minerFee': 0.01
      },
      {
        'rate': '771.93116655',
        'limit': 42.93840538,
        'pair': 'GNO_RCN',
        'maxLimit': 42.93840538,
        'min': 0.00489993,
        'minerFee': 2
      },
      {
        'rate': '0.60960591',
        'limit': 34440.0648162,
        'pair': 'RCN_ZRX',
        'maxLimit': 34440.0648162,
        'min': 0.01548931,
        'minerFee': 0.005
      },
      {
        'rate': '1.53344134',
        'limit': 21615.10344113,
        'pair': 'ZRX_RCN',
        'maxLimit': 21615.10344113,
        'min': 2.46305419,
        'minerFee': 2
      },
      {
        'rate': '0.06328975',
        'limit': 496.85281567,
        'pair': 'NMC_REP',
        'maxLimit': 496.85281567,
        'min': 0.27659714,
        'minerFee': 0.01
      },
      {
        'rate': '13.69847349',
        'limit': 177.87635866,
        'pair': 'REP_NMC',
        'maxLimit': 177.87635866,
        'min': 0.00063897,
        'minerFee': 0.005
      },
      {
        'rate': '0.01548146',
        'limit': 496.85281567,
        'pair': 'NMC_GNO',
        'maxLimit': 496.85281567,
        'min': 1.14582952,
        'minerFee': 0.01
      },
      {
        'rate': '56.74720716',
        'limit': 42.93840538,
        'pair': 'GNO_NMC',
        'maxLimit': 42.93840538,
        'min': 0.0001563,
        'minerFee': 0.005
      },
      {
        'rate': '7.78209339',
        'limit': 496.85281567,
        'pair': 'NMC_ZRX',
        'maxLimit': 496.85281567,
        'min': 0.0011381,
        'minerFee': 0.005
      },
      {
        'rate': '0.11272833',
        'limit': 21615.10344113,
        'pair': 'ZRX_NMC',
        'maxLimit': 21615.10344113,
        'min': 0.07856732,
        'minerFee': 0.005
      },
      {
        'rate': '0.23492532',
        'limit': 177.87635866,
        'pair': 'REP_GNO',
        'maxLimit': 177.87635866,
        'min': 0.08033392,
        'minerFee': 0.01
      },
      {
        'rate': '3.97853754',
        'limit': 42.93840538,
        'pair': 'GNO_REP',
        'maxLimit': 42.93840538,
        'min': 0.00474357,
        'minerFee': 0.01
      },
      {
        'rate': '118.09028879',
        'limit': 177.87635866,
        'pair': 'REP_ZRX',
        'maxLimit': 177.87635866,
        'min': 0.00007979,
        'minerFee': 0.005
      },
      {
        'rate': '0.00790336',
        'limit': 21615.10344113,
        'pair': 'ZRX_REP',
        'maxLimit': 21615.10344113,
        'min': 2.38445813,
        'minerFee': 0.01
      },
      {
        'rate': '489.20006178',
        'limit': 42.93840538,
        'pair': 'GNO_ZRX',
        'maxLimit': 42.93840538,
        'min': 0.00001952,
        'minerFee': 0.005
      },
      {
        'rate': '0.00193326',
        'limit': 21615.10344113,
        'pair': 'ZRX_GNO',
        'maxLimit': 21615.10344113,
        'min': 9.87784072,
        'minerFee': 0.01
      }
    ]
  }
}

export {checkShiftTokenAvailability}
