import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../Navigation/AdminNav";
import "../MailMessenger.css";
import "./ChatWithOptions.css";

const ChatWithOptions = () => {
  const navigate = useNavigate();
  const users = [
    { id: 1, name: "John Doe", avatar: "https://via.placeholder.com/150" },
    { id: 2, name: "Jane Smith", avatar: "https://via.placeholder.com/150" },
    { id: 3, name: "Jim Beam", avatar: "https://via.placeholder.com/150" },
    { id: 4, name: "Jim Beam", avatar: "https://via.placeholder.com/150" },
    { id: 5, name: "Jim Beam", avatar: "https://via.placeholder.com/150" },
  ];
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleUserOnlineClick = (user) => {
    setSelectedUser(user);
  };

  const handleChatNow = () => {
    if (selectedUser) {
      navigate(`/admin/mail-messenger/messenger?user=${selectedUser.name}`);
    }
  };


  return (
    <div className="admin-container">
      <AdminNav />
      <div className="parent">
        <div className="first">
          <div className="heading-container">
           USERS ONLINE
          </div>
          <div className="users-online-container">
            {users.map((user) => (
              <div className="user-online-item" key={user.id} onClick={() => handleUserOnlineClick(user)}>
                <div className="user-online-item-name" style={{backgroundColor:"white", boxShadow:"0 0 10px 0 rgba(0, 0, 0, 0.1)", padding:"20px 40px", borderRadius:"5px", fontSize:"16px", fontWeight:"600", color:"#333", textTransform:"uppercase", letterSpacing:"0.5px"}}>
                  {user.name}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="second">
          {selectedUser ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" }}>
              <h1>MESSAGE {selectedUser.name.toUpperCase()}</h1>
              <button 
                onClick={handleChatNow}
                style={{
                  backgroundColor: "#0867db",
                  color: "white",
                  border: "none",
                  padding: "15px 50px",
                  fontSize: "16px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  fontFamily: "Montserrat, sans-serif"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#0654b8";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(8, 103, 219, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#0867db";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                CHAT NOW
              </button>
            </div>
          ) : (
            <h1>CHOOSE USER</h1>
          )}
        </div>
      </div>
         </div>
  );
};

export default ChatWithOptions;
