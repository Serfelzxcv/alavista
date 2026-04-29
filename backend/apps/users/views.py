from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import LoginSerializer, LogoutSerializer, RegisterSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'email', 'created_at']


@extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
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
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'message': 'Usuario registrado exitosamente',
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(responses={200: UserSerializer})
@api_view(['GET'])
def me(request):
    return Response(
        {
            'success': True,
            'data': UserSerializer(request.user).data,
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
            'message': 'Sesion cerrada exitosamente',
        }
    )
