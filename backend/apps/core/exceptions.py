from rest_framework.views import exception_handler


def standard_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return None

    message = 'Error en la solicitud'
    errors = response.data

    if isinstance(response.data, dict):
        message = response.data.get('detail') or response.data.get('message') or message
        errors = response.data.get('errors', response.data)

    response.data = {
        'success': False,
        'data': None,
        'message': message,
        'errors': errors,
    }
    return response
