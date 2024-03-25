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
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import moment from "moment";

const Settings = ({ user, setUser, closeSettingsModal }) => {
  const [formData, setFormData] = useState({
    therapeutic_approach: "",
    goal_setting_preference: "",
    clients_strengths_emphasis: "",
    client_resistance_approach: "",
    homework_importance: "",
    therapeutic_metaphors_preference: "",
    feedback_approach: "",
    external_resources_approach: "",
    cultural_considerations: "",
  });

  const [profileUpdated, setProfileUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    if (profileUpdated) {
      setTimeout(() => {
        setProfileUpdated(false);
      }, 3000);
    }
  }, [profileUpdated]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/storeTherapistPreferences`,
        formData,
        { withCredentials: true }
      );
      setProfileUpdated(true);
      setUpdateMessage("Settings saved successfully");
      if(closeSettingsModal) {
        closeSettingsModal();
      }
    } catch (error) {
      alert("Error saving settings");
      console.log(error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/retrieveTherapistPreferences`,
        { withCredentials: true }
      );

      console.log("Settings: ", response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
      <div className="alert alert-dark" role="alert">
        Please Note: Saving new settings will affect the content of client summaries based on new preferences.
      </div>

      <Form onSubmit={handleSubmit} className="profile-form">
        <div className="settings-form-row">
          <div className="settings-form-col">
            <Form.Group controlId="formQuestion1">
              <Form.Label style={{ color: "#fff" }}>
                Therapeutic Approach
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.therapeutic_approach}
                onChange={handleChange}
                name="therapeutic_approach"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="CBT">Cognitive Behavioral Therapy (CBT)</option>
                <option value="DBT">Dialectical Behavior Therapy (DBT)</option>
                <option value="Humanistic">Humanistic/Person-Centered</option>
                <option value="Psychodynamic">Psychodynamic</option>
                <option value="SFBT">
                  Solution-Focused Brief Therapy (SFBT)
                </option>
                <option value="Gestalt">Gestalt Therapy</option>
                <option value="Integrative">Integrative or Eclectic</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion2" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Preference for Goal Setting
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.goal_setting_preference}
                onChange={handleChange}
                name="goal_setting_preference"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Highly Directive (Set specific goals for clients)">
                  Highly Directive (Set specific goals for clients)
                </option>
                <option value="Collaborative (Set goals with clients)">
                  Collaborative (Set goals with clients)
                </option>
                <option value="Non-directive (Allow clients to set their own goals)">
                  Non-directive (Allow clients to set their own goals)
                </option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion3" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Emphasis on Client’s Strengths
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.clients_strengths_emphasis}
                onChange={handleChange}
                name="clients_strengths_emphasis"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Strong Emphasis">Strong Emphasis</option>
                <option value="Moderate Emphasis">Moderate Emphasis</option>
                <option value="Neutral">Neutral</option>
                <option value="Limited Emphasis">Limited Emphasis</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion4" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Approach to Client Resistance
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.client_resistance_approach}
                onChange={handleChange}
                name="client_resistance_approach"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Confront and Challenge">
                  Confront and Challenge
                </option>
                <option value="Explore and Understand">
                  Explore and Understand
                </option>
                <option value="Accept and Redirect">Accept and Redirect</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion5" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Importance of Homework/Outside Tasks
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.homework_importance}
                onChange={handleChange}
                name="homework_importance"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Essential">Essential</option>
                <option value="Beneficial but not necessary">
                  Beneficial but not necessary
                </option>
                <option value="Rarely assign">Rarely assign</option>
                <option value="Never assign">Never assign</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion6" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Preference for Therapeutic Metaphors/Analogies
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.therapeutic_metaphors_preference}
                onChange={handleChange}
                name="therapeutic_metaphors_preference"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Frequently use">Frequently use</option>
                <option value="Occasionally use">Occasionally use</option>
                <option value="Rarely use">Rarely use</option>
                <option value="Never use">Never use</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion7" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Approach to Feedback (from clients)
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.feedback_approach}
                onChange={handleChange}
                name="feedback_approach"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Actively seek during sessions">
                  Actively seek during sessions
                </option>
                <option value="Open to, but do not regularly request">
                  Open to, but do not regularly request
                </option>
                <option value="Rarely discuss in sessions">
                  Rarely discuss in sessions
                </option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion8" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Approach to Incorporating External Resources (books, videos,
                etc.)
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.external_resources_approach}
                onChange={handleChange}
                name="external_resources_approach"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Highly Encouraged">Highly Encouraged</option>
                <option value="Occasionally Recommended">
                  Occasionally Recommended
                </option>
                <option value="Seldom Recommend">Seldom Recommend</option>
                <option value="Never Recommend">Never Recommend</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formQuestion10" className="mt-3">
              <Form.Label style={{ color: "#fff" }}>
                Cultural and Diversity Considerations
              </Form.Label>
              <Form.Control
                as="select"
                value={formData.cultural_considerations}
                onChange={handleChange}
                name="cultural_considerations"
                className="profile-form-control w-100"
              >
                <option value="">Select...</option>
                <option value="Strong Emphasis on Cultural Context">
                  Strong Emphasis on Cultural Context
                </option>
                <option value="Moderate Emphasis on Cultural Context">
                  Moderate Emphasis on Cultural Context
                </option>
                <option value="Neutral">Neutral</option>
                <option value="Limited Emphasis on Cultural Context">
                  Limited Emphasis on Cultural Context
                </option>
              </Form.Control>
            </Form.Group>

            {profileUpdated && (
        <div className="alert alert-success mt-3" role="alert">
          <FontAwesomeIcon
            style={{ marginRight: "8px" }}
            color="green"
            icon={faCircleCheck}
          />
          {updateMessage}
        </div>
      )}
          </div>
        </div>
        <div className="mt-3 w-100 d-flex justify-content-center">
          <Button variant="primary" type="submit">
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;
