#!/usr/bin/env python3
"""
Simple PDF Generator for NivixPe Documentation
Uses markdown2 and weasyprint (or reportlab as fallback)
"""

import os
import sys
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import markdown2
        print("✓ markdown2 installed")
    except ImportError:
        print("✗ markdown2 not installed")
        print("  Install: pip install markdown2")
        return False
    
    # Try weasyprint first
    try:
        import weasyprint
        print("✓ weasyprint installed")
        return True
    except ImportError:
        print("✗ weasyprint not installed")
        print("  Install: pip install weasyprint")
        
    # Try reportlab as fallback
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate
        print("✓ reportlab installed (fallback)")
        return True
    except ImportError:
        print("✗ reportlab not installed")
        print("  Install: pip install reportlab")
        return False

def generate_pdf_weasyprint(md_file, pdf_file):
    """Generate PDF using weasyprint"""
    import markdown2
    from weasyprint import HTML, CSS
    
    # Read markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert to HTML
    html_content = markdown2.markdown(md_content, extras=['tables', 'fenced-code-blocks'])
    
    # Add CSS styling
    css_style = """
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; border-bottom: 2px solid #95a5a6; padding-bottom: 8px; margin-top: 30px; }
        h3 { color: #7f8c8d; margin-top: 20px; }
        code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        blockquote { border-left: 4px solid #3498db; padding-left: 20px; margin: 20px 0; color: #555; }
    </style>
    """
    
    full_html = f"<html><head>{css_style}</head><body>{html_content}</body></html>"
    
    # Generate PDF
    HTML(string=full_html).write_pdf(pdf_file)
    print(f"✓ Generated: {pdf_file}")

def main():
    """Main function"""
    print("=" * 60)
    print("NivixPe Documentation PDF Generator")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Missing dependencies. Please install required packages.")
        sys.exit(1)
    
    # Create pdf directory
    pdf_dir = Path("reports/pdf")
    pdf_dir.mkdir(exist_ok=True)
    
    # List of markdown files to convert
    md_files = [
        "reports/01_PRODUCT_REQUIREMENTS_DOCUMENT.md",
        "reports/02_AML_COMPLIANCE_REPORT.md",
        "reports/README_REPORTS.md",
        "reports/QUICK_COMMANDS.md",
        "reports/00_START_HERE.md",
        "DOCUMENTATION_SUMMARY.md",
        "CHAINCODE_DEPLOYMENT_COMPLETE_FIX.md",
    ]
    
    print(f"\nGenerating PDFs...\n")
    
    success_count = 0
    for md_file in md_files:
        if not os.path.exists(md_file):
            print(f"⚠ Skipping {md_file} (not found)")
            continue
        
        # Generate PDF filename
        pdf_filename = Path(md_file).stem + ".pdf"
        pdf_file = pdf_dir / pdf_filename
        
        try:
            generate_pdf_weasyprint(md_file, str(pdf_file))
            success_count += 1
        except Exception as e:
            print(f"❌ Error generating {pdf_file}: {e}")
    
    print(f"\n{'=' * 60}")
    print(f"✓ Successfully generated {success_count} PDFs")
    print(f"📁 PDFs saved in: {pdf_dir}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
