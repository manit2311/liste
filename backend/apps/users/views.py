from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
import re
from .models import User
from .serializers import UserSerializer, RegisterSerializer, ManageUserSerializer
from .permissions import IsBoss
from apps.notifications.utils import notify_admins
from apps.audit.utils import log_action
from apps.core.mixins import CompanyScopedMixin


def validate_password_strength(password):
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter."
    return None


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user:
            log_action(user, "Logged in", request)
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            })
        return Response({"error": "Invalid credentials"}, status=401)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ResetAccountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        new_password = request.data.get("password") or ""

        if not username or not phone:
            return Response(
                {"detail": "Both username and phone number are required."},
                status=400
            )

        cache_key = f"reset_fail_{username}"
        fails = cache.get(cache_key, 0)
        if fails >= 5:
            return Response(
                {"detail": "Too many failed attempts. Try again in 15 minutes."},
                status=423,
            )

        user = User.objects.filter(
            username=username, phone=phone, is_active=True
        ).first()

        if not user:
            cache.set(cache_key, fails + 1, timeout=900)
            remaining = 5 - (fails + 1)
            return Response(
                {"detail": f"No account matches that username and phone number. "
                           f"{remaining} attempt(s) left."},
                status=400,
            )

        if not new_password:
            return Response({"detail": "New password is required."}, status=400)

        error = validate_password_strength(new_password)
        if error:
            return Response({"detail": error}, status=400)

        user.set_password(new_password)
        user.save()
        cache.delete(cache_key)

        notify_admins("Account reset",
                      f"🔑 '{user.username}' reset their own password via phone verification",
                      "info")
        log_action(user, "Reset own password via phone verification", request)

        return Response({
            "status": "ok",
            "detail": "Password updated. You can now sign in with your new password."
        })


class UserViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    permission_classes = [IsBoss]
    serializer_class = ManageUserSerializer
    queryset = User.objects.all().order_by('-id')

    def perform_create(self, serializer):
        password = self.request.data.get("password", "")
        error = validate_password_strength(password)
        if error:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"password": error})
        company = self.get_company()
        user = serializer.save(company=company)
        notify_admins("New user created",
                      f"👤 '{user.username}' ({user.role}) was added",
                      "info")
        log_action(self.request.user,
                   f"Created user '{user.username}' (role: {user.role})",
                   self.request)

    def perform_update(self, serializer):
        password = self.request.data.get("password", "")
        if password:
            error = validate_password_strength(password)
            if error:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"password": error})
        password_changed = bool(password)
        user = serializer.save()
        details = f"Edited user '{user.username}' (role: {user.role}, active: {user.is_active})"
        if password_changed:
            details += " — password changed"
        log_action(self.request.user, details, self.request)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {"detail": "You can't delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        notify_admins("User removed",
                      f"🗑️ '{user.username}' was removed",
                      "info")
        log_action(request.user, f"Deleted user '{user.username}'", request)
        return super().destroy(request, *args, **kwargs)