package com.appGate.config;

import org.hibernate.boot.model.TypeContributions;
import org.hibernate.dialect.MariaDBDialect;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.type.SqlTypes;
import org.hibernate.type.descriptor.jdbc.VarcharJdbcType;

/**
 * Hibernate 6's {@code MySQLDialect.contributeTypes} unconditionally registers
 * {@code MySQLEnumJdbcType} for JDBC type code {@link SqlTypes#ENUM} (6000), which is
 * what {@code @Enumerated(EnumType.STRING)} resolves to on this dialect - meaning
 * schema validation expects a native SQL {@code enum(...)} column. Every enum column
 * in this schema was created years ago (under {@code ddl-auto=update}, which never
 * checked this) as plain VARCHAR, which is what's actually correct here - the
 * documented global property for this ({@code hibernate.type.preferred_enum_jdbc_type})
 * is only consulted for DDL generation in this Hibernate version, not validation, so it
 * had no effect. Re-registering the same code (6000) with {@link VarcharJdbcType}
 * after the super registration overwrites it, without touching any {@code @Enumerated}
 * field in the codebase.
 */
public class VarcharEnumMariaDBDialect extends MariaDBDialect {
    @Override
    public void contributeTypes(TypeContributions typeContributions, ServiceRegistry serviceRegistry) {
        super.contributeTypes(typeContributions, serviceRegistry);
        typeContributions.getTypeConfiguration().getJdbcTypeRegistry()
                .addDescriptor(SqlTypes.ENUM, VarcharJdbcType.INSTANCE);
    }
}
