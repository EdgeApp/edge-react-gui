/**
 * Complete information for the 'js test 1' user,
 * used by the unit tests.
 */

import { EdgeFakeUser } from 'edge-core-js/types'

// Credentials:
const info = {
  password: 'y768Mv4PLFupQjMu',
  pin: '1234',
  username: 'JS Test 1'
}

const fakeUserDump: EdgeFakeUser = {
  username: 'js test 1',
  loginId: 'Tg+IxuNwr4YMAZalWcfq5EjlFTs5ZehzdfvkaG9VX6k=',
  loginKey: 'AxJd1CfG4WgLOiW8r24p0BNi7aQ3FnE4G4q1jL++uaA=',

  server: {
    appId: '',
    loginAuthBox: {
      encryptionType: 0,
      iv_hex: '785bcaf5ccfffef9e063f2bdb487a641',
      data_base64: '0raA/GQpdS0zecC6fL/i3/9wOHj59ldwGfiVQG5L+E/JfZIBk+g9YDlOWYPVjKQYJkgQRT+/0HK7nisuwCDCzE9iQtxseGlsBNp/wRhQWo3K9YmFXT7rXi8zNJZ44+ky'
    },
    loginId: 'Tg+IxuNwr4YMAZalWcfq5EjlFTs5ZehzdfvkaG9VX6k=',
    passwordAuthBox: {
      encryptionType: 0,
      iv_hex: 'e063f2bdb487a641486b1a859c0f4e89',
      data_base64:
        'F1JDsfFE8foL6K5Rf/UYeUOLxfs0P3sZtgx9EuxD8TB/itDS4B4x3wN6K7RDm+gOhcnTBr7k1VgP7YvMYKlI4niyVKPbilCSgvOqTjQA6aFS6wZuLHFMbXKQL3bCHpOxTEMCc3hqmvchWHGMIAC49w=='
    },
    passwordAuthSnrp: { salt_hex: 'b5865ffb9fa7b3bfe4b2384d47ce831ee22a4a9d5c34c7ef7d21467cc758f81b', n: 16384, r: 1, p: 1 },
    passwordBox: {
      encryptionType: 0,
      iv_hex: 'b796f1b89b0a350c3f3e3920a332fdf4',
      data_base64:
        'jePZF2d2A/vJdJH8dM5JbhdW0PK+RZCKC4lgMzygrTxkVa9Om8wH5144K8m8qUgnME28rNo/gtHlJBIajyrOdsNi14oQ9UVnMLpRQoR2bZ/97a7oSAaog2L5I0hznQOkNsvb8hGF+Aq2HNah8ui+7w=='
    },
    passwordKeySnrp: { salt_hex: '1b8ab58cbfbeb9a023b27d74476601082bda455ccf0e497033020d4457b691d8', n: 131072, r: 8, p: 1 },
    pin2Box: {
      encryptionType: 0,
      iv_hex: '913B1057482F298253909150D33CC839',
      data_base64:
        'Pe8W38yY/VmsSh+7CrgZGwI3WDpKqIOA6pC4G22fAFkwvSlU8Ojft/77+LlEg8vHo/hEAxEN60wvD3wbOTV46vomVyNKvsqlbaAr7+ex5oSnWsVv9veD3svehRFgoVvq9lak8PAo22o8Q4/LhUd7qA=='
    },
    pin2KeyBox: {
      encryptionType: 0,
      iv_hex: '143A07FE6C5DD52727505872F4635CC4',
      data_base64:
        'k7+rmq/rnTF4gbU1hC4ETX/YA2s1clHXWewnHqc/XP+j2TavdM3ZVLu06lfI1KIaMrwrPc+4GbzEeKP1xzsaTsiDSRrd4dTA+BUIadDWguHbaTWIfg42Nu+MW0MIRAJ1KMteqjEwUHrpwzGzVO9QsA=='
    },
    pin2TextBox: {
      encryptionType: 0,
      iv_hex: 'A5D640EE754A2EB4C9757EAF3AEE3EF5',
      data_base64: 'DG0PZIeTueE9fE/JNKMYufF5to3dCyFh2Ce+nMYwbcRewJsXwmtKE0BXd4bbVmzQITE5RhAnTbSOSQUDmbQ6C6n+oI3fkFUif0fB39ukeEbePZU368zt+Db3vY1x8lRD'
    },
    loginAuth: 'I7J9dEdmAQgr2kVczw5JcDMCDURXtpHYOyrVLN9e2UA=',
    passwordAuth: 'wwlWGZ9GiRqktzxUCMPe5yeXS8AJTJX3A3EWaVdUB1Q=',
    pin2Auth: '2NwK/17oKh43WhHn50sfg6aRLs2HnLJjv6WTpgt8jRY=',
    pin2Id: 'bGQENktbhPupBK9CecIzbZKlTeBjaSC7oDmbrZE63kw=',
    keyBoxes: [
      {
        encryptionType: 0,
        iv_hex: '0003125dd427c6e1680b3a25bcaf6e29',
        data_base64:
          'GqOm5dS4vvyXDDdCos3OTBfaix2aitnh6HSvRPHSJ9pGEgMQdqbljQb5dJlCAyFgPA7DB1ybPLI+Jp/b+fTjWlxaMN4X1CwLb/Xh+Gda/CTtG6jqBoyoASYot11aN5EYc4MTuGsf0Cj7x60IMSA9NepZzpeHfXLwWAn2HVtj3R/lRIpDjxXWMDZQt94NeJoYX6vAJq6vJyhnRXNgCZWFThnaDm9JfJ83M+phnqWUICq0KI2VwntagNZW3j5WhyEuS+rphlCRQACRKWoEyYzBQUyt8jiehC3Nzbnju1vtSKETCqmpD/ZLnxMo2ImMFDa9DTgVJW45w3r0gXR1JKKrmnC8RcNd6H2XSCdpiWN9/UduWx1XlptDhW5fCOQFt/xy'
      },
      {
        encryptionType: 0,
        iv_hex: '8392dd54a74661e88bbaa53c2feea950',
        data_base64:
          'iV6rM6j+xhrBGR/6T9rwKySY4fEOqJOI+sYuNhOxeroIIqoXUmHvmYBtiBPtCgXYXEaKNdiCIOL2SvCZSui/Jzu0Ga1/3rC6Q475VqBX3AgRYWrkKBj9ial/3TajP/Opw8ypgw+GgW3plYVySo9H63oENZ8SWfHTT77fX7Dj6I6+TlDxAp/QTd72bn5ZTllGO+x1H0tCdd8P5PKmsPSUxfC6C4+w2dcckEpyGEKbRMBvzbXXIB4AkhsBOlXiSoLwRDjhjBAJNGQ0x6B3zK7PMA7e5G4cZY2OhQOOQqK45WnrxVZYVRP9L+sbcIlxI3+d8PuX9y2/M/GrwKOdOFfslUir5p65cN9E13ktq0OFcnJ2DjoXG7yXO+MIdXSWmQ0M90dG7lHFOb9RHjjUclAHYvWqhwweHbAJ0kf9MUOrvjf7NZpV1D45rECzS7ZIlYYVQV87jej6I35tSaCzUzUt5fjXg5bmPiVDmHv9d4hYWTVm77Gc6al7tFSGjX9r2My1NpPHt/K6w0sPqTva6r7HgUfWj3jBGM1HT40ZTGTjKk3M8xEvPqP7+h8gNLhL7U7/JURVItb6jDtZXesbTjXp8UYIb7G6+cI9KquR2ykl1PE='
      },
      {
        encryptionType: 0,
        iv_hex: 'c7e68188ab5ac5dc4f8ec9f0b3828dc4',
        data_base64:
          'ptUUG08ZcIfjT5W3ia8Ee6nNIN6GEK5/JeEUwl3F0OaIC14xu7MtqSR+3V/Ylvp2IvphuuwjTQ+I/mXxQd6/jlZZxSDfyffygG0VpCXenyvgDLahgvQifuuEBonMtQLFssLOVQMuZD/gnyCtHAmQIH8oHkEX1FQWehkr+f4hA+FFTBW/d+34Jd7ywdPorPzFxMsm7TWvtXBRaUBgbA5joaw2dV/m/BSuA15Z34MFGJUmKRq9A5I3bS2jvN74rvkk6wN5sUIE7G4lb0DKGmvijdUPzXPccpHghn7Pb3Ku9+E2AxDpGd9KqELmsiGHZgsExsPRZ0unOtcAVaE6VPGsnOadFQllEkE8LKc4HDy4JgfaggVcTDUeGjXat1dK1ouH3SKq2RHqoUAK+isJ7Cmvc9EuUSRIWb6bCqEnImuVRPXc47ZwVteEqGNZATVmRBR7OYs4LCIC/5ctPhk7znEOxCWdNl9CSnx4+EQPeJVm9nxPLNmTKMtcKNMX/GDxfJRVydYxWR3LcrD+n/pdUulcxdyTqQGkQyodXGQCUZuEJZokHibHGJHiVI0ZsPWXWH09sV3y7t2YoJby7y3Hv6FE3Q=='
      },
      {
        encryptionType: 0,
        iv_hex: 'cbfae57c6f2ee990d322ad64f7d631f8',
        data_base64:
          'KOyo3JeDuLKnYJdfZcI6WcDWzfOKnghij8s/PuuvB8hFbkzpXZMsRUkmSX5398ga00PjgWqvAEvgpFBzmcsF02T60JUvY4XTq0rmSduSlKszMrmFUP+AiLdi+yXUjZsZ2pdywMSFzhyKSOPoU02A/RqnCNHUQ6IWur/ACMjmfhDlrFWu4UDQ/2emgXNI6RxKvNLM/rnRrzxxJMoewuqeSezGfSneYn8wB0ZDcQwW3VicchXJZFTH/akiYZquQiQJKoS/Gnc4m8IvfJenbt0GxRDif5w9MHv6t9NB2h/GicG8hub1lkc/96SmEt2EP04AWNAOOQZYkuJrtFEogYKDNaae4DTeDc3bx1HIdU2VW/1VobVt/3zSJAH+I/Qa3CUl77WEyRSIzJgEbHKyvlVTSDWrljYCioqHvc/0wm5CLNBJBsEZjFw1CJ65ltz+6YZa24TDaYlPhXv+09WhgPYcbblfBKTnwm59G4ML/F704vdSdhXirvAj9CzIU1EZjN79LYf0sKj2RlxQ9u+UYfnqCQzsW3uwW363ACAHjic9p5J85UbkbkCi4rLBSqdOYMRPmVTAhptFOCAojcNhXxZjJ9fK6cbyM3X3gG8YBYq/omrRuQN5H9HB+NgqQU0xVqN5'
      },
      {
        encryptionType: 0,
        iv_hex: '8fce0930f3c2cd0417765198fbea95ec',
        data_base64:
          'H/aYpYog0EIfXJLJtRM6d4JFG1c/uoV2RS98Yns2Y9uVD6qI3C7mbEv9W9P7o1J5DziTxQvLWWmryuVOktPrLUhRvPwku5zARF6ZbNUYm6L6Zbi5/ZYoIvQpilCm6I5Fv5GIHKg9wt8vvTTLLSlodvwJTxBuuMjglcVZMxOeolMKhRMgDA7s++yEnK46Wcc24aXkdSVbSjPyjIgEc8jteQLzcWnfreq3y18zd9oxMPmRAQYUfiYRu/CEprrJxhmtWsKVLSjAGKV8qODbmZetqWx3+Kkxjr+MRe5vkiBDPDHYORKDn9UvQmoa/sVbkt49t0aT5tKpAGuNE1omd9k9ZEEe2KE8yGS/BHPPgiQy7acq+g80s+S36M/HvZgmqxdclHWd+lctj9OqP9IG3H60gM7buOAshMW1kjbGydGMKs9d8c1VdLFlq7lFMpNzJ0Im2XERDSjc1ZH8SBXZIa8xJ0Mx84gvQRK4K9vj0nQafQ+CH+hmi+IlaaPwYU63v8Xs7AJouK2jIUlmtlywmPF5cwFESLgh9Eml+2kQ7T8+mP1klI1woGEo9tF0v+qNboZ2J9Ya6diyMAHDHUnn+a9lM8miE2ga9sR/5H7oqEN/koIKCBlnOaEU0jnEVK5wClZk'
      },
      {
        encryptionType: 0,
        iv_hex: '33020d4457b691d83b2ad52cdf5ed940',
        data_base64:
          '2kCWlAfIYgm+ILwMlZGONPM4Vz6YC7dYZoMvpZUxPXZlPQW181iiX0MlnLLdd313a28yeqHUxK4AX85pFSxAJ29ZvAazBULcN4ZedOaJ/NXeRy2VAdVZMC5hP2BM3qynlco9REvdyP1mWEsfLpjA+9m8rImfa/GYD+j/VoZ2+X0wRscb/nrEGk12qd1yIS7xFCjxwmsPd1voMMZrErGkRTZbmguY8zWMWz5NV+rZxSCQ65H/n0uUj+Flh+sK9YEffvtss9Mmkvc7ZUhvmswOcTf2+NptWa2esg/8Ey6jIeLNxsRWnNhANyUdUSDzhrhBzX9XTtDLL8LvJpFtxfFixTRB6scWFuZHRbvGc0fazRb42nlqMW6pd1s7Y0SNzq4exGxFUnEqTzV0CiMhCSOv4eWNBus7SnUK1M1Ik6Wrh+msBW1Yloj1heX2oAnOsNpB+2N//JrHnwNRqeH6LfPeytWdTo0TrdLM65k0qeRw50Y5FGHfd4ilxSyU5ZW+K2k+zyS8acyzkSDEgON7r8qCxqfLue3uMQlHpZzdx1bm7r9fBeLGTwBkkTzSXnCTQZPQJ+NGvWLSOc58OKjqtQ5FDIFs4giB2BEita89xUvi+JE='
      },
      {
        encryptionType: 0,
        iv_hex: '57b691d83b2ad52cdf5ed94043529d14',
        data_base64:
          'XJdAhMHeWS128eIcCN6TzQ34dpM4BSIj7/OO0q+wdyvf+h7JJbDic1X6A6Npe10ZrZcF9w6OeneWgBG1SOWYTEoDIT7x+ZqtZUtVqCQdcC/hOW8DDRhoJVPEaHbAEP/T/D/at3FIv4QI5H4iaMy+gFGIDSMjR/ZDKiuq3tnNaBkWrOZQk/Rpq08TQKWmS+HWYZ1ND2hgoOJiKp1bVHjmlj0qIdASCEWaPL9eeEpLfIGRjSmb0avOSOW44BLbGB0EDQOa+q/NsApW6eSW4rgPuUqH7lDvpIp2XzBN58GF3J6KnGLG0IOHvrZgVo9nHl1Ie6Brm7N7kFyJOr8r3HYkfGqMST9ZBUPKe3UFrTR5zdMDFovf+uGSSO3Fi9DIdwWGVQBHzUZDx6BgK+gjhI3UoL7igmd281zXzVdX+HjY4Fsx/lUYj/nHnn4tc8FYJJMefIrCg8VvGtYxmqQ/DO7lG9F+qc+BtMVuAsS7TrcWy2h2E5tpf82A0tZB3r7fJtYs1BRnp9CnEN0cEJHl4eZJTFr3qKUk/scns5GgADO22ho8Zro3zaYRWj1zJEdfNffGFj0eOwPX+5sGJq3TIXRhUe1BjyddmpVMISBYeLnxRkQ='
      },
      {
        encryptionType: 0,
        iv_hex: '3b2ad52cdf5ed94043529d14670621a8',
        data_base64:
          'DB1qwKKD8BF01TGgEeW0p7MdIcOmAiXtlq2Q5A52mv1/hXv+BntYXqoNN0gTWKaVt8DiriNdgbG7Cxt9o6aizmJEC+j9vft+SNQBbk95H7wHsfn+uEKNAw/aBT0PCGPOC1qV8C6y6szHlosuy15T/riCxf7O/DQj/OMoUuQjZdEoSlilp2h7SfsaeAIZ/yzhaJD4k8OV85Dgr2htZSkqQn+SW4xpyNv5TQaFR7OGjQPSa9BIoIgTpELFtuXAydDCnDVms18ZKW9WsohFs1FtvyulARkP22RLlrkCUrzOL8K00t7ji2B3xn4He1v853bniTwkKkx3R8SsGY43k1LtrmxVlKX1MaRTDujQPsgPVuUmAe2pm8dQiSQf6kHgW4FWwUi1iFmSW1Myv8+QPlMjialSmbI9unUfY+sZzmoNakACialRqHC0OWxKg2UByRn19mckSODzShhTTZvVPqECx9goSau3DH4akFDPSjMAUR16CIo+rmUNIA8ZU5maNot2svOk5fnmgZ4Y3oVRR4K34b6INJk5DhEvb/RecWlgh1nKbZnnlmC0WpcWHZqFmgOzxTiVfDLApaInXJR9h7A2k/RcTEmoNEs9deiMejQ7mcEjC3+t0FJXK/FVQSEX4aCY'
      },
      {
        encryptionType: 0,
        iv_hex: 'df5ed94043529d14670621a84b7a65fc',
        data_base64:
          'oBAEdveNfDT8C7lgpj5UbTFlmC5bci2MuEYz1idMIlZYkk4Ok4HnAzee8Xg82zrU6C7DcLqf3z54vEKvFVge5ROPaDLeQ7QabLrJUxDxjyTByxw4xK4Aq6v0rIMOgkdOKDmIjyOqAeaUSMpknV/XbkuorP3Q+XAEGcb/3FCzv6n+mjk/UD8Xyp+vIqnikU4rk0ZrP7Pj1hdt6FFQlf5B/uBQT/Kbax9c3gdrxv26SImLibkublVzK43c1gHtKsOmFeVtHe52ca24gNqlXo0DOmO8FGFrKYpSWZGx/0HX9CUzpYAONVDjdnSZQVtsBHoFgT42Lpvdyjt32yusoZZv1D5wSpAyhb99ZhZMfJ/Mx7YGWomwrp0c1XY/xFTzrIV1DYJw1tDDg3os2omZeAT+KjJeZfMRUjFECkm1GLabiJSV8M6y3VEbr1pBXKBJFqOIxziN97+rltmdNaPmKPQIXsiW/6NxqT7ayg1ETu4+yftmbEODK1a9BadETjhPpT2zXWcjHJThBKdsBZ3+PcqHJ6O1XEqU97gJdguWbcWnFGFnUPaYxSzZpT53lAsnP95CU7X/xNxFi48r2YBgR1Y+Jg=='
      },
      {
        encryptionType: 0,
        iv_hex: '63f2bdb487a641486b1a859c0f4e89b0',
        data_base64:
          'QEksqKkt8MrpuLp5gq+ibKM1hLVu/ELAVO012LrswDZjzddGC8PXKVP7RXWqNWmVYzZ3Jt3hgSxHcFZ3NIRy7ecvoxDx36WX096UcOx7TB9Waqy1eJbO0IQVf4bzGVIsSYHo4N1+mdmDM/ctZhMPrvW6aaZn0wJT8b9l1GrHSpAEObfE6HOb7AXSqggmyJuIjMWmmrqIeL7NSECO3B07ak5zWVsh2XiYH6A0RYxzTyjOAR26579Jyw59SwBLKehXykBulf6I1KNcyNEkEakrYXEOmTBhxONemDi4FOqr9uD7er/qDiWLvCmmicR5mwSoRq7k81Gv3emun8oOKrQaRfb+t3z4mDmFwMsz92Ls787FP0xy+RocT+LbwgpaQtOUkrwuBP8a79NwXWyG1xFCnA0J2FPIwguShfhMIjCNgbWXatztisFKPJwEtNQ2BX+Dym1XS9EHirw+/b3xIJ5cMCWBNCM7Ut1NQD1R5vbUkhrqaRGRFd6vBlV/JayOo/52DjHw9V3uamTneEYAzawOwQ/ggYlUY2vcRgeQLEs5ljNZn/StqYDJnj1njwG2EsLjED/yt1RvrDgkOCbSdbPRBJPPK4k4rA9vRvoAFnmz6Qs='
      },
      {
        encryptionType: 0,
        iv_hex: 'a74661e88bbaa53c2feea95093e26d24',
        data_base64:
          'qDKzvSGfWOs0h6nY7Pr8p0ug955bs+x4BhmEFV3d75oq1dMXKt/YQT769EMuwJG3KUGOzIpJf6/Jws0rKWbscNjxe6FtQCvXYC+kaSH3+Yf9AKgVfla7AH6BWVOfMpYMbDjWcgfe9lPlCUq4pVK0K9aL4/a29ginmB+Ke1HiQ2Fwa0cMEcsfv823vR3lKXRYN87eHpqqW6tz/FmyhoBCN7C30jhLAdpm+ifYXHgPw1snA9HFcXEk6vWJTyNCsYgBt9ThiqzYNUEUnvtNkuFInFJu7mO8CRMPY5BfuspzdM/Xg35+yTGewrqdOHWjf0UN7LL+ijHtgaLajCvQUxEwYEyTVNPuZEe1oBGHIRyLXpFlWFquRc9d6R2ZTnmLaxvVNhOv9vdQsUMuRqOwooixDahIE6fCGgxdSasBNjiZHaRskPIlxbepr/Uf92uXzCswqvjh1ABqe2lHV54PdqVZ+UMGsRKKcQrWgqoWY+DQ/UiwKkMEHWs2Rg4VemBdMygdwNOIgInDoyg4NzfoCxlj4MG06ktsEUhoSltJQ2lk2HRe227XNVvR3eMrAXTGA/2zZI4rKvZn7KDJ1ycg2f5pig=='
      },
      {
        encryptionType: 0,
        iv_hex: 'ab5ac5dc4f8ec9f0b3828dc4d7361158',
        data_base64:
          '2EJi4pLyhRcRXBy5bBNS3Nur8uGC6jgRb8hnOZ99/Sv4JPbGlWA9DvFwIUlyK0mAx23/dN80shud7tnt2OE6NujqL1wrcpvPjBm8ZBPvIBJw0vjE4+5EKENAGtIp/ia6mNaR6DZY5O2hv8NTbHDLj4gC0n5/JAyksszF8bcp9LPuT1DjEgUcyq0cgUmDlzo6HnhFnGBf8M6I8fTcy6fCubXYAC8VwYpIFxFBhP82CNUUv06dxx7kby2TwZXpUWwiaecOr95aJA0X2SHbPCqfHiD7V9288Xm5c8+YCGk9R+MLUc8+A6qDnnmsJSLqWGQINPN67aQwlJB5u1OZF8USlHx/hfRe0eOTOWNsHHKsLKjLUnf486EdUjrcoK+3iG9FKYPgQ5o8pBntsISx/JfMntw0x/HdoVQ3+5aXKf0vw5IWJMebVPTzJGnmrM5tEypPPrXCyhsfbbXR84Gem6Fn6nfQFbiVBZqCiA+AZSML8tlecbizQ8zazu4rLpkzgRsCTT04233nSs85YZK0PereJSKLZ5U48B+bIwnVvR3rXay2sdmzYKKTZugynws804HJJ0sbHJuSo4hV9f7IQNWq72cBdFSROtfMYPFrsSzh9mU='
      },
      {
        encryptionType: 0,
        iv_hex: '6f2ee990d322ad64f7d631f8db4a754c',
        data_base64:
          'pJSoi3TbRZbyL8fDCTOcW1E72LRKAVURx/W/jbC/pqCwIKmGZ8xRd9QEuHVAv3nsHDV0uV33dZrl2luJDQbKUBqwAATAWpWzulQfp+osk5pqRWyC/3c0JGtf3B9ofu1CLQDKiBqIS6+YQInYpG5rTsCpG3fQA0NRI2YFtPYgOIZl5eGlqlxJAE3+1pEDIdC5AnxQJUWMw/QIK9k5FvivxWWffmE+WeKoIDbMdjStjR446cdK3+6DrQL4uvJGNUX6maNTy1NVNUhrygrE+42AEWGWBUnPnZLNJ0hOiU+FEypVnh3YQueJpq/G6+7zeGWz2i0yp0N31HLZpAnaMayY2l6yGW/4nSTScQz1om6rMVfVYr4r4TlMnS9k0Cj788SC/ZdwtnfDsx7OqdCGsvdU9cv4+uabUnEG2oP0I7gnCBFnL+sBsVfdnktd5s2nU/YkizuPOLzY/Eb1HLlwGsKy8jCE1QP2vzdLmbr5/FJc968='
      },
      {
        encryptionType: 0,
        iv_hex: 'a84b7a65fcefae691053a22de47756b1',
        data_base64:
          'yYdVtbeTZXKH1kp8B6i7zwardQEGnv20shriJNUYdjbZqht9bhxXt9djvtwA5ketbLhwDukzUET8tbT4kAY0rTF8nMnI5TvtVndKctMddvmTrkCB0yXukHh9spzG4C0HC5SvnJgcn7qrfAXQLD+O4HPrfJQ1IVY+mPB8lsv6y8ya/3hTh0bVXexvdHArHhrvdXVV8qVeYFEfjfQ1ekcTaWlNbFy4dAY4gp0PfddcE8alncU/bwyOU8YRxD3UW192sgLPY6OHCrUKgzD4rMYrylol8qfeUGHQKAA2DQSSX13YUERZBKAT5YZpRAgviASBUEGbbXVlNIbcrMpKT8QjY29okX4YdjJSvI10VwW6rp9RwX666NqxLuKNWdeaWCjYriC/egbDtQ1pZmHzGWcnZRUhQ2VbGJkYJJvefQzjMwaLPlGv7SWuL3F9sGJN09S5FZJfy3rjH+9oDv/pjoVR5QY1fk9LJJJhXa0ROx2EsaWrrkNg0KKPJUlE7aJKTU3d36fVnveBktp0YRL1imHkLrUWhEkBIun6lunpXI+Nq8qqBFUaj6QnRxIte0Yd08vpAo/96B8TgRhKiBIF+RB7wFNKLLel5VEhQvzOdfZZTnxylS0gKvk+34eQS83DcjhW0nKYWq6Gt8VsytS9/C4j43acL//4jT4xHcn/2xQXRYCaAqeOXjkdwtI1H0l6JL5KmuDvy4odpCo37jB10nJlSN/B+aoEXnxfHwNBkrsz8WI+IZA4D3bkF7cAA9K9WWrmWAEHn5JGuZjbQiRinAZoGSpm3iNT383/j7befrhp82U='
      },
      {
        encryptionType: 0,
        iv_hex: 'db4a754c7f7e7960e3723d340726c1c8',
        data_base64:
          'v5lzDSVqe48Ie17Z5BY2twx+HRBL230UyOSeDF/NbSKYWybrhXdghi1CRSOS9LUTRAbM0GqwyVln12BIuM5p17U+TGRlHP6CtYT8I6d3BWqiT716NgDuNaF4z4CfCrEm93VkN1yzBJ0HMzfxeyZlLUiG6qzm67qu5TVNjyvL2SUo28pqE3Z9HD68pjyWP2r7nrCmOYZIDGm21o59KC/fpxHoZ1XsUPKFak9YIYNvoA9Xc0iN4aD5sbbh57TNrJgE9dvVgxZxVn8B2IHsqTXMinhhDz1zpUDe+vbkl2KvKxZff5/FJtHd1yFT6r4/PPxW8g+a3tewTh1E7FFPVJGxiRNPja2mzI1Nd6nN4nwD9MhFIhn1Vzy3/UioaZ48rvcBk4kLnOuboayJ4kMI28lD8DHwk3SG+uA/1TemxnezRr0='
      }
    ]
  },
  repos: {
    e786a128cbfae57c6f2ee990d322ad64f7d631f8: {},
    '1053a22de47756b1785bcaf5ccfffef9e063f2bd': {},
    '3c2feea95093e26d24b796f1b89b0a350c3f3e39': {},
    e88bbaa53c2feea95093e26d24b796f1b89b0a35: {},
    f4c7e68188ab5ac5dc4f8ec9f0b3828dc4d73611: {},
    '0003125dd427c6e1680b3a25bcaf6e29d01362ed': {},
    ec9f1e990003125dd427c6e1680b3a25bcaf6e29: {},
    '98fbea95ec9f1e990003125dd427c6e1680b3a25': {},
    a4371671381b8ab58cbfbeb9a023b27d74476601: {},
    '7033020d4457b691d83b2ad52cdf5ed94043529d': {},
    '9c0f4e89b073424d8497f6d1187b6a156c1f9e19': {},
    '486b1a859c0f4e89b073424d8497f6d1187b6a15': {},
    '54a74661e88bbaa53c2feea95093e26d24b796f1': {},
    bfbeb9a023b27d74476601082bda455ccf0e4970: {},
    b89b0a350c3f3e3920a332fdf4c7e68188ab5ac5: {}
  }
}

export const fakeUser = { ...info, ...fakeUserDump }
