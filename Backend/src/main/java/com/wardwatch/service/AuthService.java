package com.wardwatch.service;

import com.wardwatch.dto.AuthRequest;
import com.wardwatch.dto.AuthResponse;
import com.wardwatch.model.Role;
import com.wardwatch.model.User;
import com.wardwatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public AuthResponse register(AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already taken: " + request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .role(Role.STAFF)
                .build();

        userRepository.save(user);
        return new AuthResponse("Registration successful", Role.STAFF);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return new AuthResponse("Login successful", user.getRole());
    }
}
