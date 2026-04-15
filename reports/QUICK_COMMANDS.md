# NivixPe - Quick Commands Reference

## Generate PDF Reports

### Install Dependencies (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y pandoc texlive-latex-base texlive-fonts-recommended texlive-latex-extra texlive-xetex
```

### Install Dependencies (macOS)
```bash
brew install pandoc
brew install --cask mactex-no-gui
```

### Generate All PDFs
```bash
cd reports
chmod +x generate_all_reports.sh
./generate_all_reports.sh
```

### Generate Single PDF
```bash
# Product Requirements Document
pandoc 01_PRODUCT_REQUIREMENTS_DOCUMENT.md -o pdf/PRD.pdf --pdf-engine=xelatex --toc --number-sections

# AML Compliance Report
pandoc 02_AML_COMPLIANCE_REPORT.md -o pdf/AML_Report.pdf --pdf-engine=xelatex --toc --number-sections
```

### Alternative: Use Online Converter
If pandoc installation fails, use online tools:
1. Go to: https://www.markdowntopdf.com/
2. Upload the .md file
3. Download the generated PDF

---

## Current Status

### ✅ Completed Documents
1. **Product Requirements Document (PRD)** - `01_PRODUCT_REQUIREMENTS_DOCUMENT.md`
   - 25+ pages of comprehensive product specifications
   - Functional & non-functional requirements
   - User stories, success metrics, roadmap

2. **AML Compliance Report (Partial)** - `02_AML_COMPLIANCE_REPORT.md`
   - Regulatory framework
   - Risk assessment matrix
   - (Needs completion: KYC procedures, monitoring, reporting)

3. **Reports README** - `README_REPORTS.md`
   - Overview of all required documents
   - Status tracking
   - Generation instructions

### ⏳ Documents to Complete
3. Technical Architecture Report
4. Workflow Documentation
5. API Documentation
6. Security Audit Report
7. User Manual
8. Deployment Guide

---

## Next Steps

### To Complete All Documentation:

1. **Finish AML Report** (Priority: High)
   ```bash
   # Continue editing
   nano reports/02_AML_COMPLIANCE_REPORT.md
   ```

2. **Create Technical Architecture Report**
   ```bash
   # Use existing NIVIX_MASTER_DOCUMENTATION.md as reference
   cp nivix-project/NIVIX_MASTER_DOCUMENTATION.md reports/03_TECHNICAL_ARCHITECTURE_REPORT.md
   # Edit and format for formal report
   ```

3. **Create Workflow Documentation**
   ```bash
   # Create new file with process flows
   nano reports/04_WORKFLOW_DOCUMENTATION.md
   ```

4. **Generate PDFs**
   ```bash
   cd reports
   ./generate_all_reports.sh
   ```

---

## File Locations

### Source Files (Markdown)
```
reports/
├── 01_PRODUCT_REQUIREMENTS_DOCUMENT.md  ✅ Complete
├── 02_AML_COMPLIANCE_REPORT.md          ⏳ 30% Complete
├── 03_TECHNICAL_ARCHITECTURE_REPORT.md  ⏳ Pending
├── 04_WORKFLOW_DOCUMENTATION.md         ⏳ Pending
├── 05_API_DOCUMENTATION.md              ⏳ Pending
├── 06_SECURITY_AUDIT_REPORT.md          ⏳ Pending
├── 07_USER_MANUAL.md                    ⏳ Pending
├── 08_DEPLOYMENT_GUIDE.md               ⏳ Pending
├── README_REPORTS.md                    ✅ Complete
└── generate_all_reports.sh              ✅ Complete
```

### Generated PDFs
```
reports/pdf/
├── 01_PRODUCT_REQUIREMENTS_DOCUMENT.pdf
├── 02_AML_COMPLIANCE_REPORT.pdf
├── 03_TECHNICAL_ARCHITECTURE_REPORT.pdf
├── 04_WORKFLOW_DOCUMENTATION.pdf
├── 05_API_DOCUMENTATION.pdf
├── 06_SECURITY_AUDIT_REPORT.pdf
├── 07_USER_MANUAL.pdf
└── 08_DEPLOYMENT_GUIDE.pdf
```

---

## Summary

I've created:
1. ✅ **Complete Product Requirements Document** (PRD) - 25+ pages
2. ✅ **Partial AML Compliance Report** - Framework and risk assessment
3. ✅ **Report Generation Script** - Automated PDF creation
4. ✅ **Documentation README** - Overview and status tracking
5. ✅ **This Quick Commands Guide** - Easy reference

**To get PDFs:**
```bash
cd reports
chmod +x generate_all_reports.sh
./generate_all_reports.sh
```

PDFs will be in `reports/pdf/` folder.
