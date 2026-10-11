package com.bhuvaneshwarimart.repository;

import com.bhuvaneshwarimart.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Search by English name OR Tamil name; category = "" means all categories
    @Query("SELECT p FROM Product p WHERE "
            + "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(p.tamilName, '')) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "AND (:cat = '' OR p.category = :cat) "
            + "ORDER BY p.category, p.name")
    List<Product> search(@Param("q") String q, @Param("cat") String cat);

    List<Product> findBySellerIdOrderByIdDesc(Long sellerId);

    List<Product> findAllByOrderByIdDesc();

    void deleteBySellerId(Long sellerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findForUpdate(@Param("id") Long id);
}
