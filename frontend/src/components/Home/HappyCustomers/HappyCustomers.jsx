import React, { useState, useEffect, useRef } from "react";
import "./HappyCustomers.css";

const HappyCustomers = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      name: "Ifoma Ada",
      image: "https://i.pravatar.cc/150?img=1",
      text: "PM made shopping a breeze! Their wide selection and easy payment options made finding and purchasing what I needed a delight.",
    },
    {
      id: 2,
      name: "Ifayin Oyama",
      image: "https://i.pravatar.cc/150?img=12",
      text: "As a small business owner, PM has been invaluable. Their platform gave my products the exposure they needed, and their support team is always there to help.",
    },
    {
      id: 3,
      name: "Paul Demilade",
      image: "https://i.pravatar.cc/150?img=47",
      text: "I've never experienced such personalized service online until I shopped with PM. From start to finish, they exceeded my expectations.",
    },
  ];

  // Create infinite loop by duplicating testimonials
  const infiniteTestimonials = [...testimonials, ...testimonials, ...testimonials];

  // Auto-rotate slider every 6 seconds (slower, smoother)
  useEffect(() => {
    if (!isDragging) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          // Max index is 6 (to show last 3 cards: 6,7,8)
          const maxIndex = infiniteTestimonials.length - 3;
          const next = prev + 1;
          // Reset to middle set (index 3) when reaching end for seamless loop
          if (next > maxIndex) {
            return testimonials.length;
          }
          return next;
        });
      }, 6000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [testimonials.length, isDragging, infiniteTestimonials.length]);

  // Initialize to middle set for infinite scroll
  useEffect(() => {
    setCurrentIndex(testimonials.length);
  }, [testimonials.length]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setDragOffset(0);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStart;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // Determine if we should move to next/prev slide based on drag distance
      const cardWidth = sliderRef.current ? sliderRef.current.offsetWidth / 3 : 0;
      if (Math.abs(dragOffset) > cardWidth * 0.3) {
        setCurrentIndex((prev) => {
          const maxIndex = infiniteTestimonials.length - 3;
          const next = dragOffset > 0 ? prev - 1 : prev + 1;
          // Reset to middle set when going beyond bounds for seamless loop
          if (next < 0) return testimonials.length * 2;
          if (next > maxIndex) return testimonials.length;
          return next;
        });
      }
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  // Touch drag handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
    setDragOffset(0);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - dragStart;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      const cardWidth = sliderRef.current ? sliderRef.current.offsetWidth / 3 : 0;
      if (Math.abs(dragOffset) > cardWidth * 0.3) {
        setCurrentIndex((prev) => {
          const maxIndex = infiniteTestimonials.length - 3;
          const next = dragOffset > 0 ? prev - 1 : prev + 1;
          // Reset to middle set when going beyond bounds for seamless loop
          if (next < 0) return testimonials.length * 2;
          if (next > maxIndex) return testimonials.length;
          return next;
        });
      }
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  // Calculate transform based on current index and drag offset
  // Each card is 33.333% + gap, so we calculate the offset
  const getTransform = () => {
    if (!sliderRef.current) return "0%";
    const containerWidth = sliderRef.current.offsetWidth;
    const cardWidthPercent = 33.333;
    const gapPercent = (30 / containerWidth) * 100;
    const cardWidthWithGap = cardWidthPercent + gapPercent;
    const baseOffset = -(currentIndex * cardWidthWithGap);
    const dragOffsetPercent = containerWidth > 0 ? (dragOffset / containerWidth) * 100 : 0;
    return `${baseOffset + dragOffsetPercent}%`;
  };

  return (
    <section className="happy-customers-section">
      <div className="container">
        <h2 className="section-title">WHAT OUR HAPPY CUSTOMERS SAY</h2>
        <div className="testimonials-container">
          <div
            className="testimonials-slider"
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateX(${getTransform()})`,
              cursor: isDragging ? "grabbing" : "grab",
              transition: isDragging ? "none" : "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {infiniteTestimonials.map((testimonial, index) => (
              <div key={`${testimonial.id}-${index}`} className="testimonial-card">
                <div className="testimonial-image-wrapper">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="testimonial-image"
                  />
                </div>
                <h3 className="testimonial-name">{testimonial.name}</h3>
                <div className="quote-icon">"</div>
                <p className="testimonial-text">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HappyCustomers;

