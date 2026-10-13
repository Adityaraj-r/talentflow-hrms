import os
import re

directory = r'c:\web development\HRMS\frontend\src'

def replace_colors_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace blue and indigo with purple
    # But only for Tailwind classes like bg-blue-600, text-blue-500, border-indigo-600, hover:bg-blue-700, ring-blue-500, shadow-blue-500
    # Let's match the pattern: (bg|text|border|ring|shadow|from|to|via)-(blue|indigo)-(\d{2,3}(/\d{1,2})?)
    
    pattern = r'(bg|text|border|ring|shadow|from|to|via|fill|stroke|hover:bg|hover:text|hover:border|dark:bg|dark:text|dark:hover:bg)-(blue|indigo)-(\d{2,3}(/\d{1,2})?)'
    
    def replacer(match):
        prefix = match.group(1)
        # color = match.group(2)
        weight = match.group(3)
        return f"{prefix}-purple-{weight}"
        
    new_content = re.sub(pattern, replacer, content)
    
    # Also catch data-[state=selected]:bg-blue-600/15 etc
    # Actually, the regex prefix catches 'hover:bg', but what about 'data-[state=selected]:bg'?
    # Better pattern: any class containing blue- or indigo-
    # pattern2: r'([a-zA-Z0-9_:-]+)-(blue|indigo)-(\d{2,3}(/\d+)?)'
    # wait, if I just replace 'blue-' and 'indigo-' with 'purple-' in the file?
    # Are there any variable names with 'blue' or 'indigo' that we shouldn't touch?
    # Probably safe to just regex replace (blue|indigo)-(\d{2,3}) with purple-\2
    
    # Let's do exactly that: replace blue-XXX and indigo-XXX with purple-XXX
    # where XXX is digits (and optional /opacity)
    simple_pattern = r'(blue|indigo)-(\d{2,3}(?:/\d+)?)'
    new_content = re.sub(simple_pattern, r'purple-\2', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

changed_files = []
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.tsx', '.ts')):
            filepath = os.path.join(root, file)
            if replace_colors_in_file(filepath):
                changed_files.append(filepath)

print(f"Changed {len(changed_files)} files.")
for f in changed_files:
    print(f.replace(directory, ''))
