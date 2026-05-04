import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { gsap } from 'gsap'
import loginImage from './assets/login.jpg'
import './App.css'

type Role = 'admin' | 'project_manager' | 'developer'
type Section = 'dashboard' | 'projects' | 'tasks' | 'profile' | 'team'
type ProjectStatus = 'active' | 'archived'
type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

type User = {
  id: number
  name: string
  email: string
  role: Role
  avatar_url?: string
  is_active?: boolean
}

type Project = {
  id: number
  name: string
  description: string
  status: ProjectStatus
  owner: number
  owner_name: string
  tasks?: ProjectTask[]
}

type ProjectTask = {
  id: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigned_to_name: string
  due_date: string | null
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
  created_at: string
  due_date: string | null
  updated_at: string
}

type TaskFormState = {
  assigned_to: string
  description: string
  due_date: string
  priority: TaskPriority
  project: string
  status: TaskStatus
  title: string
}

type TaskFilters = {
  assigned_to: string
  ordering: string
  priority: string
  project: string
  status: string
}

type AuthPayload = {
  access: string
  refresh: string
  user: User
}

type Paginated<T> = {
  results: T[]
}

type ApiEnvelope<T> = {
  data: T
  errors?: unknown
  message?: string
  meta?: unknown
  success: boolean
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
  assigned_to: 'Asignado',
  detail: 'Error',
  due_date: 'Fecha límite',
  email: 'Email',
  name: 'Nombre',
  non_field_errors: 'Error',
  password: 'Contraseña',
  project: 'Proyecto',
  role: 'Rol',
  title: 'Título',
}

function getStoredUser() {
  const storedUser = localStorage.getItem('taskflow_user')
  return storedUser ? (JSON.parse(storedUser) as User) : null
}

function isAuthPayload(payload: unknown): payload is AuthPayload {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return isAuthPayload((payload as ApiEnvelope<unknown>).data)
  }

  if (!payload || typeof payload !== 'object') return false
  const data = payload as Record<string, unknown>
  return typeof data.access === 'string' && typeof data.refresh === 'string' && !!data.user
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data
  }

  return payload as T
}

function unwrapList<T>(payload: unknown): T[] {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const data = (payload as ApiEnvelope<unknown>).data
    return Array.isArray(data) ? (data as T[]) : []
  }

  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results
  }
  return []
}

