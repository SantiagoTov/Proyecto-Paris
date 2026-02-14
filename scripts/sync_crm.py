import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def sync_leads():
    """
    Sincroniza un Lead desde nuestro backend hacia Twenty CRM (Supabase).
    Este script asume que Twenty ya ha sido inicializado y ha creado su esquema 'default'.
    """
    
    # Configuración de conexión
    host = os.getenv("SUPABASE_DB_HOST")
    password = os.getenv("SUPABASE_DB_PASSWORD")
    user = "postgres"
    dbname = "postgres"
    port = "5432"

    if not password or password == "[TU_CONTRASEÑA_DE_BASE_DE_DATOS_SUPABASE]":
        print("ERROR: Por favor configura SUPABASE_DB_PASSWORD en el archivo .env")
        return

    conn = None
    try:
        # Conectar a la base de datos Supabase
        print(f"Conectando a {host}...")
        conn = psycopg2.connect(
            host=host,
            database=dbname,
            user=user,
            password=password,
            port=port
        )
        cursor = conn.cursor()
        
        # Datos del Lead simulado (esto vendría de Firecrawl/Backend)
        lead = {
            "name": "Cliente Potencial (Desde Paris IA)",
            "email": "cliente@ejemplo.com",
            "company": "Tech Corp"
        }
        
        print(f"Sincronizando lead: {lead['name']}...")

        # Verificar si el esquema 'default' existe (creado por Twenty)
        cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'default';")
        if not cursor.fetchone():
            print("ERROR: El esquema 'default' no existe en la base de datos.")
            print("Asegúrate de haber ejecutado 'docker-compose up' y que Twenty haya completado sus migraciones iniciales.")
            return

        # Insertar en la tabla 'person' del esquema 'default'
        # Nota: La estructura de Twenty puede variar. Esto asume una tabla estándar 'person' con campos básicos.
        # En producción, se recomienda usar la API GraphQL de Twenty en lugar de inserción directa SQL.
        
        query = """
            INSERT INTO "default"."person" (
                "id", "createdAt", "updatedAt", "name"
            ) VALUES (
                gen_random_uuid(), NOW(), NOW(), %s
            ) RETURNING "id";
        """
        
        cursor.execute(query, (lead['name'],))
        new_id = cursor.fetchone()[0]
        
        conn.commit()
        print(f"✅ Lead insertado exitosamente en Twenty CRM! ID: {new_id}")
        print("Ahora puedes verlo en la interfaz de gestión de clientes.")

    except Exception as e:
        print(f"❌ Error al sincronizar lead: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cursor.close()
            conn.close()
            print("Conexión cerrada.")

if __name__ == "__main__":
    sync_leads()
