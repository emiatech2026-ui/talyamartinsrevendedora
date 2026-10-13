import re

with open('src/lib/storage.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add initialTasks to imports
content = re.sub(r'import \{ (.*?) \} from \'../data/mockData\';', r"import { \1, initialTasks } from '../data/mockData';", content)

# Add Task to types import
content = re.sub(r'import \{ (.*?) \} from \'../types\';', r"import { \1, Task } from '../types';", content)

if 'TASKS:' not in content:
    content = content.replace("SETTINGS: 'talya_revenda_settings_v1',", "SETTINGS: 'talya_revenda_settings_v1',\n  TASKS: 'talya_revenda_tasks_v1',")

tasks_code = """
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
content = re.sub(r'(getProducts:)', tasks_code + r'\n  \1', content)

with open('src/lib/storage.ts', 'w', encoding='utf-8') as f:
    f.write(content)


with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = re.sub(r'import \{ (.*?) \} from \'./types\';', r"import { \1, Task } from './types';", app_content)

app_content = app_content.replace(
    "const [customers, setCustomers] = useState<Customer[]>([]);",
    "const [customers, setCustomers] = useState<Customer[]>([]);\n  const [tasks, setTasks] = useState<Task[]>([]);"
)

app_content = app_content.replace(
    "setCustomers(StorageService.getCustomers());",
    "setCustomers(StorageService.getCustomers());\n      setTasks(StorageService.getTasks());"
)

tasks_handlers = """
  const handleSaveTask = (task: Task) => {
    const isNew = !tasks.find((t) => t.id === task.id);
    let updated;
    if (isNew) {
      updated = [...tasks, task];
    } else {
      updated = tasks.map((t) => (t.id === task.id ? task : t));
    }
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    StorageService.saveTasks(updated);
  };
"""
app_content = app_content.replace(
    "const handleSaveCustomer =",
    tasks_handlers + "\n  const handleSaveCustomer ="
)

# Specifically inject into Clientes.tsx usage
app_content = app_content.replace(
    "<Clientes \n          customers={customers}\n          settings={settings}\n          onSaveCustomer={handleSaveCustomer}\n          onDeleteCustomer={handleDeleteCustomer}\n          onSettleDebt={handleSettleDebt}\n        />",
    "<Clientes \n          customers={customers}\n          settings={settings}\n          onSaveCustomer={handleSaveCustomer}\n          onDeleteCustomer={handleDeleteCustomer}\n          onSettleDebt={handleSettleDebt}\n          tasks={tasks}\n          onSaveTask={handleSaveTask}\n          onDeleteTask={handleDeleteTask}\n        />"
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
