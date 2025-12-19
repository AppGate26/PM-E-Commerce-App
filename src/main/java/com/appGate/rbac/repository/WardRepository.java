package com.appGate.rbac.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.rbac.models.Ward;

public interface WardRepository  extends JpaRepository<Ward, Long>, JpaSpecificationExecutor<Ward>{

    List<Ward> findAllByLgaId(Long lgaId);
}
