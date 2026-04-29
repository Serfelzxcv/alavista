import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Role = 'admin' | 'project_manager' | 'developer'
type ProjectStatus = 'active' | 'archived'
type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

type User = {
  id: number
  name: string
  email: string
  role: Role
}

type Project = {
  id: number
  name: string
  description: string
  status: ProjectStatus
  owner: number
  owner_name: string
}

type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  project: number
  project_name: string
  assigned_to: number
  assigned_to_name: string
  due_date: string | null
}

type Paginated<T> = {
  results: T[]
}

type AuthPayload = {
  access: string
  refresh: string
  user: User
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Pendiente',
  in_progress: 'En progreso',
  in_review: 'En revisión',
  done: 'Completado',
}

const projectStatusLabels: Record<ProjectStatus, string> = {
  active: 'Activo',
  archived: 'Archivado',
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  developer: 'Developer',
}

const fieldLabels: Record<string, string> = {
  name: 'Nombre',
  email: 'Email',
  password: 'Contraseña',
  role: 'Rol',
  title: 'Título',
  project: 'Proyecto',
  assigned_to: 'Asignado',
  due_date: 'Fecha límite',
  non_field_errors: 'Error',
  detail: 'Error',
}

function getStoredUser() {
  const storedUser = localStorage.getItem('taskflow_user')
  return storedUser ? (JSON.parse(storedUser) as User) : null
}

function isAuthPayload(payload: unknown): payload is AuthPayload {
  if (!payload || typeof payload !== 'object') return false
  const data = payload as Record<string, unknown>
  return typeof data.access === 'string' && typeof data.refresh === 'string' && !!data.user
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results
  }
  return []
}

