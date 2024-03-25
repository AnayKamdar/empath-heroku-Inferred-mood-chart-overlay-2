import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./UnlinkModal.css";

const UnlinkModal = ({ show, onHide, showModal }) => {

    const [clientLimit, setClientLimit] = useState();
    const [clientCount, setClientCount] = useState();
    const [clientList, setClientList] = useState([]);
    const [clientsToUnlink, setClientsToUnlink] = useState(0);
    const [unlinkConfirmation, setUnlinkConfirmation] = useState({});

    const fetchClientLimit = async () => {
        try {
            const response = await axios.get(
            `${process.env.REACT_APP_BACK_END_URL}/api/therapists/retrieveTherapistClientLimit`,
            {
                withCredentials: true,
            }
            );
            setClientLimit(response.data.client_limit);
            setClientCount(response.data.client_count);
        } catch (error) {
            console.log("Error fetching client limit/count", error);
        }
    }
    
    const handleCloseModal = () => {
        if (clientsToUnlink === 0) {
            setUnlinkConfirmation({});
            onHide();
        }
    };
    
    const fetchTherapistClients = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACK_END_URL}/api/users/fetchTherapistClients`,
                { withCredentials: true }
            );
            setClientList(response.data);
            if(clientCount > clientLimit) {
                showModal(true);
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await fetchClientLimit();
            setClientsToUnlink(Math.max(0,(parseInt(clientCount) - parseInt(clientLimit))));
            await fetchTherapistClients();
        };
        
        fetchData();
    }, [clientCount, clientLimit, clientsToUnlink]);

    const handleUnlinkClient = async (userId) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACK_END_URL}/api/users/unlinkClientFromTherapist`,
                { userId },
                { withCredentials: true }
            );
            console.log(response.data);
            setClientList((prevClientList) =>
                prevClientList.filter((client) => client.id !== userId)
            );
            setClientsToUnlink((prevClientsToUnlink) => prevClientsToUnlink - 1);
            fetchClientLimit();
        } catch (error) {
            console.error("Error unlinking client:", error);
        }
    };

    const handleConfirmUnlink = (userId) => {
        handleUnlinkClient(userId);
        setUnlinkConfirmation({});
    };

    const handleCancelUnlink = () => {
        setUnlinkConfirmation({});
    };

    const renderUnlinkButton = (client) => {
        if (unlinkConfirmation[client.id]) {
            return (
                <div className="unlink-buttons">
                    <text className="unlink-text">Are you sure?</text>
                    <Button className="unlink-confirm" onClick={() => handleConfirmUnlink(client.id)}>
                        <FontAwesomeIcon icon={faCheck} className="unlink-icon"/>
                    </Button>
                    <Button className="unlink-cancel" onClick={handleCancelUnlink}>
                        <FontAwesomeIcon icon={faTimes} className="unlink-icon"/>
                    </Button>
                </div>
            );
        } else {
            return (
                <Button className="unlink-button" onClick={() => setUnlinkConfirmation({ [client.id]: true })}>
                    <FontAwesomeIcon icon={faMinus} className="unlink-icon"/>
                </Button>
            );
        }
    };

    return (
        <Modal show={show} onHide={handleCloseModal} backdrop="static" keyboard={false} className="unlink-modal">
        <Modal.Header className="unlink-header">
          <div>
            <Modal.Title className="unlink-title">Unlink Clients</Modal.Title>
            <br/>
            <text className={clientCount > clientLimit ? "seats-remaining-red" : "seats-remaining"}> {clientCount} / {clientLimit} Seats used</text>
            {clientCount > clientLimit && <br />}
            {clientCount > clientLimit && <text className="unlink-limit-message">Your number of clients exceed the maximum limit</text>}
            <br/><br/>
            <text className="unlink-text">Unlinking a client will remove them from your client list and you will no longer have access to them</text>
          </div>
        </Modal.Header>
        <Modal.Body>
          <ul className="client-list">
            {clientList.map((client) => (
              <li key={client.id} className="client-item">
                <span>{client.name}</span>
                <span className="unlink-container">
                  {renderUnlinkButton(client)}
                </span>
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={clientCount > clientLimit}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    )
};

export default UnlinkModal;
