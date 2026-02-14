from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

class pdfGenerator:
    def __init__(self, output_dir=".tmp"):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def generate_quote(self, business_name: str, items: list, lead_id: str):
        """
        Generates a simple PDF quote.
        items: list of dicts {name, price, qty}
        """
        filename = f"{self.output_dir}/quote_{lead_id}.pdf"
        c = canvas.Canvas(filename, pagesize=letter)
        width, height = letter

        # Header
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 50, f"Cotización para {business_name}")
        
        # Grid
        c.setFont("Helvetica", 12)
        y = height - 100
        c.drawString(50, y, "Ítem")
        c.drawString(300, y, "Cantidad")
        c.drawString(400, y, "Precio")
        
        y -= 20
        c.line(50, y, 500, y)
        
        total = 0
        y -= 20
        
        for item in items:
            c.drawString(50, y, item['name'])
            c.drawString(300, y, str(item['qty']))
            c.drawString(400, y, f"${item['price']}")
            total += item['qty'] * item['price']
            y -= 20

        y -= 20
        c.line(50, y, 500, y)
        y -= 30
        c.setFont("Helvetica-Bold", 14)
        c.drawString(300, y, f"Total: ${total}")

        c.save()
        print(f"[OK] PDF Generated: {filename}")
        return filename

# Singleton
pdf_gen = pdfGenerator()
