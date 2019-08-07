// @flow

export const FLAG_LOGO_URL = 'https://developer.airbitz.co/content/country-logos'

export const EDGE_PLUGIN_REGIONS = {
  simplex: {
    countryCodes: {
      AF: true,
      AL: true,
      DZ: true,
      AS: true,
      AD: true,
      AO: true,
      AI: true,
      AQ: true,
      AG: true,
      AR: true,
      AM: true,
      AW: true,
      AU: true,
      AT: true,
      AZ: true,
      BS: true,
      BH: true,
      BD: true,
      BB: true,
      BY: true,
      BE: true,
      BZ: true,
      BJ: true,
      BM: true,
      BT: true,
      BO: true,
      BQ: true,
      BA: true,
      BW: true,
      BV: true,
      BR: true,
      IO: true,
      BN: true,
      BG: true,
      BF: true,
      BI: true,
      KH: true,
      CM: true,
      CA: true,
      CV: true,
      KY: true,
      CF: true,
      TD: true,
      CL: true,
      CN: true,
      CX: true,
      CC: true,
      CO: true,
      KM: true,
      CG: true,
      CD: true,
      CK: true,
      CR: true,
      HR: true,
      CU: true,
      CW: true,
      CY: true,
      CZ: true,
      CI: true,
      DK: true,
      DJ: true,
      DM: true,
      DO: true,
      EC: true,
      EG: true,
      SV: true,
      GQ: true,
      ER: true,
      EE: true,
      ET: true,
      FK: true,
      FO: true,
      FJ: true,
      FI: true,
      FR: true,
      GF: true,
      PF: true,
      TF: true,
      GA: true,
      GM: true,
      GE: true,
      DE: true,
      GH: true,
      GI: true,
      GR: true,
      GL: true,
      GD: true,
      GP: true,
      GU: true,
      GT: true,
      GG: true,
      GN: true,
      GW: true,
      GY: true,
      HT: true,
      HM: true,
      VA: true,
      HN: true,
      HK: true,
      HU: true,
      IS: true,
      IN: true,
      ID: true,
      IR: true,
      IQ: true,
      IE: true,
      IM: true,
      IL: true,
      IT: true,
      JM: true,
      JP: true,
      JE: true,
      JO: true,
      KZ: true,
      KE: true,
      KI: true,
      KP: true,
      KR: true,
      KW: true,
      KG: true,
      LA: true,
      LV: true,
      LB: true,
      LS: true,
      LR: true,
      LY: true,
      LI: true,
      LT: true,
      LU: true,
      MO: true,
      MK: true,
      MG: true,
      MW: true,
      MY: true,
      MV: true,
      ML: true,
      MT: true,
      MH: true,
      MQ: true,
      MR: true,
      MU: true,
      YT: true,
      MX: true,
      FM: true,
      MD: true,
      MC: true,
      MN: true,
      ME: true,
      MS: true,
      MA: true,
      MZ: true,
      MM: true,
      NA: true,
      NR: true,
      NP: true,
      NL: true,
      NC: true,
      NZ: true,
      NI: true,
      NE: true,
      NG: true,
      NU: true,
      NF: true,
      MP: true,
      NO: true,
      OM: true,
      PK: true,
      PW: true,
      PS: true,
      PA: true,
      PG: true,
      PY: true,
      PE: true,
      PH: true,
      PN: true,
      PL: true,
      PT: true,
      PR: true,
      QA: true,
      RO: true,
      RU: true,
      RW: true,
      RE: true,
      BL: true,
      SH: true,
      KN: true,
      LC: true,
      MF: true,
      PM: true,
      VC: true,
      WS: true,
      SM: true,
      ST: true,
      SA: true,
      SN: true,
      RS: true,
      SC: true,
      SL: true,
      SG: true,
      SX: true,
      SK: true,
      SI: true,
      SB: true,
      SO: true,
      ZA: true,
      GS: true,
      SS: true,
      ES: true,
      LK: true,
      SD: true,
      SR: true,
      SJ: true,
      SZ: true,
      SE: true,
      CH: true,
      SY: true,
      TW: true,
      TJ: true,
      TZ: true,
      TH: true,
      TL: true,
      TG: true,
      TK: true,
      TO: true,
      TT: true,
      TN: true,
      TR: true,
      TM: true,
      TC: true,
      TV: true,
      UG: true,
      UA: true,
      AE: true,
      GB: true,
      US: true,
      UM: true,
      UY: true,
      UZ: true,
      VU: true,
      VE: true,
      VN: true,
      VG: true,
      VI: true,
      WF: true,
      EH: true,
      YE: true,
      ZM: true,
      ZW: true
    },
    cryptoCodes: {
      BTC: true,
      BCH: true,
      ETH: true,
      LTC: true,
      XRP: true
    },
    priority: 1,
    paymentType: 'credit'
  },
  wyre: {
    countryCodes: {
      US: true
    },
    cryptoCodes: {
      BTC: true,
      ETH: true,
      DAI: true
    },
    priority: 1,
    paymentType: 'bank'
  },
  moonpay: {
    countryCodes: {
      AT: true,
      BE: true,
      BG: true,
      HR: true,
      CA: true,
      CY: true,
      CZ: true,
      DK: true,
      EE: true,
      FI: true,
      FR: true,
      DE: true,
      GR: true,
      HU: true,
      IS: true,
      IE: true,
      IT: true,
      KR: true,
      LV: true,
      LI: true,
      LT: true,
      LU: true,
      MT: true,
      MX: true,
      NL: true,
      NO: true,
      PL: true,
      PT: true,
      RO: true,
      RU: true,
      SK: true,
      SI: true,
      ES: true,
      SE: true,
      ZA: true,
      GB: true
    },
    cryptoCodes: {
      BTC: true,
      BCH: true,
      ETH: true,
      DAI: true,
      LTC: true,
      EOS: true,
      XRP: true,
      XLM: true,
      BAT: true,
      BNB: true,
      PAX: true,
      TUSD: true,
      USDC: true,
      USDT: true
    },
    priority: 1,
    paymentType: 'credit'
  },
  bitrefill: {
    countryCodes: {
      AF: true,
      AL: true,
      DZ: true,
      AS: true,
      AD: true,
      AO: true,
      AI: true,
      AQ: true,
      AG: true,
      AR: true,
      AM: true,
      AW: true,
      AU: true,
      AT: true,
      AZ: true,
      BS: true,
      BH: true,
      BD: true,
      BB: true,
      BY: true,
      BE: true,
      BZ: true,
      BJ: true,
      BM: true,
      BT: true,
      BO: true,
      BQ: true,
      BA: true,
      BW: true,
      BV: true,
      BR: true,
      IO: true,
      BN: true,
      BG: true,
      BF: true,
      BI: true,
      KH: true,
      CM: true,
      CA: true,
      CV: true,
      KY: true,
      CF: true,
      TD: true,
      CL: true,
      CN: true,
      CX: true,
      CC: true,
      CO: true,
      KM: true,
      CG: true,
      CD: true,
      CK: true,
      CR: true,
      HR: true,
      CU: true,
      CW: true,
      CY: true,
      CZ: true,
      CI: true,
      DK: true,
      DJ: true,
      DM: true,
      DO: true,
      EC: true,
      EG: true,
      SV: true,
      GQ: true,
      ER: true,
      EE: true,
      ET: true,
      FK: true,
      FO: true,
      FJ: true,
      FI: true,
      FR: true,
      GF: true,
      PF: true,
      TF: true,
      GA: true,
      GM: true,
      GE: true,
      DE: true,
      GH: true,
      GI: true,
      GR: true,
      GL: true,
      GD: true,
      GP: true,
      GU: true,
      GT: true,
      GG: true,
      GN: true,
      GW: true,
      GY: true,
      HT: true,
      HM: true,
      VA: true,
      HN: true,
      HK: true,
      HU: true,
      IS: true,
      IN: true,
      ID: true,
      IR: true,
      IQ: true,
      IE: true,
      IM: true,
      IL: true,
      IT: true,
      JM: true,
      JP: true,
      JE: true,
      JO: true,
      KZ: true,
      KE: true,
      KI: true,
      KP: true,
      KR: true,
      KW: true,
      KG: true,
      LA: true,
      LV: true,
      LB: true,
      LS: true,
      LR: true,
      LY: true,
      LI: true,
      LT: true,
      LU: true,
      MO: true,
      MK: true,
      MG: true,
      MW: true,
      MY: true,
      MV: true,
      ML: true,
      MT: true,
      MH: true,
      MQ: true,
      MR: true,
      MU: true,
      YT: true,
      MX: true,
      FM: true,
      MD: true,
      MC: true,
      MN: true,
      ME: true,
      MS: true,
      MA: true,
      MZ: true,
      MM: true,
      NA: true,
      NR: true,
      NP: true,
      NL: true,
      NC: true,
      NZ: true,
      NI: true,
      NE: true,
      NG: true,
      NU: true,
      NF: true,
      MP: true,
      NO: true,
      OM: true,
      PK: true,
      PW: true,
      PS: true,
      PA: true,
      PG: true,
      PY: true,
      PE: true,
      PH: true,
      PN: true,
      PL: true,
      PT: true,
      PR: true,
      QA: true,
      RO: true,
      RU: true,
      RW: true,
      RE: true,
      BL: true,
      SH: true,
      KN: true,
      LC: true,
      MF: true,
      PM: true,
      VC: true,
      WS: true,
      SM: true,
      ST: true,
      SA: true,
      SN: true,
      RS: true,
      SC: true,
      SL: true,
      SG: true,
      SX: true,
      SK: true,
      SI: true,
      SB: true,
      SO: true,
      ZA: true,
      GS: true,
      SS: true,
      ES: true,
      LK: true,
      SD: true,
      SR: true,
      SJ: true,
      SZ: true,
      SE: true,
      CH: true,
      SY: true,
      TW: true,
      TJ: true,
      TZ: true,
      TH: true,
      TL: true,
      TG: true,
      TK: true,
      TO: true,
      TT: true,
      TN: true,
      TR: true,
      TM: true,
      TC: true,
      TV: true,
      UG: true,
      UA: true,
      AE: true,
      GB: true,
      US: true,
      UM: true,
      UY: true,
      UZ: true,
      VU: true,
      VE: true,
      VN: true,
      VG: true,
      VI: true,
      WF: true,
      EH: true,
      YE: true,
      ZM: true,
      ZW: true
    },
    cryptoCodes: {
      BTC: true,
      DASH: true,
      ETH: true,
      LTC: true,
      DOGE: true
    },
    priority: 1,
    paymentType: 'crypto'
  },
  safello: {
    countryCodes: {
      AD: true,
      AT: true,
      BE: true,
      HR: true,
      DK: true,
      EE: true,
      FI: true,
      FR: true,
      DE: true,
      GI: true,
      GR: true,
      GG: true,
      HU: true,
      IS: true,
      IE: true,
      IM: true,
      IT: true,
      JE: true,
      LV: true,
      LI: true,
      LT: true,
      LU: true,
      MT: true,
      MC: true,
      ME: true,
      NL: true,
      NO: true,
      PL: true,
      PT: true,
      SM: true,
      SK: true,
      SI: true,
      ES: true,
      SE: true,
      CH: true,
      GB: true
    },
    cryptoCodes: {
      BTC: true,
      ETH: true
    },
    priority: 1,
    paymentType: 'credit'
  },
  libertyx: {
    countryCodes: {
      US: true
    },
    cryptoCodes: {
      BTC: true
    },
    priority: 1,
    paymentType: 'cash'
  }
}

