-- rider_box.status was created as a native MariaDB ENUM('PENDING','ACCEPTED','REJECTED','DELIVERED')
-- rather than VARCHAR like the older enum columns. VarcharEnumMariaDBDialect only changes what
-- Hibernate expects during schema validation, not the live column, so when
-- DeliveryOperationsService.startDelivery wrote the new IN_TRANSIT value MariaDB rejected it
-- ("Data truncated for column 'status'", error 1265) and PUT /api/delivery-agent/start-delivery
-- failed. Convert to VARCHAR (keeping it nullable, as before) so new enum values need no migration.
ALTER TABLE rider_box MODIFY status VARCHAR(20) NULL;
