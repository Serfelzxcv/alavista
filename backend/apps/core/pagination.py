from math import ceil

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPageNumberPagination(PageNumberPagination):
    page_query_param = 'page'
    page_size_query_param = 'limit'
    max_page_size = 100

    def get_paginated_response(self, data):
        limit = self.get_page_size(self.request) or len(data)
        total = self.page.paginator.count

        return Response(
            {
                'success': True,
                'data': data,
                'message': 'Listado obtenido correctamente',
                'errors': None,
                'meta': {
                    'page': self.page.number,
                    'limit': limit,
                    'total': total,
                    'totalPages': ceil(total / limit) if limit else 1,
                    'next': self.get_next_link(),
                    'previous': self.get_previous_link(),
                },
            }
        )
