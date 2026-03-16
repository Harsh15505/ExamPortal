from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT name, sql FROM sqlite_master WHERE type="trigger"')
triggers = cursor.fetchall()
print('Triggers:', triggers)
for table in ['student_answers', 'core_studentanswer']:
    cursor.execute(f'PRAGMA table_info({table})')
    print(f'{table} info:', cursor.fetchall())
