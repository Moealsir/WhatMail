// components/VerificationField.js
import React from "react";

const VerificationField = ({ name, value, error, onChange, onVerify }) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
        Verification Code
      </label>
      <div className="flex">
        <input
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            error ? "border-red-500" : ""
          }`}
          id={name}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
        />
        <button
          className="bg-malachite-500 hover:bg-malachite-700 text-white text-sm text-nowrap font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
          type="button"
          onClick={onVerify}
        >
          Verify
        </button>
      </div>
      {error && <p className="text-red-500 text-xs italic">{error}</p>}
    </div>
  );
};

export default VerificationField;
