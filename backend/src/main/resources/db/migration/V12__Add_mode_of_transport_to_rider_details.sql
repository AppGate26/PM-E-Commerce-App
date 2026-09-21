-- RiderDetails had no way to record how a rider gets around (bicycle,
-- motorcycle, car, tricycle, truck, van), which delivery ops needs to plan
-- routes and match delivery types to a rider's capacity.
--
-- NOTE: Flyway is inert in this project (see V2/V3/V4/V9/V10). Run this by
-- hand against the database.

ALTER TABLE RiderDetails ADD COLUMN mode_of_transport VARCHAR(20) NULL;
