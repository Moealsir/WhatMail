// components/FloatingMessage.js
import React from "react";
import PropTypes from "prop-types";

// the floating message that include informations
const FloatingMessage = ({ message, onClose, type }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white p-4 rounded-lg shadow-lg`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button className="ml-4" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

FloatingMessage.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["success", "error"]).isRequired,
};

export default FloatingMessage;
