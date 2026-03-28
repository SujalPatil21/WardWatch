package com.wardwatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
        "com.wardwatch",
        "com.wardwatch.dev2"
})
@EnableScheduling
public class WardwatchBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(WardwatchBackendApplication.class, args);
    }

}
