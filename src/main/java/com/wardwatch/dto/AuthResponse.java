package com.wardwatch.backend.dto;

import com.wardwatch.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private Role role;
}
