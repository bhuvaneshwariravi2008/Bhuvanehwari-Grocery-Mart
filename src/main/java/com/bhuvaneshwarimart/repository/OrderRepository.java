package com.bhuvaneshwarimart.repository;

import com.bhuvaneshwarimart.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<CustomerOrder> findAllByOrderByCreatedAtDesc();

    // Orders that contain at least one item sold by this seller
    @Query("SELECT DISTINCT o FROM CustomerOrder o JOIN o.items i WHERE i.sellerId = :sellerId ORDER BY o.createdAt DESC")
    List<CustomerOrder> findBySeller(@Param("sellerId") Long sellerId);
}
