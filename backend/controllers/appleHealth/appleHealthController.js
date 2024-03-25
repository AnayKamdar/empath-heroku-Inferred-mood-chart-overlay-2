const pool = require('../../db');
require('dotenv').config({ path: '../../../.env' });
const { dataEncryption, dataDecryption } = require('../../middleware/Auth/Encryption/encrypt');
const crypto = require('crypto');
const { defaultLogger, createLogger } = require('../../logging/logger');
const appleHealthLogger = createLogger('AppleHealthController');


const saveAppleHealth = (req, res) => {
  const client_id = req.clientId;
  const healthDataArray = req.body; // this is an array of objects
  const userId = req.userId;
  pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, results)=> {
    if (error) {
        return res.status(500).json({ message: 'Error fetching IV from user', error });
    }
    if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      } 
    const IV = results[0].IV;
    if (IV !== null && IV !== undefined && IV !== '') {
    const promises = healthDataArray.flatMap(healthData => {
      const { sleep, steps, distance, created_at } = healthData;

      // Function to create a Promise for inserting data
      const insertData = (dataType, data) => {
       
        if (!data) return Promise.resolve(`No data for ${dataType}`);
        return new Promise((resolve, reject) => {
          const EncryptedHealth = dataEncryption([dataType, data.value], IV);
          pool.query(
            'INSERT INTO apple_health_data (client_id, dataType, value, startDate, endDate, created_at, EncryptedHealth) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), endDate = VALUES(endDate), updated_at = CURRENT_TIMESTAMP',
            [client_id, dataType, data.value, data.startDate, data.endDate, created_at, EncryptedHealth],
            (error, results) => {
              if (error) {
                appleHealthLogger.error(`Error saving ${dataType} data: `, error);
                reject(error);
              } else {
                appleHealthLogger.info(`Inserted ${dataType} data: `, results);
                resolve(`Inserted ${dataType} data`);
              }
            }
          );
        });
      };

      // Create promises for each data type
      return [insertData('sleep', sleep), insertData('steps', steps), insertData('distance', distance)];
    });

    Promise.allSettled(promises)
      .then(results => {
        // Handle results here - send a single response
        res.status(200).json({ message: 'Apple Health data processed', results });
      })
      .catch(error => {
        appleHealthLogger.error(error);
        res.status(500).json({ message: 'Error processing Apple Health data', error });
      });
  }
}
  );
};

const getAppleHealthData = (req, res) => {
  const userId = req.body.userId;
  const therapistId = req.therapistId;

  appleHealthLogger.info("getAppleHealthData called", therapistId, userId);

  // Check client association
  pool.query(
    "SELECT client_id FROM clients WHERE user_id = ? AND therapist_id = ?",
    [userId, therapistId],
    (error, clientResults) => {
      if (error) {
        return res.status(500).json({ message: "Error checking client association", error });
      }

      if (clientResults.length === 0) {
        return res.status(403).json({ message: "User is not associated with this therapist." });
      }

      const clientId = clientResults[0].client_id;

      // Retrieve Apple Health data
      pool.query('SELECT IV FROM EmPath.users WHERE id = ?', [userId], (error, returned)=> {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error });
        }
        if (! returned[0]) {
           return res.status(404).json({ message: 'User not found' });
         } 

         const IV = returned[0].IV;
         if (IV !== null && IV !== undefined && IV !== '') {
           pool.query(
            'SELECT * FROM apple_health_data WHERE client_id = ? ORDER BY startDate DESC',
            [clientId],
            (error, results) => {
              if (error) {
                appleHealthLogger.error(error);
                return res.status(500).json({ message: 'Error retrieving Apple Health data', error });
              }
              if (results.length === 0) {
                return res.status(404).json({ message: 'No Apple Health data found for this client' });
              }
              
              for (let i = 0; i < results.length; i++) {
                decryptedHealth = dataDecryption(results[i].EncryptedHealth, IV);
                const [dataType, val] = decryptedHealth;
                
                results[i] = {
                    id: results[i].journal_id,
                    client_id: results[i].client_id,
                    dataType: dataType,
                    value: val,
                    startDate: results[i].startDate,
                    endDate: results[i].endDate,
                    created_at: results[i].created_at,
                    updated_at: results[i].updated_at,
                  };
                }
                
              res.json({ message: 'Apple Health data retrieved', data: results });
            }
           );
         }
        }
      );
    }
  );
};


module.exports = {
  saveAppleHealth,
  getAppleHealthData
}