from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'priority',
            'project',
            'project_name',
            'assigned_to',
            'assigned_to_name',
            'created_by',
            'created_by_name',
            'due_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'project_name',
            'assigned_to_name',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
