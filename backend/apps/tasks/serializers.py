from rest_framework import serializers

from apps.core.serializers import SanitizedInputMixin

from .models import Task, TaskStatus


class TaskSerializer(SanitizedInputMixin, serializers.ModelSerializer):
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

    def validate_status(self, value):
        if self.instance is None and value != TaskStatus.TODO:
            raise serializers.ValidationError('La tarea debe iniciar en estado pendiente.')

        if self.instance is None or value == self.instance.status:
            return value

        allowed_transitions = {
            TaskStatus.TODO: TaskStatus.IN_PROGRESS,
            TaskStatus.IN_PROGRESS: TaskStatus.IN_REVIEW,
            TaskStatus.IN_REVIEW: TaskStatus.DONE,
        }

        if allowed_transitions.get(self.instance.status) != value:
            raise serializers.ValidationError(
                'El flujo permitido es: todo -> in_progress -> in_review -> done.'
            )

        return value
