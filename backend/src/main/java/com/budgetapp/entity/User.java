package com.budgetapp.entity;

import com.budgetapp.entity.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column
    private String passwordHash;

    @Column(unique = true)
    private String googleId;

    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    private String displayName;

    private String currency = "ALL";

    private LocalDateTime createdAt = LocalDateTime.now();
}
