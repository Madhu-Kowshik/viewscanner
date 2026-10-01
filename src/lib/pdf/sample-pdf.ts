import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates an authentic, clean, 5-page sample PDF document for instant testing.
 */
export async function createSamplePdf(): Promise<{ data: ArrayBuffer; name: string }> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pagesInfo = [
    {
      title: 'OmniPDF Sample Report — Page 1',
      subtitle: 'Welcome to the browser-based PDF workspace.',
      color: rgb(0.31, 0.27, 0.9), // Indigo
      content: [
        'This sample document was generated entirely in your browser using OmniPDF.',
        'No data was sent to any server.',
        '',
        'Available features to test on this document:',
        '• Drag and drop to reorder pages in the Organizer',
        '• Rotate individual or multiple pages (90°, 180°, 270°)',
        '• Duplicate important pages',
        '• Delete pages and verify the exported file',
        '• Split by ranges (e.g. pages 1-2, 3-5) or extract specific pages',
        '• View with crisp zoom and high-DPI canvas rendering',
      ],
    },
    {
      title: 'Financial Summary — Page 2',
      subtitle: 'Quarterly Performance & Growth Metrics',
      color: rgb(0.06, 0.58, 0.44), // Emerald
      content: [
        'Revenue Growth: +34% YoY',
        'Gross Margin: 82.4%',
        'Active Workspaces: 142,500+',
        'Local Processing Efficiency: 99.8%',
        '',
        'Notice the distinct header color and page number at the bottom.',
        'Try rotating this page 90 degrees or moving it to position 1.',
      ],
    },
    {
      title: 'Architecture & Privacy — Page 3',
      subtitle: 'Client-Side Security Model',
      color: rgb(0.85, 0.35, 0.1), // Orange
      content: [
        'OmniPDF operates with a zero-server upload policy.',
        'Your documents are parsed using client-side WebAssembly and JavaScript.',
        '',
        'Key Security Attributes:',
        '1. Files remain inside browser sandboxed memory',
        '2. Zero network requests transmit document contents',
        '3. Object URLs are revoked upon completion',
        '4. Temporary canvas buffers are strictly garbage collected',
      ],
    },
    {
      title: 'Operations & Workflow — Page 4',
      subtitle: 'Standard Operating Procedures',
      color: rgb(0.55, 0.2, 0.75), // Purple
      content: [
        'Section 4.1: Batch Merging',
        'Section 4.2: Range Extraction',
        'Section 4.3: High-Res Rasterization',
        '',
        'Try duplicating this page in the organizer to see two identical copies,',
        'then download the resulting PDF to verify.',
      ],
    },
    {
      title: 'Appendix & Verification — Page 5',
      subtitle: 'Final Checklist and Sign-off',
      color: rgb(0.18, 0.45, 0.85), // Blue
      content: [
        'Document ID: OMNI-SAMPLE-2026-X1',
        'Status: Verified & Validated',
        'Check-sum: Validated local ArrayBuffer',
        '',
        'Thank you for testing OmniPDF.',
        'You can now test Split PDF, Extract Pages, or Delete Pages on this document.',
      ],
    },
  ];

  for (let i = 0; i < pagesInfo.length; i++) {
    const info = pagesInfo[i];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    // Top banner
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width,
      height: 120,
      color: info.color,
    });

    // White title on banner
    page.drawText(info.title, {
      x: 40,
      y: height - 60,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Subtitle
    page.drawText(info.subtitle, {
      x: 40,
      y: height - 90,
      size: 13,
      font,
      color: rgb(0.9, 0.95, 1),
    });

    // Document body
    let currentY = height - 160;
    for (const line of info.content) {
      if (line === '') {
        currentY -= 14;
        continue;
      }
      const isHeader = line.startsWith('•') || line.startsWith('Key') || line.startsWith('Section') || line.startsWith('Available');
      page.drawText(line, {
        x: 45,
        y: currentY,
        size: isHeader ? 12 : 11,
        font: isHeader ? boldFont : font,
        color: rgb(0.15, 0.17, 0.22),
      });
      currentY -= 22;
    }

    // Border line at bottom
    page.drawLine({
      start: { x: 40, y: 50 },
      end: { x: width - 40, y: 50 },
      thickness: 1,
      color: rgb(0.85, 0.87, 0.9),
    });

    // Footer text
    page.drawText('OmniPDF Workspace — 100% Client-Side', {
      x: 40,
      y: 35,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.6),
    });

    // Page indicator
    page.drawText(`Page ${i + 1} of ${pagesInfo.length}`, {
      x: width - 110,
      y: 35,
      size: 9,
      font: boldFont,
      color: rgb(0.3, 0.35, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return {
    data: pdfBytes.buffer as ArrayBuffer,
    name: 'OmniPDF-Sample-Document.pdf',
  };
}
