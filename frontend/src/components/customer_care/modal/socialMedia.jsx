import React, { useState, useEffect } from "react";
import "../care.css";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { careApi } from "../../../lib/careApi";

const emptyForm = { platform: "", handle: "", url: "" };

const CareSocialMediaModal = ({ isOpen, onClose }) => {
  const [socialMediaData, setSocialMediaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddSocialMedia = async (event) => {
    event.preventDefault();
    if (!form.platform.trim()) {
      setError("Platform is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await careApi.createSocialMedia({
        platform: form.platform.trim(),
        handle: form.handle.trim(),
        url: form.url.trim(),
      });
      setForm(emptyForm);
      await fetchSocialMedia();
    } catch (err) {
      setError("Failed to add social media: " + (err?.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSocialMedia = async (id) => {
    setError("");
    try {
      await careApi.deleteSocialMedia(id);
      await fetchSocialMedia();
    } catch (err) {
      setError("Failed to remove social media: " + (err?.message || "unknown error"));
    }
  };
  
  // Fetch social media data
  const fetchSocialMedia = async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`🔵 SocialMedia: ========== FETCHING SOCIAL MEDIA DATA ==========`);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("SocialMedia: Calling endpoint: GET /support/social-media");

      const response = await careApi.getSocialMedia();
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ SocialMedia: SOCIAL MEDIA RESPONSE RECEIVED`);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("SocialMedia: Full API response:", response);
      
      let socialData = [];
      
      // Handle the API response format based on your API docs
      // Expected format: {status: 200, message: "successful", response: {data: [...]}}
      if (response && response.status === 200) {
        if (response.response && response.response.data) {
          // If data is an array in the response
          if (Array.isArray(response.response.data)) {
            socialData = response.response.data;
            console.log(`✅ SocialMedia: Found ${socialData.length} social media items in response.response.data`);
          } 
          // If data is directly in the response
          else if (Array.isArray(response.response)) {
            socialData = response.response;
            console.log(`✅ SocialMedia: Found ${socialData.length} social media items in response.response`);
          }
          // If the response itself is the data array
          else if (Array.isArray(response)) {
            socialData = response;
            console.log(`✅ SocialMedia: Found ${socialData.length} social media items in response`);
          }
          // Check for different possible response structures
          else if (response.response && typeof response.response === 'object') {
            // Try to extract array data from the object
            const possibleArrays = Object.values(response.response).filter(item => Array.isArray(item));
            if (possibleArrays.length > 0) {
              socialData = possibleArrays[0];
              console.log(`✅ SocialMedia: Found ${socialData.length} social media items in response object`);
            } else {
              console.log("ℹ️ SocialMedia: No array found in response, using empty array");
              socialData = [];
            }
          }
        } else {
          console.log("ℹ️ SocialMedia: No social media data found in response:", response);
          socialData = [];
        }
      } else {
        console.warn("⚠️ SocialMedia: Unexpected response format:", response);
        socialData = [];
      }

      console.log("SocialMedia: Processed social media list:", socialData);
      
      // Transform API data to match our component structure
      const transformedData = socialData.map(item => ({
        id: item.id || item.socialMediaId || Date.now(),
        platform: item.platform?.toLowerCase() || item.type?.toLowerCase() || item.name?.toLowerCase() || "unknown",
        name: item.name || item.platform || item.type || "Social Media",
        handle: item.handle || "",
        url: item.url || "",
        strategy: item.strategy || item.description || "",
        data: item.data || item.metrics || {},
        isActive: item.isActive !== undefined ? item.isActive : true,
        icon: getPlatformIcon(item.platform || item.type || item.name)
      }));

      setSocialMediaData(transformedData);

    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ SocialMedia: ERROR FETCHING SOCIAL MEDIA DATA");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("SocialMedia: Error message:", err?.message);
      console.error("SocialMedia: Error stack:", err?.stack);
      setError("Failed to load social media data: " + err.message);
      setSocialMediaData([]);
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate icon for platform
  const getPlatformIcon = (platform) => {
    const platformLower = platform?.toLowerCase() || '';
    
    if (platformLower.includes('facebook') || platformLower === 'fb') {
      return <FaFacebook />;
    } else if (platformLower.includes('instagram') || platformLower === 'ig') {
      return <FaInstagram />;
    } else if (platformLower.includes('twitter') || platformLower.includes('x')) {
      return <FaXTwitter />;
    } else if (platformLower.includes('linkedin')) {
      return <FaLinkedin />;
    } else if (platformLower.includes('youtube')) {
      return <FaYoutube />;
    } else {
      // Default to first letter of platform
      return <span>{platform?.charAt(0)?.toUpperCase() || '?'}</span>;
    }
  };

  // Get platform name for display
  const getPlatformName = (platform) => {
    const platformLower = platform?.toLowerCase() || '';
    
    if (platformLower.includes('facebook') || platformLower === 'fb') {
      return 'Facebook';
    } else if (platformLower.includes('instagram') || platformLower === 'ig') {
      return 'Instagram';
    } else if (platformLower.includes('twitter') || platformLower.includes('x')) {
      return 'Twitter';
    } else if (platformLower.includes('linkedin')) {
      return 'LinkedIn';
    } else if (platformLower.includes('youtube')) {
      return 'YouTube';
    } else {
      return platform || 'Social Media';
    }
  };

  // Handle refresh data
  const handleRefresh = () => {
    fetchSocialMedia();
  };

  // Fetch data when component opens
  useEffect(() => {
    if (isOpen) {
      fetchSocialMedia();
    }
  }, [isOpen]);

  // Close error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Add the 'open' class based on `isOpen` prop
  const modalClass = isOpen
    ? "care-social-media-modal open"
    : "care-social-media-modal";
  const overlayClass = isOpen
    ? "care-social-media-overlay open"
    : "care-social-media-overlay";

  return (
    <>
      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 1100,
          maxWidth: '400px'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError("")}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className={overlayClass} onClick={onClose}></div>{" "}
      {/* Overlay for background dimming */}
      <div className={modalClass}>
        <div className="care-social-media-modal-content">
          <h1>Social Media</h1>

          {/* Setup: add a social media account / login address */}
          <form onSubmit={handleAddSocialMedia} className="care-social-setup-form" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <input
                style={{ flex: "1 1 120px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                placeholder="Platform (e.g. Facebook)"
                value={form.platform}
                onChange={(event) => updateForm("platform", event.target.value)}
              />
              <input
                style={{ flex: "1 1 160px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                placeholder="Login handle / address (e.g. @pomstores)"
                value={form.handle}
                onChange={(event) => updateForm("handle", event.target.value)}
              />
              <input
                style={{ flex: "1 1 160px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                placeholder="Profile URL (optional)"
                value={form.url}
                onChange={(event) => updateForm("url", event.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spinner-border text-primary" role="status" style={{ marginBottom: '10px' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading social media data...</p>
              </div>
            </div>
          ) : socialMediaData.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p>No social media data found</p>
                <p className="text-muted small">The API is connected but there is no social media data yet.</p>
                <button 
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={handleRefresh}
                  style={{
                    padding: '5px 15px',
                    fontSize: '12px'
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>
          ) : (
            <div>
              {socialMediaData.map((item) => (
                <div key={item.id} className="care-social-icon">
                  <span>
                    {item.icon || getPlatformIcon(item.platform)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h2>{getPlatformName(item.platform)}</h2>
                    {item.handle && (
                      <p className="text-muted small" style={{ margin: 0, fontSize: "12px" }}>
                        Login: {item.handle}
                      </p>
                    )}
                    {item.url && (
                      <p className="text-muted small" style={{ margin: 0, fontSize: "12px" }}>
                        <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                      </p>
                    )}
                    {item.strategy && (
                      <p className="text-muted small" style={{ margin: 0, fontSize: '12px' }}>
                        Strategy: {item.strategy}
                      </p>
                    )}
                    {item.data && typeof item.data === 'object' && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        {Object.entries(item.data).map(([key, value]) => (
                          <span key={key} className="badge bg-light text-dark" style={{ fontSize: '10px' }}>
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`badge ${item.isActive ? 'bg-success' : 'bg-secondary'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    style={{ marginLeft: "8px", fontSize: "11px" }}
                    onClick={() => handleDeleteSocialMedia(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              {/* Fallback to default icons if no data from API but we still want to show something */}
              {socialMediaData.length === 0 && (
                <>
                  <div className="care-social-icon">
                    <span>
                      <FaFacebook />
                    </span>
                    <h2>Facebook</h2>
                    <span className="badge bg-secondary" style={{ fontSize: '10px' }}>
                      No Data
                    </span>
                  </div>
                  <div className="care-social-icon">
                    <span>
                      <FaInstagram />
                    </span>
                    <h2>Instagram</h2>
                    <span className="badge bg-secondary" style={{ fontSize: '10px' }}>
                      No Data
                    </span>
                  </div>
                  <div className="care-social-icon">
                    <span>
                      <FaXTwitter />
                    </span>
                    <h2>Twitter</h2>
                    <span className="badge bg-secondary" style={{ fontSize: '10px' }}>
                      No Data
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CareSocialMediaModal;
