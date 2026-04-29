from rest_framework import serializers

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'content',
            'task',
            'task_title',
            'user',
            'user_name',
            'created_at',
        ]
        read_only_fields = ['id', 'task_title', 'user_name', 'created_at']
