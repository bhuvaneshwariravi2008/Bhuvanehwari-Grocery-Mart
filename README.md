# 🥬 Bhuvaneshwari Mart

Online grocery store for **Fruits & Vegetables** (Flipkart-style shopping).

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML, CSS, JavaScript (plain)       |
| Backend   | Java Spring Boot 3 (REST API)       |
| Database  | MySQL                               |
| Theme     | Green & White                       |

## ✨ Features

- **Buyer**: browse 60 products, search (English / Tamil name), filter Fruits / Vegetables, add to cart, place order ("Order Successfully Placed!" popup), **My Orders** history, cancel order
- **Seller**: add / edit / delete own products, see orders for own products, update order status
- **Admin**: dashboard stats, view / delete users, delete products, view all orders and update status
- Search with no match → **"No results found"**
- 3 logins: **Buyer / Seller / Admin** (buyers and sellers can register)
- 60 products (30 fruits + 30 vegetables) are added automatically on first run

## 🔑 Default logins (created automatically)

| Role   | Email             | Password  |
|--------|-------------------|-----------|
| Admin  | admin@mart.com    | admin123  |
| Seller | seller@mart.com   | seller123 |
| Buyer  | buyer@mart.com    | buyer123  |

## 🚀 How to run (VS Code)

### 1. Install (one time)
- **Java JDK 17 or higher**  (check: `java -version`)
- **Maven**  (check: `mvn -version`)
- **MySQL Server** (running on port 3306)
- VS Code extensions: *Extension Pack for Java* and *Spring Boot Extension Pack*

### 2. Set your MySQL password
Open `src/main/resources/application.properties` and change **only this line**:

```
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

(If your MySQL username is not `root`, change `spring.datasource.username` too.)

The database `bhuvaneshwari_mart` and all tables are **created automatically** — you do not need to create anything in MySQL.

### 3. Run
Open the project folder in VS Code, then either:

- Open `BhuvaneshwariMartApplication.java` → click **Run** above `main`, **or**
- In the terminal inside the project folder:
  ```
  mvn spring-boot:run
  ```

### 4. Open in browser
👉 **http://localhost:8080**

(The frontend is inside the Spring Boot project, so one run starts everything.)

## 📁 Project structure

```
bhuvaneshwari-mart/
├── pom.xml
├── database.sql                         (optional - manual DB creation)
└── src/main/
    ├── java/com/bhuvaneshwarimart/
    │   ├── BhuvaneshwariMartApplication.java
    │   ├── config/DataInitializer.java  (default users + 60 products)
    │   ├── model/                       (User, Product, CustomerOrder, OrderItem, Role)
    │   ├── repository/                  (database access)
    │   ├── service/AuthService.java     (login token + password hashing)
    │   ├── controller/                  (Auth, Product, Order, Admin REST APIs)
    │   └── exception/GlobalExceptionHandler.java
    └── resources/
        ├── application.properties       (MySQL password here)
        └── static/                      (frontend)
            ├── index.html  login.html  register.html
            ├── cart.html   orders.html seller.html  admin.html
            ├── css/style.css
            └── js/ common.js shop.js login.js register.js cart.js orders.js seller.js admin.js
```

## 🛠 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Access denied for user 'root'` | Wrong password in `application.properties` |
| `Communications link failure` | MySQL is not running — start MySQL service |
| `Port 8080 already in use` | Change `server.port=8081` in `application.properties` and open `http://localhost:8081` |
| Login says "session expired" after restart | Normal — login tokens are kept in memory; just login again |
| Want to reset all data | In MySQL run `DROP DATABASE bhuvaneshwari_mart;` and start the app again |
