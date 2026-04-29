from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.name', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'status',
            'owner',
            'owner_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'owner_name', 'created_at', 'updated_at']
