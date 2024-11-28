import React, { useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Protect = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleProtect = async () => {
    if (!selectedFile) {
      // You can add toast notification here
      alert("Please select a file first");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!password) {
      alert("Please enter a password");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate protection process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to export page with file and password data
      navigate("/export", {
        state: {
          file: selectedFile,
          password: password,
        },
      });
    } catch (error) {
      alert("Failed to protect the file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Protect your PDF</h1>
        </div>

        {!selectedFile ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="text-center">
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-md mb-2 hover:bg-blue-700"
                  onClick={() => document.getElementById("file-input").click()}
                >
                  Select files
                </button>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg"
                />
                <p className="text-sm text-gray-500">
                  Add PDF, image, Word, Excel, and PowerPoint files
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded">
                    PDF
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                    DOC
                  </span>
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded">
                    XLS
                  </span>
                  <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded">
                    PPT
                  </span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded">
                    PNG
                  </span>
                  <span className="px-2 py-1 bg-pink-50 text-pink-600 text-xs rounded">
                    JPG
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6">
            <div className="flex gap-8">
              {/* Left side - Preview */}
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center">
                  {selectedFile && selectedFile.type === "application/pdf" ? (
                    <object
                      data={URL.createObjectURL(selectedFile)}
                      type="application/pdf"
                      className="w-full h-96"
                    >
                      <p>PDF preview not available</p>
                    </object>
                  ) : (
                    <div className="bg-orange-50 rounded-lg p-4 w-full h-96 flex items-center justify-center">
                      <img
                        src="/api/placeholder/200/280"
                        alt="File preview"
                        className="max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)}{" "}
                  KB)
                </p>
              </div>

              {/* Right side - Password setup */}
              <div className="flex-1 max-w-md">
                <div>
                  <h3 className="text-lg font-medium mb-6">Add a password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Type password
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-10"
                          placeholder="Set your password"
                        />
                        <button className="absolute right-3 top-2.5 text-gray-400">
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Repeat password
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md pr-10"
                          placeholder="Confirm your password"
                        />
                        <button className="absolute right-3 top-2.5 text-gray-400">
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    128-bit AES encryption protection
                  </p>
                  <button
                    onClick={handleProtect}
                    disabled={isLoading}
                    className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Working..." : "Protect"}
                    {!isLoading && <span>→</span>}
                  </button>

                  {isLoading && (
                    <div className="text-center mt-4">
                      <p className="text-base">Working...</p>
                      <p className="text-sm text-gray-500">
                        This might take a few seconds...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Protect;
