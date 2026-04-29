from rest_framework import viewsets

from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related('owner').all()
    serializer_class = ProjectSerializer
    filterset_fields = ['status', 'owner']
    search_fields = ['name', 'description', 'owner__name']
    ordering_fields = ['name', 'status', 'created_at', 'updated_at']
