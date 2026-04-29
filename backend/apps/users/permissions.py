from rest_framework import permissions

from .models import UserRole


class IsAdminRole(permissions.BasePermission):
    message = 'Solo un Admin puede realizar esta acción.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class ProjectRolePermission(permissions.BasePermission):
    message = 'No tienes permiso para gestionar este proyecto.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == 'create':
            return request.user.role in [UserRole.ADMIN, UserRole.PROJECT_MANAGER]

        return True

    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True

        if view.action in ['update', 'partial_update']:
            return request.user.role == UserRole.PROJECT_MANAGER and obj.owner_id == request.user.id

        if view.action == 'destroy':
            return False

        if request.user.role == UserRole.PROJECT_MANAGER:
            return obj.owner_id == request.user.id

        return obj.tasks.filter(assigned_to=request.user).exists()


class TaskRolePermission(permissions.BasePermission):
    message = 'No tienes permiso para gestionar esta tarea.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == 'destroy':
            return request.user.role in [UserRole.ADMIN, UserRole.PROJECT_MANAGER]

        return True

    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True

        if request.user.role == UserRole.PROJECT_MANAGER:
            return obj.project.owner_id == request.user.id

        if request.user.role == UserRole.DEVELOPER:
            if view.action == 'destroy':
                return False
            return obj.assigned_to_id == request.user.id

        return False
