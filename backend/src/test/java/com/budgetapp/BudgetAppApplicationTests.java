package com.budgetapp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "jwt.secret=TEST_SECRET_KEY_MUST_BE_32_CHARS_MIN",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class BudgetAppApplicationTests {

    @Test
    void contextLoads() {
    }
}
