from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.projects.models import Project
from apps.tasks.models import Task
from apps.users.models import User


class Command(BaseCommand):
    help = 'Carga usuarios, proyectos y tareas de ejemplo para desarrollo.'

    def handle(self, *args, **options):
        self.stdout.write('Cargando datos de ejemplo...')

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

        users = {}
        created_users = 0
        updated_users = 0
        sample_credentials = []

        for user_data in users_data:
            password = user_data['password']
            sample_credentials.append((user_data['email'], password))
            user, created = User.objects.update_or_create(
                email=user_data['email'],
                defaults={
                    'name': user_data['name'],
                    'role': user_data['role'],
                },
            )
            user.set_password(password)
            user.save(update_fields=['password', 'name', 'role', 'updated_at'])
            users[user.email] = user

            if created:
                created_users += 1
                self.stdout.write(f'Usuario creado: {user.email}')
            else:
                updated_users += 1
                self.stdout.write(f'Usuario actualizado: {user.email}')

        projects_data = [
            {
                'name': 'Proyecto Web E-commerce',
                'description': 'Desarrollo de una plataforma de comercio electronico completa',
                'status': 'active',
                'owner': users['admin@example.com'],
            },
            {
                'name': 'Sistema de Gestion Interna',
                'description': 'Aplicacion interna para gestion de empleados y recursos',
                'status': 'archived',
                'owner': users['manager@example.com'],
            },
        ]

        projects = {}
        created_projects = 0
        updated_projects = 0

        for project_data in projects_data:
            project, created = Project.objects.update_or_create(
                name=project_data['name'],
                defaults={
                    'description': project_data['description'],
                    'status': project_data['status'],
                    'owner': project_data['owner'],
                },
            )
            projects[project.name] = project

            if created:
                created_projects += 1
                self.stdout.write(f'Proyecto creado: {project.name}')
            else:
                updated_projects += 1
                self.stdout.write(f'Proyecto actualizado: {project.name}')

        tasks_data = [
            {
                'title': 'Implementar autenticacion de usuarios',
                'description': 'Crear sistema de login y registro con JWT',
                'status': 'done',
                'priority': 'high',
                'project': projects['Proyecto Web E-commerce'],
                'assigned_to': users['dev1@example.com'],
                'created_by': users['admin@example.com'],
                'due_date': date.today() + timedelta(days=7),
            },
            {
                'title': 'Disenar base de datos del catalogo',
                'description': 'Modelar las tablas para productos, categorias y ordenes',
                'status': 'in_progress',
                'priority': 'critical',
                'project': projects['Proyecto Web E-commerce'],
                'assigned_to': users['dev2@example.com'],
                'created_by': users['manager@example.com'],
                'due_date': date.today() + timedelta(days=14),
            },
            {
                'title': 'Crear API de productos',
                'description': 'Endpoints REST para gestion de productos',
                'status': 'todo',
                'priority': 'medium',
                'project': projects['Proyecto Web E-commerce'],
                'assigned_to': users['dev1@example.com'],
                'created_by': users['admin@example.com'],
                'due_date': date.today() + timedelta(days=21),
            },
            {
                'title': 'Implementar dashboard administrativo',
                'description': 'Panel de control para gestion del sistema interno',
                'status': 'in_review',
                'priority': 'high',
                'project': projects['Sistema de Gestion Interna'],
                'assigned_to': users['dev2@example.com'],
                'created_by': users['manager@example.com'],
                'due_date': date.today() + timedelta(days=10),
            },
            {
                'title': 'Configurar permisos de usuarios',
                'description': 'Sistema de roles y permisos para empleados',
                'status': 'todo',
                'priority': 'low',
                'project': projects['Sistema de Gestion Interna'],
                'assigned_to': users['dev1@example.com'],
                'created_by': users['manager@example.com'],
                'due_date': date.today() + timedelta(days=30),
            },
            {
                'title': 'Optimizar rendimiento de consultas',
                'description': 'Mejorar velocidad de carga de datos en el sistema',
                'status': 'in_progress',
                'priority': 'medium',
                'project': projects['Sistema de Gestion Interna'],
                'assigned_to': users['dev2@example.com'],
                'created_by': users['admin@example.com'],
                'due_date': date.today() + timedelta(days=5),
            },
        ]

        created_tasks = 0
        updated_tasks = 0

        for task_data in tasks_data:
            task, created = Task.objects.update_or_create(
                title=task_data['title'],
                project=task_data['project'],
                defaults={
                    'description': task_data['description'],
                    'status': task_data['status'],
                    'priority': task_data['priority'],
                    'assigned_to': task_data['assigned_to'],
                    'created_by': task_data['created_by'],
                    'due_date': task_data['due_date'],
                },
            )

            if created:
                created_tasks += 1
                self.stdout.write(f'Tarea creada: {task.title}')
            else:
                updated_tasks += 1
                self.stdout.write(f'Tarea actualizada: {task.title}')

        self.stdout.write(self.style.SUCCESS('Datos de ejemplo cargados correctamente.'))
        self.stdout.write(
            f'Resumen: usuarios {created_users} creados/{updated_users} actualizados, '
            f'proyectos {created_projects} creados/{updated_projects} actualizados, '
            f'tareas {created_tasks} creadas/{updated_tasks} actualizadas.'
        )
        self.stdout.write('Credenciales:')
        for email, password in sample_credentials:
            self.stdout.write(f'  - {email} / {password}')
