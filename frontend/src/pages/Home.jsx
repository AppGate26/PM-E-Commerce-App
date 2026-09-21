import React from "react";
import NavBar from "../components/NavBar";
import Hero from "../components/Home/Hero/Hero";
import WhyWeStandOut from "../components/Home/WhyWeStandOut/WhyWeStandOut";
import DownloadApp from "../components/Home/DownloadApp/DownloadApp";
import HappyCustomers from "../components/Home/HappyCustomers/HappyCustomers";
import FAQ from "../components/Home/FAQ/FAQ";
import Footer from "../components/Home/Footer/Footer";

const Home = () => {
  return (
    <div className="width-container">
      <NavBar />
      <Hero />
      <WhyWeStandOut />
      <DownloadApp />
      <HappyCustomers />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Home;
