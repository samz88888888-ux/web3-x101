
import cryptoJs from 'crypto-js'


export const guid = () => {
  return 'yxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const aesEncrypt = (dataStr, key) => {
  var keyHex = cryptoJs.enc.Utf8.parse(key)
  dataStr = cryptoJs.enc.Utf8.parse(dataStr)
  let encrypted = cryptoJs.AES.encrypt(dataStr, keyHex, {
    // iv,
    mode: cryptoJs.mode.ECB,
    padding: cryptoJs.pad.Pkcs7
  })
  return cryptoJs.enc.Base64.stringify(encrypted.ciphertext)
}
export const aesDecrypt = (encrypted, key) => {
  var keyHex = cryptoJs.enc.Utf8.parse(key)
  let decrypted = cryptoJs.AES.decrypt(encrypted, keyHex, {
    // iv,
    mode: cryptoJs.mode.ECB,
    padding: cryptoJs.pad.Pkcs7
  })
  return decrypted.toString(cryptoJs.enc.Utf8)
}