from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, SubjectViewSet, QuestionViewSet, ExamViewSet,
    ExamAttemptViewSet, ResultViewSet, ExamAnalyticsViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'exams', ExamViewSet)
router.register(r'attempts', ExamAttemptViewSet)
router.register(r'results', ResultViewSet)
router.register(r'analytics', ExamAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
