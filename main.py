from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import sqlite3
import os
import shutil

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database setup
conn = sqlite3.connect('bikeshop.db')
cursor = conn.cursor()

# Create tables
cursor.execute('''
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_path TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products (id)
)
''')

conn.commit()

# Models
class Product(BaseModel):
    id: int
    title: str
    description: str
    price: float
    image_path: str

class CartItem(BaseModel):
    id: int
    product_id: int
    quantity: int

# API endpoints
@app.post("/products")
async def create_product(title: str = Form(...), description: str = Form(...), price: float = Form(...), image: UploadFile = File(...)):
    image_path = f"static/images/{image.filename}"
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    cursor.execute("INSERT INTO products (title, description, price, image_path) VALUES (?, ?, ?, ?)",
                   (title, description, price, image_path))
    conn.commit()
    return {"message": "Product created successfully"}

@app.get("/products", response_model=List[Product])
async def get_products():
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    return [Product(id=p[0], title=p[1], description=p[2], price=p[3], image_path=p[4]) for p in products]

@app.delete("/products/{product_id}")
async def delete_product(product_id: int):
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@app.post("/cart")
async def add_to_cart(product_id: int):
    cursor.execute("INSERT INTO cart (product_id) VALUES (?)", (product_id,))
    conn.commit()
    return {"message": "Product added to cart successfully"}

@app.get("/cart", response_model=List[CartItem])
async def get_cart():
    cursor.execute("SELECT * FROM cart")
    cart_items = cursor.fetchall()
    return [CartItem(id=item[0], product_id=item[1], quantity=item[2]) for item in cart_items]

@app.put("/cart/{product_id}")
async def update_cart_item(product_id: int, quantity: int):
    cursor.execute("UPDATE cart SET quantity = ? WHERE product_id = ?", (quantity, product_id))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Product not found in cart")
    return {"message": "Cart item updated successfully"}

@app.delete("/cart/{product_id}")
async def remove_from_cart(product_id: int):
    cursor.execute("DELETE FROM cart WHERE product_id = ?", (product_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Product not found in cart")
    return {"message": "Product removed from cart successfully"}

# Serve the main HTML file
@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)