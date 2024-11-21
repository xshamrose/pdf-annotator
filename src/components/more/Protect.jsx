import React, { useState } from "react";

const Protect = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProtect = () => {
    // Implement the logic to protect the PDF file using the provided password
    console.log("Protecting the PDF file with the password:", password);
  };

  return (
    <div>
      <h2>Add a password</h2>
      <input
        type="password"
        placeholder="Type password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleProtect}>Protect</button>
    </div>
  );
};

export default Protect;
