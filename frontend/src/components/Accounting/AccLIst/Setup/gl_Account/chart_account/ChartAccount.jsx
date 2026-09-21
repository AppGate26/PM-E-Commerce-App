import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReuseableChartNav from "./ReusableChartNav";
import logo from "../../../../../../assets/images/acc_rafiki.png";
import AccountNavSm from "../../../../AccountNavSm";
import { getAccountTypes, getControlAccounts } from "../../../../../../lib/accountingApi";

const ChartAccount = () => {
  const [accountType, setAccountType] = useState("");
  const [accountTypes, setAccountTypes] = useState([]);
  const [controlAccounts, setControlAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadControlAccounts = async () => {
      try {
        setLoading(true);
        setError("");
        const [types, controls] = await Promise.all([
          getAccountTypes(),
          getControlAccounts(),
        ]);
        const typeMap = new Map(types.map((type) => [String(type.id), type.name]));
        setAccountTypes(types);
        setControlAccounts(
          controls.map((control) => ({
            controlId: control.id,
            displayControlId: control.controlId || control.id,
            accountTypeId: String(control.accountTypeId || ""),
            accountType: control.accountTypeName || typeMap.get(String(control.accountTypeId)) || "",
            controlName: control.name,
          }))
        );
      } catch (requestError) {
        setControlAccounts([]);
        setError(requestError?.message || "Unable to load backend control accounts.");
      } finally {
        setLoading(false);
      }
    };

    loadControlAccounts();
  }, []);

  const accountTypeOptions = useMemo(
    () => accountTypes,
    [accountTypes]
  );

  const controlAccountOptions = useMemo(
    () =>
      controlAccounts.filter((row) =>
        accountType ? String(row.accountTypeId) === String(accountType) : true
      ),
    [accountType, controlAccounts]
  );

  const handleAccountTypeChange = (e) => {
    setAccountType(e.target.value);
  };

  const handleControlAccountChange = (e) => {
    const selectedControlId = e.target.value;
    if (selectedControlId) {
    navigate(`/chartAccount/${encodeURIComponent(selectedControlId)}`);
    }
  };

  return (
    <div>
      <div className="AccountNavSm">
        <AccountNavSm title="chart of account" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableChartNav title="choose account type" />
      </div>

      <div className="chart-acc-box bg-white">
        <div className="account-selector">
          <div className="chart-acc-select">
            <label>Account Type</label>
            <select onChange={handleAccountTypeChange} value={accountType}>
              <option value="">
                {loading ? "Loading account types..." : "Choose account type"}
              </option>
              {accountTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-acc-select">
            <label>Control Account</label>
            <select onChange={handleControlAccountChange} disabled={loading}>
              <option value="">
                {loading ? "Loading control accounts..." : "Select control account"}
              </option>
              {controlAccountOptions.map((option) => (
                <option key={option.controlId} value={option.controlId}>
                  {option.displayControlId} - {option.controlName}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="text-danger fw-semibold">{error}</div>}
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-6 d-flex justify-content-center flex-column text-uppercase my-5">
              <h3 className="text-primary fw-semibold">Nothing selected yet</h3>
              <h5 className="bg-primary py-4 px-5 fw-semibold text-white rounded">
                select appropriate drop down to get display
              </h5>
            </div>
            <div className="col-md-6 text-center my-5">
              <img src={logo} alt="Chart illustration" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartAccount;
