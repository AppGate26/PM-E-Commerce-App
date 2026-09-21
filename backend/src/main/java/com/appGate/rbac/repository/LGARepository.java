package com.appGate.rbac.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.rbac.models.LGA;

public interface LGARepository extends JpaRepository<LGA, Long>, JpaSpecificationExecutor<LGA>{
  List<LGA> findAllByStateId(Long stateId);    
}
