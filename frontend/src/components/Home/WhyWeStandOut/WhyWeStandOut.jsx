import React, { useState } from "react";
import "./WhyWeStandOut.css";

const WhyWeStandOut = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    {
      id: 1,
      title: "Unrivaled Product Selection",
      description:
        "Our e-commerce platform boasts an extensive range of high-quality products curated to meet diverse needs and preferences, ensuring there's something for everyone.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#0867db" />
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Convenient Installment Payments",
      description:
        "We understand the importance of affordability, which is why we offer flexible installment payment options, allowing customers to spread their payments over time and make purchases within their budget",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="16" rx="2" fill="white" />
          <path
            d="M8 2v6M16 2v6M3 10h18M8 14h8M8 18h5"
            stroke="#0867db"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="4" fill="#0867db" />
          <path
            d="M18 16v4M18 20v-4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Exceptional Customer Experience",
      description:
        "We prioritize customer satisfaction above all else, offering seamless navigation, secure transactions, and prompt support to ensure a hassle-free shopping journey from start to finish.",
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke="#0867db"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="7" r="4" stroke="#0867db" strokeWidth="2" />
          <path
            d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"
            fill="#0867db"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="why-stand-out-section">
      <div className="container">
        <h2 className="section-title">Why we stand out</h2>
        <div className="features-grid">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`feature-card ${hoveredCard === feature.id ? "hovered" : ""}`}
              onMouseEnter={() => setHoveredCard(feature.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyWeStandOut;




















