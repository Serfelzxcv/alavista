from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None

        if data is None or response is None:
            return super().render(data, accepted_media_type, renderer_context)

        if isinstance(data, dict) and 'openapi' in data and 'paths' in data:
            return super().render(data, accepted_media_type, renderer_context)

        if isinstance(data, dict) and 'success' in data:
            return super().render(data, accepted_media_type, renderer_context)

        if response.status_code >= 400:
            message = 'Error en la solicitud'
            errors = data

            if isinstance(data, dict):
                message = data.get('detail') or data.get('message') or message
                errors = data.get('errors', data)

            payload = {
                'success': False,
                'data': None,
                'message': message,
                'errors': errors,
            }
            return super().render(payload, accepted_media_type, renderer_context)

        payload = {
            'success': True,
            'data': data,
            'message': 'Operación completada correctamente',
            'errors': None,
        }
        return super().render(payload, accepted_media_type, renderer_context)
