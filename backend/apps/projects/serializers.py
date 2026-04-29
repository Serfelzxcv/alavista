from rest_framework import serializers

from apps.core.serializers import SanitizedInputMixin

from .models import Project


class ProjectTaskSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    assigned_to_name = serializers.CharField(source='assigned_to.name')
    due_date = serializers.DateField(allow_null=True)


class ProjectSerializer(SanitizedInputMixin, serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    tasks = ProjectTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'status',
            'owner',
            'owner_name',
            'tasks',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'owner_name', 'tasks', 'created_at', 'updated_at']
