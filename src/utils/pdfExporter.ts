import { ThemeConfig } from './storage';
import { generateHTML } from './exporter';

/**
 * Exports the document as PDF using the browser's native print dialog.
 * Opens a hidden iframe with the fully rendered HTML, triggers window.print(),
 * and the user selects "Save as PDF" from the print destination.
 *
 * This approach is used instead of html2pdf.js because html2canvas's bundled
 * CSS parser doesn't support oklch() colors (used by Tailwind CSS v4).
 * The browser's native print engine handles all modern CSS perfectly.
 */
export const exportToPDF = async (
  title: string,
  htmlContent: string,
  theme: ThemeConfig,
  _fileName: string
): Promise<void> => {
  const fullHTML = generateHTML(title, htmlContent, theme);

  // Create a hidden iframe to render the standalone HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '0';
  iframe.style.top = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframe.contentWindow) {
      throw new Error('Could not access iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(fullHTML);
    iframeDoc.close();

    // Wait for the document to fully load (images, fonts, styles)
    await new Promise<void>(resolve => {
      if (iframeDoc.readyState === 'complete') {
        resolve();
      } else {
        iframe.addEventListener('load', () => resolve(), { once: true });
      }
    });

    // Extra settle time for web fonts
    await new Promise(r => setTimeout(r, 300));

    // Inject a print stylesheet to clean up interactive-only elements
    const printStyle = iframeDoc.createElement('style');
    printStyle.textContent = `
      @media print {
        .sticky-header, .progress-bar, .back-to-top,
        .share-buttons, [data-no-print] { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `;
    iframeDoc.head.appendChild(printStyle);

    // Trigger the browser print dialog — user selects "Save as PDF"
    iframe.contentWindow.print();
  } finally {
    // Small delay before cleanup so the print dialog can grab the content
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }
};
