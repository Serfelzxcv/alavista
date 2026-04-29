from rest_framework import viewsets

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('project', 'assigned_to', 'created_by').all()
    serializer_class = TaskSerializer
    filterset_fields = ['status', 'priority', 'project', 'assigned_to']
    search_fields = ['title', 'description', 'project__name', 'assigned_to__name']
    ordering_fields = ['due_date', 'created_at', 'updated_at', 'priority', 'status']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
