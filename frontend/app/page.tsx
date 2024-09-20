
"use client"
import Footer from "../components/Footer";
import Navbar from "../components/Nav"
import Hero from "../components/Hero"
import Team from "../components/Team"
import Features from "../components/Features"
import { useEffect } from "react";
import axios from "axios";
export default function Home() {
  useEffect(() => {
    axios.get('/').then((res) => {
      console.log(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1" id="Home">
        {/* NavBar */}
        <Navbar />

        {/* hero */}
        <Hero />

        {/* features */}
        <Features />

        <Team />
      </main>

      <Footer />
    </div>
  );
}
