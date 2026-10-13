import re

with open('src/lib/storage.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Imports
if 'Task' not in content:
    content = content.replace('AppSettings } from', 'AppSettings, Task } from')
    content = content.replace('initialSettings } from', 'initialSettings, initialTasks } from')

# Add TASKS key
if 'TASKS:' not in content:
    content = content.replace("SETTINGS: 'talya_revenda_settings_v1',", "SETTINGS: 'talya_revenda_settings_v1',\n  TASKS: 'talya_revenda_tasks_v1',")

# getTasks / saveTasks
if 'getTasks' not in content:
    tasks_methods = """
  getTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : initialTasks;
    } catch {
      return initialTasks;
    }
  },

  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },
"""
    content = content.replace('getProducts:', tasks_methods + '\n  getProducts:')

with open('src/lib/storage.ts', 'w', encoding='utf-8') as f:
    f.write(content)
