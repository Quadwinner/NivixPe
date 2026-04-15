#!/bin/bash

# NivixPe Report Generation Script
# This script generates all required PDF reports from markdown files

echo "=========================================="
echo "NivixPe Report Generation"
echo "=========================================="

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed"
    echo "Install with: sudo apt-get install pandoc texlive-latex-base texlive-fonts-recommended texlive-latex-extra"
    exit 1
fi

# Create reports directory if it doesn't exist
mkdir -p reports/pdf

# List of reports to generate
reports=(
    "01_PRODUCT_REQUIREMENTS_DOCUMENT"
    "02_AML_COMPLIANCE_REPORT"
    "03_TECHNICAL_ARCHITECTURE_REPORT"
    "04_WORKFLOW_DOCUMENTATION"
    "05_API_DOCUMENTATION"
    "06_SECURITY_AUDIT_REPORT"
    "07_USER_MANUAL"
    "08_DEPLOYMENT_GUIDE"
)

# Generate PDFs
for report in "${reports[@]}"; do
    if [ -f "reports/${report}.md" ]; then
        echo "Generating ${report}.pdf..."
        pandoc "reports/${report}.md" \
            -o "reports/pdf/${report}.pdf" \
            --pdf-engine=pdflatex \
            --variable geometry:margin=1in \
            --variable fontsize=11pt \
            --variable documentclass=article \
            --toc \
            --number-sections \
            2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ ${report}.pdf generated successfully"
        else
            echo "❌ Failed to generate ${report}.pdf"
        fi
    else
        echo "⚠️  ${report}.md not found, skipping..."
    fi
done

echo "=========================================="
echo "Report generation complete!"
echo "PDFs saved in: reports/pdf/"
echo "=========================================="
