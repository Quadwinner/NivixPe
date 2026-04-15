#!/usr/bin/env python3
"""
Convert Markdown to HTML for easy PDF printing
No dependencies required - uses Python's built-in libraries
"""

import os
import re
from pathlib import Path

def simple_markdown_to_html(md_content):
    """Convert markdown to HTML using simple regex replacements"""
    html = md_content
    
    # Headers
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    
    # Bold and italic
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # Code blocks
    html = re.sub(r'```(.*?)```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
    html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)
    
    # Links
    html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html)
    
    # Lists
    lines = html.split('\n')
    in_list = False
    result = []
    
    for line in lines:
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            if not in_list:
                result.append('<ul>')
                in_list = True
            item = line.strip()[2:]
            result.append(f'<li>{item}</li>')
        elif line.strip().startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
            if not in_list:
                result.append('<ol>')
                in_list = True
            item = re.sub(r'^\d+\.\s*', '', line.strip())
            result.append(f'<li>{item}</li>')
        else:
            if in_list:
                result.append('</ul>' if result[-1].startswith('<li>') else '</ol>')
                in_list = False
            if line.strip():
                result.append(f'<p>{line}</p>')
            else:
                result.append('<br>')
    
    if in_list:
        result.append('</ul>')
    
    return '\n'.join(result)

def create_html_file(md_file, html_file):
    """Create HTML file from markdown"""
    
    # Read markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert to HTML
    body_html = simple_markdown_to_html(md_content)
    
    # HTML template with print-friendly CSS
    html_template = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{Path(md_file).stem}</title>
    <style>
        @media print {{
            body {{ margin: 0.5in; }}
            h1 {{ page-break-before: always; }}
            h1:first-of-type {{ page-break-before: avoid; }}
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: #fff;
        }}
        
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 40px;
        }}
        
        h2 {{
            color: #34495e;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 8px;
            margin-top: 30px;
        }}
        
        h3 {{
            color: #7f8c8d;
            margin-top: 25px;
        }}
        
        h4 {{
            color: #95a5a6;
            margin-top: 20px;
        }}
        
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        
        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }}
        
        pre code {{
            background: none;
            padding: 0;
        }}
        
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        
        th {{
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }}
        
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        
        ul, ol {{
            margin: 15px 0;
            padding-left: 30px;
        }}
        
        li {{
            margin: 8px 0;
        }}
        
        a {{
            color: #3498db;
            text-decoration: none;
        }}
        
        a:hover {{
            text-decoration: underline;
        }}
        
        blockquote {{
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            color: #555;
            font-style: italic;
        }}
        
        .print-button {{
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }}
        
        .print-button:hover {{
            background: #2980b9;
        }}
        
        @media print {{
            .print-button {{ display: none; }}
        }}
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Print to PDF</button>
    {body_html}
</body>
</html>"""
    
    # Write HTML file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    print(f"✓ Created: {html_file}")

def main():
    """Main function"""
    print("=" * 70)
    print("NivixPe Documentation HTML Generator")
    print("(Open HTML files in browser and use Print to PDF)")
    print("=" * 70)
    
    # Create html directory
    html_dir = Path("reports/html")
    html_dir.mkdir(exist_ok=True)
    
    # List of markdown files to convert
    md_files = [
        "reports/01_PRODUCT_REQUIREMENTS_DOCUMENT.md",
        "reports/02_AML_COMPLIANCE_REPORT.md",
        "reports/README_REPORTS.md",
        "reports/QUICK_COMMANDS.md",
        "reports/00_START_HERE.md",
        "DOCUMENTATION_SUMMARY.md",
        "CHAINCODE_DEPLOYMENT_COMPLETE_FIX.md",
        "QUICK_FIX_COMMANDS.sh",
    ]
    
    print(f"\nGenerating HTML files...\n")
    
    success_count = 0
    html_files = []
    
    for md_file in md_files:
        if not os.path.exists(md_file):
            print(f"⚠ Skipping {md_file} (not found)")
            continue
        
        # Generate HTML filename
        html_filename = Path(md_file).stem + ".html"
        html_file = html_dir / html_filename
        
        try:
            create_html_file(md_file, str(html_file))
            html_files.append(str(html_file))
            success_count += 1
        except Exception as e:
            print(f"❌ Error generating {html_file}: {e}")
    
    print(f"\n{'=' * 70}")
    print(f"✓ Successfully generated {success_count} HTML files")
    print(f"📁 HTML files saved in: {html_dir}")
    print(f"\n📝 TO CREATE PDFs:")
    print(f"   1. Open each HTML file in your browser")
    print(f"   2. Press Ctrl+P (or Cmd+P on Mac)")
    print(f"   3. Select 'Save as PDF'")
    print(f"   4. Save to reports/pdf/ folder")
    print(f"\n📂 Files created:")
    for html_file in html_files:
        print(f"   - {html_file}")
    print(f"{'=' * 70}")

if __name__ == "__main__":
    main()
