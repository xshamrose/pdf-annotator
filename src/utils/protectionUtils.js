// utils/protectionUtils.js
import { PDFDocument } from "pdf-lib";

/**
 * Protects a PDF file with a password using AES-256 encryption
 * @param {File} file - The PDF file to protect
 * @param {string} password - The password to encrypt the PDF with
 * @returns {Promise<Blob>} - A promise that resolves with the encrypted PDF as a Blob
 */
export const protectPDF = async (file, password) => {
  try {
    // Validate inputs
    if (!file || !(file instanceof File)) {
      throw new Error("Invalid file input");
    }

    if (!password || typeof password !== "string" || password.length === 0) {
      throw new Error("Invalid password");
    }

    // Check if file is PDF
    if (!file.type.includes("pdf")) {
      throw new Error("File must be a PDF");
    }

    // Read the file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    console.log("Encrypting PDF with password:", password);
    // Save with encryption options
    const encryptedPdfBytes = await pdfDoc.save({
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: "lowResolution",
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });
    console.log("Encrypted PDF bytes length:", encryptedPdfBytes.length);
    // Return as Blob
    return new Blob([encryptedPdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Error protecting PDF:", error);
    throw new Error(`Failed to protect PDF: ${error.message}`);
  }
};
/**
 * Validates if a file can be protected
 * @param {File} file - The file to validate
 * @returns {Promise<boolean>} - Whether the file can be protected
 */
export const canProtectFile = async (file) => {
  try {
    if (!file || !(file instanceof File)) {
      return false;
    }

    if (!file.type.includes("pdf")) {
      return false;
    }

    const fileBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
    });

    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the encryption status of a PDF file
 * @param {File} file - The PDF file to check
 * @returns {Promise<Object>} - Encryption status information
 */
export const getPDFEncryptionInfo = async (file) => {
  try {
    const fileBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
    });

    return {
      isEncrypted: pdfDoc.isEncrypted,
      encryptionAlgorithm: pdfDoc.isEncrypted ? "AES" : null,
      hasPassword: pdfDoc.isEncrypted,
    };
  } catch (error) {
    console.error("Error checking PDF encryption:", error);
    throw new Error("Failed to check PDF encryption status");
  }
};

export const unlockPDF = async (file, password) => {
  console.log(password, "password from unlock page");

  try {
    // Validate inputs
    if (!file || !(file instanceof File)) {
      throw new Error("Invalid file input");
    }

    if (!password || typeof password !== "string" || password.length === 0) {
      throw new Error("Invalid password");
    }

    // Read the file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Multiple attempts with different password handling
    const passwordAttempts = [
      password, // Original password
      password.trim(), // Remove leading/trailing whitespaces
      encodeURIComponent(password), // URL encode
      encodeURIComponent(password.trim()), // URL encode and trim
    ];

    for (const attemptPassword of passwordAttempts) {
      try {
        const pdfDoc = await PDFDocument.load(fileBuffer, {
          password: attemptPassword,
          ignoreEncryption: false,
        });

        // If successful, save the PDF without encryption
        const unlockedPdfBytes = await pdfDoc.save();

        // Create a new Blob with the unlocked PDF
        const unlockedFile = new Blob([unlockedPdfBytes], {
          type: "application/pdf",
        });

        // Rename the file to indicate it's unlocked
        unlockedFile.name = `Unlocked_${file.name}`;

        return {
          success: true,
          unlockedFile: unlockedFile,
          message: "PDF unlocked successfully",
        };
      } catch (decryptionError) {
        // Continue to next attempt if current fails
        console.log(
          `Attempt with password: ${attemptPassword} failed`,
          decryptionError
        );
      }
    }

    // If all attempts fail
    throw new Error("Incorrect password. Please verify and try again.");
  } catch (error) {
    console.error("PDF Unlock Error:", error);
    throw new Error(error.message || "Failed to unlock PDF");
  }
};

// Additional utility to check encryption status
export const checkPDFEncryption = async (file) => {
  try {
    const fileBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
    });

    return {
      isEncrypted: pdfDoc.isEncrypted,
      encryptionMethod: pdfDoc.isEncrypted ? "Detected" : "None",
    };
  } catch (error) {
    console.error("Encryption Check Error:", error);
    return {
      isEncrypted: false,
      encryptionMethod: "Unknown",
    };
  }
};

export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: "Password is required",
    };
  }
  return {
    isValid: true,
    message: "Password is valid",
  };
};

export const validateFile = (file) => {
  if (!file) {
    return {
      isValid: false,
      message: "Please select a file",
    };
  }

  const validTypes = ["application/pdf"];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      message: "Please select a valid PDF file",
    };
  }

  // Maximum file size (e.g., 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: "File size exceeds maximum limit (100MB)",
    };
  }

  return {
    isValid: true,
    message: "File is valid",
  };
};
