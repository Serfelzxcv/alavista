from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.users.models import User
from apps.projects.models import Project
from apps.tasks.models import Task
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Load sample data for development'

    def handle(self, *args, **options):
        self.stdout.write('Loading sample data...')

        # Create users
        users_data = [
            {
                'name': 'Admin User',
                'email': 'admin@example.com',
                'role': 'admin',
                'password': 'admin123',
            },
            {
                'name': 'Project Manager',
                'email': 'manager@example.com',
                'role': 'project_manager',
                'password': 'manager123',
            },
            {
                'name': 'Developer One',
                'email': 'dev1@example.com',
                'role': 'developer',
                'password': 'dev123',
            },
            {
                'name': 'Developer Two',
                'email': 'dev2@example.com',
                'role': 'developer',
                'password': 'dev123',
            },
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'name': user_data['name'],
                    'role': user_data['role'],
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'Created user: {user.email}')
            users.append(user)

        admin_user = users[0]
        manager_user = users[1]
        dev1 = users[2]
        dev2 = users[3]

        # Create projects
        projects_data = [
            {
                'name': 'Proyecto Web E-commerce',
                'description': 'Desarrollo de una plataforma de comercio electrónico completa',
                'status': 'active',
                'owner': admin_user,
            },
            {
                'name': 'Sistema de Gestión Interna',
                'description': 'Aplicación interna para gestión de empleados y recursos',
                'status': 'archived',
                'owner': manager_user,
            },
        ]

        projects = []
        for project_data in projects_data:
            project, created = Project.objects.get_or_create(
                name=project_data['name'],
                defaults={
                    'description': project_data['description'],
                    'status': project_data['status'],
                    'owner': project_data['owner'],
                }
            )
            if created:
                self.stdout.write(f'Created project: {project.name}')
            projects.append(project)

        ecommerce_project = projects[0]
        internal_project = projects[1]

        # Create tasks
        tasks_data = [
            {
                'title': 'Implementar autenticación de usuarios',
                'description': 'Crear sistema de login y registro con JWT',
                'status': 'done',
                'priority': 'high',
                'project': ecommerce_project,
                'assigned_to': dev1,
                'created_by': admin_user,
                'due_date': date.today() + timedelta(days=7),
            },
            {
                'title': 'Diseñar base de datos del catálogo',
                'description': 'Modelar las tablas para productos, categorías y órdenes',
                'status': 'in_progress',
                'priority': 'critical',
                'project': ecommerce_project,
                'assigned_to': dev2,
                'created_by': manager_user,
                'due_date': date.today() + timedelta(days=14),
            },
            {
                'title': 'Crear API de productos',
                'description': 'Endpoints REST para gestión de productos',
                'status': 'todo',
                'priority': 'medium',
                'project': ecommerce_project,
                'assigned_to': dev1,
                'created_by': admin_user,
                'due_date': date.today() + timedelta(days=21),
            },
            {
                'title': 'Implementar dashboard administrativo',
                'description': 'Panel de control para gestión del sistema interno',
                'status': 'in_review',
                'priority': 'high',
                'project': internal_project,
                'assigned_to': dev2,
                'created_by': manager_user,
                'due_date': date.today() + timedelta(days=10),
            },
            {
                'title': 'Configurar permisos de usuarios',
                'description': 'Sistema de roles y permisos para empleados',
                'status': 'todo',
                'priority': 'low',
                'project': internal_project,
                'assigned_to': dev1,
                'created_by': manager_user,
                'due_date': date.today() + timedelta(days=30),
            },
            {
                'title': 'Optimizar rendimiento de consultas',
                'description': 'Mejorar velocidad de carga de datos en el sistema',
                'status': 'in_progress',
                'priority': 'medium',
                'project': internal_project,
                'assigned_to': dev2,
                'created_by': admin_user,
                'due_date': date.today() + timedelta(days=5),
            },
        ]

        for task_data in tasks_data:
            task, created = Task.objects.get_or_create(
                title=task_data['title'],
                project=task_data['project'],
                defaults={
                    'description': task_data['description'],
                    'status': task_data['status'],
                    'priority': task_data['priority'],
                    'assigned_to': task_data['assigned_to'],
                    'created_by': task_data['created_by'],
                    'due_date': task_data['due_date'],
                }
            )
            if created:
                self.stdout.write(f'Created task: {task.title}')

        self.stdout.write(self.style.SUCCESS('Sample data loaded successfully!'))
        self.stdout.write('\nSample users:')
        for user in users:
            self.stdout.write(f'  - {user.email}: {user.name} (password: {user_data["password"]})')
        self.stdout.write('\nYou can now log in with these credentials.')