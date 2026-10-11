package com.bhuvaneshwarimart.service;

import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import com.bhuvaneshwarimart.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Very simple token based login.
 * After login a random token is given to the browser; it is sent back in the
 * "Authorization: Bearer <token>" header on every request.
 * (Tokens are kept in memory - if the server restarts, users just log in again.)
 */
@Service
public class AuthService {

    private final Map<String, Long> tokens = new ConcurrentHashMap<>();
    private final UserRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository users) {
        this.users = users;
    }

    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String hashed) {
        return encoder.matches(rawPassword, hashed);
    }

    public String createToken(User user) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, user.getId());
        return token;
    }

    public void removeToken(String header) {
        String token = extract(header);
        if (token != null) tokens.remove(token);
    }

    /** Returns the logged-in user or throws 401. If roles are given, also checks the role (403). */
    public User requireUser(String header, Role... allowedRoles) {
        String token = extract(header);
        Long userId = token == null ? null : tokens.get(token);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please login to continue");
        }
        User user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please login to continue"));
        if (allowedRoles != null && allowedRoles.length > 0) {
            boolean ok = false;
            for (Role r : allowedRoles) {
                if (user.getRole() == r) { ok = true; break; }
            }
            if (!ok) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to do this");
            }
        }
        return user;
    }

    private String extract(String header) {
        if (header == null || !header.startsWith("Bearer ")) return null;
        return header.substring(7).trim();
    }
}
