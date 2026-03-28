package com.wardwatch.dto;

import com.wardwatch.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private Role role;
}
