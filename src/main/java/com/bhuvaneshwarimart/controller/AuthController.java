package com.bhuvaneshwarimart.controller;

import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import com.bhuvaneshwarimart.repository.UserRepository;
import com.bhuvaneshwarimart.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository users;
    private final AuthService auth;

    public AuthController(UserRepository users, AuthService auth) {
        this.users = users;
        this.auth = auth;
    }

    public record RegisterRequest(String name, String email, String password, String phone, String role) {}

    public record LoginRequest(String email, String password, String role) {}

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest req) {
        if (req.name() == null || req.name().isBlank())
            throw bad("Please enter your name");
        if (req.email() == null || !req.email().trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            throw bad("Please enter a valid email");
        if (req.password() == null || req.password().length() < 6)
            throw bad("Password must be at least 6 characters");
        if (req.phone() == null || !req.phone().trim().matches("^[0-9]{10}$"))
            throw bad("Phone number must be 10 digits");

        Role role;
        if ("SELLER".equalsIgnoreCase(req.role())) role = Role.SELLER;
        else if ("BUYER".equalsIgnoreCase(req.role())) role = Role.BUYER;
        else throw bad("Please choose Buyer or Seller");

        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered. Please login.");

        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(auth.hash(req.password()));
        u.setPhone(req.phone().trim());
        u.setRole(role);
        u = users.save(u);

        return loginResponse(u);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        if (req.email() == null || req.password() == null)
            throw bad("Please enter email and password");

        User u = users.findByEmail(req.email().trim().toLowerCase()).orElse(null);
        if (u == null || !auth.matches(req.password(), u.getPassword()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");

        if (req.role() != null && !req.role().isBlank() && !u.getRole().name().equalsIgnoreCase(req.role()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This is not a " + req.role().toLowerCase() + " account. Please choose the correct login tab.");

        return loginResponse(u);
    }

    @GetMapping("/me")
    public User me(@RequestHeader(value = "Authorization", required = false) String header) {
        return auth.requireUser(header);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.removeToken(header);
        return Map.of("message", "Logged out");
    }

    private Map<String, Object> loginResponse(User u) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token", auth.createToken(u));
        res.put("user", u);
        return res;
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
