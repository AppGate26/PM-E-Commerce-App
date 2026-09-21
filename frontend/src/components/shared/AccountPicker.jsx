import React, { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./AccountPicker.css";

// Searchable, scrollable GL account picker (ACCOUNT #18). Replaces the plain
// dropdown for "account to debit / credit": you can type to filter by GL code
// (e.g. 1020101) or name, and every row shows the account ID. Options are the
// shape returned by getAccountOptions ({ value, label, code, name, id }).
const AccountPicker = ({
  accounts = [],
  value = "",
  onChange,
  disabled = false,
  placeholder = "Search account by ID or name",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);

  const selected = useMemo(
    () => accounts.find((a) => String(a.value) === String(value)) || null,
    [accounts, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const code = String(a.code || a.glCode || "").toLowerCase();
      const name = String(a.name || a.label || "").toLowerCase();
      const id = String(a.id || a.value || "").toLowerCase();
      return code.includes(q) || name.includes(q) || id.includes(q);
    });
  }, [accounts, query]);

  const label = selected
    ? selected.label ||
      [selected.code, selected.name, selected.id ? `ID: ${selected.id}` : ""]
        .filter(Boolean)
        .join(" - ")
    : "";

  const handleSelect = (account) => {
    onChange?.(account.value);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="account-picker">
      <input
        type="text"
        className="form-control border-primary-subtle account-picker-input"
        value={open ? query : label}
        placeholder={selected ? label : placeholder}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && !disabled ? (
        <div
          className="account-picker-menu"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {filtered.length === 0 ? (
            <div className="account-picker-empty">No matching account</div>
          ) : (
            filtered.map((account) => (
              <button
                key={account.value || account.code}
                type="button"
                className={`account-picker-item ${
                  String(account.value) === String(value) ? "active" : ""
                }`}
                onClick={() => handleSelect(account)}
              >
                <span className="account-picker-code">{account.code || account.id || "—"}</span>
                <span className="account-picker-name">{account.name || account.label}</span>
                {account.id ? <span className="account-picker-id">ID: {account.id}</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};

AccountPicker.propTypes = {
  accounts: PropTypes.array,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default AccountPicker;
