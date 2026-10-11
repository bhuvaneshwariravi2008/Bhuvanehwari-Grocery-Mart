package com.bhuvaneshwarimart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BhuvaneshwariMartApplication {

    public static void main(String[] args) {
        SpringApplication.run(BhuvaneshwariMartApplication.class, args);
        System.out.println("\n=====================================================");
        System.out.println("  Bhuvaneshwari Mart is running!");
        System.out.println("  Open in browser:  http://localhost:8080");
        System.out.println("=====================================================\n");
    }
}