function App() {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [dialogError, setDialogError] = useState('')

  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  const [projectForm, setProjectForm] = useState({
    description: '',
    name: '',
    status: 'active' as ProjectStatus,
  })
  const [taskForm, setTaskForm] = useState({
    assigned_to: '',
    description: '',
    due_date: '',
    priority: 'medium' as TaskPriority,
    project: '',
    status: 'todo' as TaskStatus,
    title: '',
  })
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    assigned_to: '',
    ordering: 'due_date',
    priority: '',
    project: '',
    status: '',
  })
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTaskForm, setEditTaskForm] = useState<TaskFormState>({
    assigned_to: '',
    description: '',
    due_date: '',
    priority: 'medium',
    project: '',
    status: 'todo',
    title: '',
  })
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'developer' as Role,
  })
  const [profileForm, setProfileForm] = useState({
    avatar_url: user?.avatar_url ?? '',
    email: user?.email ?? '',
    name: user?.name ?? '',
  })
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [editProjectForm, setEditProjectForm] = useState({
    description: '',
    name: '',
    status: 'active' as ProjectStatus,
  })
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    is_active: true,
    name: '',
    role: 'developer' as Role,
  })
  const [formMessage, setFormMessage] = useState('')
  const authPageRef = useRef<HTMLElement | null>(null)

  const canCreateProjects = user?.role === 'admin' || user?.role === 'project_manager'
  const canManageUsers = user?.role === 'admin'

  useEffect(() => {
    if (user || !authPageRef.current) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const context = gsap.context(() => {
      gsap.from('.auth-animate', {
        autoAlpha: 0,
        y: 28,
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
      })

      gsap.from('.hero-visual', {
        autoAlpha: 0,
        scale: 0.82,
        rotation: -8,
        duration: 1.1,
        ease: 'expo.out',
      })

      gsap.to('.hero-visual', {
        y: -16,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

    }, authPageRef)

    return () => context.revert()
  }, [user])

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

  function reportError(errorSource: unknown) {
    const message = getNetworkError(errorSource)
    setDialogError(message)
    return message
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

  function getTaskQueryString() {
    const params = new URLSearchParams()

    Object.entries(taskFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    const query = params.toString()
    return query ? `?${query}` : ''
  }

  async function loadWorkspace() {
    if (!user) return

    setDataLoading(true)
    setDataError('')

    try {
      const [projectsPayload, tasksPayload] = await Promise.all([
        apiRequest('/projects/'),
        apiRequest(`/tasks/${getTaskQueryString()}`),
      ])

      setProjects(unwrapList<Project>(projectsPayload))
      setTasks(unwrapList<Task>(tasksPayload))

      if (user.role === 'admin') {
        const usersPayload = await apiRequest('/users/')
        setUsers(unwrapList<User>(usersPayload))
      } else {
        setUsers([user])
      }
    } catch (loadError) {
      setDataError(reportError(loadError))
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspace()
  }, [user, taskFilters])

  useEffect(() => {
    if (user) {
      setProfileForm({
        avatar_url: user.avatar_url ?? '',
        email: user.email,
        name: user.name,
      })
    }
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

      saveSession(unwrapData<AuthPayload>(payload))
    } catch (loginError) {
      setAuthError(reportError(loginError))
    } finally {
      setAuthLoading(false)
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
    setActiveSection('dashboard')
    setProjects([])
    setTasks([])
    setUser(null)
    setUsers([])
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')

    try {
      await apiRequest('/users/', {
        method: 'POST',
        body: JSON.stringify(userForm),
      })
      setUserForm({ email: '', name: '', password: '', role: 'developer' })
      setFormMessage('Usuario creado correctamente')
      await loadWorkspace()
    } catch (createError) {
      setFormMessage(reportError(createError))
    }
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')

    try {
      const payload = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      })

      if (payload && typeof payload === 'object' && 'data' in payload) {
        const updatedUser = (payload as { data: User }).data
        localStorage.setItem('taskflow_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      setFormMessage('Perfil actualizado correctamente')
    } catch (updateError) {
      setFormMessage(reportError(updateError))
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingUserId) return

    setFormMessage('')

    try {
      await apiRequest(`/users/${editingUserId}/`, {
        method: 'PATCH',
        body: JSON.stringify(editUserForm),
      })
      setEditingUserId(null)
      setFormMessage('Usuario actualizado correctamente')
      await loadWorkspace()
    } catch (updateError) {
      setFormMessage(reportError(updateError))
    }
  }

  async function handleDeactivateUser(userId: number) {
    setFormMessage('')

    try {
      await apiRequest(`/users/${userId}/`, { method: 'DELETE' })
      setFormMessage('Usuario desactivado correctamente')
      await loadWorkspace()
    } catch (deleteError) {
      setFormMessage(reportError(deleteError))
    }
  }

  function startEditingUser(member: User) {
    setEditingUserId(member.id)
    setEditUserForm({
      email: member.email,
      is_active: member.is_active ?? true,
      name: member.name,
      role: member.role,
    })
    setFormMessage('')
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')

    try {
      await apiRequest('/projects/', {
        method: 'POST',
        body: JSON.stringify(projectForm),
      })
      setProjectForm({ description: '', name: '', status: 'active' })
      setFormMessage('Proyecto creado correctamente')
      await loadWorkspace()
    } catch (createError) {
      setFormMessage(reportError(createError))
    }
  }

  async function handleSelectProject(projectId: number) {
    setFormMessage('')
    const project = projects.find((item) => item.id === projectId)
    if (project) setSelectedProject(project)

    try {
      const payload = await apiRequest(`/projects/${projectId}/`)
      setSelectedProject(unwrapData<Project>(payload))
    } catch (detailError) {
      setFormMessage(reportError(detailError))
    }
  }

  function startEditingProject(project: Project) {
    setEditingProjectId(project.id)
    setEditProjectForm({
      description: project.description,
      name: project.name,
      status: project.status,
    })
    setFormMessage('')
  }

  async function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProjectId) return

    setFormMessage('')

    try {
      await apiRequest(`/projects/${editingProjectId}/`, {
        method: 'PATCH',
        body: JSON.stringify(editProjectForm),
      })
      setEditingProjectId(null)
      setFormMessage('Proyecto actualizado correctamente')
      await loadWorkspace()
      await handleSelectProject(editingProjectId)
    } catch (updateError) {
      setFormMessage(reportError(updateError))
    }
  }

  async function handleArchiveProject(projectId: number) {
    setFormMessage('')

    try {
      await apiRequest(`/projects/${projectId}/archive/`, { method: 'POST' })
      setSelectedProject(null)
      setFormMessage('Proyecto archivado correctamente')
      await loadWorkspace()
    } catch (archiveError) {
      setFormMessage(reportError(archiveError))
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
          assigned_to: Number(taskForm.assigned_to),
          due_date: taskForm.due_date || null,
          project: Number(taskForm.project),
        }),
      })
      setTaskForm({
        assigned_to: '',
        description: '',
        due_date: '',
        priority: 'medium',
        project: '',
        status: 'todo',
        title: '',
      })
      setFormMessage('Tarea creada correctamente')
      await loadWorkspace()
    } catch (createError) {
      setFormMessage(reportError(createError))
    }
  }

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id)
    setEditTaskForm({
      assigned_to: String(task.assigned_to),
      description: task.description,
      due_date: task.due_date ?? '',
      priority: task.priority,
      project: String(task.project),
      status: task.status,
      title: task.title,
    })
    setFormMessage('')
  }

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTaskId) return

    setFormMessage('')

    try {
      await apiRequest(`/tasks/${editingTaskId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...editTaskForm,
          assigned_to: Number(editTaskForm.assigned_to),
          due_date: editTaskForm.due_date || null,
          project: Number(editTaskForm.project),
        }),
      })
      setEditingTaskId(null)
      setFormMessage('Tarea actualizada correctamente')
      await loadWorkspace()
    } catch (updateError) {
      setFormMessage(reportError(updateError))
    }
  }

  async function handleDeleteTask(taskId: number) {
    setFormMessage('')

    try {
      await apiRequest(`/tasks/${taskId}/`, { method: 'DELETE' })
      setFormMessage('Tarea eliminada correctamente')
      await loadWorkspace()
    } catch (deleteError) {
      setFormMessage(reportError(deleteError))
    }
  }

  async function handleAdvanceTask(task: Task) {
    const nextStatus: Partial<Record<TaskStatus, TaskStatus>> = {
      todo: 'in_progress',
      in_progress: 'in_review',
      in_review: 'done',
    }

    const status = nextStatus[task.status]
    if (!status) return

    setFormMessage('')

    try {
      await apiRequest(`/tasks/${task.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setFormMessage('Estado actualizado correctamente')
      await loadWorkspace()
    } catch (statusError) {
      setFormMessage(reportError(statusError))
    }
  }

  const statusGroups = useMemo(() => {
    const counts = tasks.reduce<Record<TaskStatus, number>>(
      (summary, task) => ({ ...summary, [task.status]: summary[task.status] + 1 }),
      { done: 0, in_progress: 0, in_review: 0, todo: 0 },
    )

    return [
      { count: counts.todo, key: 'todo' as TaskStatus, label: 'Pendientes' },
      { count: counts.in_progress, key: 'in_progress' as TaskStatus, label: 'En progreso' },
      { count: counts.in_review, key: 'in_review' as TaskStatus, label: 'En revisión' },
      { count: counts.done, key: 'done' as TaskStatus, label: 'Completadas' },
    ]
  }, [tasks])

  const activeProjects = projects.filter((project) => project.status === 'active')
  const assignableUsers = user?.role === 'developer' ? users.filter((member) => member.id === user.id) : users
  const upcomingTasks = tasks
    .filter((task) => task.due_date)
    .sort((first, second) => new Date(first.due_date ?? '').getTime() - new Date(second.due_date ?? '').getTime())
    .slice(0, 4)
  const recentTasks = [...tasks]
    .sort((first, second) => {
      const firstDate = new Date(first.updated_at || first.created_at).getTime()
      const secondDate = new Date(second.updated_at || second.created_at).getTime()
      return secondDate - firstDate
    })
    .slice(0, 5)

  if (!user) {
    return (
      <main className="auth-page" ref={authPageRef}>
        <ErrorDialog message={dialogError} onClose={() => setDialogError('')} />
        <section className="auth-panel auth-animate">
          <div className="auth-heading auth-animate">
            <span className="eyebrow">Gestión de proyectos</span>
            <h1>Controla tu equipo desde un acceso protegido</h1>
            <p className="auth-copy">
              Organiza proyectos, tareas y permisos con una experiencia clara para Admin,
              Project Manager y Developer.
            </p>
          </div>

          <form className="login-form auth-animate" onSubmit={handleLogin}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            </label>
            {authError && <p className="form-error">{authError}</p>}
            <button type="submit" className="primary-button" disabled={authLoading}>
              {authLoading ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>

          <div className="seed-users auth-animate">
            <span>Accesos demo</span>
            <button type="button" onClick={() => { setEmail('admin@example.com'); setPassword('admin123') }}>Admin</button>
            <button type="button" onClick={() => { setEmail('manager@example.com'); setPassword('manager123') }}>Manager</button>
            <button type="button" onClick={() => { setEmail('dev1@example.com'); setPassword('dev123') }}>Developer</button>
          </div>
        </section>

        <section className="auth-preview" aria-label="Vista previa de Alavista">
          <div className="preview-card auth-animate">
            <div className="hero-stage">
              <div className="hero-brand">
                <span>Alavista</span>
              </div>
              <img className="hero-visual" src={loginImage} alt="Cohete 3D de Alavista" />
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <ErrorDialog message={dialogError} onClose={() => setDialogError('')} />
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>Alavista</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav className="nav-list">
          <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>Dashboard</button>
          <button className={activeSection === 'projects' ? 'active' : ''} onClick={() => setActiveSection('projects')}>Proyectos</button>
          <button className={activeSection === 'tasks' ? 'active' : ''} onClick={() => setActiveSection('tasks')}>Tareas</button>
          <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>Mi perfil</button>
          {canManageUsers && <button className={activeSection === 'team' ? 'active' : ''} onClick={() => setActiveSection('team')}>Equipo</button>}
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
            <h1>{getSectionTitle(activeSection)}</h1>
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
                <RecentActivity tasks={recentTasks} />
              </aside>
            </section>
          </>
        )}

        {activeSection === 'projects' && (
          <section className="management-grid">
            {canCreateProjects ? (
              <ProjectForm
                formMessage={formMessage}
                onSubmit={handleCreateProject}
                projectForm={projectForm}
                setProjectForm={setProjectForm}
              />
            ) : (
              <p className="state-message">Tu rol puede visualizar proyectos relacionados a tus tareas, pero no crear nuevos proyectos.</p>
            )}
            <ProjectList
              editProjectForm={editProjectForm}
              editingProjectId={editingProjectId}
              formMessage={formMessage}
              onArchiveProject={handleArchiveProject}
              onCancelEdit={() => setEditingProjectId(null)}
              onClearSelection={() => setSelectedProject(null)}
              onSelectProject={handleSelectProject}
              onStartEdit={startEditingProject}
              onSubmitEdit={handleUpdateProject}
              selectedProject={selectedProject}
              setEditProjectForm={setEditProjectForm}
              user={user}
              projects={projects}
            />
          </section>
        )}

        {activeSection === 'tasks' && (
          <section className="management-grid">
            <TaskForm
              assignableUsers={assignableUsers}
              formMessage={formMessage}
              onSubmit={handleCreateTask}
              projects={projects}
              setTaskForm={setTaskForm}
              taskForm={taskForm}
            />
            <TaskPanel
              assignableUsers={assignableUsers}
              editTaskForm={editTaskForm}
              editingTaskId={editingTaskId}
              filters={taskFilters}
              onAdvanceTask={handleAdvanceTask}
              onCancelEdit={() => setEditingTaskId(null)}
              onDeleteTask={handleDeleteTask}
              onStartEdit={startEditingTask}
              onSubmitEdit={handleUpdateTask}
              projects={projects}
              setEditTaskForm={setEditTaskForm}
              setFilters={setTaskFilters}
              tasks={tasks}
              user={user}
            />
          </section>
        )}

        {activeSection === 'profile' && (
          <section className="management-grid profile-grid">
            <ProfileForm
              formMessage={formMessage}
              onSubmit={handleUpdateProfile}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
            />
            <div className="main-panel">
              <div className="section-header">
                <h2>Datos de cuenta</h2>
                <mark className="status done">{roleLabels[user.role]}</mark>
              </div>
              <div className="profile-summary">
                <span className="avatar large-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <small>El rol solo puede ser cambiado por un Admin.</small>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'team' && canManageUsers && (
          <section className="management-grid">
            <div className="stacked-forms">
              <UserForm
                formMessage={formMessage}
                onSubmit={handleCreateUser}
                setUserForm={setUserForm}
                userForm={userForm}
              />
            </div>
            <TeamList
              editUserForm={editUserForm}
              editingUserId={editingUserId}
              onCancelEdit={() => setEditingUserId(null)}
              onDeactivateUser={handleDeactivateUser}
              onStartEdit={startEditingUser}
              onSubmitEdit={handleUpdateUser}
              setEditUserForm={setEditUserForm}
              users={users}
            />
          </section>
        )}
      </main>
    </div>
  )
}

