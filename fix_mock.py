import re
with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("'contatados'", "'pagos'")
content = content.replace("'negociacao'", "'pos_venda'")
content = content.replace("'fiado'", "'fiados'")
with open('src/data/mockData.ts', 'w', encoding='utf-8') as f:
    f.write(content)
