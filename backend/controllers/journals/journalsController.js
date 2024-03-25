const pool = require('../../db');

require('dotenv').config({ path: '../../../.env' });
const { dataEncryption, dataDecryption } = require('../../middleware/Auth/Encryption/encrypt');
const crypto = require('crypto');
const { defaultLogger, createLogger } = require('../../logging/logger');
const journalsControllerLogger = createLogger('JournalsController');


createJournalEntry = (req, res) => {
    const clientId = req.clientId;
    const userId = req.userId;
    const { title, text, feeling, intensity, approach_withdrawal, mood_trigger, platform, date, voice_journal_path, isShared} = req.body;
    pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, results)=> {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
          } 
        const IV = results[0].IV;
        if (IV !== null && IV !== undefined && IV !== '') {
            const encryptedJournal = dataEncryption([text, title, mood_trigger, feeling.toString(), intensity.toString(), approach_withdrawal.toString(), platform, voice_journal_path], IV);
            pool.query('INSERT INTO journals (client_id, entry_date, isShared, encryptedJournal) VALUES (?, ?, ?, ?)', 
            [clientId, date, isShared, encryptedJournal], 
            (error, results) => {
                if (error) {
                    return res.status(500).json({ message: 'Error creating journal entry', error });
                }
                res.status(200).json({ message: 'Journal entry created', journalId: results.insertId });
            });
        }
    });
};

fetchAllJournalEntries = (req, res) => {
 const userId = req.userId;
 pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, returned)=> {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error });
        }
        if (! returned[0]) {
            return res.status(404).json({ message: 'User not found' });
        } 
         const IV = returned[0].IV;
         if (IV !== null && IV !== undefined && IV !== '') {
            pool.query('SELECT * FROM journals', (error, results) => {
                if (error) {
                    return res.status(500).json({ message: 'Error fetching journals', error });
                }
                if (results.length === 0) {
                    return res.status(404).json({ message: 'Journal entry not found' });
                }
                journalsControllerLogger.info("fetchAllJournalEntries: ", results);
                for (let i = 0; i < results.length; i++) {
                    decryptedJ =  dataDecryption(results[i].EncryptedJournal, IV);
                    const [text, title, mood_trigger, feelingString, intensityString,  approach_withdrawalString, platform, voice_journal_path] = decryptedJ;
                    const feeling = parseFloat(feelingString);
                    const intensity = parseFloat(intensityString);
                    const approach_withdrawal = parseFloat(approach_withdrawalString);
                    results[i] = {
                        journal_id: results[i].journal_id,
                        client_id: results[i].client_id,
                        title: title,
                        text: text,
                        feeling: feeling,
                        intensity: intensity,
                        approach_withdrawal: approach_withdrawal,
                        mood_trigger: mood_trigger,
                        platform: platform,
                        voice_journal_path: voice_journal_path,
                        created_at: results[i].created_at,
                        updated_at: results[i].updated_at,
                        entry_date: results[i].entry_date,
                        isShared: results[i].isShared
                        };
                }
                res.status(200).json(results);
            });
         }
    });
};

fetchJournalEntryById = (req, res) => {
    const journalId = req.params.id;
    const userId = req.userId;
    pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, returned)=> {
         if (error) {
             return res.status(500).json({ message: 'Error fetching IV from user', error });
         }
         if (!returned[0]) {
            return res.status(404).json({ message: 'User not found' });
          }
          const IV = returned[0].IV;
          if (IV !== null && IV !== undefined && IV !== '') {
            pool.query('SELECT * FROM journals WHERE journal_id = ?', [journalId], 
            (error, results) => {
                if (error) {
                    return res.status(500).json({ message: 'Error fetching journal entry', error });
                }
                if (results.length === 0) {
                    return res.status(404).json({ message: 'Journal entry not found' });
                }
                
                for (let i = 0; i < results.length; i++) {
                    decryptedJ =  dataDecryption(results[i].EncryptedJournal, IV);
                    const [text, title, mood_trigger, feelingString, intensityString,  approach_withdrawalString, platform, voice_journal_path] = decryptedJ;
                    const feeling = parseFloat(feelingString);
                    const intensity = parseFloat(intensityString);
                    const approach_withdrawal = parseFloat(approach_withdrawalString);
                    results[i] = {
                        journal_id: results[i].journal_id,
                        client_id: results[i].client_id,
                        title: title,
                        text: text,
                        feeling: feeling,
                        intensity: intensity,
                        approach_withdrawal: approach_withdrawal,
                        mood_trigger: mood_trigger,
                        platform: platform,
                        voice_journal_path: voice_journal_path,
                        created_at: results[i].created_at,
                        updated_at: results[i].updated_at,
                        entry_date: results[i].entry_date,
                        isShared: results[i].isShared
                        };
                }      
              res.status(200).json(results);
            });
          }
    });
};

