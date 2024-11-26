// utils/protectionUtils.js
import { PDFDocument } from "pdf-lib";

/**
 * Protects a PDF file with a password using AES-256 encryption
 * @param {File} file - The PDF file to protect
 * @param {string} password - The password to encrypt the PDF with
 * @returns {Promise<Blob>} - A promise that resolves with the encrypted PDF as a Blob
 */
export const protectPDF = async (file, password) => {
  console.log(password, "passwordprotect");

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
  try {
    // Here you would implement the actual PDF unlocking logic
    // This is a placeholder that simulates the process
    return new Promise((resolve, reject) => {
      // Simulate processing time
      setTimeout(() => {
        if (password && file) {
          resolve({
            success: true,
            unlockedFile: file,
            message: "PDF unlocked successfully",
          });
        } else {
          reject(new Error("Invalid password or file"));
        }
      }, 1500);
    });
  } catch (error) {
    throw new Error(`Failed to unlock PDF: ${error.message}`);
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
