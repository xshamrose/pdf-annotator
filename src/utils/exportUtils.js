// utils/exportUtils.js
import { saveAs } from "file-saver";
import { protectPDF } from "./protectionUtils";
// Helper function to convert file size to readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Save as PDF
export const saveAsPDF = async (file, fileName, password) => {
  console.log(password, "password");

  try {
    let fileToSave = file;

    // If password is provided, encrypt the PDF
    if (password) {
      fileToSave = await protectPDF(file, password);
    }

    // Use FileSaver.js instead of creating manual download link
    saveAs(fileToSave, `${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error saving PDF:", error);
    return false;
  }
};

// Convert and save as Word
export const saveAsWord = async (file, fileName) => {
  try {
    // Here you would typically make an API call to your backend service
    // that handles the PDF to Word conversion
    const response = await fetch("/api/convert/word", {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) throw new Error("Conversion failed");

    const wordBlob = await response.blob();
    saveAs(wordBlob, `${fileName}.docx`);
    return true;
  } catch (error) {
    console.error("Error converting to Word:", error);
    return false;
  }
};

// Convert and save as PowerPoint
export const saveAsPowerPoint = async (file, fileName) => {
  try {
    const response = await fetch("/api/convert/powerpoint", {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) throw new Error("Conversion failed");

    const pptBlob = await response.blob();
    saveAs(pptBlob, `${fileName}.pptx`);
    return true;
  } catch (error) {
    console.error("Error converting to PowerPoint:", error);
    return false;
  }
};

// Convert and save as Excel
// export const saveAsExcel = async (file, fileName) => {
//   try {
//     const response = await fetch("/api/convert/excel", {
//       method: "POST",
//       body: file,
//       headers: {
//         "Content-Type": "application/pdf",
//       },
//     });

//     if (!response.ok) throw new Error("Conversion failed");

//     const excelBlob = await response.blob();
//     saveAs(excelBlob, `${fileName}.xlsx`);
//     return true;
//   } catch (error) {
//     console.error("Error converting to Excel:", error);
//     return false;
//   }
// };

// Convert and save as Image
export const saveAsImage = async (file, fileName) => {
  try {
    const response = await fetch("/api/convert/image", {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) throw new Error("Conversion failed");

    const imageBlob = await response.blob();
    saveAs(imageBlob, `${fileName}.jpg`);
    return true;
  } catch (error) {
    console.error("Error converting to Image:", error);
    return false;
  }
};