export const COUNTRY_CODES = [
  { name: 'Afghanistan', 'alpha-2': 'AF' },
  { name: 'Åland Islands', filename: 'aland-islands', 'alpha-2': 'AX' },
  { name: 'Albania', 'alpha-2': 'AL' },
  { name: 'Algeria', 'alpha-2': 'DZ' },
  { name: 'American Samoa', 'alpha-2': 'AS' },
  { name: 'Andorra', 'alpha-2': 'AD' },
  { name: 'Angola', 'alpha-2': 'AO' },
  { name: 'Anguilla', 'alpha-2': 'AI' },
  { name: 'Antarctica', 'alpha-2': 'AQ' },
  { name: 'Antigua and Barbuda', filename: 'antigua-and-barbuda', 'alpha-2': 'AG' },
  { name: 'Argentina', 'alpha-2': 'AR' },
  { name: 'Armenia', 'alpha-2': 'AM' },
  { name: 'Aruba', 'alpha-2': 'AW' },
  { name: 'Australia', 'alpha-2': 'AU' },
  { name: 'Austria', 'alpha-2': 'AT' },
  { name: 'Azerbaijan', 'alpha-2': 'AZ' },
  { name: 'Bahamas', 'alpha-2': 'BS' },
  { name: 'Bahrain', 'alpha-2': 'BH' },
  { name: 'Bangladesh', 'alpha-2': 'BD' },
  { name: 'Barbados', 'alpha-2': 'BB' },
  { name: 'Belarus', 'alpha-2': 'BY' },
  { name: 'Belgium', 'alpha-2': 'BE' },
  { name: 'Belize', 'alpha-2': 'BZ' },
  { name: 'Benin', 'alpha-2': 'BJ' },
  { name: 'Bermuda', 'alpha-2': 'BM' },
  { name: 'Bhutan', 'alpha-2': 'BT' },
  { name: 'Bolivia (Plurinational State of)', filename: 'bolivia', 'alpha-2': 'BO' },
  { name: 'Bonaire, Sint Eustatius and Saba', filename: 'bonaire', 'alpha-2': 'BQ' },
  { name: 'Bosnia and Herzegovina', filename: 'bosnia-and-herzegovina', 'alpha-2': 'BA' },
  { name: 'Botswana', 'alpha-2': 'BW' },
  { name: 'Bouvet Island', 'alpha-2': 'BV' },
  { name: 'Brazil', 'alpha-2': 'BR' },
  { name: 'British Indian Ocean Territory', filename: 'british-indian-ocean-territory', 'alpha-2': 'IO' },
  { name: 'Brunei Darussalam', filename: 'brunei', 'alpha-2': 'BN' },
  { name: 'Bulgaria', 'alpha-2': 'BG' },
  { name: 'Burkina Faso', 'alpha-2': 'BF' },
  { name: 'Burundi', 'alpha-2': 'BI' },
  { name: 'Cabo Verde', filename: 'cape-verde', 'alpha-2': 'CV' },
  { name: 'Cambodia', 'alpha-2': 'KH' },
  { name: 'Cameroon', 'alpha-2': 'CM' },
  { name: 'Canada', 'alpha-2': 'CA' },
  { name: 'Cayman Islands', 'alpha-2': 'KY' },
  { name: 'Central African Republic', filename: 'central-african-republic', 'alpha-2': 'CF' },
  { name: 'Chad', 'alpha-2': 'TD' },
  { name: 'Chile', 'alpha-2': 'CL' },
  { name: 'China', 'alpha-2': 'CN' },
  { name: 'Christmas Island', 'alpha-2': 'CX' },
  { name: 'Cocos (Keeling) Islands', filename: 'cocos-island', 'alpha-2': 'CC' },
  { name: 'Colombia', 'alpha-2': 'CO' },
  { name: 'Comoros', 'alpha-2': 'KM' },
  { name: 'Congo', 'alpha-2': 'CG' },
  { name: 'Congo, Democratic Republic of the', filanem: 'democratic-republic-of-congo', 'alpha-2': 'CD' },
  { name: 'Cook Islands', 'alpha-2': 'CK' },
  { name: 'Costa Rica', 'alpha-2': 'CR' },
  { name: "Côte d'Ivoire", filename: 'ivory-coast', 'alpha-2': 'CI' },
  { name: 'Croatia', 'alpha-2': 'HR' },
  { name: 'Cuba', 'alpha-2': 'CU' },
  { name: 'Curaçao', filename: 'curacao', 'alpha-2': 'CW' },
  { name: 'Cyprus', 'alpha-2': 'CY' },
  { name: 'Czechia', filename: 'czech-republic', 'alpha-2': 'CZ' },
  { name: 'Denmark', 'alpha-2': 'DK' },
  { name: 'Djibouti', 'alpha-2': 'DJ' },
  { name: 'Dominica', 'alpha-2': 'DM' },
  { name: 'Dominican Republic', 'alpha-2': 'DO' },
  { name: 'Ecuador', 'alpha-2': 'EC' },
  { name: 'Egypt', 'alpha-2': 'EG' },
  { name: 'El Salvador', filename: 'salvador', 'alpha-2': 'SV' },
  { name: 'Equatorial Guinea', 'alpha-2': 'GQ' },
  { name: 'Eritrea', 'alpha-2': 'ER' },
  { name: 'Estonia', 'alpha-2': 'EE' },
  { name: 'Eswatini', 'alpha-2': 'SZ' },
  { name: 'Ethiopia', 'alpha-2': 'ET' },
  { name: 'Falkland Islands (Malvinas)', filename: 'falkland-islands', 'alpha-2': 'FK' },
  { name: 'Faroe Islands', 'alpha-2': 'FO' },
  { name: 'Fiji', 'alpha-2': 'FJ' },
  { name: 'Finland', 'alpha-2': 'FI' },
  { name: 'France', 'alpha-2': 'FR' },
  { name: 'French Guiana', filename: 'guyana', 'alpha-2': 'GF' },
  { name: 'French Polynesia', 'alpha-2': 'PF' },
  { name: 'French Southern Territories', 'alpha-2': 'TF' },
  { name: 'Gabon', 'alpha-2': 'GA' },
  { name: 'Gambia', 'alpha-2': 'GM' },
  { name: 'Georgia', 'alpha-2': 'GE' },
  { name: 'Germany', 'alpha-2': 'DE' },
  { name: 'Ghana', 'alpha-2': 'GH' },
  { name: 'Gibraltar', 'alpha-2': 'GI' },
  { name: 'Greece', 'alpha-2': 'GR' },
  { name: 'Greenland', 'alpha-2': 'GL' },
  { name: 'Grenada', 'alpha-2': 'GD' },
  { name: 'Guadeloupe', 'alpha-2': 'GP' },
  { name: 'Guam', 'alpha-2': 'GU' },
  { name: 'Guatemala', 'alpha-2': 'GT' },
  { name: 'Guernsey', 'alpha-2': 'GG' },
  { name: 'Guinea', 'alpha-2': 'GN' },
  { name: 'Guinea-Bissau', 'alpha-2': 'GW' },
  { name: 'Guyana', 'alpha-2': 'GY' },
  { name: 'Haiti', 'alpha-2': 'HT' },
  { name: 'Heard Island and McDonald Islands', 'alpha-2': 'HM' },
  { name: 'Holy See', filename: 'vatican-city', 'alpha-2': 'VA' },
  { name: 'Honduras', 'alpha-2': 'HN' },
  { name: 'Hong Kong', 'alpha-2': 'HK' },
  { name: 'Hungary', 'alpha-2': 'HU' },
  { name: 'Iceland', 'alpha-2': 'IS' },
  { name: 'India', 'alpha-2': 'IN' },
  { name: 'Indonesia', 'alpha-2': 'ID' },
  { name: 'Iran (Islamic Republic of)', filename: 'iran', 'alpha-2': 'IR' },
  { name: 'Iraq', 'alpha-2': 'IQ' },
  { name: 'Ireland', 'alpha-2': 'IE' },
  { name: 'Isle of Man', filename: 'isle-of-man', 'alpha-2': 'IM' },
  { name: 'Israel', 'alpha-2': 'IL' },
  { name: 'Italy', 'alpha-2': 'IT' },
  { name: 'Jamaica', 'alpha-2': 'JM' },
  { name: 'Japan', 'alpha-2': 'JP' },
  { name: 'Jersey', 'alpha-2': 'JE' },
  { name: 'Jordan', 'alpha-2': 'JO' },
  { name: 'Kazakhstan', 'alpha-2': 'KZ' },
  { name: 'Kenya', 'alpha-2': 'KE' },
  { name: 'Kiribati', 'alpha-2': 'KI' },
  { name: "Korea (Democratic People's Republic of)", filename: 'north-korea', 'alpha-2': 'KP' },
  { name: 'Korea, Republic of', filename: 'south-korea', 'alpha-2': 'KR' },
  { name: 'Kuwait', 'alpha-2': 'KW' },
  { name: 'Kyrgyzstan', 'alpha-2': 'KG' },
  { name: "Lao People's Democratic Republic", filename: 'laos', 'alpha-2': 'LA' },
  { name: 'Latvia', 'alpha-2': 'LV' },
  { name: 'Lebanon', 'alpha-2': 'LB' },
  { name: 'Lesotho', 'alpha-2': 'LS' },
  { name: 'Liberia', 'alpha-2': 'LR' },
  { name: 'Libya', 'alpha-2': 'LY' },
  { name: 'Liechtenstein', 'alpha-2': 'LI' },
  { name: 'Lithuania', 'alpha-2': 'LT' },
  { name: 'Luxembourg', 'alpha-2': 'LU' },
  { name: 'Macao', 'alpha-2': 'MO' },
  { name: 'Madagascar', 'alpha-2': 'MG' },
  { name: 'Malawi', 'alpha-2': 'MW' },
  { name: 'Malaysia', 'alpha-2': 'MY' },
  { name: 'Maldives', 'alpha-2': 'MV' },
  { name: 'Mali', 'alpha-2': 'ML' },
  { name: 'Malta', 'alpha-2': 'MT' },
  { name: 'Marshall Islands', filename: 'marshall-island', 'alpha-2': 'MH' },
  { name: 'Martinique', 'alpha-2': 'MQ' },
  { name: 'Mauritania', 'alpha-2': 'MR' },
  { name: 'Mauritius', 'alpha-2': 'MU' },
  { name: 'Mayotte', 'alpha-2': 'YT' },
  { name: 'Mexico', 'alpha-2': 'MX' },
  { name: 'Micronesia (Federated States of)', filename: 'micronesia', 'alpha-2': 'FM' },
  { name: 'Moldova, Republic of', filename: 'moldova', 'alpha-2': 'MD' },
  { name: 'Monaco', 'alpha-2': 'MC' },
  { name: 'Mongolia', 'alpha-2': 'MN' },
  { name: 'Montenegro', 'alpha-2': 'ME' },
  { name: 'Montserrat', 'alpha-2': 'MS' },
  { name: 'Morocco', 'alpha-2': 'MA' },
  { name: 'Mozambique', 'alpha-2': 'MZ' },
  { name: 'Myanmar', 'alpha-2': 'MM' },
  { name: 'Namibia', 'alpha-2': 'NA' },
  { name: 'Nauru', 'alpha-2': 'NR' },
  { name: 'Nepal', 'alpha-2': 'NP' },
  { name: 'Netherlands', 'alpha-2': 'NL' },
  { name: 'New Caledonia', 'alpha-2': 'NC' },
  { name: 'New Zealand', 'alpha-2': 'NZ' },
  { name: 'Nicaragua', 'alpha-2': 'NI' },
  { name: 'Niger', 'alpha-2': 'NE' },
  { name: 'Nigeria', 'alpha-2': 'NG' },
  { name: 'Niue', 'alpha-2': 'NU' },
  { name: 'Norfolk Island', 'alpha-2': 'NF' },
  { name: 'North Macedonia', 'alpha-2': 'MK' },
  { name: 'Northern Mariana Islands', filename: 'northern-marianas-islands', 'alpha-2': 'MP' },
  { name: 'Norway', 'alpha-2': 'NO' },
  { name: 'Oman', 'alpha-2': 'OM' },
  { name: 'Pakistan', 'alpha-2': 'PK' },
  { name: 'Palau', 'alpha-2': 'PW' },
  { name: 'Palestine, State of', filename: 'palestine', 'alpha-2': 'PS' },
  { name: 'Panama', 'alpha-2': 'PA' },
  { name: 'Papua New Guinea', filename: 'papua-new-guinea', 'alpha-2': 'PG' },
  { name: 'Paraguay', 'alpha-2': 'PY' },
  { name: 'Peru', 'alpha-2': 'PE' },
  { name: 'Philippines', 'alpha-2': 'PH' },
  { name: 'Pitcairn', filename: 'pitcairn-islands', 'alpha-2': 'PN' },
  { name: 'Poland', filename: 'republic-of-poland', 'alpha-2': 'PL' },
  { name: 'Portugal', 'alpha-2': 'PT' },
  { name: 'Puerto Rico', 'alpha-2': 'PR' },
  { name: 'Qatar', 'alpha-2': 'QA' },
  { name: 'Réunion', 'alpha-2': 'RE' },
  { name: 'Romania', 'alpha-2': 'RO' },
  { name: 'Russian Federation', filename: 'russia', 'alpha-2': 'RU' },
  { name: 'Rwanda', 'alpha-2': 'RW' },
  { name: 'Saint Barthélemy', 'alpha-2': 'BL' },
  { name: 'Saint Helena, Ascension and Tristan da Cunha', 'alpha-2': 'SH' },
  { name: 'Saint Kitts and Nevis', filename: 'saint-kitts-and-nevis', 'alpha-2': 'KN' },
  { name: 'Saint Lucia', filename: 'st-lucia', 'alpha-2': 'LC' },
  { name: 'Saint Martin (French part)', 'alpha-2': 'MF' },
  { name: 'Saint Pierre and Miquelon', 'alpha-2': 'PM' },
  { name: 'Saint Vincent and the Grenadines', filename: 'st-vincent-and-the-grenadines', 'alpha-2': 'VC' },
  { name: 'Samoa', 'alpha-2': 'WS' },
  { name: 'San Marino', 'alpha-2': 'SM' },
  { name: 'Sao Tome and Principe', 'alpha-2': 'ST' },
  { name: 'Saudi Arabia', 'alpha-2': 'SA' },
  { name: 'Senegal', 'alpha-2': 'SN' },
  { name: 'Serbia', 'alpha-2': 'RS' },
  { name: 'Seychelles', 'alpha-2': 'SC' },
  { name: 'Sierra Leone', 'alpha-2': 'SL' },
  { name: 'Singapore', 'alpha-2': 'SG' },
  { name: 'Sint Maarten (Dutch part)', 'alpha-2': 'SX' },
  { name: 'Slovakia', 'alpha-2': 'SK' },
  { name: 'Slovenia', 'alpha-2': 'SI' },
  { name: 'Solomon Islands', 'alpha-2': 'SB' },
  { name: 'Somalia', 'alpha-2': 'SO' },
  { name: 'South Africa', 'alpha-2': 'ZA' },
  { name: 'South Georgia and the South Sandwich Islands', 'alpha-2': 'GS' },
  { name: 'South Sudan', 'alpha-2': 'SS' },
  { name: 'Spain', 'alpha-2': 'ES' },
  { name: 'Sri Lanka', 'alpha-2': 'LK' },
  { name: 'Sudan', 'alpha-2': 'SD' },
  { name: 'Suriname', 'alpha-2': 'SR' },
  { name: 'Svalbard and Jan Mayen', 'alpha-2': 'SJ' },
  { name: 'Sweden', 'alpha-2': 'SE' },
  { name: 'Switzerland', 'alpha-2': 'CH' },
  { name: 'Syrian Arab Republic', filename: 'syria', 'alpha-2': 'SY' },
  { name: 'Taiwan, Province of China', filename: 'taiwan', 'alpha-2': 'TW' },
  { name: 'Tajikistan', 'alpha-2': 'TJ' },
  { name: 'Tanzania, United Republic of', filename: 'tanzania', 'alpha-2': 'TZ' },
  { name: 'Thailand', 'alpha-2': 'TH' },
  { name: 'Timor-Leste', filename: 'east-timor', 'alpha-2': 'TL' },
  { name: 'Togo', 'alpha-2': 'TG' },
  { name: 'Tokelau', 'alpha-2': 'TK' },
  { name: 'Tonga', 'alpha-2': 'TO' },
  { name: 'Trinidad and Tobago', filename: 'trinidad-and-tobago', 'alpha-2': 'TT' },
  { name: 'Tunisia', 'alpha-2': 'TN' },
  { name: 'Turkey', 'alpha-2': 'TR' },
  { name: 'Turkmenistan', 'alpha-2': 'TM' },
  { name: 'Turks and Caicos Islands', filename: 'turks-and-caicos', 'alpha-2': 'TC' },
  { name: 'Tuvalu', 'alpha-2': 'TV' },
  { name: 'Uganda', 'alpha-2': 'UG' },
  { name: 'Ukraine', 'alpha-2': 'UA' },
  { name: 'United Arab Emirates', filename: 'united-arab-emirates', 'alpha-2': 'AE' },
  { name: 'United Kingdom of Great Britain and Northern Ireland', filename: 'united-kingdom', 'alpha-2': 'GB' },
  { name: 'United States of America', filename: 'united-states-of-america', 'alpha-2': 'US' },
  { name: 'United States Minor Outlying Islands', 'alpha-2': 'UM' },
  { name: 'Uruguay', 'alpha-2': 'UY' },
  { name: 'Uzbekistan', filename: 'uzbekistn', 'alpha-2': 'UZ' },
  { name: 'Vanuatu', 'alpha-2': 'VU' },
  { name: 'Venezuela (Bolivarian Republic of)', filename: 'venezuela', 'alpha-2': 'VE' },
  { name: 'Viet Nam', filename: 'vietnam', 'alpha-2': 'VN' },
  { name: 'Virgin Islands (British)', filename: 'british-virgin-islands', 'alpha-2': 'VG' },
  { name: 'Virgin Islands (U.S.)', filename: 'virgin-islands', 'alpha-2': 'VI' },
  { name: 'Wallis and Futuna', 'alpha-2': 'WF' },
  { name: 'Western Sahara', 'alpha-2': 'EH' },
  { name: 'Yemen', 'alpha-2': 'YE' },
  { name: 'Zambia', 'alpha-2': 'ZM' },
  { name: 'Zimbabwe', 'alpha-2': 'ZW' }
]

// utility for recreating list from https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json
/* const modifiedCountryCodes = COUNTRY_CODES.map(country => {
  return {
    name: country.name,
    'alpha-2': country['alpha-2']
  }
})

console.log(JSON.stringify(modifiedCountryCodes)) */