function App() {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('admin@taskflow.com')
  const [password, setPassword] = useState('Admin123!')
  const [role, setRole] = useState<Role>('developer')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [activeSection, setActiveSection] = useState<'dashboard' | 'projects' | 'tasks'>('dashboard')

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'active' as ProjectStatus,
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    project: '',
    assigned_to: '',
    due_date: '',
  })
  const [formMessage, setFormMessage] = useState('')

  const accessToken = localStorage.getItem('taskflow_access')

  function saveSession(payload: AuthPayload) {
    localStorage.setItem('taskflow_access', payload.access)
    localStorage.setItem('taskflow_refresh', payload.refresh)
    localStorage.setItem('taskflow_user', JSON.stringify(payload.user))
    setUser(payload.user)
  }

  function getApiError(payload: unknown, fallback: string): string {
    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>
      if (typeof data.detail === 'string') return data.detail
      if (typeof data.message === 'string') return data.message
      if ('errors' in data && data.errors && typeof data.errors === 'object') {
        return getApiError(data.errors, fallback)
      }

      const fieldErrors = Object.entries(data)
        .map(([field, value]) => {
          const label = fieldLabels[field] ?? field
          if (Array.isArray(value)) return `${label}: ${value.join(' ')}`
          if (value && typeof value === 'object') return `${label}: ${getApiError(value, fallback)}`
          if (typeof value === 'string') return `${label}: ${value}`
          return ''
        })
        .filter(Boolean)

      if (fieldErrors.length > 0) return fieldErrors.join(' ')
    }

    return fallback
  }

  async function readJsonResponse(response: Response): Promise<unknown> {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  function getNetworkError(errorSource: unknown) {
    if (errorSource instanceof TypeError) {
      return `No se pudo conectar con la API (${API_BASE_URL}). Verifica que el backend esté encendido.`
    }
    return errorSource instanceof Error ? errorSource.message : 'Error inesperado'
  }

  async function apiRequest(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('taskflow_access')
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
    const payload = await readJsonResponse(response)

    if (!response.ok) {
      throw new Error(getApiError(payload, 'No se pudo completar la operación'))
    }

    return payload
  }

  async function loadWorkspace() {
    if (!user || !accessToken) return

    setDataLoading(true)
    setDataError('')

    try {
      const [usersPayload, projectsPayload, tasksPayload] = await Promise.all([
        apiRequest('/users/'),
        apiRequest('/projects/'),
        apiRequest('/tasks/'),
      ])

      setUsers(unwrapList<User>(usersPayload))
      setProjects(unwrapList<Project>(projectsPayload))
      setTasks(unwrapList<Task>(tasksPayload))
    } catch (loadError) {
      setDataError(getNetworkError(loadError))
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspace()
  }, [user])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = await readJsonResponse(response)

      if (!response.ok) throw new Error(getApiError(payload, 'No se pudo iniciar sesión'))
      if (!isAuthPayload(payload)) throw new Error('La API no devolvió una sesión válida')

      saveSession(payload)
    } catch (loginError) {
      setAuthError(getNetworkError(loginError))
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const payload = await readJsonResponse(response)

      if (!response.ok) throw new Error(getApiError(payload, 'No se pudo crear la cuenta'))
      if (!isAuthPayload(payload)) throw new Error('La API no devolvió una sesión válida')

      saveSession(payload)
    } catch (registerError) {
      setAuthError(getNetworkError(registerError))
    } finally {
      setAuthLoading(false)
    }
  }

  function switchAuthMode(nextMode: 'login' | 'register') {
    setAuthMode(nextMode)
    setAuthError('')

    if (nextMode === 'register') {
      setEmail('')
      setPassword('')
      setName('')
      setRole('developer')
    } else {
      setEmail('admin@taskflow.com')
      setPassword('Admin123!')
    }
  }

  async function handleLogout() {
    const refresh = localStorage.getItem('taskflow_refresh')
    const token = localStorage.getItem('taskflow_access')

    if (refresh && token) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      }).catch(() => undefined)
    }

    localStorage.removeItem('taskflow_access')
    localStorage.removeItem('taskflow_refresh')
    localStorage.removeItem('taskflow_user')
    setUser(null)
    setProjects([])
    setTasks([])
    setUsers([])
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')

    try {
      await apiRequest('/projects/', {
        method: 'POST',
        body: JSON.stringify(projectForm),
      })
      setProjectForm({ name: '', description: '', status: 'active' })
      setFormMessage('Proyecto creado correctamente')
      await loadWorkspace()
    } catch (createError) {
      setFormMessage(getNetworkError(createError))
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')

    try {
      await apiRequest('/tasks/', {
        method: 'POST',
        body: JSON.stringify({
          ...taskForm,
          project: Number(taskForm.project),
          assigned_to: Number(taskForm.assigned_to),
          due_date: taskForm.due_date || null,
        }),
      })
      setTaskForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        project: '',
        assigned_to: '',
        due_date: '',
      })
      setFormMessage('Tarea creada correctamente')
      await loadWorkspace()
    } catch (createError) {
      setFormMessage(getNetworkError(createError))
    }
  }

  const statusGroups = useMemo(() => {
    const counts = tasks.reduce<Record<TaskStatus, number>>(
      (summary, task) => ({ ...summary, [task.status]: summary[task.status] + 1 }),
      { todo: 0, in_progress: 0, in_review: 0, done: 0 },
    )

    return [
      { key: 'todo' as TaskStatus, label: 'Pendientes', count: counts.todo },
      { key: 'in_progress' as TaskStatus, label: 'En progreso', count: counts.in_progress },
      { key: 'in_review' as TaskStatus, label: 'En revisión', count: counts.in_review },
      { key: 'done' as TaskStatus, label: 'Completadas', count: counts.done },
    ]
  }, [tasks])

  const upcomingTasks = tasks.filter((task) => task.due_date).slice(0, 4)
  const activeProjects = projects.filter((project) => project.status === 'active')

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="brand auth-brand">
            <span className="brand-mark">T</span>
            <div>
              <strong>TaskFlow Pro</strong>
              <span>Acceso seguro</span>
            </div>
          </div>

          <div>
            <span className="eyebrow">Gestión de proyectos</span>
            <h1>{authMode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta de equipo'}</h1>
            <p className="auth-copy">
              {authMode === 'login'
                ? 'Usa las credenciales semilla para validar roles, dashboard y endpoints protegidos.'
                : 'El registro valida email único y envía la contraseña al backend para guardarla hasheada.'}
            </p>
          </div>

          <div className="auth-switch" role="tablist" aria-label="Modo de autenticación">
            <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => switchAuthMode('login')}>
              Login
            </button>
            <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => switchAuthMode('register')}>
              Registro
            </button>
          </div>

          <form className="login-form" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
            {authMode === 'register' && (
              <label>
                Nombre
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
              </label>
            )}

            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>

            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            </label>

            {authMode === 'register' && (
              <label>
                Rol
                <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  <option value="developer">Developer</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            )}

            {authError && <p className="form-error">{authError}</p>}

            <button type="submit" className="primary-button" disabled={authLoading}>
              {authLoading ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </section>

        <section className="auth-preview">
          <div className="preview-card">
            <span className="eyebrow">Vista protegida</span>
            <h2>Dashboard, proyectos y tareas bajo JWT</h2>
            <p>El frontend consume proyectos y tareas reales desde la API protegida.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <strong>TaskFlow Pro</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav className="nav-list">
          <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>Dashboard</button>
          <button className={activeSection === 'projects' ? 'active' : ''} onClick={() => setActiveSection('projects')}>Proyectos</button>
          <button className={activeSection === 'tasks' ? 'active' : ''} onClick={() => setActiveSection('tasks')}>Tareas</button>
          <a href="http://127.0.0.1:8000/api/docs/" target="_blank">API Docs</a>
        </nav>

        <div className="profile-card">
          <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{roleLabels[user.role]}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Gestión operativa</span>
            <h1>{activeSection === 'dashboard' ? 'Dashboard de proyectos' : activeSection === 'projects' ? 'Proyectos' : 'Tareas'}</h1>
          </div>
          <div className="actions">
            <button type="button" className="secondary-button" onClick={loadWorkspace}>Actualizar</button>
            <button type="button" className="danger-button" onClick={handleLogout}>Salir</button>
          </div>
        </header>

        {dataError && <p className="form-error">{dataError}</p>}
        {dataLoading && <p className="state-message">Cargando datos del workspace...</p>}

        {activeSection === 'dashboard' && (
          <>
            <section className="metrics-grid" aria-label="Resumen de tareas">
              {statusGroups.map((item) => (
                <article className="metric-card" key={item.key}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                  <div className={`metric-line ${item.key}`} />
                </article>
              ))}
            </section>

            <section className="content-grid">
              <TaskPanel tasks={tasks} />
              <aside className="side-panel">
                <ProjectSummary projects={activeProjects} />
                <UpcomingTasks tasks={upcomingTasks} />
              </aside>
            </section>
          </>
        )}

        {activeSection === 'projects' && (
          <section className="management-grid">
            <form className="management-form" onSubmit={handleCreateProject}>
              <div>
                <span className="eyebrow">Nuevo proyecto</span>
                <h2>Crear proyecto</h2>
              </div>
              <label>
                Nombre
                <input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} required />
              </label>
              <label>
                Descripción
                <textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} />
              </label>
              <label>
                Estado
                <select value={projectForm.status} onChange={(event) => setProjectForm({ ...projectForm, status: event.target.value as ProjectStatus })}>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
              <button className="primary-button" type="submit">Crear proyecto</button>
              {formMessage && <p className="inline-message">{formMessage}</p>}
            </form>

            <div className="main-panel">
              <div className="section-header">
                <h2>Listado de proyectos</h2>
                <span className="count-pill">{projects.length}</span>
              </div>
              <div className="cards-list">
                {projects.map((project) => (
                  <article className="project-card" key={project.id}>
                    <strong>{project.name}</strong>
                    <span>{project.description || 'Sin descripción'}</span>
                    <mark className={`status ${project.status === 'active' ? 'done' : 'todo'}`}>{projectStatusLabels[project.status]}</mark>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'tasks' && (
          <section className="management-grid">
            <form className="management-form" onSubmit={handleCreateTask}>
              <div>
                <span className="eyebrow">Nueva tarea</span>
                <h2>Crear tarea</h2>
              </div>
              <label>
                Título
                <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required />
              </label>
              <label>
                Descripción
                <textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
              </label>
              <label>
                Proyecto
                <select value={taskForm.project} onChange={(event) => setTaskForm({ ...taskForm, project: event.target.value })} required>
                  <option value="">Selecciona un proyecto</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
              <label>
                Asignado
                <select value={taskForm.assigned_to} onChange={(event) => setTaskForm({ ...taskForm, assigned_to: event.target.value })} required>
                  <option value="">Selecciona un usuario</option>
                  {users.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </label>
              <div className="form-row">
                <label>
                  Estado
                  <select value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value as TaskStatus })}>
                    <option value="todo">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="in_review">En revisión</option>
                    <option value="done">Completado</option>
                  </select>
                </label>
                <label>
                  Prioridad
                  <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </label>
              </div>
              <label>
                Fecha límite
                <input type="date" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} />
              </label>
              <button className="primary-button" type="submit">Crear tarea</button>
              {formMessage && <p className="inline-message">{formMessage}</p>}
            </form>

            <TaskPanel tasks={tasks} />
          </section>
        )}
      </main>
    </div>
  )
}

