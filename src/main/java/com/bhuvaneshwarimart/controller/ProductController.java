package com.bhuvaneshwarimart.controller;

import com.bhuvaneshwarimart.model.Product;
import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import com.bhuvaneshwarimart.repository.ProductRepository;
import com.bhuvaneshwarimart.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductRepository products;
    private final AuthService auth;

    public ProductController(ProductRepository products, AuthService auth) {
        this.products = products;
        this.auth = auth;
    }

    public record ProductRequest(String name, String tamilName, String category, Double price,
                          String unit, Integer stock, String emoji, String description) {}

    // ---------- PUBLIC: list / search ----------
    @GetMapping
    public List<Product> list(@RequestParam(defaultValue = "") String q,
                              @RequestParam(defaultValue = "") String category) {
        return products.search(q.trim(), category.trim());
    }

    // ---------- SELLER: my products (must be declared before /{id}) ----------
    @GetMapping("/mine")
    public List<Product> mine(@RequestHeader(value = "Authorization", required = false) String header) {
        User u = auth.requireUser(header, Role.SELLER, Role.ADMIN);
        return products.findBySellerIdOrderByIdDesc(u.getId());
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    // ---------- SELLER: add ----------
    @PostMapping
    public Product add(@RequestHeader(value = "Authorization", required = false) String header,
                       @RequestBody ProductRequest req) {
        User u = auth.requireUser(header, Role.SELLER, Role.ADMIN);
        Product p = new Product();
        apply(p, req);
        p.setSellerId(u.getId());
        p.setSellerName(u.getName());
        return products.save(p);
    }

    // ---------- SELLER: edit own product ----------
    @PutMapping("/{id}")
    public Product update(@RequestHeader(value = "Authorization", required = false) String header,
                          @PathVariable Long id, @RequestBody ProductRequest req) {
        User u = auth.requireUser(header, Role.SELLER, Role.ADMIN);
        Product p = products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        checkOwner(u, p);
        apply(p, req);
        return products.save(p);
    }

    // ---------- SELLER: delete own product (admin can delete any) ----------
    @DeleteMapping("/{id}")
    public Map<String, String> delete(@RequestHeader(value = "Authorization", required = false) String header,
                                      @PathVariable Long id) {
        User u = auth.requireUser(header, Role.SELLER, Role.ADMIN);
        Product p = products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        checkOwner(u, p);
        products.delete(p);
        return Map.of("message", "Product deleted");
    }

    private void checkOwner(User u, Product p) {
        if (u.getRole() != Role.ADMIN && !u.getId().equals(p.getSellerId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only change your own products");
    }

    private void apply(Product p, ProductRequest r) {
        if (r.name() == null || r.name().isBlank())
            throw bad("Product name is required");
        if (!"Fruits".equals(r.category()) && !"Vegetables".equals(r.category()))
            throw bad("Category must be Fruits or Vegetables");
        if (r.price() == null || r.price() <= 0)
            throw bad("Price must be greater than 0");
        if (r.unit() == null || r.unit().isBlank())
            throw bad("Unit is required (kg, piece, dozen...)");
        if (r.stock() == null || r.stock() < 0)
            throw bad("Stock cannot be negative");

        p.setName(r.name().trim());
        p.setTamilName(r.tamilName() == null ? null : r.tamilName().trim());
        p.setCategory(r.category());
        p.setPrice(Math.round(r.price() * 100.0) / 100.0);
        p.setUnit(r.unit().trim());
        p.setStock(r.stock());
        String emoji = (r.emoji() == null || r.emoji().isBlank())
                ? ("Fruits".equals(r.category()) ? "🍎" : "🥬") : r.emoji().trim();
        p.setEmoji(emoji);
        String desc = r.description() == null ? "" : r.description().trim();
        p.setDescription(desc.length() > 500 ? desc.substring(0, 500) : desc);
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
