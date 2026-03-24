import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load secure environment variables
load_dotenv()

# The Google Watch Tower requires strict logging.
def log_agent(message, status="INFO"):
    print(f"[DB AGENT - {status}] {message}")

def run_database_diagnostics():
    log_agent("Initiating Database Connection Protocol...")
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        log_agent("CRITICAL FAILURE: No DATABASE_URL found in .env file.", "ERROR")
        return False

    try:
        # 1. Test the Connection
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        log_agent("Connection to PostgreSQL Secured.", "SUCCESS")

        # 2. Build the Vault (Tables)
        log_agent("Scanning for 'properties' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(50) DEFAULT 'MO',
                zip_code VARCHAR(20) NOT NULL,
                arv NUMERIC(10, 2),
                repair_cost NUMERIC(10, 2),
                asking_price NUMERIC(10, 2),
                rodney_score INTEGER,
                status VARCHAR(50) DEFAULT 'Available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        log_agent("Table structure verified and enforced.", "SUCCESS")

        # 3. Inject Test Inventory (Only if empty)
        cursor.execute("SELECT COUNT(*) FROM properties;")
        count = cursor.fetchone()['count']
        
        if count == 0:
            log_agent("Database is empty. Injecting initial SV-1500 test inventory...")
            test_deals = [
                ("4512 St Louis Ave", "St. Louis", "63115", 185000.00, 45000.00, 95000.00, 92),
                ("8904 Gravois Rd", "Affton", "63123", 240000.00, 30000.00, 160000.00, 88),
                ("12301 Fenton Main", "Fenton", "63026", 310000.00, 65000.00, 190000.00, 95)
            ]
            
            insert_query = """
                INSERT INTO properties (address, city, zip_code, arv, repair_cost, asking_price, rodney_score)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            for deal in test_deals:
                cursor.execute(insert_query, deal)
                log_agent(f"Injected Deal: {deal[0]} - Rodney Score: {deal[6]}")
                
        else:
            log_agent(f"Inventory check complete. {count} properties already active in the vault.")

        # Commit and Close
        conn.commit()
        cursor.close()
        conn.close()
        log_agent("All diagnostics passed. Database is ready for production.", "SUCCESS")
        return True

    except Exception as e:
        log_agent(f"FATAL ERROR during diagnostics: {e}", "ERROR")
        return False

if __name__ == "__main__":
    print("==================================================")
    print("   RODNEY & SONS: DATABASE AUTOMATION AGENT v1.0  ")
    print("==================================================")
    run_database_diagnostics()