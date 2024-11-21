import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../ui/toast";

const Protect = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleProtect = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate file protection process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to the ExportPage with the file and password
      navigate("/export", {
        state: { file, password },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to protect the file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Protect your PDF
        </h2>
        {!file ? (
          <div className="flex justify-center">
            <label
              htmlFor="file-input"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md cursor-pointer"
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              Upload File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="preview mb-4">
              <embed
                src={URL.createObjectURL(file)}
                type="application/pdf"
                width="100%"
                height="300px"
              />
            </div>
            <input
              type="password"
              placeholder="Type password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <button
              onClick={handleProtect}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md w-full"
            >
              {isLoading ? "Processing..." : "Protect"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Protect;
