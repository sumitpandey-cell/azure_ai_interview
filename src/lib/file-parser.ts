// Set up the worker for PDF.js - only in browser
if (typeof window !== 'undefined') {
    // We will import pdfjs dynamically inside parsePDF to avoid top-level issues
}

/**
 * Parses a PDF file and extracts its text content
 */
export async function parsePDF(file: File): Promise<string> {
    if (typeof window === 'undefined') return '';

    // Dynamic import to avoid SSR issues
    const pdfjs = await import('pdfjs-dist');

    // Set up worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText.trim();
}

/**
 * Parses a DOCX file and extracts its text content
 */
export async function parseDOCX(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
}

/**
 * Parses a file (PDF, DOCX, or TXT) and extracts its text content
 */
export async function parseFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return parsePDF(file);
        case 'docx':
            return parseDOCX(file);
        case 'txt':
            return file.text();
        default:
            throw new Error(`Unsupported file format: ${extension}`);
    }
}
