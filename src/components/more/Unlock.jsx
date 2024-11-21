import React, { useState } from "react";

const Unlock = () => {
  const [password, setPassword] = useState("");

  const handleUnlock = () => {
    // Implement the logic to unlock the protected PDF file using the provided password
    console.log("Unlocking the PDF file with the password:", password);
  };

  return (
    <div>
      <h2>Remove password</h2>
      <input
        type="password"
        placeholder="Type password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleUnlock}>Unlock</button>
    </div>
  );
};

export default Unlock;
