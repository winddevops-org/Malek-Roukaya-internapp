// src/main/java/com/tonentreprise/backend/repository/PermissionRepository.java
package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

  Optional<Permission> findByCode(String code);
}
