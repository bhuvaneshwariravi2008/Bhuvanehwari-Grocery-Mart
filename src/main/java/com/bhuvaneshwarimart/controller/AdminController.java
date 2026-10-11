package com.bhuvaneshwarimart.controller;

import com.bhuvaneshwarimart.model.CustomerOrder;
import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import com.bhuvaneshwarimart.repository.OrderRepository;
import com.bhuvaneshwarimart.repository.ProductRepository;
import com.bhuvaneshwarimart.repository.UserRepository;
import com.bhuvaneshwarimart.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final AuthService auth;

    public AdminController(UserRepository users, ProductRepository products,
                           OrderRepository orders, AuthService auth) {
        this.users = users;
        this.products = products;
        this.orders = orders;
        this.auth = auth;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.requireUser(header, Role.ADMIN);
        double revenue = 0;
        for (CustomerOrder o : orders.findAll()) {
            if (!"CANCELLED".equals(o.getStatus())) revenue += o.getTotalAmount();
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("buyers", users.countByRole(Role.BUYER));
        m.put("sellers", users.countByRole(Role.SELLER));
        m.put("products", products.count());
        m.put("orders", orders.count());
        m.put("revenue", Math.round(revenue * 100.0) / 100.0);
        return m;
    }

    @GetMapping("/users")
    public List<User> users(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.requireUser(header, Role.ADMIN);
        return users.findAllByOrderByIdAsc();
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public Map<String, String> deleteUser(@RequestHeader(value = "Authorization", required = false) String header,
                                          @PathVariable Long id) {
        auth.requireUser(header, Role.ADMIN);
        User u = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (u.getRole() == Role.ADMIN)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin account cannot be deleted");
        if (u.getRole() == Role.SELLER) products.deleteBySellerId(u.getId());
        users.delete(u);
        return Map.of("message", "User deleted");
    }

    @GetMapping("/orders")
    public List<CustomerOrder> allOrders(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.requireUser(header, Role.ADMIN);
        return orders.findAllByOrderByCreatedAtDesc();
    }
}
