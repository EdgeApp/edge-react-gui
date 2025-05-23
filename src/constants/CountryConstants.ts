import { CountryData, StateProvinceData } from '../types/types'
import { FLAG_LOGO_URL } from './CdnConstants'

export const STATE_PROVINCE_CODES: {
  [countryCode: string]: StateProvinceData[]
} = {
  US: [
    { name: 'Alabama', 'alpha-2': 'AL' },
    { name: 'Alaska', 'alpha-2': 'AK' },
    { name: 'Arizona', 'alpha-2': 'AZ' },
    { name: 'Arkansas', 'alpha-2': 'AR' },
    { name: 'California', 'alpha-2': 'CA' },
    { name: 'Colorado', 'alpha-2': 'CO' },
    { name: 'Connecticut', 'alpha-2': 'CT' },
    { name: 'Delaware', 'alpha-2': 'DE' },
    { name: 'District of Columbia', 'alpha-2': 'DC' },
    { name: 'Florida', 'alpha-2': 'FL' },
    { name: 'Georgia', 'alpha-2': 'GA' },
    { name: 'Hawaii', 'alpha-2': 'HI' },
    { name: 'Idaho', 'alpha-2': 'ID' },
    { name: 'Illinois', 'alpha-2': 'IL' },
    { name: 'Indiana', 'alpha-2': 'IN' },
    { name: 'Iowa', 'alpha-2': 'IA' },
    { name: 'Kansas', 'alpha-2': 'KS' },
    { name: 'Kentucky', 'alpha-2': 'KY' },
    { name: 'Louisiana', 'alpha-2': 'LA' },
    { name: 'Maine', 'alpha-2': 'ME' },
    { name: 'Maryland', 'alpha-2': 'MD' },
    { name: 'Massachusetts', 'alpha-2': 'MA' },
    { name: 'Michigan', 'alpha-2': 'MI' },
    { name: 'Minnesota', 'alpha-2': 'MN' },
    { name: 'Mississippi', 'alpha-2': 'MS' },
    { name: 'Missouri', 'alpha-2': 'MO' },
    { name: 'Montana', 'alpha-2': 'MT' },
    { name: 'Nebraska', 'alpha-2': 'NE' },
    { name: 'Nevada', 'alpha-2': 'NV' },
    { name: 'New Hampshire', 'alpha-2': 'NH' },
    { name: 'New Jersey', 'alpha-2': 'NJ' },
    { name: 'New Mexico', 'alpha-2': 'NM' },
    { name: 'New York', 'alpha-2': 'NY' },
    { name: 'North Carolina', 'alpha-2': 'NC' },
    { name: 'North Dakota', 'alpha-2': 'ND' },
    { name: 'Ohio', 'alpha-2': 'OH' },
    { name: 'Oklahoma', 'alpha-2': 'OK' },
    { name: 'Oregon', 'alpha-2': 'OR' },
    { name: 'Pennsylvania', 'alpha-2': 'PA' },
    { name: 'Rhode Island', 'alpha-2': 'RI' },
    { name: 'South Carolina', 'alpha-2': 'SC' },
    { name: 'South Dakota', 'alpha-2': 'SD' },
    { name: 'Tennessee', 'alpha-2': 'TN' },
    { name: 'Texas', 'alpha-2': 'TX' },
    { name: 'Utah', 'alpha-2': 'UT' },
    { name: 'Vermont', 'alpha-2': 'VT' },
    { name: 'Virginia', 'alpha-2': 'VA' },
    { name: 'Washington', 'alpha-2': 'WA' },
    { name: 'West Virginia', 'alpha-2': 'WV' },
    { name: 'Wisconsin', 'alpha-2': 'WI' },
    { name: 'Wyoming', 'alpha-2': 'WY' }
  ]
}

