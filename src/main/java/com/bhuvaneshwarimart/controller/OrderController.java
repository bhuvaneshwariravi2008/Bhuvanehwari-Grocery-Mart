package com.bhuvaneshwarimart.controller;

import com.bhuvaneshwarimart.model.CustomerOrder;
import com.bhuvaneshwarimart.model.OrderItem;
import com.bhuvaneshwarimart.model.Product;
import com.bhuvaneshwarimart.model.Role;
import com.bhuvaneshwarimart.model.User;
import com.bhuvaneshwarimart.repository.OrderRepository;
import com.bhuvaneshwarimart.repository.ProductRepository;
import com.bhuvaneshwarimart.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    public static final List<String> STATUSES =
            List.of("PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED");

    private final OrderRepository orders;
    private final ProductRepository products;
    private final AuthService auth;

    public OrderController(OrderRepository orders, ProductRepository products, AuthService auth) {
        this.orders = orders;
        this.products = products;
        this.auth = auth;
    }

    public record ItemRequest(Long productId, Integer quantity) {}

    public record OrderRequest(List<ItemRequest> items, String address, String phone, String paymentMethod) {}

    public record StatusRequest(String status) {}

    // ---------- BUYER: place order ----------
    @PostMapping
    @Transactional
    public CustomerOrder place(@RequestHeader(value = "Authorization", required = false) String header,
                               @RequestBody OrderRequest req) {
        User user = auth.requireUser(header, Role.BUYER);

        if (req.items() == null || req.items().isEmpty())
            throw bad("Your cart is empty");
        if (req.address() == null || req.address().isBlank())
            throw bad("Please enter your delivery address");
        if (req.phone() == null || !req.phone().trim().matches("^[0-9]{10}$"))
            throw bad("Phone number must be 10 digits");

        String payment = "UPI".equalsIgnoreCase(req.paymentMethod()) ? "UPI on Delivery" : "Cash on Delivery";

        // merge duplicate products and validate quantities
        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (ItemRequest it : req.items()) {
            if (it.productId() == null || it.quantity() == null || it.quantity() < 1 || it.quantity() > 100)
                throw bad("Invalid quantity in cart");
            wanted.merge(it.productId(), it.quantity(), Integer::sum);
        }

        CustomerOrder order = new CustomerOrder();
        order.setUserId(user.getId());
        order.setCustomerName(user.getName());
        order.setCustomerPhone(req.phone().trim());
        order.setAddress(req.address().trim());
        order.setPaymentMethod(payment);
        order.setStatus("PLACED");

        double total = 0;
        for (Map.Entry<Long, Integer> e : wanted.entrySet()) {
            Product p = products.findForUpdate(e.getKey())
                    .orElseThrow(() -> bad("A product in your cart is no longer available. Please refresh your cart."));
            int qty = e.getValue();
            if (p.getStock() < qty) {
                throw bad(p.getStock() == 0
                        ? p.getName() + " is out of stock"
                        : "Only " + p.getStock() + " " + p.getUnit() + " of " + p.getName() + " is available");
            }
            p.setStock(p.getStock() - qty);
            products.save(p);

            OrderItem item = new OrderItem();
            item.setProductId(p.getId());
            item.setProductName(p.getName());
            item.setEmoji(p.getEmoji());
            item.setUnit(p.getUnit());
            item.setPrice(p.getPrice());
            item.setQuantity(qty);
            item.setSellerId(p.getSellerId());
            order.getItems().add(item);

            total += p.getPrice() * qty;
        }
        order.setTotalAmount(Math.round(total * 100.0) / 100.0);
        return orders.save(order);
    }

    // ---------- BUYER: my orders (history) ----------
    @GetMapping("/my")
    public List<CustomerOrder> myOrders(@RequestHeader(value = "Authorization", required = false) String header) {
        User user = auth.requireUser(header, Role.BUYER);
        return orders.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    // ---------- BUYER: cancel ----------
    @PutMapping("/{id}/cancel")
    @Transactional
    public CustomerOrder cancel(@RequestHeader(value = "Authorization", required = false) String header,
                                @PathVariable Long id) {
        User user = auth.requireUser(header, Role.BUYER);
        CustomerOrder order = find(id);
        if (!order.getUserId().equals(user.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your order");
        if (!"PLACED".equals(order.getStatus()) && !"CONFIRMED".equals(order.getStatus()))
            throw bad("This order can no longer be cancelled");
        order.setStatus("CANCELLED");
        restock(order);
        return orders.save(order);
    }

    // ---------- SELLER: orders containing my products ----------
    @GetMapping("/seller")
    public List<Map<String, Object>> sellerOrders(@RequestHeader(value = "Authorization", required = false) String header) {
        User seller = auth.requireUser(header, Role.SELLER);
        List<Map<String, Object>> result = new ArrayList<>();
        for (CustomerOrder o : orders.findBySeller(seller.getId())) {
            List<OrderItem> mine = new ArrayList<>();
            double subtotal = 0;
            for (OrderItem it : o.getItems()) {
                if (seller.getId().equals(it.getSellerId())) {
                    mine.add(it);
                    subtotal += it.getPrice() * it.getQuantity();
                }
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.getId());
            m.put("customerName", o.getCustomerName());
            m.put("customerPhone", o.getCustomerPhone());
            m.put("address", o.getAddress());
            m.put("paymentMethod", o.getPaymentMethod());
            m.put("status", o.getStatus());
            m.put("createdAt", o.getCreatedAt());
            m.put("items", mine);
            m.put("totalAmount", Math.round(subtotal * 100.0) / 100.0);
            result.add(m);
        }
        return result;
    }

    // ---------- SELLER / ADMIN: change order status ----------
    @PutMapping("/{id}/status")
    @Transactional
    public CustomerOrder updateStatus(@RequestHeader(value = "Authorization", required = false) String header,
                                      @PathVariable Long id, @RequestBody StatusRequest req) {
        User user = auth.requireUser(header, Role.SELLER, Role.ADMIN);
        CustomerOrder order = find(id);

        if (req.status() == null || !STATUSES.contains(req.status()))
            throw bad("Invalid status");
        if (user.getRole() == Role.SELLER) {
            boolean mine = order.getItems().stream().anyMatch(i -> user.getId().equals(i.getSellerId()));
            if (!mine) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This order has none of your products");
        }
        String old = order.getStatus();
        if ("CANCELLED".equals(old) || "DELIVERED".equals(old))
            throw bad("This order is already " + old.toLowerCase() + " and cannot be changed");

        if ("CANCELLED".equals(req.status())) restock(order);
        order.setStatus(req.status());
        return orders.save(order);
    }

    private CustomerOrder find(Long id) {
        return orders.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    /** Put the quantities of a cancelled order back into stock. */
    private void restock(CustomerOrder order) {
        for (OrderItem it : order.getItems()) {
            products.findForUpdate(it.getProductId()).ifPresent(p -> {
                p.setStock(p.getStock() + it.getQuantity());
                products.save(p);
            });
        }
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
