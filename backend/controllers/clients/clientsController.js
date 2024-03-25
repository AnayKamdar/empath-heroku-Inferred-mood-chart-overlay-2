const pool = require('../../db');
const { dataEncryption, dataDecryption } = require('../../middleware/Auth/Encryption/encrypt');
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { defaultLogger, createLogger } = require('../../logging/logger');
const clientControllerLogger = createLogger('ClientController');

associateClientWithTherapist = (req, res) => {
    const { userId, therapistId } = req.body;
    clientControllerLogger.info("body: ", req.body);
    const newClientId = uuidv4();
    pool.query('INSERT INTO clients (client_id, user_id, therapist_id) VALUES (?, ?, ?)',
    [newClientId, userId, therapistId],
    (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error creating client entry', error });
        }
        res.status(200).json({ message: 'Client entry created', clientId: newClientId });
    });
};

existingClientLoginForLinking = (req, res) => {
    try {
        const { email, password, token } = req.body;
        clientControllerLogger.info("existingClientLoginForLinking called");

        pool.query(
            "SELECT * FROM sign_up_client_tokens WHERE token = ? AND used = 0",
            [token],
            (tokenError, tokenResults) => {
                if (tokenError) {
                    return res.status(500).json({ message: "Error checking token", tokenError });
                }

                if (tokenResults.length === 0) {
                    clientControllerLogger.info("Token already used");
                    return res.status(401).json({ message: "Token already used" });
                }

                pool.query(
                    "SELECT * FROM users WHERE email = ?",
                    [email],
                    async (error, results) => {
                        if (error) {
                            return res.status(500).json({ message: "Error associating existing client with therapist", error });
                        }

                        if (results.length === 0) {
                            return res.status(404).json({ message: "User not found" });
                        }

                        const user = results[0];
                        const match = await bcrypt.compare(password, user.password_hash);

                        if (!match) {
                            return res.status(401).json({ message: "Invalid email or password" });
                        }

                        pool.query(
                            "SELECT client_id FROM clients WHERE user_id = ?",
                            [user.id],
                            (error, clientResults) => {
                                if (error) {
                                    return res
                                        .status(500)
                                        .json({ message: "Error fetching client info", error });
                                }

                                if (clientResults.length === 0) {
                                    return res
                                        .status(404)
                                        .json({ message: "Client not found for user" });
                                }

                                pool.query(
                                    "UPDATE sign_up_client_tokens SET used = 1 WHERE token = ?",
                                    [token],
                                    (updateError, updateResults) => {
                                        if (updateError) {
                                            clientControllerLogger.info(
                                                "Error updating token used status:",
                                                updateError
                                            );
                                        }

                                        const token = jwt.sign(
                                            { userId: user.id },
                                            process.env.JSON_WEB_TOKEN_SECRET
                                        );

                                        res.status(200).json({
                                            userId: user.id,
                                            token: token,
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        clientControllerLogger.error("Error while associating user to therapist:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

associateExistingClientWithTherapist = (req, res) => {
    const { userId, therapistId } = req.body;
    clientControllerLogger.info("body: ", req.body);

    pool.query('UPDATE clients SET therapist_id = ? WHERE user_id = ? AND therapist_id IS NULL',
    [therapistId, userId],
    (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error updating therapist ID', error });
        }
        if (results.affectedRows === 0) {
            return res.status(400).json({ message: 'Client still linked to a therapist' });
        }
        res.status(200).json({ message: 'Client linked to new therapist', therapistId: therapistId, clientId: userId });
    });
};

updateLastVisitedForClient = (req, res) => {
    const clientId = req.clientId;
    const timestamp = req.body.timestamp;

    clientControllerLogger.info("updateLastVisitedForClient client id: ", clientId);

    pool.query('UPDATE clients SET last_visited = ? WHERE client_id = ?', [timestamp, clientId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error updating last_visited for client', error });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json({ message: 'Last visited updated successfully' });
    });
};

addFeeleings = async (req, res) => {
    const clientId = req.clientId;
    const userId = req.userId;
    const { date, feeling, intensity } = req.body;
    pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, userResults) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error: error });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        clientControllerLogger.info("userResults: ", userResults[0].IV);
        const IV = userResults[0].IV;
         if (IV !== null && IV !== undefined && IV !== '') {
            const encryptedData = dataEncryption([feeling.toString(), intensity.toString()], IV);
            pool.query('INSERT INTO mood (client_id, date, encryptedFeeling) VALUES (?, ?, ?)', 
            [clientId, date, encryptedData], (insertError, insertResults) => {
                if (insertError) {
                    return res.status(500).json({ message: 'Error creating mood entry', error: insertError });
                }
                res.status(200).json({ message: 'Mood entry created', moodId: insertResults.insertId });
            });
        } else {
            return res.status(400).json({ message: 'Invalid IV for encryption' });
        }
    });
};

retrieveFeelings = (req, res) => {
    const userId = req.userId;
    const clientId = req.clientId;
    const date = req.body.date;

    pool.query('SELECT IV FROM users WHERE id = ?', [userId], (error, userResults) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching IV from user', error: error });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const IV = userResults[0].IV;
        if (IV) {
            pool.query('SELECT * FROM mood WHERE client_id = ? AND date = ?', [clientId, date], (moodError, moodResults) => {
                if (moodError) {
                    return res.status(500).json({ message: 'Error fetching mood entry', error: moodError });
                }
                if (moodResults.length === 0) {
                    return res.status(404).json({ message: 'Mood not found for the given date' });
                }
                const decryptedData = dataDecryption(moodResults[0].encryptedFeeling, IV);
                if (!decryptedData) {
                    return res.status(500).json({ message: 'Error decrypting mood data' });
                }
                const [feelingString, intensityString] = decryptedData;
                const feeling = parseFloat(feelingString);
                const intensity = parseFloat(intensityString);
                res.status(200).json({ feeling, intensity });
            });
        } else {
            return res.status(400).json({ message: 'Invalid IV for encryption' });
        }
    });
};

module.exports = {
    addFeeleings,
    retrieveFeelings,
    associateClientWithTherapist,
    updateLastVisitedForClient,
    existingClientLoginForLinking,
    associateExistingClientWithTherapist,
};