import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# import Task
if 'Task' not in content.split('}')[0]:
    content = content.replace('PaymentStatus } from', 'PaymentStatus, Task } from')

# State variables
if 'const [tasks, setTasks]' not in content:
    state_injection = """
  const [tasks, setTasks] = useState<Task[]>([]);
"""
    content = content.replace("const [customers, setCustomers] = useState<Customer[]>([]);", "const [customers, setCustomers] = useState<Customer[]>([]);" + state_injection)

# loadData
if 'StorageService.getTasks()' not in content:
    content = content.replace("setCustomers(StorageService.getCustomers());", "setCustomers(StorageService.getCustomers());\n      setTasks(StorageService.getTasks());")

# saveTask function
if 'handleSaveTask' not in content:
    task_handlers = """
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
    content = content.replace("const handleSaveCustomer =", task_handlers + "\n  const handleSaveCustomer =")

# Pass props to Clientes
if 'tasks={tasks}' not in content:
    content = content.replace("customers={customers}", "customers={customers}\n          tasks={tasks}\n          onSaveTask={handleSaveTask}\n          onDeleteTask={handleDeleteTask}")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
