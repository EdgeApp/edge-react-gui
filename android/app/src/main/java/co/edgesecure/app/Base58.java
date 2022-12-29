package co.edgesecure.app;

class Base58 {
  public static String encode(byte data[]) {
    // Data iterator:
    int i = 0;

    // Count leading zeroes:
    int zeroes = 0;
    while (i < data.length && data[i] == 0) {
      zeroes++;
      i++;
    }

    // ln 256 / ln 58 = 1.3657:
    int maxDigits = (data.length + 1 - zeroes) * 137 / 100;

    // The base58 digits, stored in little endian:
    int digits[] = new int[maxDigits];
    int digitsUsed = 0;

    // For each input byte, we want to multiply the digits array by 256,
    // then add the byte.
    while (i < data.length) {
      int carry = 0xff & data[i];
      int j = 0;
      while (j < digitsUsed || carry != 0) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry /= 58;
        j++;
      }
      if (j > digitsUsed) digitsUsed = j;
      i++;
    }

    // Now we have the digits in base58, but we need to stringify them:
    char[] out = new char[zeroes + digitsUsed];
    int j = 0;
    while (j < zeroes) {
      out[j] = BASE58[0];
      j++;
    }
    while (j < out.length) {
      digitsUsed--;
      out[j] = BASE58[digits[digitsUsed]];
      j++;
    }
    return new String(out);
  }

  private static final char[] BASE58 = {
    '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
    'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e',
    'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
    'z'
  };
}
