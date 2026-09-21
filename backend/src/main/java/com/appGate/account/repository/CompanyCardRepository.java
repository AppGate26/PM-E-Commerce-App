package com.appGate.account.repository;

import com.appGate.account.models.CompanyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyCardRepository extends JpaRepository<CompanyCard, Long> {

    List<CompanyCard> findByIsActiveTrueOrderByCardNameAsc();
}
