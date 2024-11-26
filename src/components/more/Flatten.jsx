import React from "react";

const Flatten = () => {
  const handleFlatten = () => {
    // Implement the logic to flatten the PDF file
    console.log("Flattening the PDF file");
  };

  return (
    <div>
      <h2>Flatten PDF</h2>
      <button onClick={handleFlatten}>Flatten</button>
    </div>
  );
};

export default Flatten;
