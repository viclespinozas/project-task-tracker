from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///../../test.db')

with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM projects'))
    print('Projects:', result.fetchone()[0])
    
    result = conn.execute(text('SELECT COUNT(*) FROM tasks'))
    print('Tasks:', result.fetchone()[0])