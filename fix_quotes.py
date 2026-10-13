import re
with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("\\'fiado\\'", "'fiado'")
content = content.replace("\\'contatados\\'", "'contatados'")
content = content.replace("\\'negociacao\\'", "'negociacao'")
with open('src/data/mockData.ts', 'w', encoding='utf-8') as f:
    f.write(content)
