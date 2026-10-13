import re
with open('src/pages/Clientes.tsx', 'r', encoding='utf-8') as f: content = f.read()
# Remove Tarefas logic
content = re.sub(r'const \[taskSearchTerm, setTaskSearchTerm\] = useState\(\'\'\);\n?', '', content)
content = re.sub(r'const \[newTaskTitle, setNewTaskTitle\] = useState\(\'\'\);\n?', '', content)
content = re.sub(r'const \[isListeningTask, setIsListeningTask\] = useState\(false\);\n?', '', content)
content = re.sub(r'const filteredTasks = tasks\.filter\(.*?;\n?', '', content)
content = re.sub(r'const handleTaskSubmit.*?};\n', '', content, flags=re.DOTALL)
content = re.sub(r'\{\/\* TAREFAS Tab \*\/\}.*?\{\/\* Modal CRM \*\/\}', '{/* Modal CRM */}', content, flags=re.DOTALL)
content = re.sub(r'\{\/\* Header Tabs \*\/\}.*?\{\/\* CRM Tab \*\/\}', '{/* Header */} <div className=\"flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100\"><h2 className=\"text-xl font-bold text-slate-800 flex items-center gap-2\"><KanbanSquare className=\"w-5 h-5 text-purple-600\" /> CRM & Clientes</h2><button onClick={() => handleOpenModal()} className=\"px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2\"><Plus className=\"w-4 h-4\" /> Novo Contato</button></div>', content, flags=re.DOTALL)
content = re.sub(r'\{activeTab === \'crm\' && \(\n(.*?)\s*\)\}', r'\1', content, flags=re.DOTALL)
content = re.sub(r'const \[activeTab, setActiveTab\] = useState<\'crm\' \| \'tarefas\'>\(\'crm\'\);\n?', '', content)
with open('src/pages/Clientes.tsx', 'w', encoding='utf-8') as f: f.write(content)