export const COUNTRY_CODES: CountryData[] = [
  { name: 'Afghanistan', 'alpha-2': 'AF', 'alpha-3': 'AFG' },
  {
    name: 'Åland Islands',
    filename: 'aland-islands',
    'alpha-2': 'AX',
    'alpha-3': 'ALA'
  },
  { name: 'Albania', 'alpha-2': 'AL', 'alpha-3': 'ALB' },
  { name: 'Algeria', 'alpha-2': 'DZ', 'alpha-3': 'DZA' },
  { name: 'American Samoa', 'alpha-2': 'AS', 'alpha-3': 'ASM' },
  { name: 'Andorra', 'alpha-2': 'AD', 'alpha-3': 'AND' },
  { name: 'Angola', 'alpha-2': 'AO', 'alpha-3': 'AGO' },
  { name: 'Anguilla', 'alpha-2': 'AI', 'alpha-3': 'AIA' },
  {
    name: 'Antigua and Barbuda',
    filename: 'antigua-and-barbuda',
    'alpha-2': 'AG',
    'alpha-3': 'ATG'
  },
  { name: 'Argentina', 'alpha-2': 'AR', 'alpha-3': 'ARG' },
  { name: 'Armenia', 'alpha-2': 'AM', 'alpha-3': 'ARM' },
  { name: 'Aruba', 'alpha-2': 'AW', 'alpha-3': 'ABW' },
  { name: 'Australia', 'alpha-2': 'AU', 'alpha-3': 'AUS' },
  { name: 'Austria', 'alpha-2': 'AT', 'alpha-3': 'AUT' },
  { name: 'Azerbaijan', 'alpha-2': 'AZ', 'alpha-3': 'AZE' },
  { name: 'Bahamas', 'alpha-2': 'BS', 'alpha-3': 'BHS' },
  { name: 'Bahrain', 'alpha-2': 'BH', 'alpha-3': 'BHR' },
  { name: 'Bangladesh', 'alpha-2': 'BD', 'alpha-3': 'BGD' },
  { name: 'Barbados', 'alpha-2': 'BB', 'alpha-3': 'BRB' },
  { name: 'Belarus', 'alpha-2': 'BY', 'alpha-3': 'BLR' },
  { name: 'Belgium', 'alpha-2': 'BE', 'alpha-3': 'BEL' },
  { name: 'Belize', 'alpha-2': 'BZ', 'alpha-3': 'BLZ' },
  { name: 'Benin', 'alpha-2': 'BJ', 'alpha-3': 'BEN' },
  { name: 'Bermuda', 'alpha-2': 'BM', 'alpha-3': 'BMU' },
  { name: 'Bhutan', 'alpha-2': 'BT', 'alpha-3': 'BTN' },
  {
    name: 'Bolivia (Plurinational State of)',
    filename: 'bolivia',
    'alpha-2': 'BO',
    'alpha-3': 'BOL'
  },
  {
    name: 'Bonaire, Sint Eustatius and Saba',
    filename: 'bonaire',
    'alpha-2': 'BQ',
    'alpha-3': 'BES'
  },
  {
    name: 'Bosnia and Herzegovina',
    filename: 'bosnia-and-herzegovina',
    'alpha-2': 'BA',
    'alpha-3': 'BIH'
  },
  { name: 'Botswana', 'alpha-2': 'BW', 'alpha-3': 'BWA' },
  { name: 'Brazil', 'alpha-2': 'BR', 'alpha-3': 'BRA' },
  {
    name: 'British Indian Ocean Territory',
    filename: 'british-indian-ocean-territory',
    'alpha-2': 'IO',
    'alpha-3': 'IOT'
  },
  {
    name: 'Brunei Darussalam',
    filename: 'brunei',
    'alpha-2': 'BN',
    'alpha-3': 'BRN'
  },
  { name: 'Bulgaria', 'alpha-2': 'BG', 'alpha-3': 'BGR' },
  { name: 'Burkina Faso', 'alpha-2': 'BF', 'alpha-3': 'BFA' },
  { name: 'Burundi', 'alpha-2': 'BI', 'alpha-3': 'BDI' },
  {
    name: 'Cabo Verde',
    filename: 'cape-verde',
    'alpha-2': 'CV',
    'alpha-3': 'CPV'
  },
  { name: 'Cambodia', 'alpha-2': 'KH', 'alpha-3': 'KHM' },
  { name: 'Cameroon', 'alpha-2': 'CM', 'alpha-3': 'CMR' },
  { name: 'Canada', 'alpha-2': 'CA', 'alpha-3': 'CAN' },
  { name: 'Cayman Islands', 'alpha-2': 'KY', 'alpha-3': 'CYM' },
  {
    name: 'Central African Republic',
    filename: 'central-african-republic',
    'alpha-2': 'CF',
    'alpha-3': 'CAF'
  },
  { name: 'Chad', 'alpha-2': 'TD', 'alpha-3': 'TCD' },
  { name: 'Chile', 'alpha-2': 'CL', 'alpha-3': 'CHL' },
  { name: 'China', 'alpha-2': 'CN', 'alpha-3': 'CHN' },
  { name: 'Christmas Island', 'alpha-2': 'CX', 'alpha-3': 'CXR' },
  {
    name: 'Cocos (Keeling) Islands',
    filename: 'cocos-island',
    'alpha-2': 'CC',
    'alpha-3': 'CCK'
  },
  { name: 'Colombia', 'alpha-2': 'CO', 'alpha-3': 'COL' },
  { name: 'Comoros', 'alpha-2': 'KM', 'alpha-3': 'COM' },
  { name: 'Congo', 'alpha-2': 'CG', 'alpha-3': 'COG' },
  {
    name: 'Congo, Democratic Republic of the',
    filename: 'democratic-republic-of-congo',
    'alpha-2': 'CD',
    'alpha-3': 'COD'
  },
  { name: 'Cook Islands', 'alpha-2': 'CK', 'alpha-3': 'COK' },
  { name: 'Costa Rica', 'alpha-2': 'CR', 'alpha-3': 'CRI' },
  {
    name: "Côte d'Ivoire",
    filename: 'ivory-coast',
    'alpha-2': 'CI',
    'alpha-3': 'CIV'
  },
  { name: 'Croatia', 'alpha-2': 'HR', 'alpha-3': 'HRV' },
  { name: 'Cuba', 'alpha-2': 'CU', 'alpha-3': 'CUB' },
  { name: 'Curaçao', filename: 'curacao', 'alpha-2': 'CW', 'alpha-3': 'CUW' },
  { name: 'Cyprus', 'alpha-2': 'CY', 'alpha-3': 'CYP' },
  {
    name: 'Czechia',
    filename: 'czech-republic',
    'alpha-2': 'CZ',
    'alpha-3': 'CZE'
  },
  { name: 'Denmark', 'alpha-2': 'DK', 'alpha-3': 'DNK' },
  { name: 'Djibouti', 'alpha-2': 'DJ', 'alpha-3': 'DJI' },
  { name: 'Dominica', 'alpha-2': 'DM', 'alpha-3': 'DMA' },
  { name: 'Dominican Republic', 'alpha-2': 'DO', 'alpha-3': 'DOM' },
  { name: 'Ecuador', 'alpha-2': 'EC', 'alpha-3': 'ECU' },
  { name: 'Egypt', 'alpha-2': 'EG', 'alpha-3': 'EGY' },
  {
    name: 'El Salvador',
    filename: 'salvador',
    'alpha-2': 'SV',
    'alpha-3': 'SLV'
  },
  { name: 'Equatorial Guinea', 'alpha-2': 'GQ', 'alpha-3': 'GNQ' },
  { name: 'Eritrea', 'alpha-2': 'ER', 'alpha-3': 'ERI' },
  { name: 'Estonia', 'alpha-2': 'EE', 'alpha-3': 'EST' },
  { name: 'Eswatini', 'alpha-2': 'SZ', 'alpha-3': 'SWZ' },
  { name: 'Ethiopia', 'alpha-2': 'ET', 'alpha-3': 'ETH' },
  {
    name: 'Falkland Islands (Malvinas)',
    filename: 'falkland-islands',
    'alpha-2': 'FK',
    'alpha-3': 'FLK'
  },
  { name: 'Faroe Islands', 'alpha-2': 'FO', 'alpha-3': 'FRO' },
  { name: 'Fiji', 'alpha-2': 'FJ', 'alpha-3': 'FJI' },
  { name: 'Finland', 'alpha-2': 'FI', 'alpha-3': 'FIN' },
  { name: 'France', 'alpha-2': 'FR', 'alpha-3': 'FRA' },
  {
    name: 'French Guiana',
    filename: 'guyana',
    'alpha-2': 'GF',
    'alpha-3': 'GUF'
  },
  { name: 'French Polynesia', 'alpha-2': 'PF', 'alpha-3': 'PYF' },
  { name: 'Gabon', 'alpha-2': 'GA', 'alpha-3': 'GAB' },
  { name: 'Gambia', 'alpha-2': 'GM', 'alpha-3': 'GMB' },
  { name: 'Georgia', 'alpha-2': 'GE', 'alpha-3': 'GEO' },
  { name: 'Germany', 'alpha-2': 'DE', 'alpha-3': 'DEU' },
  { name: 'Ghana', 'alpha-2': 'GH', 'alpha-3': 'GHA' },
  { name: 'Gibraltar', 'alpha-2': 'GI', 'alpha-3': 'GIB' },
  { name: 'Greece', 'alpha-2': 'GR', 'alpha-3': 'GRC' },
  { name: 'Greenland', 'alpha-2': 'GL', 'alpha-3': 'GRL' },
  { name: 'Grenada', 'alpha-2': 'GD', 'alpha-3': 'GRD' },
  { name: 'Guam', 'alpha-2': 'GU', 'alpha-3': 'GUM' },
  { name: 'Guatemala', 'alpha-2': 'GT', 'alpha-3': 'GTM' },
  { name: 'Guernsey', 'alpha-2': 'GG', 'alpha-3': 'GGY' },
  { name: 'Guinea', 'alpha-2': 'GN', 'alpha-3': 'GIN' },
  { name: 'Guinea-Bissau', 'alpha-2': 'GW', 'alpha-3': 'GNB' },
  { name: 'Guyana', 'alpha-2': 'GY', 'alpha-3': 'GUY' },
  { name: 'Haiti', 'alpha-2': 'HT', 'alpha-3': 'HTI' },
  {
    name: 'Holy See',
    filename: 'vatican-city',
    'alpha-2': 'VA',
    'alpha-3': 'VAT'
  },
  { name: 'Honduras', 'alpha-2': 'HN', 'alpha-3': 'HND' },
  { name: 'Hong Kong', 'alpha-2': 'HK', 'alpha-3': 'HKG' },
  { name: 'Hungary', 'alpha-2': 'HU', 'alpha-3': 'HUN' },
  { name: 'Iceland', 'alpha-2': 'IS', 'alpha-3': 'ISL' },
  { name: 'India', 'alpha-2': 'IN', 'alpha-3': 'IND' },
  { name: 'Indonesia', 'alpha-2': 'ID', 'alpha-3': 'IDN' },
  {
    name: 'Iran (Islamic Republic of)',
    filename: 'iran',
    'alpha-2': 'IR',
    'alpha-3': 'IRN'
  },
  { name: 'Iraq', 'alpha-2': 'IQ', 'alpha-3': 'IRQ' },
  { name: 'Ireland', 'alpha-2': 'IE', 'alpha-3': 'IRL' },
  {
    name: 'Isle of Man',
    filename: 'isle-of-man',
    'alpha-2': 'IM',
    'alpha-3': 'IMN'
  },
  { name: 'Israel', 'alpha-2': 'IL', 'alpha-3': 'ISR' },
  { name: 'Italy', 'alpha-2': 'IT', 'alpha-3': 'ITA' },
  { name: 'Jamaica', 'alpha-2': 'JM', 'alpha-3': 'JAM' },
  { name: 'Japan', 'alpha-2': 'JP', 'alpha-3': 'JPN' },
  { name: 'Jersey', 'alpha-2': 'JE', 'alpha-3': 'JEY' },
  { name: 'Jordan', 'alpha-2': 'JO', 'alpha-3': 'JOR' },
  { name: 'Kazakhstan', 'alpha-2': 'KZ', 'alpha-3': 'KAZ' },
  { name: 'Kenya', 'alpha-2': 'KE', 'alpha-3': 'KEN' },
  { name: 'Kiribati', 'alpha-2': 'KI', 'alpha-3': 'KIR' },
  {
    name: "Korea (Democratic People's Republic of)",
    filename: 'north-korea',
    'alpha-2': 'KP',
    'alpha-3': 'PRK'
  },
  {
    name: 'Korea, Republic of',
    filename: 'south-korea',
    'alpha-2': 'KR',
    'alpha-3': 'KOR'
  },
  { name: 'Kuwait', 'alpha-2': 'KW', 'alpha-3': 'KWT' },
  { name: 'Kyrgyzstan', 'alpha-2': 'KG', 'alpha-3': 'KGZ' },
  {
    name: "Lao People's Democratic Republic",
    filename: 'laos',
    'alpha-2': 'LA',
    'alpha-3': 'LAO'
  },
  { name: 'Latvia', 'alpha-2': 'LV', 'alpha-3': 'LVA' },
  { name: 'Lebanon', 'alpha-2': 'LB', 'alpha-3': 'LBN' },
  { name: 'Lesotho', 'alpha-2': 'LS', 'alpha-3': 'LSO' },
  { name: 'Liberia', 'alpha-2': 'LR', 'alpha-3': 'LBR' },
  { name: 'Libya', 'alpha-2': 'LY', 'alpha-3': 'LBY' },
  { name: 'Liechtenstein', 'alpha-2': 'LI', 'alpha-3': 'LIE' },
  { name: 'Lithuania', 'alpha-2': 'LT', 'alpha-3': 'LTU' },
  { name: 'Luxembourg', 'alpha-2': 'LU', 'alpha-3': 'LUX' },
  { name: 'Macao', 'alpha-2': 'MO', 'alpha-3': 'MAC' },
  { name: 'Madagascar', 'alpha-2': 'MG', 'alpha-3': 'MDG' },
  { name: 'Malawi', 'alpha-2': 'MW', 'alpha-3': 'MWI' },
  { name: 'Malaysia', 'alpha-2': 'MY', 'alpha-3': 'MYS' },
  { name: 'Maldives', 'alpha-2': 'MV', 'alpha-3': 'MDV' },
  { name: 'Mali', 'alpha-2': 'ML', 'alpha-3': 'MLI' },
  { name: 'Malta', 'alpha-2': 'MT', 'alpha-3': 'MLT' },
  {
    name: 'Marshall Islands',
    filename: 'marshall-island',
    'alpha-2': 'MH',
    'alpha-3': 'MHL'
  },
  { name: 'Martinique', 'alpha-2': 'MQ', 'alpha-3': 'MTQ' },
  { name: 'Mauritania', 'alpha-2': 'MR', 'alpha-3': 'MRT' },
  { name: 'Mauritius', 'alpha-2': 'MU', 'alpha-3': 'MUS' },
  { name: 'Mexico', 'alpha-2': 'MX', 'alpha-3': 'MEX' },
  {
    name: 'Micronesia (Federated States of)',
    filename: 'micronesia',
    'alpha-2': 'FM',
    'alpha-3': 'FSM'
  },
  {
    name: 'Moldova, Republic of',
    filename: 'moldova',
    'alpha-2': 'MD',
    'alpha-3': 'MDA'
  },
  { name: 'Monaco', 'alpha-2': 'MC', 'alpha-3': 'MCO' },
  { name: 'Mongolia', 'alpha-2': 'MN', 'alpha-3': 'MNG' },
  { name: 'Montenegro', 'alpha-2': 'ME', 'alpha-3': 'MNE' },
  { name: 'Montserrat', 'alpha-2': 'MS', 'alpha-3': 'MSR' },
  { name: 'Morocco', 'alpha-2': 'MA', 'alpha-3': 'MAR' },
  { name: 'Mozambique', 'alpha-2': 'MZ', 'alpha-3': 'MOZ' },
  { name: 'Myanmar', 'alpha-2': 'MM', 'alpha-3': 'MMR' },
  { name: 'Namibia', 'alpha-2': 'NA', 'alpha-3': 'NAM' },
  { name: 'Nauru', 'alpha-2': 'NR', 'alpha-3': 'NRU' },
  { name: 'Nepal', 'alpha-2': 'NP', 'alpha-3': 'NPL' },
  { name: 'Netherlands', 'alpha-2': 'NL', 'alpha-3': 'NLD' },
  { name: 'New Zealand', 'alpha-2': 'NZ', 'alpha-3': 'NZL' },
  { name: 'Nicaragua', 'alpha-2': 'NI', 'alpha-3': 'NIC' },
  { name: 'Niger', 'alpha-2': 'NE', 'alpha-3': 'NER' },
  { name: 'Nigeria', 'alpha-2': 'NG', 'alpha-3': 'NGA' },
  { name: 'Niue', 'alpha-2': 'NU', 'alpha-3': 'NIU' },
  { name: 'Norfolk Island', 'alpha-2': 'NF', 'alpha-3': 'NFK' },
  { name: 'North Macedonia', 'alpha-2': 'MK', 'alpha-3': 'MKD' },
  {
    name: 'Northern Mariana Islands',
    filename: 'northern-marianas-islands',
    'alpha-2': 'MP',
    'alpha-3': 'MNP'
  },
  { name: 'Norway', 'alpha-2': 'NO', 'alpha-3': 'NOR' },
  { name: 'Oman', 'alpha-2': 'OM', 'alpha-3': 'OMN' },
  { name: 'Pakistan', 'alpha-2': 'PK', 'alpha-3': 'PAK' },
  { name: 'Palau', 'alpha-2': 'PW', 'alpha-3': 'PLW' },
  {
    name: 'Palestine, State of',
    filename: 'palestine',
    'alpha-2': 'PS',
    'alpha-3': 'PSE'
  },
  { name: 'Panama', 'alpha-2': 'PA', 'alpha-3': 'PAN' },
  {
    name: 'Papua New Guinea',
    filename: 'papua-new-guinea',
    'alpha-2': 'PG',
    'alpha-3': 'PNG'
  },
  { name: 'Paraguay', 'alpha-2': 'PY', 'alpha-3': 'PRY' },
  { name: 'Peru', 'alpha-2': 'PE', 'alpha-3': 'PER' },
  { name: 'Philippines', 'alpha-2': 'PH', 'alpha-3': 'PHL' },
  {
    name: 'Pitcairn',
    filename: 'pitcairn-islands',
    'alpha-2': 'PN',
    'alpha-3': 'PCN'
  },
  {
    name: 'Poland',
    filename: 'republic-of-poland',
    'alpha-2': 'PL',
    'alpha-3': 'POL'
  },
  { name: 'Portugal', 'alpha-2': 'PT', 'alpha-3': 'PRT' },
  { name: 'Puerto Rico', 'alpha-2': 'PR', 'alpha-3': 'PRI' },
  { name: 'Qatar', 'alpha-2': 'QA', 'alpha-3': 'QAT' },
  { name: 'Romania', 'alpha-2': 'RO', 'alpha-3': 'ROU' },
  {
    name: 'Russian Federation',
    filename: 'russia',
    'alpha-2': 'RU',
    'alpha-3': 'RUS'
  },
  { name: 'Rwanda', 'alpha-2': 'RW', 'alpha-3': 'RWA' },
  {
    name: 'Saint Kitts and Nevis',
    filename: 'saint-kitts-and-nevis',
    'alpha-2': 'KN',
    'alpha-3': 'KNA'
  },
  {
    name: 'Saint Lucia',
    filename: 'st-lucia',
    'alpha-2': 'LC',
    'alpha-3': 'LCA'
  },
  {
    name: 'Saint Vincent and the Grenadines',
    filename: 'st-vincent-and-the-grenadines',
    'alpha-2': 'VC',
    'alpha-3': 'VCT'
  },
  { name: 'Samoa', 'alpha-2': 'WS', 'alpha-3': 'WSM' },
  { name: 'San Marino', 'alpha-2': 'SM', 'alpha-3': 'SMR' },
  {
    name: 'Sao Tome and Principe',
    filename: 'sao-tome-and-principe',
    'alpha-2': 'ST',
    'alpha-3': 'STP'
  },
  { name: 'Saudi Arabia', 'alpha-2': 'SA', 'alpha-3': 'SAU' },
  { name: 'Senegal', 'alpha-2': 'SN', 'alpha-3': 'SEN' },
  { name: 'Serbia', 'alpha-2': 'RS', 'alpha-3': 'SRB' },
  { name: 'Seychelles', 'alpha-2': 'SC', 'alpha-3': 'SYC' },
  { name: 'Sierra Leone', 'alpha-2': 'SL', 'alpha-3': 'SLE' },
  { name: 'Singapore', 'alpha-2': 'SG', 'alpha-3': 'SGP' },
  { name: 'Slovakia', 'alpha-2': 'SK', 'alpha-3': 'SVK' },
  { name: 'Slovenia', 'alpha-2': 'SI', 'alpha-3': 'SVN' },
  { name: 'Solomon Islands', 'alpha-2': 'SB', 'alpha-3': 'SLB' },
  { name: 'Somalia', 'alpha-2': 'SO', 'alpha-3': 'SOM' },
  { name: 'South Africa', 'alpha-2': 'ZA', 'alpha-3': 'ZAF' },
  { name: 'South Sudan', 'alpha-2': 'SS', 'alpha-3': 'SSD' },
  { name: 'Spain', 'alpha-2': 'ES', 'alpha-3': 'ESP' },
  { name: 'Sri Lanka', 'alpha-2': 'LK', 'alpha-3': 'LKA' },
  { name: 'Sudan', 'alpha-2': 'SD', 'alpha-3': 'SDN' },
  { name: 'Suriname', 'alpha-2': 'SR', 'alpha-3': 'SUR' },
  { name: 'Sweden', 'alpha-2': 'SE', 'alpha-3': 'SWE' },
  { name: 'Switzerland', 'alpha-2': 'CH', 'alpha-3': 'CHE' },
  {
    name: 'Syrian Arab Republic',
    filename: 'syria',
    'alpha-2': 'SY',
    'alpha-3': 'SYR'
  },
  {
    name: 'Taiwan, Province of China',
    filename: 'taiwan',
    'alpha-2': 'TW',
    'alpha-3': 'TWN'
  },
  { name: 'Tajikistan', 'alpha-2': 'TJ', 'alpha-3': 'TJK' },
  {
    name: 'Tanzania, United Republic of',
    filename: 'tanzania',
    'alpha-2': 'TZ',
    'alpha-3': 'TZA'
  },
  { name: 'Thailand', 'alpha-2': 'TH', 'alpha-3': 'THA' },
  {
    name: 'Timor-Leste',
    filename: 'east-timor',
    'alpha-2': 'TL',
    'alpha-3': 'TLS'
  },
  { name: 'Togo', 'alpha-2': 'TG', 'alpha-3': 'TGO' },
  { name: 'Tokelau', 'alpha-2': 'TK', 'alpha-3': 'TKL' },
  { name: 'Tonga', 'alpha-2': 'TO', 'alpha-3': 'TON' },
  {
    name: 'Trinidad and Tobago',
    filename: 'trinidad-and-tobago',
    'alpha-2': 'TT',
    'alpha-3': 'TTO'
  },
  { name: 'Tunisia', 'alpha-2': 'TN', 'alpha-3': 'TUN' },
  { name: 'Turkey', 'alpha-2': 'TR', 'alpha-3': 'TUR' },
  { name: 'Turkmenistan', 'alpha-2': 'TM', 'alpha-3': 'TKM' },
  {
    name: 'Turks and Caicos Islands',
    filename: 'turks-and-caicos',
    'alpha-2': 'TC',
    'alpha-3': 'TCA'
  },
  { name: 'Tuvalu', 'alpha-2': 'TV', 'alpha-3': 'TUV' },
  { name: 'Uganda', 'alpha-2': 'UG', 'alpha-3': 'UGA' },
  { name: 'Ukraine', 'alpha-2': 'UA', 'alpha-3': 'UKR' },
  {
    name: 'United Arab Emirates',
    filename: 'united-arab-emirates',
    'alpha-2': 'AE',
    'alpha-3': 'ARE'
  },
  {
    name: 'United Kingdom of Great Britain and Northern Ireland',
    filename: 'united-kingdom',
    'alpha-2': 'GB',
    'alpha-3': 'GBR'
  },
  {
    name: 'United States of America',
    filename: 'united-states-of-america',
    'alpha-2': 'US',
    'alpha-3': 'USA',
    stateProvinces: STATE_PROVINCE_CODES.US
  },
  { name: 'Uruguay', 'alpha-2': 'UY', 'alpha-3': 'URY' },
  {
    name: 'Uzbekistan',
    filename: 'uzbekistn',
    'alpha-2': 'UZ',
    'alpha-3': 'UZB'
  },
  { name: 'Vanuatu', 'alpha-2': 'VU', 'alpha-3': 'VUT' },
  {
    name: 'Venezuela (Bolivarian Republic of)',
    filename: 'venezuela',
    'alpha-2': 'VE',
    'alpha-3': 'VEN'
  },
  { name: 'Viet Nam', filename: 'vietnam', 'alpha-2': 'VN', 'alpha-3': 'VNM' },
  {
    name: 'Virgin Islands (British)',
    filename: 'british-virgin-islands',
    'alpha-2': 'VG',
    'alpha-3': 'VGB'
  },
  {
    name: 'Virgin Islands (U.S.)',
    filename: 'virgin-islands',
    'alpha-2': 'VI',
    'alpha-3': 'VIR'
  },
  { name: 'Western Sahara', 'alpha-2': 'EH', 'alpha-3': 'ESH' },
  { name: 'Yemen', 'alpha-2': 'YE', 'alpha-3': 'YEM' },
  { name: 'Zambia', 'alpha-2': 'ZM', 'alpha-3': 'ZMB' },
  { name: 'Zimbabwe', 'alpha-2': 'ZW', 'alpha-3': 'ZWE' }
]

