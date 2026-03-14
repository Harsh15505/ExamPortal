from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create or update demo users for student, teacher, and admin roles.'

    def handle(self, *args, **options):
        user_model = get_user_model()

        demo_users = [
            {
                'username': 'demo_student',
                'email': 'demo_student@example.com',
                'password': 'Student@123',
                'role': 'student',
                'first_name': 'Demo',
                'last_name': 'Student',
            },
            {
                'username': 'demo_teacher',
                'email': 'demo_teacher@example.com',
                'password': 'Teacher@123',
                'role': 'teacher',
                'first_name': 'Demo',
                'last_name': 'Teacher',
            },
            {
                'username': 'demo_admin',
                'email': 'demo_admin@example.com',
                'password': 'Admin@123',
                'role': 'admin',
                'first_name': 'Demo',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            },
        ]

        for spec in demo_users:
            username = spec['username']
            password = spec['password']
            defaults = {
                'email': spec['email'],
                'role': spec['role'],
                'first_name': spec['first_name'],
                'last_name': spec['last_name'],
                'is_staff': spec.get('is_staff', False),
                'is_superuser': spec.get('is_superuser', False),
                'is_active': True,
            }

            user, created = user_model.objects.update_or_create(
                username=username,
                defaults=defaults,
            )
            user.set_password(password)
            user.save()

            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f"{action}: {username} ({spec['role']})"))

        self.stdout.write(self.style.SUCCESS('Demo users are ready.'))