function getSectionTitle(section: Section) {
  const titles: Record<Section, string> = {
    dashboard: 'Dashboard de proyectos',
    profile: 'Mi perfil',
    projects: 'Proyectos',
    tasks: 'Tareas',
    team: 'Equipo',
  }
  return titles[section]
}

function ErrorDialog({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="error-dialog" role="alertdialog" aria-modal="true" aria-labelledby="error-dialog-title">
        <div>
          <span className="eyebrow">Error</span>
          <h2 id="error-dialog-title">No se pudo completar la acción</h2>
        </div>
        <p>{message}</p>
        <button className="primary-button" type="button" onClick={onClose}>Entendido</button>
      </section>
    </div>
  )
}

function ProjectForm({
  formMessage,
  onSubmit,
  projectForm,
  setProjectForm,
}: {
  formMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  projectForm: { description: string; name: string; status: ProjectStatus }
  setProjectForm: (form: { description: string; name: string; status: ProjectStatus }) => void
}) {
  return (
    <form className="management-form" onSubmit={onSubmit}>
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
  )
}

function TaskForm({
  assignableUsers,
  formMessage,
  onSubmit,
  projects,
  setTaskForm,
  taskForm,
}: {
  assignableUsers: User[]
  formMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  projects: Project[]
  setTaskForm: (form: TaskFormState) => void
  taskForm: TaskFormState
}) {
  return (
    <form className="management-form" onSubmit={onSubmit}>
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
          {assignableUsers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </label>
      <div className="form-row">
        <label>
          Estado
          <select value={taskForm.status} disabled onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value as TaskStatus })}>
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
  )
}

