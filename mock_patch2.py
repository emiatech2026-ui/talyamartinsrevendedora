import re

def process():
    with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add initialTasks array
    if 'export const initialTasks' not in content:
        tasks_code = """
export const initialTasks: Task[] = [
  { id: 'task-1', title: 'Entrar em contato com Maria Silva sobre kit Nativa SPA', completed: false, createdAt: '2026-10-01T10:00:00Z' },
  { id: 'task-2', title: 'Cobrar fiado pendente de R$ 120,00', completed: false, dueDate: '2026-10-10', createdAt: '2026-10-02T10:00:00Z' }
];
"""
        content += tasks_code

    # Add Task to import
    if 'Task' not in content.split('}')[0]:
        content = content.replace('AppSettings } from', 'AppSettings, Task } from')
    
    # Add crmColumn to mock customers if not exists
    content = re.sub(r'(favoriteBrands: \[[^\]]*\]),(\s*)\},', r'\1,\n    crmColumn: \'fiado\',\2},', content)
    content = content.replace("'fiado'", "'contatados'", 1) # First one as contatados
    content = content.replace("'fiado'", "'negociacao'", 1) # Second one as negociacao

    with open('src/data/mockData.ts', 'w', encoding='utf-8') as f:
        f.write(content)

process()
