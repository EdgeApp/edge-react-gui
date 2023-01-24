import Foundation

@objc
public class Base58: NSObject {
  @objc
  public class func encode(_ data: [UInt8]) -> String {
    // Data iterator:
    var i = 0

    // Count leading zeroes:
    var zeroes = 0
    while i < data.count && data[i] == 0 {
      zeroes += 1
      i += 1
    }

    // ln 256 / ln 58 = 1.3657:
    let maxDigits = (data.count + 1 - zeroes) * 137 / 100

    // The base58 digits, stored in little endian:
    var digits = Array(repeating: 0, count: maxDigits)
    var digitsUsed = 0

    // For each input byte, we want to multiply the digits array by 256,
    // then add the byte.
    while i < data.count {
      var carry = Int(data[i])
      var j = 0
      while j < digitsUsed || carry != 0 {
        carry += digits[j] << 8
        digits[j] = carry % 58
        carry /= 58
        j += 1
      }
      if j > digitsUsed { digitsUsed = j }
      i += 1
    }

    // Now we have the digits in base58, but we need to stringify them:
    var out: [Character] = Array(repeating: "\0", count: zeroes + digitsUsed)
    var j = 0
    while j < zeroes {
      out[j] = BASE58[0]
      j += 1
    }
    while j < out.count {
      digitsUsed -= 1
      out[j] = BASE58[digits[digitsUsed]]
      j += 1
    }
    return String(out)
  }

  private static let BASE58: [Character] = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K",
    "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e",
    "f", "g", "h", "i", "j", "k", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y",
    "z",
  ]
}
