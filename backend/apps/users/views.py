from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.throttles import AuthRateThrottle

from .models import User, UserRole
from .permissions import IsAdminRole
from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    ProfileSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [AuthRateThrottle]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'email', 'created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.exclude(is_superuser=True).order_by('name')

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=['is_active', 'updated_at'])
        return Response(
            {
                'success': True,
                'data': UserSerializer(user).data,
                'message': 'Usuario desactivado correctamente',
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
@api_view(['POST'])
@throttle_classes([AuthRateThrottle])
def register(request):
    if not request.user.is_authenticated or request.user.role != UserRole.ADMIN:
        return Response(
            {
                'success': False,
                'message': 'Solo un Admin puede crear usuarios y asignar roles',
                'errors': {'role': ['Permiso denegado']},
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'message': 'Error de validación',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = serializer.save()
    return Response(
        {
            'success': True,
            'data': UserSerializer(user).data,
            'message': 'Usuario registrado exitosamente',
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(request=ProfileSerializer, responses={200: ProfileSerializer})
@api_view(['GET', 'PATCH'])
def me(request):
    if request.method == 'PATCH':
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'message': 'Error de validación',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response(
            {
                'success': True,
                'data': serializer.data,
                'message': 'Perfil actualizado correctamente',
            }
        )

    return Response(
        {
            'success': True,
            'data': ProfileSerializer(request.user).data,
            'message': 'Perfil autenticado',
        }
    )


@extend_schema(request=LogoutSerializer, responses={200: None})
@api_view(['POST'])
def logout(request):
    refresh_token = request.data.get('refresh')

    if not refresh_token:
        return Response(
            {
                'success': False,
                'message': 'El refresh token es obligatorio',
                'errors': {'refresh': ['Campo requerido']},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    token = RefreshToken(refresh_token)
    token.blacklist()
    return Response(
        {
            'success': True,
            'data': None,
            'message': 'Sesión cerrada exitosamente',
        }
    )
