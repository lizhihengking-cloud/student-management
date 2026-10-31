package com.example.sms;

import org.junit.jupiter.api.Test;

/** Boots the real entry point once (random port, in-memory DB) to prove main() wires everything up. */
class StudentManagementApplicationTest {
    @Test
    void mainStartsTheApplication() {
        StudentManagementApplication.main(new String[]{
                "--server.port=0",
                "--spring.datasource.url=jdbc:h2:mem:maintest;DB_CLOSE_DELAY=-1"});
    }
}
