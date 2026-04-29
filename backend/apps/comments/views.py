from rest_framework import viewsets

from .models import Comment
from .serializers import CommentSerializer


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related('task', 'user').all()
    serializer_class = CommentSerializer
    filterset_fields = ['task', 'user']
    search_fields = ['content', 'task__title', 'user__name']
    ordering_fields = ['created_at']
