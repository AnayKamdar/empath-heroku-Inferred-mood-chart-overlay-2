import React, { useEffect, useState, useRef } from "react";
import { ButtonGroup, Button, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import RadarChart from "./DataVisual";
import WordCloud from "./WordCloud";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import compromise from "compromise";
import Settings from "./Settings";
import Profile from "./Profile";
import { toDataURL } from "qrcode";
import ApproachAvoidanceBar from './ApproachAvoidanceBar'; // Adjust the path as necessary
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { addFeedback } from "./Feedback/feedbackService";

import UserListSidebar from "./UserListSidebar"; // Update the path as per your file structure

import AppleHealth from "./AppleHealth";

import { useIdleTimer } from "react-idle-timer";
import UnlinkModal from "./UnlinkModal";

function TherapistDashboard() {

  const handleClientSelect = (user) => {
  setSelectedUser(user);
  localStorage.setItem('selectedClient', JSON.stringify(user));
};

const handleSelectClient = (user) => {
  if (user.id !== selectedUser.id) {
    localStorage.removeItem('selectedClient'); // Clear the stored selected client
    handleClientSelect(user); // Select the new client
  }
};

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [selectedNavItem, setSelectedNavItem] = useState("Home");
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

  const [selectedUser, setSelectedUser] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userJournals, setUserJournals] = useState([]);
  const [expandedJournalIndex, setExpandedJournalIndex] = useState(-1);
  const [userSummary, setUserSummary] = useState();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userNotes, setUserNotes] = useState("No notes yet... click to edit");
  const [saveTimeoutId, setSaveTimeoutId] = useState(null);
  const notesRef = useRef(null);
  const [showCheckIcon, setShowCheckIcon] = useState(false);
  const [feelingMood, setFeelingMood] = useState([]);
  const [isJournalLoading, setIsJournalLoading] = useState(false);
  const [emotionData, setEmotionData] = useState([
    { category: "Alert/Anxious", value: 0.0 },
    { category: "Excited/Elated", value: 0.0 },
    { category: "Pleased", value: 0.0 },
    { category: "Content/Relaxed", value: 0.0 },
    { category: "Calm/Indifferent", value: 0.0 },
    { category: "Depressed/Bored", value: 0.0 },
    { category: "Dissapointed", value: 0.0 },
    { category: "Angry/Frustrated", value: 0.0 },
  
  ]);

  const [emotionData2, setEmotionData2] = useState([
    { category: "Alert/Anxious", value: 0.5 },
    { category: "Excited/Elated", value: 0.5 },
    { category: "Pleased", value: 0.5 },
    { category: "Content/Relaxed", value: 0.5 },
    { category: "Calm/Indifferent", value: 0.5 },
    { category: "Depressed/Bored", value: 0.5 },
    { category: "Dissapointed", value: 0.5 },
    { category: "Angry/Frustrated", value: 0.5},
  ]);
  const [wordLimit,setWordLimit]= useState(50)

  const [wordData, setWordData] = useState([]);
  const [showInviteEmailModal, setShowInviteEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErrorText, setEmailErrorText] = useState(null);
  const [isValidEmail, setIsValidEmail] = useState(true);

  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState(false);
  const [clientToUnlink, setClientToUnlink] = useState(null);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  const [timeFilter, setTimeFilter] = useState('1week');
  const [averageApproachWithdrawalScore, setAverageApproachWithdrawalScore] = useState(0);
  const [showRemoveClientsModal, setShowRemoveClientsModal] = useState(false);
  const [healthData, setHealthData] = useState([]);
  const [emailErrorHtml, setEmailErrorHtml] = useState(null);

  // Feedback 
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0); // Default value can be changed
  const [showConfirmation, setShowConfirmation] = useState(false);
  const handleFeedbackTextChange = (event) => {
    setFeedbackText(event.target.value);
  };
  const handleFeedbackRatingChange = (value) => {
    setFeedbackRating(value);
  };

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selectedClient', JSON.stringify(selectedUser));
    }
  }, [selectedUser]);
  
  useEffect(() => {
  console.log("fetch user list");
  fetchfetchTherapistClients();

  const storedSelectedClient = localStorage.getItem('selectedClient');
  if (storedSelectedClient) {
    setSelectedUser(JSON.parse(storedSelectedClient));
  }
}, []);

  const [clickedJournalId, setClickedJournalId] = useState(null);
  const handleJournalClick = (journalId) => {
    setClickedJournalId(journalId);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest(".journalEntry")) {
        setClickedJournalId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Whenever selectedUser, startDate, or endDate changes, fetch journal entries
  useEffect(() => {
    if (selectedUser) {
      console.log("Fetching journals, health data, and sentiment data for selected user:", selectedUser);
      const fetchAdditionalData = async () => {
        await retrieveClientJournalEntries(selectedUser, startDate, endDate);
        await retrieveClientsAppleHealthData(selectedUser.id);
        await retriveSemiementData(selectedUser, startDate, endDate); // Call to fetch sentiment and mood data
      };
  
      fetchAdditionalData();
    }
  }, [selectedUser, startDate, endDate]);
  

  useEffect(() => {
    if (userJournals.length > 0) {
      const totalScore = userJournals.reduce((acc, journal) => acc + (journal.approach_withdrawal || 0), 0);
      const averageScore = totalScore / userJournals.length;
      setAverageApproachWithdrawalScore(averageScore);
    } else {
      setAverageApproachWithdrawalScore(0); // Reset if no journals are found
    }
  }, [userJournals]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const totalJournals = userJournals.length;
    const updatedEmotionData = emotionData.map((emotion) => {
      const relevantJournals = userJournals.filter(
        (journal) =>
          mapEmotion(journal.feeling, journal.intensity) === emotion.category
      );
      return {
        ...emotion,
        value: relevantJournals.length,
      };
    });
    console.log("updatedEmotionData", updatedEmotionData);
    const emotionDataWithPercentages = updatedEmotionData.map((emotion) => {
      return {
        ...emotion,
        value: totalJournals > 0 ? emotion.value / totalJournals : 0,
      };
    });

    console.log("emotionDataWithPercentages", emotionDataWithPercentages);

    const maxValue = Math.max(
      ...emotionDataWithPercentages.map((e) => e.value)
    );
    const adjustedEmotionData = emotionDataWithPercentages.map((emotion) => {
      return {
        ...emotion,
        value: maxValue > 0 ? (emotion.value / maxValue) * 1.05 : 0,
      };
    });
    console.log("adjustedEmotionData", adjustedEmotionData);
    setEmotionData(adjustedEmotionData);
    const fillerWords = [
      "i",
      "me",
      "my",
      "myself",
      "we",
      "our",
      "ours",
      "ourselves",
      "you",
      "your",
      "yours",
      "yourself",
      "yourselves",
      "he",
      "him",
      "his",
      "himself",
      "she",
      "her",
      "hers",
      "herself",
      "it",
      "its",
      "itself",
      "they",
      "them",
      "their",
      "theirs",
      "themselves",
      "what",
      "which",
      "who",
      "whom",
      "this",
      "that",
      "these",
      "those",
      "am",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "having",
      "do",
      "does",
      "did",
      "doing",
      "a",
      "an",
      "the",
      "and",
      "but",
      "if",
      "or",
      "because",
      "as",
      "until",
      "while",
      "of",
      "at",
      "by",
      "for",
      "with",
      "about",
      "against",
      "between",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "to",
      "from",
      "up",
      "down",
      "in",
      "out",
      "on",
      "off",
      "over",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "s",
      "t",
      "can",
      "will",
      "just",
      "don",
      "should",
      "now",
    ];

    const wordFrequencies = {};

    userJournals.forEach((journal) => {
      const words = compromise(journal.text)
        .terms()
        .out("array")
        .map((word) => word.toLowerCase());

      words.forEach((word) => {
        if (word && !fillerWords.includes(word)) {
          wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        }
      });
    });

    const wordData = Object.keys(wordFrequencies)
      .map((word) => ({
        text: word,
        value: wordFrequencies[word],
      }))
      .sort((a, b) => b.value - a.value);

    const wordCloudWordsData = wordData.slice(0, wordLimit).map((word) => ({
      text: word.text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""),
      value: word.value,
    }));

    console.log("wordCloudWordsData", wordCloudWordsData);

    setWordData(wordCloudWordsData);
  }, [userJournals]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACK_END_URL}/api/therapists/fetchTherapistSignUpCode`,
          {
            withCredentials: true,
          }
        );

        const fetchTherapistSignUpCode = response.data.fetchTherapistSignUpCode;

        console.log("fetchTherapistSignUpCode", fetchTherapistSignUpCode);

        const qrCodeValue = `${process.env.REACT_APP_BACK_END_URL}/addClinet/${fetchTherapistSignUpCode}`;

        console.log("qrCodeValue", qrCodeValue);

        toDataURL(qrCodeValue, (err, url) => {
          if (err) {
            console.error(err);
            return;
          }

          setQrCodeDataUrl(url);
        });
      } catch (error) {
        console.error("Failed to fetch therapist code:", error);
      }
    };

    fetchData();
  }, []);

  const handleFeedbackSubmit = async () => {
    console.log("Submit Feedback button clicked");
    // Create feedBack object
    const feedBack = {
      feedbackText: feedbackText,
      feedbackRating: feedbackRating,
    };
    console.log(feedBack);
    try {
      const response = await addFeedback({ feedbackText, feedbackRating });
      if (response.status >= 200 && response.status < 300) {
        // Successfully saved the feedback entry
        setFeedbackText("");
        setFeedbackRating(0);
        setTimeout(() => {
          setShowConfirmation(true);
        }, 30); // Adjust the delay time here
      } else {
        // Handle the case when the API call was not successful
        console.error("Failed to save Feedback:", response);
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  // Invite client
  const sendClientInviteLink = async () => {
    if (!isValidEmail) {
      setEmailErrorText("Please enter a valid email address");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/sendClientInviteLink`,
        { email },
        { withCredentials: true }
      );
      console.log(response.data);
      setShowInviteEmailModal(false);
      setEmail("");
      setEmailErrorText(null); // Reset any existing error message
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setEmailErrorText(null); // Reset text error
        setEmailErrorHtml({ __html: error.response.data.message });
      } else {
        console.error("Error sending email", error);
        setEmailErrorText("Error sending email");
        setEmailErrorHtml(null); // Reset HTML error
      }
    }
  };

  // Summary generation
  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setShowConfirmation(false); // Reset confirmation message
    await generateClientJournalSummary(selectedUser, startDate, endDate);
    setIsSummaryLoading(false);
  };

  const handleTwoWeekSummary = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    setStartDate(twoWeeksAgo);
    setEndDate(new Date());
    setTimeFilter('2weeks');
    await handleGenerateSummary();
  };

  const handleOneWeekSummary = async () => {
    const oneWeeksAgo = new Date();
    oneWeeksAgo.setDate(oneWeeksAgo.getDate() - 7);
    setStartDate(oneWeeksAgo);
    setEndDate(new Date());
    setTimeFilter('1week');
    await handleGenerateSummary();
  };

  const handleOneMonthSummary = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 31);
    setStartDate(oneMonthAgo);
    setEndDate(new Date());
    setTimeFilter('1month');
    await handleGenerateSummary();
  };

  const [journalIdMap, setJournalIdMap] = useState({}); // Add this state to store the mapping
  const generateClientJournalSummary = async (user, startDate, endDate) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/generateClientJournalSummary`,
        {
          userId: user.id,
          startDate: startDate,
          endDate: endDate,
          emotionData: emotionData,
        },
        { withCredentials: true }
      );
      console.log("generateClientJournalSummary", response.data);
      if (response.data.message === "No journals found") {
        setUserSummary(response.data.message);
      } else {
        setUserSummary(response.data);
        setJournalIdMap(response.data.journalIdMap || {}); // Store the journalIdMap
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  

  const fetchfetchTherapistClients = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/fetchTherapistClients`,
        { withCredentials: true }
      );
  
      console.log("userList", response.data);
      setUserList(response.data);
  
      const storedSelectedClient = localStorage.getItem('selectedClient');
      if (!storedSelectedClient && response.data.length > 0) {
        setSelectedUser(response.data[0]);
      }
  
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const handleCloseInviteEmailModal = () => {
    setShowInviteEmailModal(false);
    setEmail("");
    setEmailErrorText(null);
  };
  const handleShowInviteEmailModal = () => setShowInviteEmailModal(true);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setIsValidEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value));
  };

  // Fetch journals for selected user
  const retrieveClientJournalEntries = async (user, startDate, endDate) => {
    setIsJournalLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/retrieveClientJournalEntries`,
        {
          userId: user.id,
          startDate: startDate,
          endDate: endDate,
        },
        { withCredentials: true }
      );
      console.log("retrieveClientJournalEntries", response.data);
      setUserJournals(response.data);
      setIsJournalLoading(false);
    } catch (error) {
      console.log(error);
      setIsJournalLoading(false);
    }
  };

  


  const retriveSemiementData = async (user, startDate, endDate) => {
    setIsJournalLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/generate_Feeling_Mood`,
        {
          userId: user.id,
          startDate: startDate,
          endDate: endDate,
        },
        { withCredentials: true }
      );
      console.log("generate_Feeling_Mood", response.data);
      setFeelingMood(response.data);
      setIsJournalLoading(false);
    } catch (error) {
      console.log(error);
      setIsJournalLoading(false);
    }
  };

  // health data
  const retrieveClientsAppleHealthData = async (user) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/appleHealth/getAppleHealthData`,
        {
          userId: user,
        },
        { withCredentials: true }
      );
      setHealthData(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const parseUserLastVisit = (last_visited) => {
    console.log("lastVisit", last_visited);
    if (last_visited === null) {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date;
    }

    const date = new Date(last_visited);
    if (!isNaN(date.getTime())) {
      return date;
    } else {
      console.error(`Invalid date string: ${last_visited}`);
      return new Date();
    }
  };

  function mapFeeling(feeling, intensity) {
    const positions = {
      "Alert/Anxious": [0, 1],
      "Excited/Elated": [0.75, 0.75],
      Pleased: [1, 0],
      "Content/Relaxed": [0.75, -0.75],
      "Calm/Indifferent": [0, -1],
      "Depressed/Bored": [-0.75, -0.75],
      Disappointed: [-1, 0],
      "Angry/Frustrated": [-0.75, 0.75],
    };
    let closestCategory = null;
    let minDistance = Infinity;
    Object.entries(positions).forEach(([category, [x, y]]) => {
      const distance = Math.sqrt((x - feeling) ** 2 + (y - intensity) ** 2);
      if (distance < minDistance) {
        closestCategory = category;
        minDistance = distance;
      }
    });
    return closestCategory;
  }

  function mapEmotion(feeling, intensity) {
    const positions = {
      "Alert/Anxious": [0, 1],
      "Excited/Elated": [0.75, 0.75],
      Pleased: [1, 0],
      "Content/Relaxed": [0.75, -0.75],
      "Calm/Indifferent": [0, -1],
      "Depressed/Bored": [-0.75, -0.75],
      Disappointed: [-1, 0],
      "Angry/Frustrated": [-0.75, 0.75],
    };
    let closestCategory = null;
    let minDistance = Infinity;
    Object.entries(positions).forEach(([category, [x, y]]) => {
      const distance = Math.sqrt((x - feeling) ** 2 + (y - intensity) ** 2);
      if (distance < minDistance) {
        closestCategory = category;
        minDistance = distance;
      }
    });
    return closestCategory;
  }

  const parseSummaryText = (summaryText) => {
  const regex = /(\[\d+(?:, \d+)*\])/g; // Matches [1] and [3, 5] and [1, 2, 4, 6]
  let parts = [];
  let lastIndex = 0;

  summaryText.replace(regex, (match, p1, offset) => {
    // Add the text before the match
    if (lastIndex !== offset) {
      parts.push({ type: 'text', value: summaryText.slice(lastIndex, offset) });
    }
    // Add the match
    parts.push({ type: 'ref', value: p1 });
    lastIndex = offset + p1.length;
  });

  // Add any remaining text after the last match
  if (lastIndex < summaryText.length) {
    parts.push({ type: 'text', value: summaryText.slice(lastIndex) });
  }

  return parts;
};

const renderSummaryWithReferences = (summaryText) => {
  if (typeof summaryText !== 'string') {
    // Handle the case when summaryText is not a string
    // You can convert it to a string or handle it based on its data type
    summaryText = summaryText.toString();
  }

  const bulletPoints = summaryText.split('\n,').filter(point => point.trim() !== '');

  return (
    <ul className="summaryText">
      {bulletPoints.map((point, index) => {
        const parts = parseSummaryText(point);

        return (
          <li key={index}>
            {parts.map((part, partIndex) => {
              if (part.type === 'ref') {
                const ids = part.value.replace(/[\[\]]/g, '').split(', ');

                return (
                  <span key={partIndex}>
                    {ids.map((id, idIndex) => (
                      <JournalReference key={idIndex} journalId={id.trim()} scrollToJournal={scrollToJournal} />
                    ))}
                  </span>
                );
              } else {
                return <span key={partIndex}>{part.value}</span>;
              }
            })}
          </li>
        );
      })}
    </ul>
  );
};

const JournalReference = ({ journalId, scrollToJournal }) => {
  return (
    <span
      className="journalReference"
      onClick={() => scrollToJournal(journalId)}
      style={{ textDecoration: "underline", cursor: "pointer", marginRight: '5px' }}
    >
      [{journalId}]
    </span>
  );
};


  const scrollToJournal = (sequentialJournalId) => {
    // Convert sequentialJournalId to number since keys in journalIdMap might be stored as strings
    sequentialJournalId = Number(sequentialJournalId);
    
    // Use the journalIdMap to find the original journal ID
    const originalJournalId = journalIdMap[sequentialJournalId];
    
    if (originalJournalId) {
      const journalElement = document.querySelector(
        `.journalEntry[data-journal-id="${originalJournalId}"]`
      );
      console.log("journalElement", journalElement);
    
      if (journalElement) {
        journalElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    
        const index = userJournals.findIndex(
          (journal) => journal.journal_id === originalJournalId
        );
    
        if (index !== -1) {
          setExpandedJournalIndex(index);
        }
      }
    } else {
      console.log(`No mapping found for sequential ID: ${sequentialJournalId}`);
    }
  };
  
  

  const renderContent = () => {
    switch (selectedNavItem) {
      case "Home":
        return (
          <div>
            {selectedUser == "" ? (
              <>
                <div className="selectUserText">
                  <p className="dashboardSubtitle">
                    Select a user to view their summary
                  </p>
                </div>
              </>
            ) : (
              <div className="dashboardUserSummary">
                <div className="profileWrapper">
                  <div className="profileSection">
                    {/* <div className="profileLeft">
                      <img
                        src={selectedUser.profile_picture}
                        alt="User's Profile"
                        className="profileImage"
                      />
                    </div> */}
                    <div className="profileRight">
                      <h2 className="profileTitle">
                        {selectedUser.name}{" "}
                        <span
                          className={`show-icon ${
                            showCheckIcon ? "" : "hide-icon"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="fa-circle-check custom-green"
                          />
                        </span>
                      </h2>
                      <p className="m-0 p-0 lastVisited">
                        Last visited:{" "}
                        {moment(selectedUser.last_visited).isValid()
                          ? moment(selectedUser.last_visited).format(
                              "MM-DD-YYYY"
                            )
                          : "Not logged yet"}
                      </p> 

                      {/* <textarea
                        value={userNotes}
                        onChange={handleNotesChange}
                        className="userNotes w-100"
                        disabled={!selectedUser}
                      /> */}
                    </div>
                  </div>
                  <AppleHealth healthData={healthData} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />

                  <div className="radarChartContainer">
                    <h3 className="radarChartTitle">Mood Chart</h3>
                    {/* <div className="radarChart"> */}
                    <RadarChart props={emotionData2} />
                    <ApproachAvoidanceBar averageScore={averageApproachWithdrawalScore} />
                    {/* </div> */}
                  </div>
                  <div className="wordChartContainer">
                    <h3 className="wordChartTitle">Top Words</h3>
                    <div className="wordChart">
                      <WordCloud words={wordData} />
                    </div>
                  </div>
                </div>

                <div className="summarySection">
                  <div className="row d-flex">
                    <div className="row d-flex justify-content-center">
                      <div className="button-group">
                        <button
                          onClick={handleOneWeekSummary}
                          className="twoWeekSummaryButton"
                        >
                          1-week Summary
                        </button>
                        <button
                          onClick={handleTwoWeekSummary}
                          className="twoWeekSummaryButton"
                        >
                          2-Week Summary
                        </button>
                        <button
                          onClick={handleOneMonthSummary}
                          className="twoWeekSummaryButton"
                        >
                          1-month Summary
                        </button>
                      </div>
                    </div>
                    <div className="col-sm-6 pe-2">
                      <div className="dateContainer">
                        <label className="dateText">Start Date:</label>
                        <input
                          type="date"
                          className="dateInput"
                          value={startDate.toISOString().split("T")[0]}
                          onChange={(e) =>
                            setStartDate(new Date(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="col-sm-6 col-sm-6 ps-2">
                      <div className="dateContainer">
                        <label className="dateText">End Date:</label>
                        <input
                          type="date"
                          className="dateInput"
                          value={endDate.toISOString().split("T")[0]}
                          onChange={(e) => setEndDate(new Date(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="col-sm-12 col-sm-6 mb-3">
                      <button
                        onClick={handleGenerateSummary}
                        className="handleGenerateSummaryButton"
                      >
                        {isSummaryLoading ? (
                          <div className="loadingContainer">
                            <div
                              className="spinner-grow text-light"
                              role="status"
                            ></div>
                            <div
                              className="spinner-grow text-light me-2 ms-2"
                              role="status"
                            ></div>
                            <div
                              className="spinner-grow text-light"
                              role="status"
                            ></div>
                          </div>
                        ) : (
                          "Generate Summary For these Dates"
                        )}
                      </button>
                    </div>
                    <div className="col-sm-12 col-sm-6 mb-3"></div>
                  </div>

                  <div className="userJournals">
                    {userSummary ? (
                      <div className="summaryBlock">
                        <div className="summaryTitle">Summary</div>

                        <div className="summaryText">
                        {renderSummaryWithReferences(userSummary.summary)}
        </div>
                        <div className="feedbackForm">
                          <div className="feedbackTitle">
                            Feedback on Summary Quality
                          </div>
                          <textarea
                            placeholder="How was the summary? What was good? What was bad?"
                            value={feedbackText}
                            onChange={handleFeedbackTextChange}
                            className="feedbackTextbox"
                          />
                          {/* Star Rating */}
                          <div className="starRating">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FontAwesomeIcon
                                key={star}
                                icon={
                                  star <= feedbackRating
                                    ? faStar
                                    : faStarRegular
                                }
                                className="star"
                                onClick={() => handleFeedbackRatingChange(star)}
                                style={{ fontSize: "2rem", color: "#ffd700" }} // Adjust size and color here
                              />
                            ))}
                          </div>
                          <button
                            onClick={handleFeedbackSubmit}
                            className="submitFeedbackButton"
                          >
                            Submit Feedback
                          </button>
                          {showConfirmation && (
                            <div className="confirmationMessage">
                              Thank you! Your feedback has been submitted. Look
                              out for updates and improvements based on this.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {isJournalLoading ? (
                      <div className="loadingContainer mt-3">
                        <div
                          className="spinner-grow text-light"
                          role="status"
                        ></div>
                        <div
                          className="spinner-grow text-light me-2 ms-2"
                          role="status"
                        ></div>
                        <div
                          className="spinner-grow text-light"
                          role="status"
                        ></div>
                      </div>
                    ) : userJournals.length > 0 ? (
                      userJournals.map((journal, index) => (
                        <div
                          key={index}
                          className={`journalEntry ${
                            clickedJournalId === journal.journal_id
                              ? "journalEntry-clicked"
                              : ""
                          }`}
                          data-journal-id={journal.journal_id}
                          onClick={() => {
                            setExpandedJournalIndex(
                              index === expandedJournalIndex ? -1 : index
                            );
                            handleJournalClick(journal.journal_id);
                          }}
                        >
                          <h3 className="journalTitle">{journal.title}</h3>
                          <small className="journalDate">
                            {new Date(journal.updated_at).toDateString()}
                          </small>
                          {expandedJournalIndex === index && (
                            <p className="journalText">{journal.text}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="noJournalsMessage">
                        
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "Profile":
        return <Profile />;
      case "Settings":
        return <Settings />;
      default:
        return <div>Select a tab to see the content</div>;
    }
  };

  const handleprocessUserLogout = () => {
    axios
      .post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/processUserLogout`,
        {},
        { withCredentials: true }
      )
      .then((response) => {
        console.log("successfully logged out");
        localStorage.removeItem('selectedClient'); // Clear the stored selected client
        navigate("/");
      })
      .catch((error) => {
        console.error("processUserLogout failed", error);
      });
  };

  //Idle timer functions-----------------------

  const timeout = 60 * 60 * 1000;
  const promptBeforeIdle = 60 * 5 * 1000;

  const [remaining, setRemaining] = useState(timeout);
  const [open, setOpen] = useState(false);

  const onIdle = () => {
    setOpen(false);
    handleprocessUserLogout();
  };

  const onActive = () => {
    setOpen(false);
  };

  const onPrompt = () => {
    setOpen(true);
  };

  const { getRemainingTime, activate } = useIdleTimer({
    onIdle,
    onActive,
    onPrompt,
    timeout,
    promptBeforeIdle,
    throttle: 500,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000));
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleStillHere = () => {
    activate();
  };

  //-----------------------

  const [missingSettings, setMissingSettings] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/retrieveTherapistPreferences`,
        { withCredentials: true }
      );
      console.log("Settings: ", response.data);
      setMissingSettings(Object.keys(response.data).length === 0);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchSettings();
  }, []);

  const closeSettingsModal = () => {
    setMissingSettings(false);
  }

  const requestUnlinkClient = (clientId) => {
    setClientToUnlink(clientId);
    setShowUnlinkConfirmation(true);
  };

  const handleUnlinkClient = async () => {
    if (!clientToUnlink){ 
     console.log("wehwehrwher");
      return; 
    }
    const userId = clientToUnlink;
    try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACK_END_URL}/api/users/unlinkClientFromTherapist`,
                { userId },
                { withCredentials: true }
            );
      const data = await response.json();
      if (data.message) {
        console.log(data.message);
        setUserList(userList.filter((user) => user.id !== clientToUnlink));
      }
    } catch (error) {
      console.error("Error unlinking client: ", error);
    }

    setClientToUnlink(null);
    setShowUnlinkConfirmation(false);
  };

  const [clientLimit, setClientLimit] = useState();
  const [clientCount, setClientCount] = useState();

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
  }, [clientCount, clientLimit]);

  return (
    <div className="dashboardContainer">
      {/* Toggle Button for Sidebar */}
      <button onClick={toggleSidebar} className="sidebar-toggle-btn">
        Client List
      </button>
      <Modal show={showInviteEmailModal} onHide={handleCloseInviteEmailModal}>
        <Modal.Header closeButton>
          <Modal.Title>Send out invite email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {emailErrorHtml ? (
            <div
              className="alert alert-danger"
              dangerouslySetInnerHTML={emailErrorHtml}
            />
          ) : (
            emailErrorText && (
              <div className="alert alert-danger">{emailErrorText}</div>
            )
          )}

          <input
            type="email"
            className="form-control p-3"
            value={email}
            onChange={handleEmailChange}
            style={{
              width: "100%",
              borderColor: isValidEmail ? "lightgray" : "red",
            }}
            placeholder="Enter email address"
          />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <button
            className="btn btn-secondary p-2 m-1"
            onClick={handleCloseInviteEmailModal}
          >
            Close
          </button>
          <button
            className="btn btn-primary p-2 m-1"
            onClick={sendClientInviteLink}
          >
            Send Invite
          </button>
        </Modal.Footer>
      </Modal>

      <UserListSidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isLoading={isLoading}
        userList={userList}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setSelectedUser={setSelectedUser}
        setUserNotes={setUserNotes}
        setUserJournals={setUserJournals}
        handleShowInviteEmailModal={handleShowInviteEmailModal}
        handleprocessUserLogout={handleprocessUserLogout}
        parseUserLastVisit={parseUserLastVisit}
        selectedUser={selectedUser}
        setStartDate={setStartDate}
        handleUnlinkClient={handleUnlinkClient}
        requestUnlinkClient={requestUnlinkClient}
        clientLimit={clientLimit}
        clientCount={clientCount}
      />

      <Modal
        show={showUnlinkConfirmation}
        onHide={() => setShowUnlinkConfirmation(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Unlink Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to unlink this client?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUnlinkConfirmation(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleUnlinkClient}>
            Unlink
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="dashboardContent">
        <div className="navBar">
          <ButtonGroup
            className="buttonGroupDashboardContent"
            aria-label="Basic example"
          >
            <Button
              variant={selectedNavItem === "Home" ? "primary" : "secondary"}
              onClick={() => setSelectedNavItem("Home")}
            >
              Home
            </Button>
            <Button
              variant={selectedNavItem === "Profile" ? "primary" : "secondary"}
              onClick={() => setSelectedNavItem("Profile")}
            >
              Profile
            </Button>
            <Button
              variant={selectedNavItem === "Settings" ? "primary" : "secondary"}
              onClick={() => setSelectedNavItem("Settings")}
            >
              Settings
            </Button>
          </ButtonGroup>
        </div>
        {/* Remove Top bar
        <div className="topBar">
          <img
            src={dashboardImage}
            alt="Dashboard"
            className="dashboardImage"
          />
          <div className="timeDisplay">{currentTime}</div>
        </div> */}
        <div className="dashContainer">{renderContent()}</div>
      </div>
      <div className="idleModal" style={{ display: open ? "flex" : "none" }}>
        <div className="idle-modal-box">
          <h3>Are you still here?</h3>
          <p>Logging out in {remaining} seconds</p>
          <div className="button-container">
            <button onClick={handleStillHere}>I'm still here</button>
          </div>
        </div>
      </div>
      <div>
        <Modal show={missingSettings} onHide={() => setMissingSettings(false)} dialogClassName="settings-modal">
          <Modal.Header>
            <Modal.Title>Finish Setting Up</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Settings closeSettingsModal={closeSettingsModal} />
          </Modal.Body>
        </Modal>
      </div>
      <div>
        <UnlinkModal show={showRemoveClientsModal} onHide={() => setShowRemoveClientsModal(false)} showModal={() => setShowRemoveClientsModal(true)}/>
      </div>
    </div>
  );
}
export default TherapistDashboard;
