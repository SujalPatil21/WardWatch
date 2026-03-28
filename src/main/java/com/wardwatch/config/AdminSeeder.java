package com.wardwatch.config;

import com.wardwatch.model.Role;
import com.wardwatch.model.User;
import com.wardwatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "admin123";

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername(ADMIN_USERNAME).isEmpty()) {
            User admin = User.builder()
                    .username(ADMIN_USERNAME)
                    .password(ADMIN_PASSWORD)
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Admin user seeded — username: '{}', password: '{}'", ADMIN_USERNAME, ADMIN_PASSWORD);
        } else {
            log.info("Admin user already exists, skipping seed.");
        }
    }
}
