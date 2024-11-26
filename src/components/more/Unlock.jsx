import React, { useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Unlock = () => {
  const [password, setPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleUnlock = async () => {
    if (!password) {
      alert("Please enter the password");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate unlock process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to export page with file data
      navigate("/export", {
        state: {
          file: selectedFile,
          unlocked: true,
        },
      });
    } catch (error) {
      alert("Failed to unlock the file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Unlock PDF</h1>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex gap-8">
            {/* Left side - File preview */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  {selectedFile ? (
                    <>
                      <div className="bg-red-50 rounded-lg p-8 mb-4 flex items-center justify-center">
                        <div className="w-32 h-40">
                          <img
                            src="/api/placeholder/128/160"
                            alt="PDF preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {selectedFile.name} (
                        {Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    </>
                  ) : (
                    <div className="text-center">
                      <button
                        className="bg-blue-600 text-white px-6 py-2 rounded-md mb-2 hover:bg-blue-700"
                        onClick={() =>
                          document.getElementById("file-input").click()
                        }
                      >
                        Select PDF file
                      </button>
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf"
                      />
                      <p className="text-sm text-gray-500">
                        Select a password-protected PDF file
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Password input */}
            <div className="flex-1 max-w-md">
              <div className="bg-white p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">Remove password</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Type this file's password to unlock it
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md pr-10"
                        placeholder="Password"
                      />
                      <button className="absolute right-3 top-2.5 text-gray-400">
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleUnlock}
                    disabled={isLoading || !selectedFile}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Unlocking..." : "Unlock →"}
                  </button>

                  {isLoading && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500">
                        Unlocking your file... This might take a few seconds
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unlock;
