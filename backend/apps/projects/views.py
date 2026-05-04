from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.models import UserRole
from apps.users.permissions import ProjectRolePermission

from .models import Project, ProjectStatus
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related('owner').all()
    serializer_class = ProjectSerializer
    permission_classes = [ProjectRolePermission]
    filterset_fields = ['status', 'owner']
    search_fields = ['name', 'description', 'owner__name']
    ordering_fields = ['name', 'status', 'created_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.select_related('owner').prefetch_related('tasks')

        if user.role == UserRole.ADMIN:
            return queryset.all()

        if user.role == UserRole.PROJECT_MANAGER:
            return queryset.filter(owner=user)

        return queryset.filter(tasks__assigned_to=user).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        self.perform_destroy(project)
        return Response(
            {
                'success': True,
                'data': None,
                'message': 'Proyecto eliminado correctamente',
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        project = self.get_object()
        project.status = ProjectStatus.ARCHIVED
        project.save(update_fields=['status', 'updated_at'])
        return Response(
            {
                'success': True,
                'data': self.get_serializer(project).data,
                'message': 'Proyecto archivado correctamente',
            }
        )
