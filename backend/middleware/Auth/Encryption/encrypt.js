const crypto = require('crypto');
require('dotenv').config();
const pool = require('../../../db');
const { defaultLogger, createLogger } = require('../../../logging/logger');
const encryptionLogger = createLogger('Encrypt');

// Currently creating a symmetric encryption, which can handle larger amounts of data
// The IV is a random string, which is used to encrypt the data, and is also used to decrypt the data

// The Function We have for encryption
function dataEncryption(strings, IV) {
  const iv = Buffer.from(IV, 'hex');
  const keyEncrypt = Buffer.from(process.env.SECRET_KEY, 'hex');

  const cipher = crypto.createCipheriv('aes-256-cbc', keyEncrypt, iv);
  const data = strings.join('|*^><_(');  
  
  let dataEncrypted = cipher.update(data, 'utf8', 'hex');
  dataEncrypted += cipher.final('hex');

  return dataEncrypted;
}


// The Function We have for decryption
function dataDecryption(encryptedData, IV) {
  const iv = Buffer.from(IV, 'hex');
  const keyEncrypt = Buffer.from(process.env.SECRET_KEY, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyEncrypt, iv);
  
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  const strings = decryptedData.split('|*^><_(');

  return strings;
}

module.exports = {
    dataEncryption,
    dataDecryption
    
};