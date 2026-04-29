from django.conf import settings
from django.db import models


class TaskStatus(models.TextChoices):
    TODO = 'todo', 'Todo'
    IN_PROGRESS = 'in_progress', 'In progress'
    IN_REVIEW = 'in_review', 'In review'
    DONE = 'done', 'Done'


class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    CRITICAL = 'critical', 'Critical'


class Task(models.Model):
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=24,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )
    priority = models.CharField(
        max_length=16,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_tasks',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_tasks',
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['project']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['due_date']),
        ]
        ordering = ['due_date', '-created_at']

    def __str__(self):
        return self.title
