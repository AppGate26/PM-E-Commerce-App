import React from "react";
import Chat from "../components/customer_care/chatbox/Chat";
import NavChat from "../components/customer_care/chatbox/NavChat";

const CareChat_page = () => {
  return (
    <div>
      <NavChat />
      <Chat />
    </div>
  );
};

export default CareChat_page;
