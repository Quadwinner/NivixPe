#!/bin/bash

# Script to convert Markdown documentation to PDF
# Requires: pandoc, texlive (for PDF generation)

echo "🔄 Converting documentation to PDF format..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ pandoc is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y pandoc texlive-latex-base texlive-fonts-recommended texlive-latex-extra
fi

# Directory containing markdown files
REPORT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Convert each markdown file to PDF
echo "📄 Converting PRD_Cross_Border_Payment_System.md..."
pandoc "$REPORT_DIR/PRD_Cross_Border_Payment_System.md" \
    -o "$REPORT_DIR/PRD_Cross_Border_Payment_System.pdf" \
    --pdf-engine=pdflatex \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=article \
    --toc \
    --toc-depth=3 \
    --highlight-style=tango

echo "📄 Converting AML_Compliance_Report.md..."
pandoc "$REPORT_DIR/AML_Compliance_Report.md" \
    -o "$REPORT_DIR/AML_Compliance_Report.pdf" \
    --pdf-engine=pdflatex \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=article \
    --toc \
    --toc-depth=3 \
    --highlight-style=tango

echo "📄 Converting Technical_Architecture_Report.md..."
pandoc "$REPORT_DIR/Technical_Architecture_Report.md" \
    -o "$REPORT_DIR/Technical_Architecture_Report.pdf" \
    --pdf-engine=pdflatex \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=article \
    --toc \
    --toc-depth=3 \
    --highlight-style=tango

echo "📄 Converting Payment_Workflow_Documentation.md..."
pandoc "$REPORT_DIR/Payment_Workflow_Documentation.md" \
    -o "$REPORT_DIR/Payment_Workflow_Documentation.pdf" \
    --pdf-engine=pdflatex \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=article \
    --toc \
    --toc-depth=3 \
    --highlight-style=tango

echo "✅ PDF generation complete!"
echo ""
echo "Generated files:"
ls -lh "$REPORT_DIR"/*.pdf

echo ""
echo "📦 Creating archive..."
cd "$REPORT_DIR"
tar -czf NivixPe_Documentation_$(date +%Y%m%d).tar.gz *.pdf *.md
echo "✅ Archive created: NivixPe_Documentation_$(date +%Y%m%d).tar.gz"
