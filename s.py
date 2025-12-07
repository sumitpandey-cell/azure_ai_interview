import sqlite3
from tabulate import tabulate   # Install once: pip install tabulate

# Connect to database
conn = sqlite3.connect("shop.db")
cur = conn.cursor()

# Create table
cur.execute("""
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    category TEXT
)
""")
conn.commit()


# --------------------------

def add_product():
    print("\n--- Add Product ---")
    name = input("Product name: ").strip()
    category = input("Category: ").strip()

    try:
        price = float(input("Price: "))
        quantity = int(input("Quantity: "))
    except ValueError:
        print("❌ Invalid number entered.")
        return

    cur.execute("INSERT INTO products (name, price, quantity, category) VALUES (?, ?, ?, ?)",
                (name, price, quantity, category))
    conn.commit()
    print("✅ Product added!")


def update_stock():
    print("\n--- Update Stock ---")
    try:
        pid = int(input("Enter product ID: "))
        change = int(input("Increase (+) or Decrease (-)? Enter number: "))
    except ValueError:
        print("❌ Invalid input")
        return

    cur.execute("SELECT quantity FROM products WHERE id = ?", (pid,))
    result = cur.fetchone()

    if result is None:
        print("❌ Product not found.")
        return

    new_qty = result[0] + change
    if new_qty < 0:
        print("❌ Quantity cannot be negative.")
        return

    cur.execute("UPDATE products SET quantity = ? WHERE id = ?", (new_qty, pid))
    conn.commit()
    print("✅ Stock updated!")


def view_products():
    print("\n--- All Products ---")
    cur.execute("SELECT * FROM products")
    data = cur.fetchall()

    if not data:
        print("No products found.")
        return

    headers = ["ID", "Name", "Price", "Qty", "Category"]
    print(tabulate(data, headers=headers, tablefmt="grid"))


def view_low_stock():
    print("\n--- Low Stock Items (Qty < 5) ---")
    cur.execute("SELECT * FROM products WHERE quantity < 5")
    data = cur.fetchall()

    if not data:
        print("No low-stock items.")
        return

    headers = ["ID", "Name", "Price", "Qty", "Category"]
    print(tabulate(data, headers=headers, tablefmt="grid"))


def search_product():
    print("\n--- Search Product ---")
    key = input("Enter name or ID: ").strip()

    if key.isdigit():
        cur.execute("SELECT * FROM products WHERE id = ?", (int(key),))
    else:
        cur.execute("SELECT * FROM products WHERE name LIKE ?", (f"%{key}%",))

    data = cur.fetchall()

    if not data:
        print("❌ No matching products found.")
        return

    headers = ["ID", "Name", "Price", "Qty", "Category"]
    print(tabulate(data, headers=headers, tablefmt="grid"))


def delete_product():
    print("\n--- Delete Product ---")
    try:
        pid = int(input("Enter product ID: "))
    except ValueError:
        print("❌ Invalid ID")
        return

    cur.execute("DELETE FROM products WHERE id = ?", (pid,))
    conn.commit()

    if cur.rowcount == 0:
        print("❌ Product not found.")
    else:
        print("🗑️ Product deleted!")


# --------------------------

def menu():
    while True:
        print("\n========== INVENTORY MANAGER ==========")
        print("1. Add Product")
        print("2. Update Stock")
        print("3. View All Products")
        print("4. View Low Stock Items")
        print("5. Search Product")
        print("6. Delete Product")
        print("7. Exit")

        choice = input("Choose an option: ").strip()

        if choice == "1":
            add_product()
        elif choice == "2":
            update_stock()
        elif choice == "3":
            view_products()
        elif choice == "4":
            view_low_stock()
        elif choice == "5":
            search_product()
        elif choice == "6":
            delete_product()
        elif choice == "7":
            print("Goodbye!")
            break
        else:
            print("❌ Invalid option.")

menu()