-- Runs before Hibernate creates the tables.
-- Makes sure the database stores Tamil text and emoji correctly (utf8mb4).
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
