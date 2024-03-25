import React from "react";

const UserListSidebar = ({
  isOpen,
  toggleSidebar,
  isLoading,
  userList,
  searchTerm,
  setSearchTerm,
  setUserNotes,
  setUserJournals,
  handleShowInviteEmailModal,
  handleprocessUserLogout,
  parseUserLastVisit,
  setSelectedUser,
  setStartDate,
  selectedUser,
  requestUnlinkClient,
  clientLimit,
  clientCount,
}) => {
  const sidebarClass = isOpen ? "userList open" : "userList";

  return (
    <div className={sidebarClass}>
      <div className="userListLogo d-flex justify-content-between align-items-center">
        <div className="title">Empath</div>
        <div>
          <button
            className="btn btn-primary p-1 invite-client-btn"
            onClick={handleShowInviteEmailModal} // Updated line
          >
            Invite Client
          </button>
        </div>
        <div style={{textAlign: 'center'}}>
          <p style={{fontSize: 14}}>{clientCount}/{clientLimit} Seats Used</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search users..."
        className="searchBar"
        onChange={(e) => setSearchTerm(e.target.value)}
        value={searchTerm}
      />

      <div className="subUserList">
        {isLoading ? (
          <div className="loadingContainer">
            <div className="spinner-grow text-light" role="status"></div>
            <div
              className="spinner-grow text-light me-2 ms-2"
              role="status"
            ></div>
            <div className="spinner-grow text-light" role="status"></div>
          </div>
        ) : (
          userList
            .filter((user) =>
              user.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((user) => (
              <div
                key={user.id}
                className={`user ${
                  selectedUser && selectedUser.id === user.id
                    ? "selectedUser"
                    : ""
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  setUserNotes(user.notes ?? "No notes yet... click to edit");
                  setUserJournals([]);

                  const lastVisitDate = parseUserLastVisit(user.last_visited);
                  setStartDate(lastVisitDate);

                  toggleSidebar(); // Close the sidebar after selecting a user
                }}
              >
                {user.name}
                {/* Unlink Button */}
                <button
                  className="Unlink-user-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the onClick of the parent div
                    requestUnlinkClient(user.id);
                  }}
                >
                  Unlink
                </button>
              </div>
            ))
        )}
      </div>

      <div className="processUserLogoutButtonContainer p-3">
        <button
          className="btn btn-secondary w-100"
          onClick={handleprocessUserLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserListSidebar;
