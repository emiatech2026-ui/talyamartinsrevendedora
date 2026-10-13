import re
with open('src/App.tsx', 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('AlertCircle\n}', 'AlertCircle,\n  ListTodo\n}')
content = content.replace("import { Clientes } from './pages/Clientes';", "import { Clientes } from './pages/Clientes';\nimport { Tarefas } from './pages/Tarefas';")
content = content.replace("{ id: 'clientes', label: 'Clientes & Fiado', icon: Users },", "{ id: 'clientes', label: 'Clientes & Fiado', icon: Users },\n    { id: 'tarefas', label: 'Tarefas', icon: ListTodo },")
content = content.replace("""<Clientes
              customers={customers}
              settings={settings}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onSettleDebt={handleSettleDebt}
              tasks={tasks}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />""", """<Clientes
              customers={customers}
              settings={settings}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onSettleDebt={handleSettleDebt}
            />
          )}

          {activeTab === 'tarefas' && (
            <Tarefas
              tasks={tasks}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />""")
with open('src/App.tsx', 'w', encoding='utf-8') as f: f.write(content)
