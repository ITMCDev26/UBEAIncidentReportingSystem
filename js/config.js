/* ============================================================
   UBCC — Unified Command Center
   config.js — static fallback config.
   NOTE: At runtime the app calls API.getConfig() which pulls the
   live version of these same lists from the "Config" sheet tab,
   so the Super Admin can edit them without touching this file.
   This file is only the fallback used before the API responds
   and the shape reference for what the sheet must contain.
   ============================================================ */

const APP_CONFIG = {
  // Set this to your deployed Apps Script Web App URL (ends in /exec)
  API_URL: "https://docs.google.com/spreadsheets/d/1a_vFa0HuawjM-eRdZW-Wz6ULT7Ce3UuQ-6cgrLX5w2Y/edit?gid=201645789#gid=201645789",

  orgName: "Unified Command Center",

  townships: [
    { code: "ARCV", name: "Arcovia City Estate Association, Inc." },
    { code: "BNCE", name: "Boracay New Coast Estate Association" },
    { code: "CAPT", name: "Capital Town Association, Inc." },
    { code: "CTLK", name: "Citylink Coach Services, Inc." },
    { code: "DPDA", name: "Davao Park District Association, Inc." },
    { code: "IBPA", name: "Iloilo Business Park Estate Association" },
    { code: "MGEA", name: "Maple Grove Estate Association" },
    { code: "MTCE", name: "Mckinley Town Center Estate Association" },
    { code: "MKWE", name: "Mckinley West Estate Association" },
    { code: "NPCE", name: "Newport City Estate Association" },
    { code: "NHGE", name: "Northill Gateway Estate Association" },
    { code: "SWCE", name: "Southwoods City Estate Association" },
    { code: "MCTN", name: "The Mactan Newtown Estate Association" },
    { code: "UPEA", name: "The Upper East Estate Association" },
    { code: "UBEA", name: "Uptown Bonifacio Estate Association" },
    { code: "WSCE", name: "Westside City Estate Association" }
  ],

  incidentTypes: [
    "Vehicular Accident", "Medical Response", "Arguments / Altercations",
    "Bomb Threat", "Crime", "Damaged to Property", "Earthquake", "Flooding",
    "House Rule Violation", "Mass Action", "Natural Calamity",
    "National Security Threat", "Fire", "Natural Hazard",
    "Power Interruption", "System/Equipment/Facility Failure",
    "Typhoon", "Water Interruption"
  ],

  // Only shown when Type of Incident === "Vehicular Accident"
  incidentClassification: [
    "Reckless Driving", "Tire Blowouts or Worn Tires", "Brake Failure",
    "Distracted Driving", "Fatigue or Drowsy Driving", "Speeding",
    "Self Vehicular Accident", "Engine Failure", "Violation of Traffic Rules",
    "Improper Signage", "Driving Under the Influence (DUI)",
    "Traffic Lights Malfunction", "Steering or Suspension Problems",
    "Improper Signage or Traffic Light Malfunctions", "Other Driver's Error"
  ],

  alertLevels: [
    { value: "Blue", label: "Blue", icon: "🔵", className: "alert-blue" },
    { value: "Yellow", label: "Yellow", icon: "🟡", className: "alert-yellow" },
    { value: "Red", label: "Red", icon: "🔴", className: "alert-red" }
  ],

  weather: [
    { value: "Sunny/Clear", icon: "☀️" },
    { value: "Cloudy", icon: "☁️" },
    { value: "Windy", icon: "🌬️" },
    { value: "Drizzle", icon: "🌦️" },
    { value: "Rain", icon: "🌧️" },
    { value: "Light Rain", icon: "🌦️" },
    { value: "Heavy Rain", icon: "⛈️" },
    { value: "Typhoon", icon: "🌀" },
    { value: "Stormy", icon: "🌩️" }
  ],

  incidentCategory: ["Facility Related", "Man Made"]
};