fetchJournalEntriesByClient = (req, res) => {
    const clientId = req.clientId;
    const userId = req.userId;
    pool.query('SELECT IV FROM EmPath.users WHERE id = ?', [userId], (error, returned)=> {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error });
        }
        if (! returned[0]) {
           return res.status(404).json({ message: 'User not found' });
         } 

         const IV = returned[0].IV;
         if (IV !== null && IV !== undefined && IV !== '') {
            pool.query('SELECT * FROM journals WHERE client_id = ?', [clientId], (error, results) => {
                if (error) {
                    return res.status(500).json({ message: 'Error fetching journals for client', error });
                }
                if (results.length === 0) {
                    return res.status(404).json({ message: 'No journals found for this client' });
                }
                    for (let i = 0; i < results.length; i++) {
                        decryptedJ =  dataDecryption(results[i].EncryptedJournal, IV);
                        const [text, title, mood_trigger, feelingString, intensityString, approach_withdrawalString, platform, voice_journal_path] = decryptedJ;
                        const feeling = parseFloat(feelingString);
                        const intensity = parseFloat(intensityString);
                        const approach_withdrawal = parseFloat(approach_withdrawalString);
                        results[i] = {
                            journal_id: results[i].journal_id,
                            client_id: results[i].client_id,
                            title: title,
                            text: text,
                            feeling: feeling,
                            intensity: intensity,
                            approach_withdrawal: approach_withdrawal,
                            mood_trigger: mood_trigger,
                            platform: platform,
                            voice_journal_path: voice_journal_path,
                            created_at: results[i].created_at,
                            updated_at: results[i].updated_at,
                            entry_date: results[i].entry_date,
                            isShared: results[i].isShared
                            };
                    }      
                res.status(200).json(results);
             });
         }
   });
};

getRandomJournalPrompt = (req, res) => {
    pool.query('SELECT * FROM journal_prompts ORDER BY RAND() LIMIT 1', (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching journal prompt', error });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Journal prompt not found' });
        }
        res.status(200).json(results[0]);
    });

};

updateJournalEntryById = (req, res) => {
    const journalId = req.params.id;
    const { title, text, feeling, intensity,  approach_withdrawal, mood_trigger, platform, date, voice_journal_path, isShared} = req.body;
    const userId = req.userId;
    pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, returned)=> {
         if (error) {
             return res.status(500).json({ message: 'Error fetching IV from user', error });
         }
         if (! returned[0]) {
            return res.status(404).json({ message: 'User not found' });
          } 
          const IV = returned[0].IV;
            if (IV !== null && IV !== undefined && IV !== '') {
                journalsControllerLogger.info("UPDATING TO: ", req.body)
                const encryptedJournal = dataEncryption([text, title, mood_trigger, feeling.toString(), intensity.toString(),  approach_withdrawal,toString(),platform, voice_journal_path], IV);
                pool.query('UPDATE journals SET updated_at = ?, encryptedJournal = ?, isShared = ? WHERE journal_id = ?', 
                [date, encryptedJournal, isShared, journalId], 
                (error, results) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error updating journal entry', error });
                    }
                    if (results.affectedRows === 0) {
                        return res.status(404).json({ message: 'Journal entry not found' });
                    }
                    res.status(200).json({ message: 'Journal entry updated successfully' });
                });
            }       
    });
};

