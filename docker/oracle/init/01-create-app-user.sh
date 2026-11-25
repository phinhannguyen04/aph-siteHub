#!/bin/bash
# Mounted into /opt/oracle/scripts/startup: the lite image sources these on every container start,
# so the script is idempotent. It creates the least-privilege application schema in FREEPDB1.
# The body runs in a subshell because the image sources this file (an `exit` would stop the container).
(
  set -euo pipefail
  : "${ORACLE_APP_USER:?ORACLE_APP_USER is required}"
  : "${ORACLE_APP_PASSWORD:?ORACLE_APP_PASSWORD is required}"
  case "$ORACLE_APP_USER" in
    *[!A-Za-z0-9_]*|"") echo "ORACLE_APP_USER may contain only letters, digits and underscores" >&2; exit 1 ;;
  esac
  case "$ORACLE_APP_PASSWORD" in
    *\"*) echo "ORACLE_APP_PASSWORD must not contain double quotes" >&2; exit 1 ;;
  esac

  sqlplus -s / as sysdba <<SQL
WHENEVER SQLERROR EXIT SQL.SQLCODE
ALTER SESSION SET CONTAINER = FREEPDB1;
DECLARE
  tbs VARCHAR2(128);
  found NUMBER;
BEGIN
  SELECT COUNT(*) INTO found FROM dba_users WHERE username = UPPER('${ORACLE_APP_USER}');
  IF found = 0 THEN
    -- The lite image has no USERS tablespace, so use the PDB default.
    SELECT property_value INTO tbs FROM database_properties WHERE property_name = 'DEFAULT_PERMANENT_TABLESPACE';
    EXECUTE IMMEDIATE 'CREATE USER ${ORACLE_APP_USER} IDENTIFIED BY "${ORACLE_APP_PASSWORD}" DEFAULT TABLESPACE ' || tbs || ' QUOTA UNLIMITED ON ' || tbs;
    EXECUTE IMMEDIATE 'GRANT CREATE SESSION, CREATE TABLE TO ${ORACLE_APP_USER}';
  END IF;
END;
/
EXIT
SQL
) || echo "WARNING: application user setup failed" >&2
