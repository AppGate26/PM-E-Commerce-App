import React, { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ReuseableNavControl from "./ReuseableNavControl";
import BackendControlAccountSection from "./control_Tabs/BackendControlAccountSection";
import { getAccountTypes } from "../../../../../../lib/accountingApi";

const ControlAccount = () => {
  const [accountTypes, setAccountTypes] = useState([]);
  const [activeTypeId, setActiveTypeId] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAccountTypes = async () => {
      try {
        setLoading(true);
        const data = await getAccountTypes();
        setAccountTypes(data);
      } catch (error) {
        console.error("Unable to load backend account types:", error);
        setAccountTypes([]);
      } finally {
        setLoading(false);
      }
    };

    loadAccountTypes();
  }, []);

  useEffect(() => {
    if (!activeTypeId && accountTypes.length > 0) {
      setActiveTypeId(String(accountTypes[0].id));
    }
  }, [accountTypes, activeTypeId]);

  const activeType = accountTypes.find((type) => String(type.id) === String(activeTypeId));

  return (
    <div>
      <ReuseableNavControl title={activeType?.name || "accounts"} />
      <div className="control-account-topbar">
        <button
          type="button"
          className="control-account-back-btn"
          onClick={() => navigate("/Accounting/Setup")}
          aria-label="Go back to setup"
        >
          <IoArrowBack size={20} />
        </button>
      </div>

      <div className="control-tab-flex">
        <div className="control-side-tab">
          <h5 className="text-white bg-primary text-center fw-semibold p-3">
            ACCOUNTS
          </h5>
          <div className="d-flex gap-3 m-3 control-tab-btn">
            {loading ? (
              <button type="button" disabled>Loading...</button>
            ) : accountTypes.length === 0 ? (
              <button type="button" disabled>No account types</button>
            ) : (
              accountTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setActiveTypeId(String(type.id))}
                  className={String(activeTypeId) === String(type.id) ? "active" : ""}
                >
                  {type.name} control
                </button>
              ))
            )}
          </div>
        </div>

        <div className="tab-content tab-content-control p-3 bg-white w-100 ">
          {activeType ? (
            <BackendControlAccountSection accountType={activeType.name} accountTypeId={activeType.id} />
          ) : (
            <div className="p-5 text-primary fw-semibold">
              No backend account type selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlAccount;
