import * as pdfjs from 'pdfjs-dist';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF file using pdfjs-dist
 * @param file The PDF file to parse
 * @returns Promise with the extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText.trim();
}
