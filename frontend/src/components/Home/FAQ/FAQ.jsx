import React, { useState } from "react";
import "./FAQ.css";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How can I track my order?",
      answer:
        "We provide order tracking services for all purchases made through our website. Once your order is confirmed, you will receive a tracking number via email or SMS, allowing you to monitor the status of your delivery in real-time.",
    },
    {
      id: 2,
      question: "What payment methods do you accept?",
      answer:
        "We accept a variety of payment methods including credit cards, debit cards, bank transfers, and our convenient installment payment plans. All transactions are secure and encrypted for your protection.",
    },
    {
      id: 3,
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy on all items in their original condition. Items must be unused, with tags attached, and in the original packaging. Please contact our customer service team to initiate a return.",
    },
    {
      id: 4,
      question: "How long does shipping take?",
      answer:
        "Standard shipping typically takes 5-7 business days. Express shipping options are available for faster delivery (2-3 business days). Shipping times may vary depending on your location.",
    },
    {
      id: 5,
      question: "Do you offer customer support?",
      answer:
        "Yes, our customer support team is available 24/7 to assist you with any questions or concerns. You can reach us via email, phone, or live chat on our website.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`faq-item ${openIndex === index ? "open" : ""}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">
                  {openIndex === index ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 15l7-7 7 7"
                        stroke="#0867db"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        stroke="#0867db"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;




















