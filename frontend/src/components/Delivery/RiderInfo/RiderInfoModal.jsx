// import React from "react";
// import RiderInfo from "./RiderInfo";

// const RiderInfoModal = ({ isOpen, toggleInfoModal }) => {
//   const closeModal = () => {
//     toggleInfoModal();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="Csh_modal">
//       <div className="Csh_modal-overlay " onClick={closeModal}></div>
//       <div className="Csh_modal-content">
//         <RiderInfo toggleInfoModal={toggleInfoModal} />
//       </div>
//     </div>
//   );
// };

// export default RiderInfoModal;


import React from "react";
import RiderInfo from "./RiderInfo";

const RiderInfoModal = ({ isOpen, toggleInfoModal }) => {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modalContainer}>
        <RiderInfo toggleInfoModal={toggleInfoModal} />
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(5px)",
    position: "fixed",
    top: 0, left: 0, width: "100vw", height: "100vh",
    zIndex: 2000,
    display: "flex", justifyContent: "center", alignItems: "center",
    padding: "20px",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "100%", maxWidth: "900px",
    maxHeight: "90vh",
    borderRadius: "12px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    overflowY: "auto",
    position: "relative"
  }
};

export default RiderInfoModal;