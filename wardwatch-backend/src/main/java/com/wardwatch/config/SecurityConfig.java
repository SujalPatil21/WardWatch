package com.wardwatch.config;

import com.wardwatch.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // ✅ PUBLIC ROUTES (NO AUTH REQUIRED)
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()

                        // ✅ TEMP: OPEN FOR HACKATHON DEMO
                        .requestMatchers("/wards/**").permitAll()
                        .requestMatchers("/capacity/**").permitAll()
                        .requestMatchers("/alerts/**").permitAll()
                        .requestMatchers("/summary/**").permitAll()
                        .requestMatchers("/api/beds/**").permitAll()

                        // 🔒 EVERYTHING ELSE REQUIRES AUTH
                        .anyRequest().authenticated()
                )

                // ✅ BASIC AUTH ENABLED
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> userRepository.findByUsername(username)
                .map(user -> User.withUsername(user.getUsername())
                        .password(user.getPassword())
                        .roles(user.getRole().name()) // MUST be "STAFF" or "ADMIN"
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // ⚠️ TEMP ONLY (for hackathon)
        return NoOpPasswordEncoder.getInstance();
    }
}
