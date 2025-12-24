export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
        
        if (!window.pdfjsLib) {
          reject(new Error("PDF.js library not loaded"));
          return;
        }

        const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
        let fullText = '';

        // Limit to first 10 pages for demo performance
        const maxPages = Math.min(pdf.numPages, 10);

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    fileReader.readAsArrayBuffer(file);
  });
};