function UserForm({
  formMessage,
  onSubmit,
  setUserForm,
  userForm,
}: {
  formMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  setUserForm: (form: { email: string; name: string; password: string; role: Role }) => void
  userForm: { email: string; name: string; password: string; role: Role }
}) {
  return (
    <form className="management-form" onSubmit={onSubmit}>
      <div>
        <span className="eyebrow">Solo Admin</span>
        <h2>Crear usuario</h2>
      </div>
      <label>
        Nombre
        <input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required />
      </label>
      <label>
        Email
        <input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required />
      </label>
      <label>
        Contraseña
        <input type="password" minLength={8} value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required />
      </label>
      <label>
        Rol
        <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as Role })}>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="developer">Developer</option>
        </select>
      </label>
      <button className="primary-button" type="submit">Crear usuario</button>
      {formMessage && <p className="inline-message">{formMessage}</p>}
    </form>
  )
}

function ProfileForm({
  formMessage,
  onSubmit,
  profileForm,
  setProfileForm,
}: {
  formMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  profileForm: { avatar_url: string; email: string; name: string }
  setProfileForm: (form: { avatar_url: string; email: string; name: string }) => void
}) {
  return (
    <form className="management-form" onSubmit={onSubmit}>
      <div>
        <span className="eyebrow">Perfil propio</span>
        <h2>Editar mi perfil</h2>
      </div>
      <label>
        Nombre
        <input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} required />
      </label>
      <label>
        Email
        <input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} required />
      </label>
      <label>
        Avatar URL
        <input value={profileForm.avatar_url} onChange={(event) => setProfileForm({ ...profileForm, avatar_url: event.target.value })} />
      </label>
      <button className="primary-button" type="submit">Actualizar perfil</button>
      {formMessage && <p className="inline-message">{formMessage}</p>}
    </form>
  )
}

