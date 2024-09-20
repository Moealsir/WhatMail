// components/FormField.js
import React from "react";

const FormField = ({
  label,
  name,
  type,
  placeholder,
  value,
  error,
  onChange,
  additionalElement,
  disabled,
  readOnly,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
        {label}
      </label>
      <div className="flex">
        <input
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            error ? "border-red-500" : ""
          }`}
          id={name}
          type={type}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
        />
        {additionalElement && <div className="ml-2">{additionalElement}</div>}
      </div>
      {error && <p className="text-red-500 text-xs italic">{error}</p>}
    </div>
  );
};

export default FormField;
