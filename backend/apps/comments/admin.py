from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'user', 'created_at')
    search_fields = ('content', 'task__title', 'user__email', 'user__name')
    autocomplete_fields = ('task', 'user')
