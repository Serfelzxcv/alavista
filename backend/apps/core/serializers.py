from django.utils.html import strip_tags


class SanitizedInputMixin:
    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()

        for field_name, field in self.fields.items():
            if field.read_only or field_name not in data:
                continue

            value = data.get(field_name)
            if isinstance(value, str):
                data[field_name] = strip_tags(value).strip()

        return super().to_internal_value(data)
