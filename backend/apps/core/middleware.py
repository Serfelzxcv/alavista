from django.http import JsonResponse


class GlobalExceptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception:
            return JsonResponse(
                {
                    'success': False,
                    'data': None,
                    'message': 'Error interno del servidor',
                    'errors': {'server': ['Ocurrió un error inesperado']},
                },
                status=500,
            )
