import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Replace arrays
    content = content.replace("['O Boticário', 'Eudora']", "['O Boticário', 'Eudora', 'Natura']")
    content = content.replace("'O Boticário', 'Eudora'", "'O Boticário', 'Eudora', 'Natura'")
    content = content.replace("'O Boticário e Eudora'", "'O Boticário, Eudora e Natura'")
    
    # Replace isEudora lines to include isNatura
    # e.g., const isEudora = ...;
    # Add const isNatura = ...; below it
    content = re.sub(r'(const isEudora = [^;]+;)', lambda m: m.group(1) + '\n' + m.group(1).replace('isEudora', 'isNatura').replace('eudora', 'natura').replace('Eudora', 'Natura'), content)
    
    # Defaults in settings/brands lists
    content = re.sub(r'(\{ name: \'Eudora\', commission:[^\}]+?\})', lambda m: m.group(1) + ', ' + m.group(1).replace('Eudora', 'Natura'), content)
    
    # Add 'Natura' to any other places
    content = content.replace("'O Boticário   Eudora'", "'O Boticário   Eudora   Natura'")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, _, files in os.walk('./src'):
    for f in files:
        if f.endswith('.ts') or f.endswith('.tsx'):
            process_file(os.path.join(root, f))