function ProjectList({
  editProjectForm,
  editingProjectId,
  formMessage,
  onArchiveProject,
  onCancelEdit,
  onClearSelection,
  onSelectProject,
  onStartEdit,
  onSubmitEdit,
  projects,
  selectedProject,
  setEditProjectForm,
  user,
}: {
  editProjectForm: { description: string; name: string; status: ProjectStatus }
  editingProjectId: number | null
  formMessage: string
  onArchiveProject: (projectId: number) => void
  onCancelEdit: () => void
  onClearSelection: () => void
  onSelectProject: (projectId: number) => void
  onStartEdit: (project: Project) => void
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void
  projects: Project[]
  selectedProject: Project | null
  setEditProjectForm: (form: { description: string; name: string; status: ProjectStatus }) => void
  user: User
}) {
  return (
    <div className="main-panel">
      <div className="section-header">
        <h2>Listado de proyectos</h2>
        <span className="count-pill">{projects.length}</span>
      </div>
      {selectedProject && (
        <section className="detail-panel project-detail-card">
          <div className="section-header">
            <div>
              <span className="eyebrow">Detalle del proyecto</span>
              <h2>{selectedProject.name}</h2>
            </div>
            <div className="card-actions">
              <mark className={`status ${selectedProject.status === 'active' ? 'done' : 'todo'}`}>
                {projectStatusLabels[selectedProject.status]}
              </mark>
              <button className="secondary-button" type="button" onClick={onClearSelection}>Cerrar</button>
            </div>
          </div>
          <p>{selectedProject.description || 'Sin descripción'}</p>
          <div className="project-detail-meta">
            <span>Owner: <strong>{selectedProject.owner_name || 'Sin owner'}</strong></span>
            <span>Tareas asociadas: <strong>{selectedProject.tasks?.length ?? 0}</strong></span>
          </div>
          <div className="task-table project-detail-table" role="table" aria-label="Tareas del proyecto">
            <div className="table-row project-task-row table-head" role="row">
              <span>Tarea</span>
              <span>Responsable</span>
              <span>Estado</span>
              <span>Prioridad</span>
              <span>Vence</span>
            </div>
            {(selectedProject.tasks ?? []).map((task) => (
              <div className="table-row project-task-row" role="row" key={task.id}>
                <span><strong>{task.title}</strong></span>
                <span>{task.assigned_to_name}</span>
                <span><mark className={`status ${task.status}`}>{statusLabels[task.status]}</mark></span>
                <span><mark className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</mark></span>
                <span>{task.due_date ?? 'Sin fecha'}</span>
              </div>
            ))}
            {(selectedProject.tasks ?? []).length === 0 && <p className="empty-state">Este proyecto aún no tiene tareas asociadas.</p>}
          </div>
        </section>
      )}
      <div className="cards-list">
        {projects.map((project) => (
          <article className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`} key={project.id}>
            {editingProjectId === project.id ? (
              <form className="inline-edit-form" onSubmit={onSubmitEdit}>
                <label>
                  Nombre
                  <input value={editProjectForm.name} onChange={(event) => setEditProjectForm({ ...editProjectForm, name: event.target.value })} required />
                </label>
                <label>
                  Descripción
                  <textarea value={editProjectForm.description} onChange={(event) => setEditProjectForm({ ...editProjectForm, description: event.target.value })} />
                </label>
                <label>
                  Estado
                  <select value={editProjectForm.status} onChange={(event) => setEditProjectForm({ ...editProjectForm, status: event.target.value as ProjectStatus })}>
                    <option value="active">Activo</option>
                    <option value="archived">Archivado</option>
                  </select>
                </label>
                <div className="card-actions">
                  <button className="primary-button" type="submit">Guardar</button>
                  <button className="secondary-button" type="button" onClick={onCancelEdit}>Cancelar</button>
                </div>
                {formMessage && <p className="inline-message">{formMessage}</p>}
              </form>
            ) : (
              <>
                <strong>{project.name}</strong>
                <span>{project.description || 'Sin descripción'}</span>
                <span>Owner: {project.owner_name || 'Sin owner'}</span>
                <div className="card-actions">
                  <mark className={`status ${project.status === 'active' ? 'done' : 'todo'}`}>{projectStatusLabels[project.status]}</mark>
                  <button className="secondary-button" type="button" onClick={() => onSelectProject(project.id)}>Detalle</button>
                  {(user.role === 'admin' || (user.role === 'project_manager' && project.owner === user.id)) && (
                    <button className="secondary-button" type="button" onClick={() => onStartEdit(project)}>Editar</button>
                  )}
                  {user.role === 'admin' && project.status !== 'archived' && (
                    <button className="danger-button" type="button" onClick={() => onArchiveProject(project.id)}>Archivar</button>
                  )}
                </div>
              </>
            )}
          </article>
        ))}
        {projects.length === 0 && <p className="empty-state">Aún no hay proyectos disponibles.</p>}
      </div>
    </div>
  )
}

function TeamList({
  editUserForm,
  editingUserId,
  onCancelEdit,
  onDeactivateUser,
  onStartEdit,
  onSubmitEdit,
  setEditUserForm,
  users,
}: {
  editUserForm: { email: string; is_active: boolean; name: string; role: Role }
  editingUserId: number | null
  onCancelEdit: () => void
  onDeactivateUser: (userId: number) => void
  onStartEdit: (member: User) => void
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void
  setEditUserForm: (form: { email: string; is_active: boolean; name: string; role: Role }) => void
  users: User[]
}) {
  return (
    <div className="main-panel">
      <div className="section-header">
        <h2>Usuarios</h2>
        <span className="count-pill">{users.length}</span>
      </div>
      <div className="cards-list">
        {users.map((member) => (
          <article className="project-card" key={member.id}>
            {editingUserId === member.id ? (
              <form className="inline-edit-form" onSubmit={onSubmitEdit}>
                <label>
                  Nombre
                  <input value={editUserForm.name} onChange={(event) => setEditUserForm({ ...editUserForm, name: event.target.value })} required />
                </label>
                <label>
                  Email
                  <input type="email" value={editUserForm.email} onChange={(event) => setEditUserForm({ ...editUserForm, email: event.target.value })} required />
                </label>
                <label>
                  Rol
                  <select value={editUserForm.role} onChange={(event) => setEditUserForm({ ...editUserForm, role: event.target.value as Role })}>
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="developer">Developer</option>
                  </select>
                </label>
                <label className="checkbox-line">
                  <input
                    checked={editUserForm.is_active}
                    type="checkbox"
                    onChange={(event) => setEditUserForm({ ...editUserForm, is_active: event.target.checked })}
                  />
                  Activo
                </label>
                <div className="card-actions">
                  <button className="primary-button" type="submit">Guardar</button>
                  <button className="secondary-button" type="button" onClick={onCancelEdit}>Cancelar</button>
                </div>
              </form>
            ) : (
              <>
                <strong>{member.name}</strong>
                <span>{member.email}</span>
                <div className="card-actions">
                  <mark className={`status ${member.is_active === false ? 'todo' : 'done'}`}>
                    {member.is_active === false ? 'Inactivo' : roleLabels[member.role]}
                  </mark>
                  <button className="secondary-button" type="button" onClick={() => onStartEdit(member)}>Editar</button>
                  <button className="danger-button" type="button" onClick={() => onDeactivateUser(member.id)}>Desactivar</button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

function getNextTaskLabel(status: TaskStatus) {
  const labels: Partial<Record<TaskStatus, string>> = {
    in_progress: 'Enviar a revisión',
    in_review: 'Marcar completada',
    todo: 'Iniciar',
  }

  return labels[status]
}

function TaskPanel({
  assignableUsers = [],
  editTaskForm,
  editingTaskId,
  filters,
  onAdvanceTask,
  onCancelEdit,
  onDeleteTask,
  onStartEdit,
  onSubmitEdit,
  projects = [],
  setEditTaskForm,
  setFilters,
  tasks,
  user,
}: {
  assignableUsers?: User[]
  editTaskForm?: TaskFormState
  editingTaskId?: number | null
  filters?: TaskFilters
  onAdvanceTask?: (task: Task) => void
  onCancelEdit?: () => void
  onDeleteTask?: (taskId: number) => void
  onStartEdit?: (task: Task) => void
  onSubmitEdit?: (event: FormEvent<HTMLFormElement>) => void
  projects?: Project[]
  setEditTaskForm?: (form: TaskFormState) => void
  setFilters?: (filters: TaskFilters) => void
  tasks: Task[]
  user?: User
}) {
  const canEditTasks = Boolean(editTaskForm && onSubmitEdit && onStartEdit && setEditTaskForm)
  const canDeleteTasks = user?.role === 'admin' || user?.role === 'project_manager'
  return (
    <div className="main-panel" id="tasks">
      <div className="section-header">
        <div>
          <span className="eyebrow">Flujo de trabajo</span>
          <h2>Tareas</h2>
        </div>
        <span className="count-pill">{tasks.length}</span>
      </div>

      {filters && setFilters && (
        <div className="filters-bar" aria-label="Filtros de tareas">
          <label>
            Estado
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Todos</option>
              <option value="todo">Pendiente</option>
              <option value="in_progress">En progreso</option>
              <option value="in_review">En revisión</option>
              <option value="done">Completado</option>
            </select>
          </label>
          <label>
            Prioridad
            <select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
              <option value="">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </label>
          <label>
            Asignado
            <select value={filters.assigned_to} onChange={(event) => setFilters({ ...filters, assigned_to: event.target.value })}>
              <option value="">Todos</option>
              {assignableUsers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
          <label>
            Proyecto
            <select value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })}>
              <option value="">Todos</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label>
            Orden
            <select value={filters.ordering} onChange={(event) => setFilters({ ...filters, ordering: event.target.value })}>
              <option value="due_date">Vence primero</option>
              <option value="-created_at">Más recientes</option>
              <option value="priority">Prioridad</option>
              <option value="status">Estado</option>
            </select>
          </label>
        </div>
      )}

      <div className="task-table" role="table" aria-label="Tareas">
        <div className={`table-row table-head ${canEditTasks ? 'task-row-actions' : ''}`} role="row">
          <span>Tarea</span>
          <span>Proyecto</span>
          <span>Responsable</span>
          <span>Estado</span>
          <span>Prioridad</span>
          <span>Vence</span>
          {canEditTasks && <span>Acciones</span>}
        </div>

        {tasks.map((task) => (
          editingTaskId === task.id && editTaskForm && setEditTaskForm && onSubmitEdit ? (
            <form className="table-row task-row-actions inline-edit-form" role="row" key={task.id} onSubmit={onSubmitEdit}>
              <span>
                <input value={editTaskForm.title} onChange={(event) => setEditTaskForm({ ...editTaskForm, title: event.target.value })} required />
                <textarea value={editTaskForm.description} onChange={(event) => setEditTaskForm({ ...editTaskForm, description: event.target.value })} />
              </span>
              <span>
                <select value={editTaskForm.project} onChange={(event) => setEditTaskForm({ ...editTaskForm, project: event.target.value })} required>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </span>
              <span>
                <select value={editTaskForm.assigned_to} onChange={(event) => setEditTaskForm({ ...editTaskForm, assigned_to: event.target.value })} required>
                  {assignableUsers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </span>
              <span>
                <select value={editTaskForm.status} onChange={(event) => setEditTaskForm({ ...editTaskForm, status: event.target.value as TaskStatus })}>
                  <option value="todo">Pendiente</option>
                  <option value="in_progress">En progreso</option>
                  <option value="in_review">En revisión</option>
                  <option value="done">Completado</option>
                </select>
              </span>
              <span>
                <select value={editTaskForm.priority} onChange={(event) => setEditTaskForm({ ...editTaskForm, priority: event.target.value as TaskPriority })}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </span>
              <span>
                <input type="date" value={editTaskForm.due_date} onChange={(event) => setEditTaskForm({ ...editTaskForm, due_date: event.target.value })} />
              </span>
              <span className="card-actions">
                <button className="primary-button" type="submit">Guardar</button>
                <button className="secondary-button" type="button" onClick={onCancelEdit}>Cancelar</button>
              </span>
            </form>
          ) : (
            <div className={`table-row ${canEditTasks ? 'task-row-actions' : ''}`} role="row" key={task.id}>
              <span>
                <strong>{task.title}</strong>
                <small>#{task.id}</small>
              </span>
              <span><mark className="project-badge">{task.project_name}</mark></span>
              <span>{task.assigned_to_name}</span>
              <span><mark className={`status ${task.status}`}>{statusLabels[task.status]}</mark></span>
              <span><mark className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</mark></span>
              <span>{task.due_date ?? 'Sin fecha'}</span>
              {canEditTasks && (
                <span className="card-actions">
                  {getNextTaskLabel(task.status) && (
                    <button className="secondary-button" type="button" onClick={() => onAdvanceTask?.(task)}>
                      {getNextTaskLabel(task.status)}
                    </button>
                  )}
                  <button className="secondary-button" type="button" onClick={() => onStartEdit?.(task)}>Editar</button>
                  {canDeleteTasks && (
                    <button className="danger-button" type="button" onClick={() => onDeleteTask?.(task.id)}>Eliminar</button>
                  )}
                </span>
              )}
            </div>
          )
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

function RecentActivity({ tasks }: { tasks: Task[] }) {
  return (
    <section className="panel-section">
      <div className="section-header compact">
        <h2>Actividad reciente</h2>
        <span>{tasks.length}</span>
      </div>
      <ul className="activity-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <span className={`activity-dot ${task.status}`} />
            <div>
              <strong>{task.title}</strong>
              <span>{task.project_name} - {statusLabels[task.status]}</span>
            </div>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="empty-state">Aún no hay actividad registrada.</p>}
    </section>
  )
}

export default App
