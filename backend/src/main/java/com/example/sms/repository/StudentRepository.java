package com.example.sms.repository;

import com.example.sms.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @Modifying
    @Query(value = "DELETE FROM student_courses WHERE course_id = :courseId", nativeQuery = true)
    void removeCourseEnrollments(@Param("courseId") Long courseId);

    @Query("select count(s) from Student s join s.courses c where c.id = :courseId")
    long countEnrolled(@Param("courseId") Long courseId);
}
