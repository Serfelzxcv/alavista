from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.users.models import UserRole
from apps.users.permissions import TaskRolePermission

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('project', 'assigned_to', 'created_by').all()
    serializer_class = TaskSerializer
    permission_classes = [TaskRolePermission]
    filterset_fields = ['status', 'priority', 'project', 'assigned_to']
    search_fields = ['title', 'description', 'project__name', 'assigned_to__name']
    ordering_fields = ['due_date', 'created_at', 'updated_at', 'priority', 'status']

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.select_related('project', 'assigned_to', 'created_by')

        if user.role == UserRole.ADMIN:
            return queryset.all()

        if user.role == UserRole.PROJECT_MANAGER:
            return queryset.filter(project__owner=user)

        return queryset.filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user
        assigned_to = serializer.validated_data.get('assigned_to')
        project = serializer.validated_data.get('project')

        if user.role == UserRole.DEVELOPER and assigned_to != user:
            raise PermissionDenied('Un Developer solo puede crear tareas asignadas a sí mismo.')

        if user.role == UserRole.PROJECT_MANAGER and project.owner_id != user.id:
            raise PermissionDenied('Un Project Manager solo puede crear tareas en sus proyectos.')

        serializer.save(created_by=self.request.user)
