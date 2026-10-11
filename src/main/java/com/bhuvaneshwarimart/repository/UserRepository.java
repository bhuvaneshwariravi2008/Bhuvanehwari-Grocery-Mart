package com.bhuvaneshwarimart.repository;

import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    List<User> findAllByOrderByIdAsc();
}