export const FIAT_COUNTRY: {
  [key: string]: { countryName: string; logoUrl: string }
} = {
  AFN: {
    countryName: 'AFGHANISTAN',
    logoUrl: `${FLAG_LOGO_URL}/afghanistan.png`
  },
  ALL: { countryName: 'ALBANIA', logoUrl: `${FLAG_LOGO_URL}/albania.png` },
  DZD: { countryName: 'ALGERIA', logoUrl: `${FLAG_LOGO_URL}/algeria.png` },
  USD: {
    countryName: 'United States of America',
    logoUrl: `${FLAG_LOGO_URL}/united-states-of-america.png`
  },
  EUR: {
    countryName: 'European Union',
    logoUrl: `${FLAG_LOGO_URL}/european-union.png`
  },
  AOA: { countryName: 'ANGOLA', logoUrl: `${FLAG_LOGO_URL}/angola.png` },
  XCD: {
    countryName: 'SAINT VINCENT AND THE GRENADINES',
    logoUrl: `${FLAG_LOGO_URL}/st-vincent-and-the-grenadines.png`
  },
  '': { countryName: '-', logoUrl: '' },
  ARS: { countryName: 'ARGENTINA', logoUrl: `${FLAG_LOGO_URL}/argentina.png` },
  AMD: { countryName: 'ARMENIA', logoUrl: `${FLAG_LOGO_URL}/armenia.png` },
  AWG: { countryName: 'ARUBA', logoUrl: `${FLAG_LOGO_URL}/aruba.png` },
  AUD: { countryName: 'TUVALU', logoUrl: `${FLAG_LOGO_URL}/tuvalu.png` },
  AZN: {
    countryName: 'AZERBAIJAN',
    logoUrl: `${FLAG_LOGO_URL}/azerbaijan.png`
  },
  BSD: { countryName: 'BAHAMAS', logoUrl: `${FLAG_LOGO_URL}/bahamas.png` },
  BHD: { countryName: 'BAHRAIN', logoUrl: `${FLAG_LOGO_URL}/bahrain.png` },
  BDT: {
    countryName: 'BANGLADESH',
    logoUrl: `${FLAG_LOGO_URL}/bangladesh.png`
  },
  BBD: { countryName: 'BARBADOS', logoUrl: `${FLAG_LOGO_URL}/barbados.png` },
  BYN: { countryName: 'BELARUS', logoUrl: `${FLAG_LOGO_URL}/belarus.png` },
  BZD: { countryName: 'BELIZE', logoUrl: `${FLAG_LOGO_URL}/belize.png` },
  XOF: { countryName: 'TOGO', logoUrl: `${FLAG_LOGO_URL}/togo.png` },
  BMD: { countryName: 'BERMUDA', logoUrl: `${FLAG_LOGO_URL}/bermuda.png` },
  BTN: { countryName: 'BHUTAN', logoUrl: `${FLAG_LOGO_URL}/bhutan.png` },
  INR: { countryName: 'INDIA', logoUrl: `${FLAG_LOGO_URL}/india.png` },
  BOB: {
    countryName: 'BOLIVIA (PLURINATIONAL STATE OF)',
    logoUrl: `${FLAG_LOGO_URL}/bolivia.png`
  },
  BOV: {
    countryName: 'BOLIVIA (PLURINATIONAL STATE OF)',
    logoUrl: `${FLAG_LOGO_URL}/bolivia.png`
  },
  BAM: {
    countryName: 'BOSNIA AND HERZEGOVINA',
    logoUrl: `${FLAG_LOGO_URL}/bosnia-and-herzegovina.png`
  },
  BWP: { countryName: 'BOTSWANA', logoUrl: `${FLAG_LOGO_URL}/botswana.png` },
  NOK: { countryName: 'NORWAY', logoUrl: `${FLAG_LOGO_URL}/norway.png` },
  BRL: { countryName: 'BRAZIL', logoUrl: `${FLAG_LOGO_URL}/brazil.png` },
  BND: {
    countryName: 'BRUNEI DARUSSALAM',
    logoUrl: `${FLAG_LOGO_URL}/brunei.png`
  },
  BGN: { countryName: 'BULGARIA', logoUrl: `${FLAG_LOGO_URL}/bulgaria.png` },
  BIF: { countryName: 'BURUNDI', logoUrl: `${FLAG_LOGO_URL}/burundi.png` },
  CVE: {
    countryName: 'CABO VERDE',
    logoUrl: `${FLAG_LOGO_URL}/cape-verde.png`
  },
  KHR: { countryName: 'CAMBODIA', logoUrl: `${FLAG_LOGO_URL}/cambodia.png` },
  XAF: { countryName: 'GABON', logoUrl: `${FLAG_LOGO_URL}/gabon.png` },
  CAD: { countryName: 'CANADA', logoUrl: `${FLAG_LOGO_URL}/canada.png` },
  KYD: {
    countryName: 'CAYMAN ISLANDS',
    logoUrl: `${FLAG_LOGO_URL}/cayman-islands.png`
  },
  CLF: { countryName: 'CHILE', logoUrl: `${FLAG_LOGO_URL}/chile.png` },
  CLP: { countryName: 'CHILE', logoUrl: `${FLAG_LOGO_URL}/chile.png` },
  CNY: { countryName: 'CHINA', logoUrl: `${FLAG_LOGO_URL}/china.png` },
  COP: { countryName: 'COLOMBIA', logoUrl: `${FLAG_LOGO_URL}/colombia.png` },
  COU: { countryName: 'COLOMBIA', logoUrl: `${FLAG_LOGO_URL}/colombia.png` },
  KMF: { countryName: 'COMOROS', logoUrl: `${FLAG_LOGO_URL}/comoros.png` },
  CDF: {
    countryName: 'CONGO, DEMOCRATIC REPUBLIC OF THE',
    logoUrl: `${FLAG_LOGO_URL}/democratic-republic-of-congo.png`
  },
  NZD: { countryName: 'TOKELAU', logoUrl: `${FLAG_LOGO_URL}/tokelau.png` },
  CRC: {
    countryName: 'COSTA RICA',
    logoUrl: `${FLAG_LOGO_URL}/costa-rica.png`
  },
  HRK: { countryName: 'CROATIA', logoUrl: `${FLAG_LOGO_URL}/croatia.png` },
  CUC: { countryName: 'CUBA', logoUrl: `${FLAG_LOGO_URL}/cuba.png` },
  CUP: { countryName: 'CUBA', logoUrl: `${FLAG_LOGO_URL}/cuba.png` },
  ANG: {
    countryName: 'NETHERLANDS',
    logoUrl: `${FLAG_LOGO_URL}/netherlands.png`
  },
  CZK: {
    countryName: 'CZECHIA',
    logoUrl: `${FLAG_LOGO_URL}/czech-republic.png`
  },
  DKK: { countryName: 'GREENLAND', logoUrl: `${FLAG_LOGO_URL}/greenland.png` },
  DJF: { countryName: 'DJIBOUTI', logoUrl: `${FLAG_LOGO_URL}/djibouti.png` },
  DOP: {
    countryName: 'DOMINICAN REPUBLIC',
    logoUrl: `${FLAG_LOGO_URL}/dominican-republic.png`
  },
  EGP: { countryName: 'EGYPT', logoUrl: `${FLAG_LOGO_URL}/egypt.png` },
  SVC: { countryName: 'EL SALVADOR', logoUrl: `${FLAG_LOGO_URL}/salvador.png` },
  ERN: { countryName: 'ERITREA', logoUrl: `${FLAG_LOGO_URL}/eritrea.png` },
  ETB: { countryName: 'ETHIOPIA', logoUrl: `${FLAG_LOGO_URL}/ethiopia.png` },
  FKP: {
    countryName: 'FALKLAND ISLANDS (MALVINAS)',
    logoUrl: `${FLAG_LOGO_URL}/falkland-islands.png`
  },
  FJD: { countryName: 'FIJI', logoUrl: `${FLAG_LOGO_URL}/fiji.png` },
  XPF: {
    countryName: 'FRENCH POLYNESIA',
    logoUrl: `${FLAG_LOGO_URL}/french-polynesia.png`
  },
  GMD: { countryName: 'GAMBIA', logoUrl: `${FLAG_LOGO_URL}/gambia.png` },
  GEL: { countryName: 'GEORGIA', logoUrl: `${FLAG_LOGO_URL}/georgia.png` },
  GHS: { countryName: 'GHANA', logoUrl: `${FLAG_LOGO_URL}/ghana.png` },
  GIP: { countryName: 'GIBRALTAR', logoUrl: `${FLAG_LOGO_URL}/gibraltar.png` },
  GTQ: { countryName: 'GUATEMALA', logoUrl: `${FLAG_LOGO_URL}/guatemala.png` },
  GBP: {
    countryName: 'UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND',
    logoUrl: `${FLAG_LOGO_URL}/united-kingdom.png`
  },
  GNF: { countryName: 'GUINEA', logoUrl: `${FLAG_LOGO_URL}/guinea.png` },
  GYD: { countryName: 'GUYANA', logoUrl: `${FLAG_LOGO_URL}/guyana.png` },
  HTG: { countryName: 'HAITI', logoUrl: `${FLAG_LOGO_URL}/haiti.png` },
  HNL: { countryName: 'HONDURAS', logoUrl: `${FLAG_LOGO_URL}/honduras.png` },
  HKD: { countryName: 'HONG KONG', logoUrl: `${FLAG_LOGO_URL}/hong-kong.png` },
  HUF: { countryName: 'HUNGARY', logoUrl: `${FLAG_LOGO_URL}/hungary.png` },
  ISK: { countryName: 'ICELAND', logoUrl: `${FLAG_LOGO_URL}/iceland.png` },
  IDR: { countryName: 'INDONESIA', logoUrl: `${FLAG_LOGO_URL}/indonesia.png` },
  XDR: { countryName: '-', logoUrl: '' },
  IRR: {
    countryName: 'IRAN (ISLAMIC REPUBLIC OF)',
    logoUrl: `${FLAG_LOGO_URL}/iran.png`
  },
  IQD: { countryName: 'IRAQ', logoUrl: `${FLAG_LOGO_URL}/iraq.png` },
  ILS: { countryName: 'ISRAEL', logoUrl: `${FLAG_LOGO_URL}/israel.png` },
  JMD: { countryName: 'JAMAICA', logoUrl: `${FLAG_LOGO_URL}/jamaica.png` },
  JPY: { countryName: 'JAPAN', logoUrl: `${FLAG_LOGO_URL}/japan.png` },
  JOD: { countryName: 'JORDAN', logoUrl: `${FLAG_LOGO_URL}/jordan.png` },
  KZT: {
    countryName: 'KAZAKHSTAN',
    logoUrl: `${FLAG_LOGO_URL}/kazakhstan.png`
  },
  KES: { countryName: 'KENYA', logoUrl: `${FLAG_LOGO_URL}/kenya.png` },
  KPW: {
    countryName: `KOREA (DEMOCRATIC PEOPLE'S REPUBLIC OF)`,
    logoUrl: `${FLAG_LOGO_URL}/north-korea.png`
  },
  KRW: {
    countryName: 'Korea, Republic of',
    logoUrl: `${FLAG_LOGO_URL}/south-korea.png`
  },
  KWD: { countryName: 'KUWAIT', logoUrl: `${FLAG_LOGO_URL}/kuwait.png` },
  KGS: {
    countryName: 'KYRGYZSTAN',
    logoUrl: `${FLAG_LOGO_URL}/kyrgyzstan.png`
  },
  LAK: {
    countryName: `LAO PEOPLE'S DEMOCRATIC REPUBLIC`,
    logoUrl: `${FLAG_LOGO_URL}/laos.png`
  },
  LBP: { countryName: 'LEBANON', logoUrl: `${FLAG_LOGO_URL}/lebanon.png` },
  LSL: { countryName: 'LESOTHO', logoUrl: `${FLAG_LOGO_URL}/lesotho.png` },
  ZAR: {
    countryName: 'SOUTH AFRICA',
    logoUrl: `${FLAG_LOGO_URL}/south-africa.png`
  },
  LRD: { countryName: 'LIBERIA', logoUrl: `${FLAG_LOGO_URL}/liberia.png` },
  LYD: { countryName: 'LIBYA', logoUrl: `${FLAG_LOGO_URL}/libya.png` },
  CHF: {
    countryName: 'SWITZERLAND',
    logoUrl: `${FLAG_LOGO_URL}/switzerland.png`
  },
  MOP: { countryName: 'MACAO', logoUrl: `${FLAG_LOGO_URL}/macao.png` },
  MGA: {
    countryName: 'MADAGASCAR',
    logoUrl: `${FLAG_LOGO_URL}/madagascar.png`
  },
  MWK: { countryName: 'MALAWI', logoUrl: `${FLAG_LOGO_URL}/malawi.png` },
  MYR: { countryName: 'MALAYSIA', logoUrl: `${FLAG_LOGO_URL}/malaysia.png` },
  MVR: { countryName: 'MALDIVES', logoUrl: `${FLAG_LOGO_URL}/maldives.png` },
  MRU: {
    countryName: 'MAURITANIA',
    logoUrl: `${FLAG_LOGO_URL}/mauritania.png`
  },
  MUR: { countryName: 'MAURITIUS', logoUrl: `${FLAG_LOGO_URL}/mauritius.png` },
  XUA: { countryName: '-', logoUrl: '' },
  MXN: { countryName: 'MEXICO', logoUrl: `${FLAG_LOGO_URL}/mexico.png` },
  MXV: { countryName: 'MEXICO', logoUrl: `${FLAG_LOGO_URL}/mexico.png` },
  MDL: {
    countryName: 'MOLDOVA, REPUBLIC OF',
    logoUrl: `${FLAG_LOGO_URL}/moldova.png`
  },
  MNT: { countryName: 'MONGOLIA', logoUrl: `${FLAG_LOGO_URL}/mongolia.png` },
  MAD: {
    countryName: 'WESTERN SAHARA',
    logoUrl: `${FLAG_LOGO_URL}/western-sahara.png`
  },
  MZN: {
    countryName: 'MOZAMBIQUE',
    logoUrl: `${FLAG_LOGO_URL}/mozambique.png`
  },
  MMK: { countryName: 'MYANMAR', logoUrl: `${FLAG_LOGO_URL}/myanmar.png` },
  NAD: { countryName: 'NAMIBIA', logoUrl: `${FLAG_LOGO_URL}/namibia.png` },
  NPR: { countryName: 'NEPAL', logoUrl: `${FLAG_LOGO_URL}/nepal.png` },
  NIO: { countryName: 'NICARAGUA', logoUrl: `${FLAG_LOGO_URL}/nicaragua.png` },
  NGN: { countryName: 'NIGERIA', logoUrl: `${FLAG_LOGO_URL}/nigeria.png` },
  OMR: { countryName: 'OMAN', logoUrl: `${FLAG_LOGO_URL}/oman.png` },
  PKR: { countryName: 'PAKISTAN', logoUrl: `${FLAG_LOGO_URL}/pakistan.png` },
  PAB: { countryName: 'PANAMA', logoUrl: `${FLAG_LOGO_URL}/panama.png` },
  PGK: {
    countryName: 'PAPUA NEW GUINEA',
    logoUrl: `${FLAG_LOGO_URL}/papua-new-guinea.png`
  },
  PYG: { countryName: 'PARAGUAY', logoUrl: `${FLAG_LOGO_URL}/paraguay.png` },
  PEN: { countryName: 'PERU', logoUrl: `${FLAG_LOGO_URL}/peru.png` },
  PHP: {
    countryName: 'PHILIPPINES',
    logoUrl: `${FLAG_LOGO_URL}/philippines.png`
  },
  PLN: {
    countryName: 'POLAND',
    logoUrl: `${FLAG_LOGO_URL}/republic-of-poland.png`
  },
  QAR: { countryName: 'QATAR', logoUrl: `${FLAG_LOGO_URL}/qatar.png` },
  MKD: {
    countryName: 'NORTH MACEDONIA',
    logoUrl: `${FLAG_LOGO_URL}/north-macedonia.png`
  },
  RON: { countryName: 'ROMANIA', logoUrl: `${FLAG_LOGO_URL}/romania.png` },
  RUB: { countryName: 'RUSSIA', logoUrl: `${FLAG_LOGO_URL}/russia.png` },
  RWF: { countryName: 'RWANDA', logoUrl: `${FLAG_LOGO_URL}/rwanda.png` },
  SHP: {
    countryName: 'SAINT HELENA',
    logoUrl: `${FLAG_LOGO_URL}/saint-helena-pound.png`
  },
  WST: { countryName: 'SAMOA', logoUrl: `${FLAG_LOGO_URL}/samoa.png` },
  STN: {
    countryName: 'SAO TOME AND PRINCIPE',
    logoUrl: `${FLAG_LOGO_URL}/sao-tome-and-principe.png`
  },
  SAR: {
    countryName: 'SAUDI ARABIA',
    logoUrl: `${FLAG_LOGO_URL}/saudi-arabia.png`
  },
  RSD: { countryName: 'SERBIA', logoUrl: `${FLAG_LOGO_URL}/serbia.png` },
  SCR: {
    countryName: 'SEYCHELLES',
    logoUrl: `${FLAG_LOGO_URL}/seychelles.png`
  },
  SLL: {
    countryName: 'SIERRA LEONE',
    logoUrl: `${FLAG_LOGO_URL}/sierra-leone.png`
  },
  SGD: { countryName: 'SINGAPORE', logoUrl: `${FLAG_LOGO_URL}/singapore.png` },
  XSU: { countryName: '-', logoUrl: '' },
  SBD: {
    countryName: 'SOLOMON ISLANDS',
    logoUrl: `${FLAG_LOGO_URL}/solomon-islands.png`
  },
  SOS: { countryName: 'SOMALIA', logoUrl: `${FLAG_LOGO_URL}/somalia.png` },
  SSP: {
    countryName: 'SOUTH SUDAN',
    logoUrl: `${FLAG_LOGO_URL}/south-sudan.png`
  },
  LKR: { countryName: 'SRI LANKA', logoUrl: `${FLAG_LOGO_URL}/sri-lanka.png` },
  SDG: { countryName: 'SUDAN', logoUrl: `${FLAG_LOGO_URL}/sudan.png` },
  SRD: { countryName: 'SURINAME', logoUrl: `${FLAG_LOGO_URL}/suriname.png` },
  SZL: { countryName: 'ESWATINI', logoUrl: `${FLAG_LOGO_URL}/eswatini.png` },
  SEK: { countryName: 'SWEDEN', logoUrl: `${FLAG_LOGO_URL}/sweden.png` },
  CHE: {
    countryName: 'SWITZERLAND',
    logoUrl: `${FLAG_LOGO_URL}/switzerland.png`
  },
  CHW: {
    countryName: 'SWITZERLAND',
    logoUrl: `${FLAG_LOGO_URL}/switzerland.png`
  },
  SYP: {
    countryName: 'SYRIAN ARAB REPUBLIC',
    logoUrl: `${FLAG_LOGO_URL}/syria.png`
  },
  TWD: {
    countryName: 'Taiwan, Province of China',
    logoUrl: `${FLAG_LOGO_URL}/taiwan.png`
  },
  TJS: {
    countryName: 'TAJIKISTAN',
    logoUrl: `${FLAG_LOGO_URL}/tajikistan.png`
  },
  TZS: {
    countryName: 'TANZANIA, UNITED REPUBLIC OF',
    logoUrl: `${FLAG_LOGO_URL}/tanzania.png`
  },
  THB: { countryName: 'THAILAND', logoUrl: `${FLAG_LOGO_URL}/thailand.png` },
  TOP: { countryName: 'TONGA', logoUrl: `${FLAG_LOGO_URL}/tonga.png` },
  TTD: {
    countryName: 'TRINIDAD AND TOBAGO',
    logoUrl: `${FLAG_LOGO_URL}/trinidad-and-tobago.png`
  },
  TND: { countryName: 'TUNISIA', logoUrl: `${FLAG_LOGO_URL}/tunisia.png` },
  TRY: { countryName: 'TURKEY', logoUrl: `${FLAG_LOGO_URL}/turkey.png` },
  TMT: {
    countryName: 'TURKMENISTAN',
    logoUrl: `${FLAG_LOGO_URL}/turkmenistan.png`
  },
  UGX: { countryName: 'UGANDA', logoUrl: `${FLAG_LOGO_URL}/uganda.png` },
  UAH: { countryName: 'UKRAINE', logoUrl: `${FLAG_LOGO_URL}/ukraine.png` },
  AED: {
    countryName: 'UNITED ARAB EMIRATES',
    logoUrl: `${FLAG_LOGO_URL}/united-arab-emirates.png`
  },
  USN: {
    countryName: 'United States of America',
    logoUrl: `${FLAG_LOGO_URL}/united-states-of-america.png`
  },
  UYI: { countryName: 'URUGUAY', logoUrl: `${FLAG_LOGO_URL}/uruguay.png` },
  UYU: { countryName: 'URUGUAY', logoUrl: `${FLAG_LOGO_URL}/uruguay.png` },
  UZS: { countryName: 'UZBEKISTAN', logoUrl: `${FLAG_LOGO_URL}/uzbekistn.png` },
  VUV: { countryName: 'VANUATU', logoUrl: `${FLAG_LOGO_URL}/vanuatu.png` },
  VEF: {
    countryName: 'VENEZUELA (BOLIVARIAN REPUBLIC OF)',
    logoUrl: `${FLAG_LOGO_URL}/venezuela.png`
  },
  VND: { countryName: 'VIET NAM', logoUrl: `${FLAG_LOGO_URL}/vietnam.png` },
  YER: { countryName: 'YEMEN', logoUrl: `${FLAG_LOGO_URL}/yemen.png` },
  ZMW: { countryName: 'ZAMBIA', logoUrl: `${FLAG_LOGO_URL}/zambia.png` },
  ZWL: { countryName: 'ZIMBABWE', logoUrl: `${FLAG_LOGO_URL}/zimbabwe.png` }
}

// utility for recreating list from https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json
/* const modifiedCountryCodes = COUNTRY_CODES.map(country => {
  return {
    name: country.name,
    'alpha-2': country['alpha-2']
  }
})

console.log(JSON.stringify(modifiedCountryCodes)) */
