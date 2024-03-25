import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Button,
  InputGroup,
  FormControl,
  Spinner,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCircleCheck,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import moment from "moment";
import StripePricingTable from '../Dashboard/StripePricingTable';
import "./Profile.css";
import UnlinkModal from "./UnlinkModal";


const Profile = () => {
  const [therapist, setTherapist] = useState({
    therapist_id: "",
    email: "",
    name: "",
    profile_picture: null,
    prompt: "",
    sign_up_token: "",
  });

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const imageInputRef = useRef();
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");
  const [clientLimit, setClientLimit] = useState();
  const [clientCount, setClientCount] = useState();
  const [showRemoveClientsModal, setShowRemoveClientsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTherapist = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/retrieveTherapistDetails`,
        {
          withCredentials: true,
        }
      );
      console.log("Therapist: ", response.data);
      setTherapist(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapist();
  }, []);

  const handleChange = (e) => {
    setTherapist({
      ...therapist,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    if (profileUpdated) {
      setTimeout(() => {
        setProfileUpdated(false);
      }, 3000);
    }
  }, [profileUpdated]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    const fileType = file.type;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/generateProfilePictureUploadUrl`,
        {
          fileType,
        },
        { withCredentials: true }
      );

      const { signedUrl } = response.data;

      // Upload the file to S3
      await axios.put(signedUrl, file, {
        headers: {
          "Content-Type": fileType,
        },
      });

      const imageUrl = signedUrl.split("?")[0];
      const uniqueId = Date.now().toString() + Math.random().toString();

      const response2 = await axios
        .put(
          `${process.env.REACT_APP_BACK_END_URL}/api/therapists/changeTherapistProfilePicture`,
          {
            profile_picture: imageUrl,
          },
          { withCredentials: true }
        )
        .then((response) => {
          // Update the profile picture URL in the state
          setTherapist({
            ...therapist,
            profile_picture: `${imageUrl}?id=${uniqueId}`,
          });
          
          setUpdateMessage("Profile picture updated successfully!");
          setProfileUpdated(true);
        });
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitted: ", therapist);

    try {
      const response = await axios
        .put(
          `${process.env.REACT_APP_BACK_END_URL}/api/therapists/modifyTherapistProfile`,
          {
            name: therapist.name,
            email: therapist.email,
            prompt: therapist.prompt,
          },
          { withCredentials: true }
        )
        .then((response) => {
          console.log(response);
          if (response.status === 200) {
            setUpdateMessage("Profile updated successfully!");
            setProfileUpdated(true);
          }
        });
    } catch (error) {
      console.log(error);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    // Reset messages
    setPasswordChangeMessage('');
    setPasswordChangeError('');
  
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACK_END_URL}/api/users/changeUserPassword`, {
    currentPassword,
    newPassword,
  }, { withCredentials: true });
  
  
      if (response.data.message) {
        setPasswordChangeMessage(response.data.message);
        // Optionally clear the form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordChangeError(error.response?.data?.message || 'Failed to change password.');
    }
  };

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };

  const toggleCurrentPasswordVisibility = () => {
    setIsCurrentPasswordVisible(!isCurrentPasswordVisible);
  };

  const toggleNewPasswordVisibility = () => {
    setIsNewPasswordVisible(!isNewPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

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
  useEffect(() => {
    fetchClientLimit();
  }, []);

  const handleOpenModal = () => {
    setShowRemoveClientsModal(true);
  };

  if (loading) {
    return (
      <div
        className="profile-container p-3 d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-grow text-light" role="status"></div>
        <div className="spinner-grow text-light me-2 ms-2" role="status"></div>
        <div className="spinner-grow text-light" role="status"></div>
      </div>
    );
  }

  return (
    <div className="profile-container p-3">
      {profileUpdated && (
        <div className="alert alert-success" role="alert">
          <FontAwesomeIcon
            style={{ marginRight: "8px" }}
            color="green"
            icon={faCircleCheck}
          />
          {updateMessage}
        </div>
      )}
      <Form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-form-row">
          {/* Hiding Profile picture until fixed */}
          {/* <div className="profile-form-col profile-picture">
            <Form.Group className="mb-3" controlId="formProfilePicture">
              <div>
                <img
                  src={therapist.profile_picture}
                  alt="Profile"
                  className="profile-page-profileImage"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
                ref={imageInputRef}
              />
              <Button
                variant="primary"
                className="profile-form-control-image-button"
                onClick={() => imageInputRef.current.click()}
              >
                Change Image
              </Button>
            </Form.Group>
          </div> */}
          <div className="profile-form-col profile-details">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <Button onClick={handleOpenModal} style={{ marginRight: '10px'}}>Unlink Clients</Button>
              <text>Clients: {clientCount} / {clientLimit}</text>
            </div>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                name="name"
                className="profile-form-control"
                value={therapist.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                name="email"
                className="profile-form-control"
                value={therapist.email}
                onChange={handleChange}
              />
            </Form.Group>

            {/* <Form.Group className="mb-3" controlId="formToken">
              <Form.Label>Sign Up Token</Form.Label>
              <InputGroup>
                <FormControl
                  type={isTokenVisible ? "text" : "password"}
                  placeholder="Sign Up Token"
                  name="sign_up_token"
                  className="profile-form-control"
                  value={therapist.sign_up_token}
                  readOnly
                />
                <InputGroup.Text
                  onClick={toggleTokenVisibility}
                  style={{
                    backgroundColor: "#404446",
                    cursor: "pointer",
                    border: "none",
                    color: "white",
                  }}
                >
                  <FontAwesomeIcon icon={isTokenVisible ? faEyeSlash : faEye} />
                </InputGroup.Text>
              </InputGroup>
            </Form.Group> */}
          </div>
        </div>
        {/* <Form.Group className="summary-prompt" controlId="formPrompt">
          <Form.Label>Summary Prompt</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter prompt"
            name="prompt"
            className="profile-form-control"
            value={therapist.prompt}
            onChange={handleChange}
          />
        </Form.Group>
        <div className="w-100 d-flex justify-content-center">
          <Button variant="primary" type="submit">
            Update Profile
          </Button>
        </div> */}
      </Form>

    {/* Password Change Form Section */}  
  <div className="password-change-container">
    <h3 className="password-change-title">Change Password</h3>
    <Form onSubmit={handlePasswordChangeSubmit}>
      <Form.Group controlId="formCurrentPassword" className="mb-3 position-relative">
        <Form.Label>Current Password</Form.Label>
        <Form.Control
          type={isCurrentPasswordVisible ? "text" : "password"}
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Button
          variant="primary"
          className="position-absolute end-0 bottom-0 mb-1 border-0 bg-transparent text-dark"
          onClick={toggleCurrentPasswordVisibility}
        >
        <FontAwesomeIcon icon={isCurrentPasswordVisible ? faEyeSlash : faEye} />
        </Button>
      </Form.Group>

      <Form.Group controlId="formNewPassword" className="mb-3 position-relative">
        <Form.Label>New Password</Form.Label>
        <Form.Control
          type={isNewPasswordVisible ? "text" : "password"}
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Button
          variant="primary"
          className="position-absolute end-0 bottom-0 mb-1 border-0 bg-transparent text-dark"
          onClick={toggleNewPasswordVisibility}
        >
        <FontAwesomeIcon icon={isNewPasswordVisible ? faEyeSlash : faEye} />
        </Button>
      </Form.Group>

      <Form.Group controlId="formConfirmNewPassword" className="mb-3 position-relative">
        <Form.Label>Confirm New Password</Form.Label>
        <Form.Control
          type={isConfirmPasswordVisible ? "text" : "password"}
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
        />
        <Button
          variant="primary"
          className="position-absolute end-0 bottom-0 mb-1 border-0 bg-transparent text-dark"
          onClick={toggleConfirmPasswordVisibility}
        >
        <FontAwesomeIcon icon={isConfirmPasswordVisible ? faEyeSlash : faEye} />
        </Button>
      </Form.Group>

      {passwordChangeError && <div className="alert alert-danger">{passwordChangeError}</div>}
      {passwordChangeMessage && <div className="alert alert-success">{passwordChangeMessage}</div>}

      <Button variant="secondary" type="submit">
        Change Password
      </Button>

    </Form>
  </div> 

      <div style={{ marginBottom: "20px" }}></div>
      {/* Hiding Pricing Table until paid release  */}
      {/* { <StripePricingTable therapistId={therapist.therapist_id}/> } */}
      <UnlinkModal show={showRemoveClientsModal} onHide={() => setShowRemoveClientsModal(false)} showModal={() => setShowRemoveClientsModal(true)}/>
    </div>
  );
};

export default Profile;