function TaskPanel({ tasks }: { tasks: Task[] }) {
  return (
    <div className="main-panel" id="tasks">
      <div className="section-header">
        <div>
          <span className="eyebrow">Flujo de trabajo</span>
          <h2>Tareas</h2>
        </div>
        <span className="count-pill">{tasks.length}</span>
      </div>

      <div className="task-table" role="table" aria-label="Tareas">
        <div className="table-row table-head" role="row">
          <span>Tarea</span>
          <span>Responsable</span>
          <span>Estado</span>
          <span>Prioridad</span>
          <span>Vence</span>
        </div>

        {tasks.map((task) => (
          <div className="table-row" role="row" key={task.id}>
            <span>
              <strong>{task.title}</strong>
              <small>{task.project_name}</small>
            </span>
            <span>{task.assigned_to_name}</span>
            <span><mark className={`status ${task.status}`}>{statusLabels[task.status]}</mark></span>
            <span><mark className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</mark></span>
            <span>{task.due_date ?? 'Sin fecha'}</span>
          </div>
        ))}

        {tasks.length === 0 && <p className="empty-state">Aún no hay tareas registradas.</p>}
      </div>
    </div>
  )
}

function ProjectSummary({ projects }: { projects: Project[] }) {
  return (
    <section className="panel-section" id="projects">
      <div className="section-header compact">
        <h2>Proyectos activos</h2>
        <span>{projects.length}</span>
      </div>
      {projects.slice(0, 4).map((project) => (
        <div className="project-item" key={project.id}>
          <strong>{project.name}</strong>
          <span>{project.owner_name || 'Sin owner'} · {project.description || 'Sin descripción'}</span>
          <progress value="50" max="100" />
        </div>
      ))}
      {projects.length === 0 && <p className="empty-state">Aún no hay proyectos activos.</p>}
    </section>
  )
}

function UpcomingTasks({ tasks }: { tasks: Task[] }) {
  return (
    <section className="panel-section">
      <div className="section-header compact">
        <h2>Próximas a vencer</h2>
        <span>{tasks.length}</span>
      </div>
      <ul className="due-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong>
            <span>{task.due_date} - {priorityLabels[task.priority]}</span>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="empty-state">No hay tareas con fecha límite.</p>}
    </section>
  )
}

export default App
