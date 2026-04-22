package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.Entreprise;
import com.tonentreprise.backend.model.Entreprise.StatutEntreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, Long> {
    Optional<Entreprise> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMatriculeFiscale(String matriculeFiscale);

    List<Entreprise> findByStatut(StatutEntreprise statut);
}