deleteJournalEntryById = (req, res) => {
    const journalId = req.params.id;
    pool.query('DELETE FROM journals WHERE journal_id = ?', [journalId], 
    (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting journal entry', error });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }
        res.json({ message: 'Journal entry deleted successfully' });
    });
};

updateJournalAttributeById = (req, res) => {
    const journalId = req.params.id;
    const { attribute, updatedValue, date } = req.body;
    const userId = req.userId;
    pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, returned)=> {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error });
        }
        if (!returned[0]) {
           return res.status(404).json({ message: 'User not found' });
         }
         const IV = returned[0].IV;
         if (IV !== null && IV !== undefined && IV !== '') {
           pool.query('SELECT * FROM journals WHERE journal_id = ?', [journalId], 
           (error, results) => {
               if (error) {
                   return res.status(500).json({ message: 'Error fetching journal entry', error });
               }
               if (results.length === 0) {
                   return res.status(404).json({ message: 'Journal entry not found' });
               }
               
               for (let i = 0; i < results.length; i++) {
                decryptedJ =  dataDecryption(results[i].EncryptedJournal, IV);
                const [text, title, mood_trigger, feelingString, intensityString, approach_withdrawalString, platform, voice_journal_path] = decryptedJ;
                const feeling = parseFloat(feelingString);
                const intensity = parseFloat(intensityString);
                const approach_withdrawal = parseFloat(approach_withdrawalString);
                results[i] = {
                    journal_id: results[i].journal_id,
                    client_id: results[i].client_id,
                    title: title,
                    text: text,
                    feeling: feeling,
                    intensity: intensity,
                    approach_withdrawal: approach_withdrawal,
                    mood_trigger: mood_trigger,
                    platform: platform,
                    voice_journal_path: voice_journal_path,
                    created_at: results[i].created_at,
                    updated_at: results[i].updated_at,
                    entry_date: results[i].entry_date,
                    isShared: results[i].isShared
                    };
                }
                if (attribute == 'title'){
                    results[0].title = updatedValue;
                }
                else if (attribute == 'text'){
                    results[0].text = updatedValue;
                } 
                else if (attribute == 'feeling'){
                    results[0].feeling = updatedValue;
                }  
                else if (attribute == 'intensity'){
                    results[0].intensity = updatedValue;
                }
                else if (attribute == 'mood_trigger'){
                    results[0].mood_trigger = updatedValue;
                }
                else if (attribute == 'platform'){
                    results[0].platform = updatedValue;
                } 
                else if (attribute == 'voice_journal_path'){
                    results[0].voice_journal_path = updatedValue;
                } 
                else if (attribute == 'entry_date'){
                    results[0].entry_date = updatedValue;
                } 
                else if (attribute == 'is_shared'){
                    results[0].isShared = updatedValue;
                } else if (attribute == 'approach_withdrawal'){
                    results[0].approach_withdrawal = updatedValue;
                }
                const encryptedJournal = dataEncryption([results[0].text, results[0].title, results[0].mood_trigger, results[0].feeling.toString(), results[0].intensity.toString(), results[0].approach_withdrawal.toString(), results[0].platform, results[0].voice_journal_path], IV);
                pool.query('UPDATE journals SET updated_at = ?, encryptedJournal = ?, isShared = ? WHERE journal_id = ?', 
                [date, encryptedJournal, results[0].isShared, journalId], 
                (error, results) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error updating journal entry', error });
                    }
                    if (results.affectedRows === 0) {
                        return res.status(404).json({ message: 'Journal entry not found' });
                    }
                    res.status(200).json({ message: 'Journal entry updated successfully' });
                });
           });
         }
   });
};

module.exports = {
    createJournalEntry,
    fetchAllJournalEntries,
    fetchJournalEntryById,
    fetchJournalEntriesByClient,
    updateJournalEntryById,
    updateJournalAttributeById,
    deleteJournalEntryById,
    getRandomJournalPrompt
};