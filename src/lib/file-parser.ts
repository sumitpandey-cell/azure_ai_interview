import './polyfills';

/**
 * Parses a PDF file and extracts its text content
 */
export async function parsePDF(file: File): Promise<string> {
    if (typeof window === 'undefined') return '';

    try {
        // Use the legacy build of pdfjs-dist which is much more stable in Next.js
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // version is now 4.4.168
        const version = pdfjs.version || '4.4.168';

        // Set worker using CDN matching this version
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract text from items
            const pageText = textContent.items
                .map((item: unknown) => (item as { str: string }).str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (err: unknown) {
        const error = err as { message?: string; name?: string };
        console.error("PDF Parsing Error:", error);

        if (error.message?.includes('Object.defineProperty')) {
            throw new Error("PDF compatibility issue. Please try copying the text or use a .txt/.docx file.");
        }

        throw new Error(`Failed to parse PDF: ${error.message || 'Unknown error'}`);
    }
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
