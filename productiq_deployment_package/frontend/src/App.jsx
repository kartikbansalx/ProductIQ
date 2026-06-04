import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function App() {
  const [view, setView] = useState('search'); // 'search', 'loading', 'report'
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // For Margin Simulator
  const [simulatorPrice, setSimulatorPrice] = useState(1200);
  const [profit, setProfit] = useState(835);
  const [marginPct, setMarginPct] = useState(69.5);

  // For HSN copy confirmation flash
  const [hsnCopied, setHsnCopied] = useState(false);

  // Active Tab in Report
  const [activeTab, setActiveTab] = useState('Overview');

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/history`);
      setHistory(res.data || []);
    } catch (e) {
      console.log('Failed to fetch search history:', e);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setView('loading');
    setLoadingProgress(0);
    setLoadingStep(0);
    setError(null);

    // Simulate progress bar moving up to 90% while waiting for API,
    // then jump to 100% when API returns.
    const startTime = Date.now();
    const expectedDuration = 3000; // 3 seconds simulated steps (faster)

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / expectedDuration, 0.95);
      const percentage = Math.floor(progressRatio * 100);
      setLoadingProgress(percentage);

      // Determine step based on percentage
      if (percentage < 20) setLoadingStep(0);
      else if (percentage < 40) setLoadingStep(1);
      else if (percentage < 60) setLoadingStep(2);
      else if (percentage < 80) setLoadingStep(3);
      else setLoadingStep(4);
    }, 100);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/analyze`, { product_name: query });
      clearInterval(progressInterval);

      // Finish progress animation
      setLoadingProgress(100);
      setLoadingStep(4);

      setTimeout(() => {
        setReport(res.data);
        // Initialize margin simulator with report values
        const avgPrice = res.data.pricing.avg_price || 1200;
        setSimulatorPrice(avgPrice);
        const landedCost = res.data.pricing.landed_cost_est || 365;
        const initProfit = avgPrice - landedCost;
        setProfit(initProfit);
        setMarginPct(((initProfit / avgPrice) * 100).toFixed(1));

        setView('report');
        setActiveTab('Overview');
        fetchHistory(); // Refresh history
      }, 500);

    } catch (e) {
      clearInterval(progressInterval);
      console.error(e);
      setError(e.response?.data?.detail || 'An error occurred during market analysis. Please check your connection.');
      setView('search');
    }
  };

  // Adjust Margin calculations
  useEffect(() => {
    if (!report) return;
    const landedCost = report.pricing.landed_cost_est || 365;
    const computedProfit = simulatorPrice - landedCost;
    setProfit(computedProfit);
    setMarginPct(simulatorPrice > 0 ? ((computedProfit / simulatorPrice) * 100).toFixed(1) : 0);
  }, [simulatorPrice, report]);

  const copyHSN = (hsn) => {
    navigator.clipboard.writeText(hsn).then(() => {
      setHsnCopied(true);
      setTimeout(() => setHsnCopied(false), 800);
    });
  };

  const handleBackToSearch = () => {
    setSearchQuery('');
    setReport(null);
    setView('search');
  };

  const selectHistoryItem = (name) => {
    setSearchQuery(name);
    // Simulate click
    setTimeout(() => {
      const btn = document.getElementById('search-submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  // PDF Export Script using jsPDF
  const exportPDF = () => {
    if (!report) return;
    
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // PAGE 1: Pricing, Landed Cost and Profitability
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(26, 92, 54); // Primary green
    doc.text("ProductIQ Market Intelligence Report", margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Indian E-commerce Sourcing Analysis`, margin, y);
    y += 15;

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    // Verdict Banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Product: ${report.product_name}`, margin, y);
    y += 8;

    doc.setFontSize(13);
    doc.text(`Verdict: ${report.verdict} (Score: ${report.iq_score}/100)`, margin, y);
    y += 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const splitRationale = doc.splitTextToSize(`Rationale: ${report.rationale}`, 170);
    doc.text(splitRationale, margin, y);
    y += (splitRationale.length * 5) + 12;

    // Pricing & Landed Cost Breakdown
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 92, 54);
    doc.text("1. Detailed Import Landed Cost Breakdown", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    const pricing = report.pricing;
    doc.text(`- FOB China Unit Price: INR ${pricing.import_price_est.toLocaleString()}`, margin, y); y += 6;
    doc.text(`- Customs Duty Rate: ${pricing.customs_duty_pct}% (Amount: INR ${Math.round(pricing.customs_amount || 0).toLocaleString()})`, margin, y); y += 6;
    doc.text(`- IGST / GST Rate: ${pricing.gst_pct}% (Amount: INR ${Math.round(pricing.gst_amount || 0).toLocaleString()})`, margin, y); y += 6;
    doc.text(`- Shipping & Freight Est (per unit): INR ${Math.round(pricing.shipping_cost_est || 0).toLocaleString()}`, margin, y); y += 6;
    doc.text(`- Clearance & Port Agent Fees (per unit): INR ${Math.round(pricing.clearance_fees_est || 0).toLocaleString()}`, margin, y); y += 8;
    
    doc.setFont("helvetica", "bold");
    doc.text(`- TOTAL ESTIMATED LANDED COST: INR ${Math.round(pricing.landed_cost_est).toLocaleString()}`, margin, y); y += 12;

    // Profitability & Investment ROI
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 92, 54);
    doc.text("2. Profitability & Investment ROI", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`- Average Selling Price (ASP): INR ${pricing.avg_price.toLocaleString()}`, margin, y); y += 6;
    doc.text(`- Suggested MSRP: INR ${pricing.suggested_msrp.toLocaleString()}`, margin, y); y += 6;
    doc.text(`- Gross Profit Margin: ${pricing.gross_margin_pct}%`, margin, y); y += 6;
    doc.text(`- Net Profit per Unit: INR ${Math.round(pricing.net_profit_est || 0).toLocaleString()}`, margin, y); y += 6;
    doc.text(`- Return on Investment (ROI): ${pricing.roi_pct || 0}%`, margin, y); y += 8;
    
    doc.setFont("helvetica", "bold");
    doc.text(`- Consignment Break-even Target (on INR 5 Lakhs): ${(pricing.breakeven_units || 0).toLocaleString()} units`, margin, y); y += 6;

    // PAGE 2: Regulations, SWOT, and Competitor Listings
    doc.addPage();
    y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 92, 54);
    doc.text("3. Indian Regulatory Compliance Guidance", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`- HSN Classification Code: ${report.market_performance.hsn_code}`, margin, y); y += 6;
    doc.text(`- BIS Certification: ${report.market_performance.bis_required ? 'MANDATORY (' + (report.market_performance.bis_standard || 'Standard Reqd') + ')' : 'NOT REQUIRED'}`, margin, y); y += 6;
    doc.text(`- DGFT Import Status: ${report.market_performance.dgft_status}`, margin, y); y += 12;

    // SWOT Analysis
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 92, 54);
    doc.text("4. SWOT & Strategic Outlook", margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Strengths:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${report.swot.strengths.slice(0, 3).join(', ')}`, margin + 25, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Weaknesses:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${report.swot.weaknesses.slice(0, 3).join(', ')}`, margin + 27, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Opportunities:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${report.swot.opportunities.slice(0, 3).join(', ')}`, margin + 29, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Threats:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${report.swot.threats.slice(0, 3).join(', ')}`, margin + 18, y);
    y += 14;

    // Top Selling Competitors
    if (report.top_products && report.top_products.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(26, 92, 54);
      doc.text("5. Top Competitor Marketplace Listings", margin, y);
      y += 10;

      doc.setFontSize(10);
      report.top_products.slice(0, 6).forEach((prod, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. [${prod.platform}] ${prod.title.slice(0, 50)}...`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`   Price: INR ${prod.price.toLocaleString()} | Rating: ${prod.rating} (${prod.reviews_count} reviews) | Link: ${prod.link.slice(0, 60)}...`, margin, y);
        y += 7;
      });
      y += 5;
    }

    // Footer Disclaimer at bottom of page 2
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const splitDisclaimer = doc.splitTextToSize("Disclaimer: This report is generated dynamically using AI and web search aggregators. All data is for informational guidance only. Verify all legal, customs tariff, and BIS regulations with a customs broker before committing capital.", 170);
    doc.text(splitDisclaimer, margin, 275 - (splitDisclaimer.length * 4));

    // Save the PDF
    try {
      doc.save(`ProductIQ_Detailed_Report_${report.product_name.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error("Direct download failed, falling back to opening in a new tab", e);
    }

    // Fallback/Option: Also open PDF in a new window/tab so users in sandboxed frames can view/save it
    try {
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error("Failed to open PDF in new tab", e);
    }
  };

  // 12-month Google Trends data transform for Recharts
  const formatTrendsData = () => {
    if (!report || !report.demand_trends) return [];
    return Object.entries(report.demand_trends).map(([month, val]) => ({
      name: month,
      Interest: val
    }));
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-on-surface bg-background">
      
      {/* ================= VIEW 1: SEARCH PAGE ================= */}
      {view === 'search' && (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-tr from-[#E6F3EE] via-[#F4FAF8] to-[#E6F3EE]">

          {/* Top Header Navigation */}
          <header className="w-full flex justify-between items-center px-6 py-4 relative z-30 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004322" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#004322]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
                <path d="M12 12l5-5m0 0h-3.5m3.5 0V10.5" stroke="#10B981" strokeWidth="3" />
              </svg>
              <span className="text-xl font-extrabold text-[#004322] tracking-tight font-headline-lg">ProductIQ</span>
            </div>
          </header>

          {/* Floating Sticker Layer */}
          <div className="absolute inset-0 pointer-events-none select-none z-10 hidden sm:block">
            <span className="absolute text-[32px] animate-float opacity-50 left-[10%] top-[18%]" style={{ animationDelay: '0s' }}>📦</span>
            <span className="absolute text-[36px] animate-float opacity-50 right-[18%] top-[22%]" style={{ animationDelay: '1s' }}>📈</span>
            <span className="absolute text-[34px] animate-float opacity-50 left-[5%] top-[45%]" style={{ animationDelay: '2s' }}>🔍</span>
            <span className="absolute text-[30px] animate-float opacity-50 right-[12%] top-[65%]" style={{ animationDelay: '1.5s' }}>💡</span>
            <span className="absolute text-[28px] animate-float opacity-50 right-[26%] bottom-[10%]" style={{ animationDelay: '3s' }}>⚡</span>
            <span className="absolute text-[32px] font-bold text-[#707971]/20 left-[15%] bottom-[22%] tracking-wider font-sans select-none">IN</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-margin max-w-4xl mx-auto w-full relative z-20 pt-8 pb-8">
            
            {/* Pulsing Live Badge */}
            <div className="mb-8 flex items-center gap-2 px-5 py-1.5 rounded-full border border-[#D9E6E2] bg-white/70 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1A5C36] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#1A5C36] tracking-wider uppercase font-sans">
                Live Market Intelligence for Indian Importers
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-center text-[40px] md:text-[54px] text-[#121c28] tracking-tight leading-[1.1] mb-8 max-w-[768px] font-extrabold font-headline-lg">
              Is this product worth <span className="text-[#004322] italic font-serif font-extrabold">importing</span> <br className="hidden md:inline" /> from China?
            </h2>

            {/* Error Message banner */}
            {error && (
              <div className="w-full max-w-[576px] mb-md p-md bg-error-container text-on-error-container rounded-xl border border-error/20 flex gap-sm items-start shadow-sm">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="text-caption leading-snug">{error}</p>
              </div>
            )}

            {/* Search Input Container */}
            <form onSubmit={handleSearchSubmit} className="w-full max-w-[672px] mb-8">
              <div className="relative flex items-center bg-white rounded-full border border-[#D0DFD9] shadow-[0_4px_16px_rgba(0,0,0,0.03)] p-1.5">
                <span className="material-symbols-outlined text-[#707971] ml-4 mr-2 select-none">search</span>
                <input
                  type="text"
                  placeholder="E.g., Smart Watches, Portable EV Chargers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-transparent text-on-surface focus:outline-none text-body-md"
                />
                <button
                  type="submit"
                  id="search-submit-btn"
                  className="h-11 px-8 bg-[#004322] hover:bg-[#0b522d] text-white font-semibold rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-xs whitespace-nowrap"
                >
                  Analyze <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </form>

            {/* Checkmark values */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 w-full text-[#404941] text-[13px] mb-8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004322] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-semibold">Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004322] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-semibold">No signup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004322] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-semibold">Indian legal data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004322] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-semibold">Updated daily</span>
              </div>
            </div>

            {/* History List */}
            {history.length > 0 && (
              <div className="mt-xl w-full max-w-[448px] bg-white/50 border border-outline-variant rounded-xl p-md shadow-sm">
                <h4 className="text-caption font-bold font-data-label uppercase text-on-surface-variant border-b border-outline-variant pb-xs mb-xs flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">history</span> Recent Searches
                </h4>
                <div className="flex flex-wrap gap-xs pt-sm max-h-24 overflow-y-auto no-scrollbar">
                  {history.slice(0, 10).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectHistoryItem(item.product_name)}
                      className="px-sm py-xs bg-white border border-outline-variant rounded-lg hover:border-primary text-caption font-medium transition-all text-on-surface-variant active:scale-95"
                    >
                      {item.product_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <footer className="py-lg px-margin flex flex-col md:flex-row justify-between items-center gap-sm bg-surface-container-highest border-t border-outline-variant text-center w-full mt-auto">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-caption font-caption text-on-surface-variant">© 2026 ProductIQ Market Intelligence. Built for Indian Entrepreneurs.</p>
              <p className="text-caption font-caption text-on-surface-variant">Contact Developer: <a href="mailto:kartikb.work@gmail.com" className="hover:underline text-primary font-semibold">kartikb.work@gmail.com</a></p>
            </div>
            <div className="flex gap-md">
              <a className="text-caption font-caption text-on-surface-variant hover:underline hover:text-primary transition-all" href="#">Terms of Service</a>
              <a className="text-caption font-caption text-on-surface-variant hover:underline hover:text-primary transition-all" href="#">Privacy Policy</a>
              <a className="text-caption font-caption text-on-surface-variant hover:underline hover:text-primary transition-all" href="#">Support</a>
            </div>
          </footer>
        </div>
      )}

      {/* ================= VIEW 2: LOADING PROGRESS SCREEN ================= */}
      {view === 'loading' && (
        <div className="flex-grow min-h-screen bg-[#E2EFEB] flex items-center justify-center font-body-md text-on-surface relative">
          
          {/* Background Dotted Texture */}
          <div aria-hidden="true" className="fixed inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1A5C36 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
          </div>

          <main className="relative z-10 w-[460px] bg-surface-container-lowest rounded-[20px] p-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant mx-sm">
            {/* Header */}
            <header className="text-center mb-lg">
              <h1 className="font-headline-lg text-headline-md text-primary tracking-tight font-extrabold">ProductIQ</h1>
              <p className="text-on-surface-variant font-caption text-caption uppercase tracking-widest mt-base">Market Intelligence Engine</p>
            </header>

            {/* Progress Visualization */}
            <div className="mb-xl">
              <div className="flex justify-between items-end mb-sm">
                <span className="font-data-label text-[11px] text-on-surface-variant uppercase tracking-wider">Analyzing Data Pipeline</span>
                <span className="font-data-value text-body-lg text-primary font-bold tabular-nums">{loadingProgress}%</span>
              </div>
              <div className="w-full h-[6px] bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-[#4ade80] rounded-full transition-all duration-100" style={{ width: `${loadingProgress}%` }}></div>
              </div>
            </div>

            {/* Step Checklist */}
            <nav aria-label="Processing Steps" className="space-y-md">
              {[
                "Researching Product & Query mapping",
                "Querying Indian Marketplaces (Amazon, Flipkart)",
                "Calculating Customs Tariffs & GST Duties",
                "Benchmarking Competitors & Review Ratings",
                "Generating AI Strategic Opportunity Score"
              ].map((stepText, idx) => {
                const isCompleted = loadingStep > idx;
                const isActive = loadingStep === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-md transition-all duration-300 ${
                      isCompleted ? 'text-outline opacity-70' : isActive ? 'text-primary font-bold' : 'opacity-40'
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : isActive ? (
                        <span className="material-symbols-outlined text-primary text-[20px] animate-spin-slow">sync</span>
                      ) : (
                        <span className="material-symbols-outlined text-outline text-[20px]">circle</span>
                      )}
                    </div>
                    <span className="text-body-md leading-none">{stepText}</span>
                  </div>
                );
              })}
            </nav>

            {/* Footer Text */}
            <footer className="mt-xl pt-lg border-t border-outline-variant/30 text-center">
              <div className="flex items-center justify-center gap-xs text-on-surface-variant font-caption text-caption">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                Secure Institutional Grade Connection
              </div>
            </footer>
          </main>
        </div>
      )}

      {/* ================= VIEW 3: REPORT PAGE ================= */}
      {view === 'report' && report && (
        <div className="flex-1 flex flex-col pt-[60px] min-h-screen bg-background">
          
          {/* STICKY TOP BAR */}
          <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin h-[60px] bg-white border-b border-outline-variant shadow-sm max-w-7xl mx-auto left-0 right-0">
            <div className="flex items-center gap-sm">
              <button
                onClick={handleBackToSearch}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-container-low transition-colors"
                title="Go back to search"
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
              <h1 className="text-headline-md font-headline-lg font-bold text-primary max-w-[120px] sm:max-w-none truncate">
                ProductIQ <span className="text-on-surface-variant text-caption font-normal ml-sm hidden sm:inline">/ Analysis</span>
              </h1>
            </div>

            {/* Right side Score Ring and Status Pill */}
            <div className="flex items-center gap-md">
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-surface-container-highest" cx="22" cy="22" fill="transparent" r="18" stroke="currentColor" stroke-width="4"></circle>
                  <circle
                    className="text-primary transition-all duration-1000 ease-out score-ring"
                    cx="22"
                    cy="22"
                    fill="transparent"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="113"
                    strokeDashoffset={113 - (113 * report.iq_score) / 100}
                  ></circle>
                </svg>
                <span className="absolute font-data-label text-[12px] font-bold text-primary">{report.iq_score}</span>
              </div>
              <span className={`px-sm py-1 text-white font-bold text-[12px] rounded-full tracking-wider ${
                report.verdict === 'BUY' ? 'bg-primary' : report.verdict === 'CAUTION' ? 'bg-amber-600' : 'bg-red-700'
              }`}>
                {report.verdict}
              </span>
            </div>
          </nav>

          {/* MAIN WRAPPER */}
          <div className="flex-1 max-w-7xl mx-auto w-full px-margin pb-xl flex flex-col">
            
            {/* STICKY TAB BAR */}
            <div className="sticky top-[60px] z-40 bg-background/90 backdrop-blur-md py-sm border-b border-outline-variant mb-lg overflow-x-auto no-scrollbar">
              <div className="flex gap-md min-w-max">
                {['Overview', 'Pricing', 'Demand', 'Competition', 'Legal', 'AI Verdict'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-xs font-data-label text-data-label border-b-2 transition-all px-xs ${
                      activeTab === tab
                        ? 'text-primary font-bold border-primary'
                        : 'text-on-surface-variant font-medium border-transparent hover:text-primary hover:border-outline-variant'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT 1: OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="space-y-lg">
                {/* Rationale Banner */}
                <section>
                  <div className="relative overflow-hidden rounded-xl p-lg bg-gradient-to-br from-primary-container to-primary text-on-primary-container flex flex-col md:flex-row items-center gap-lg">
                    {/* Score Dial */}
                    <div className="relative w-[120px] h-[120px] flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-on-primary-container/20" cx="60" cy="60" fill="transparent" r="50" stroke="currentColor" stroke-width="8"></circle>
                        <circle
                          className="text-on-primary-container transition-all duration-1000 ease-out score-ring"
                          cx="60"
                          cy="60"
                          fill="transparent"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray="314"
                          strokeDashoffset={314 - (314 * report.iq_score) / 100}
                        ></circle>
                      </svg>
                      <div className="absolute text-center">
                        <span className="block text-[32px] font-headline-lg text-white font-extrabold leading-none">{report.iq_score}</span>
                        <span className="text-[9px] font-data-label text-white/70 uppercase">IQ Score</span>
                      </div>
                    </div>
                    {/* Rationale Text */}
                    <div className="text-center md:text-left">
                      <h2 className="text-headline-lg font-headline-lg text-white mb-xs truncate">{report.product_name}</h2>
                      <p className="text-body-lg font-body-lg text-white/95 max-w-[672px] leading-relaxed">
                        {report.rationale}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Metrics 8-Card Grid */}
                <section>
                  <h3 className="font-headline-md text-headline-md mb-md text-primary">Market Overview Key Performance Indexes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
                    {/* Category */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Sub-Category</p>
                      <p className="text-body-lg font-bold text-primary truncate" title={report.market_performance.category}>{report.market_performance.category}</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-bar" style={{ '--target-width': '80%' }}></div>
                      </div>
                    </div>

                    {/* Market Size */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Market Size (India)</p>
                      <p className="text-headline-md font-data-value text-primary leading-none">₹{report.market_performance.market_size_cr} Cr</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-bar" style={{ '--target-width': '70%' }}></div>
                      </div>
                    </div>

                    {/* Avg ASP */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Average Selling Price</p>
                      <p className="text-headline-md font-data-value text-primary leading-none">₹{report.pricing.avg_price.toLocaleString()}</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-bar" style={{ '--target-width': '55%' }}></div>
                      </div>
                    </div>

                    {/* Import Price */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Est. Chinese Cost</p>
                      <p className="text-headline-md font-data-value text-secondary leading-none">₹{report.pricing.import_price_est.toLocaleString()}</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-secondary animate-bar" style={{ '--target-width': '40%' }}></div>
                      </div>
                    </div>

                    {/* Gross Margin */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Gross Profit Margin</p>
                      <p className="text-headline-md font-data-value text-on-primary-fixed-variant leading-none">{report.pricing.gross_margin_pct}%</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-on-primary-fixed-variant animate-bar" style={{ '--target-width': `${report.pricing.gross_margin_pct}%` }}></div>
                      </div>
                    </div>

                    {/* Demand Level */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Demand Level</p>
                      <p className="text-body-lg font-bold text-primary">{report.market_performance.demand_level}</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-bar" style={{ '--target-width': report.market_performance.demand_level === 'HIGH' ? '90%' : report.market_performance.demand_level === 'MEDIUM' ? '60%' : '30%' }}></div>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">Entry Difficulty</p>
                      <p className={`text-body-lg font-bold ${report.market_performance.entry_difficulty === 'HIGH' ? 'text-error' : report.market_performance.entry_difficulty === 'MEDIUM' ? 'text-amber-600' : 'text-primary'}`}>{report.market_performance.entry_difficulty}</p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-outline animate-bar" style={{ '--target-width': report.market_performance.entry_difficulty === 'HIGH' ? '90%' : report.market_performance.entry_difficulty === 'MEDIUM' ? '60%' : '30%' }}></div>
                      </div>
                    </div>

                    {/* BIS */}
                    <div className="glass-card p-md rounded-lg shadow-sm">
                      <p className="text-caption font-data-label text-on-surface-variant mb-xs">BIS Certification</p>
                      <p className={`text-body-lg font-bold ${report.market_performance.bis_required ? 'text-error' : 'text-primary'}`}>
                        {report.market_performance.bis_required ? 'MANDATORY' : 'NOT REQUIRED'}
                      </p>
                      <div className="h-1 bg-surface-container-highest mt-md rounded-full overflow-hidden">
                        <div className="h-full bg-outline animate-bar" style={{ '--target-width': report.market_performance.bis_required ? '100%' : '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2-Column Variants and Features Section */}
                <section className="grid md:grid-cols-2 gap-lg">
                  {/* Key Variants */}
                  <div className="glass-card p-lg rounded-xl">
                    <div className="flex items-center gap-xs mb-md text-primary">
                      <span className="material-symbols-outlined">category</span>
                      <h4 className="font-headline-md text-headline-md">Key Variants Sourced</h4>
                    </div>
                    <div className="flex flex-wrap gap-sm">
                      {report.variants.map((variant, idx) => (
                        <span key={idx} className="px-sm py-xs bg-surface-container text-primary font-data-label text-data-label rounded-lg border border-outline-variant">
                          {variant}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top Features */}
                  <div className="glass-card p-lg rounded-xl">
                    <div className="flex items-center gap-xs mb-md text-on-primary-fixed-variant">
                      <span className="material-symbols-outlined">verified</span>
                      <h4 className="font-headline-md text-headline-md">High-Value Target Features</h4>
                    </div>
                    <div className="flex flex-wrap gap-sm">
                      {report.features.map((feature, idx) => (
                        <span key={idx} className="px-sm py-xs bg-primary-container text-on-primary-container font-data-label text-data-label rounded-lg">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* TAB CONTENT 2: PRICING */}
            {activeTab === 'Pricing' && (
              <div className="space-y-lg">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-gutter">
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">Min Retail</p>
                    <p className="text-headline-md font-data-value text-primary leading-none">₹{report.pricing.min_price.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">Max Retail</p>
                    <p className="text-headline-md font-data-value text-primary leading-none">₹{report.pricing.max_price.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">Avg Retail</p>
                    <p className="text-headline-md font-data-value text-primary leading-none">₹{report.pricing.avg_price.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">FOB China</p>
                    <p className="text-headline-md font-data-value text-secondary leading-none">₹{report.pricing.import_price_est.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">Customs %</p>
                    <p className="text-headline-md font-data-value text-tertiary leading-none">{report.pricing.customs_duty_pct}%</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">IGST %</p>
                    <p className="text-headline-md font-data-value text-on-primary-container leading-none">{report.pricing.gst_pct}%</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">Landed Cost</p>
                    <p className="text-headline-md font-data-value text-primary leading-none">₹{report.pricing.landed_cost_est.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between hover:border-primary transition-all">
                    <p className="text-[10px] font-data-label text-on-secondary-container mb-xs uppercase">Mkt Margin</p>
                    <p className="text-headline-md font-data-value text-on-primary-fixed-variant leading-none">{report.pricing.gross_margin_pct}%</p>
                  </div>
                </div>

                {/* Detailed Cost Breakdown & Profitability Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                  <div>
                    <h3 className="text-headline-md font-bold text-primary mb-md flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      Import & Landed Cost Breakdown
                    </h3>
                    <div className="space-y-sm text-body-md">
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">FOB China Unit Cost</span>
                        <span className="font-semibold text-on-surface">₹{report.pricing.import_price_est.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Customs Duty ({report.pricing.customs_duty_pct}%)</span>
                        <span className="font-semibold text-on-surface">₹{Math.round(report.pricing.customs_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">IGST on Import ({report.pricing.gst_pct}%)</span>
                        <span className="font-semibold text-on-surface">₹{Math.round(report.pricing.gst_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Shipping & Freight Est.</span>
                        <span className="font-semibold text-on-surface">₹{Math.round(report.pricing.shipping_cost_est).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Clearance & Port Agent Fees</span>
                        <span className="font-semibold text-on-surface">₹{Math.round(report.pricing.clearance_fees_est).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs pt-sm text-primary font-bold">
                        <span>Total Est. Landed Cost</span>
                        <span>₹{Math.round(report.pricing.landed_cost_est).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-headline-md font-bold text-primary mb-md flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                      Investment ROI & Profitability
                    </h3>
                    <div className="space-y-sm text-body-md">
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Avg Selling Price (ASP)</span>
                        <span className="font-semibold text-on-surface">₹{report.pricing.avg_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Suggested Retail MSRP</span>
                        <span className="font-semibold text-on-surface">₹{report.pricing.suggested_msrp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Net Profit Margin per Unit</span>
                        <span className="font-semibold text-green-700">₹{Math.round(report.pricing.net_profit_est).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Return on Investment (ROI)</span>
                        <span className="font-bold text-green-700">{report.pricing.roi_pct}%</span>
                      </div>
                      <div className="flex justify-between py-xs border-b border-outline-variant/30">
                        <span className="text-on-surface-variant font-medium">Gross Profit Margin %</span>
                        <span className="font-semibold text-on-surface">{report.pricing.gross_margin_pct}%</span>
                      </div>
                      <div className="flex justify-between py-xs pt-sm text-primary font-bold" title="Based on ₹5,00,000 standard container/consignment size">
                        <span>Consignment Break-even Units</span>
                        <span>{report.pricing.breakeven_units.toLocaleString()} units</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                  {/* Platform Listings Density Bar Chart */}
                  <div className="lg:col-span-2 bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                    <h3 className="text-headline-md font-headline-md text-on-surface mb-lg">E-Commerce Channel Prices & Volume</h3>
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={report.platforms}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="platform" tick={{ fill: '#404941', fontFamily: 'Instrument Sans' }} />
                          <YAxis label={{ value: 'Average Price (INR)', angle: -90, position: 'insideLeft', offset: -10 }} />
                          <Tooltip formatter={(value, name) => [value, name === 'avg_price' ? 'Avg Price (INR)' : name]} />
                          <Bar dataKey="avg_price" fill="#1A5C36" radius={[8, 8, 0, 0]}>
                            {report.platforms.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1A5C36' : '#2A6A43'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right side layout: HSN & Live Margin Simulator */}
                  <div className="flex flex-col gap-gutter">
                    {/* Copyable HSN Code Card */}
                    <div
                      className={`bg-gradient-to-br from-primary to-primary-container p-lg rounded-xl shadow-lg relative overflow-hidden group cursor-pointer transition-all duration-300 ${
                        hsnCopied ? 'bg-gradient-to-br from-primary-fixed-dim to-primary-fixed ring-4 ring-primary/20' : ''
                      }`}
                      onClick={() => copyHSN(report.market_performance.hsn_code)}
                      title="Click to copy HSN code"
                    >
                      <p className="text-[10px] font-data-label text-primary-fixed-dim uppercase tracking-widest mb-sm">Regulated HSN Code</p>
                      <div className="flex items-center justify-between">
                        <h4 className="text-headline-lg font-data-value text-white tracking-tighter">{report.market_performance.hsn_code}</h4>
                        <button className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all active:scale-95">
                          <span className="material-symbols-outlined text-[20px]">{hsnCopied ? 'check' : 'content_copy'}</span>
                        </button>
                      </div>
                      <div className="mt-md flex gap-xs">
                        <span className="px-xs py-1 bg-white/10 rounded text-[9px] font-data-label text-white/80 border border-white/20 uppercase">
                          {report.market_performance.category.slice(0, 15)}
                        </span>
                        <span className="px-xs py-1 bg-white/10 rounded text-[9px] font-data-label text-white/80 border border-white/20">
                          {hsnCopied ? 'COPIED!' : 'CLICK TO COPY'}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Margin Simulator */}
                    <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex-grow">
                      <h3 className="text-headline-md font-headline-md text-on-surface mb-md">Interactive Profit Margin Simulator</h3>
                      <div className="space-y-md">
                        <div className="flex justify-between items-center">
                          <label className="text-label-sm font-headline-md text-on-surface">Target Selling Price</label>
                          <span className="text-headline-md font-data-value text-primary font-bold">₹{simulatorPrice.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min={Math.floor(report.pricing.landed_cost_est * 1.1)}
                          max={Math.floor(report.pricing.avg_price * 2.5)}
                          value={simulatorPrice}
                          onChange={(e) => setSimulatorPrice(Number(e.target.value))}
                          className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                        <div className="flex justify-between text-caption font-data-label text-outline">
                          <span>₹{Math.floor(report.pricing.landed_cost_est * 1.1).toLocaleString()}</span>
                          <span>₹{Math.floor(report.pricing.avg_price * 2.5).toLocaleString()}</span>
                        </div>

                        <div className="p-md bg-surface-container-low rounded-lg border border-outline-variant border-dashed">
                          <div className="flex justify-between items-center mb-sm">
                            <span className="text-caption font-body-md text-on-surface-variant">Landed Cost (Fixed)</span>
                            <span className="font-data-value text-on-surface font-semibold">₹{Math.round(report.pricing.landed_cost_est).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-sm border-t border-outline-variant/30">
                            <span className="text-body-md font-headline-md text-on-surface">Net Margin / Unit</span>
                            <span className={`text-headline-md font-data-value font-bold ${profit > 0 ? 'text-green-700' : 'text-error'}`}>
                              ₹{Math.round(profit).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-xs pt-xs flex items-center gap-xs">
                            <div className="h-2 flex-grow bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${marginPct < 25 ? 'bg-error' : 'bg-green-700'}`}
                                style={{ width: `${Math.max(0, Math.min(100, marginPct))}%` }}
                              ></div>
                            </div>
                            <span className={`text-caption font-data-value font-bold ${marginPct < 25 ? 'text-error' : 'text-green-700'}`}>
                              {marginPct}%
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-outline font-body-md italic leading-tight">
                          *Calculations exclude platform dynamic channel fees, marketing search ad bids and local warehouses logistics storage costs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 10 Best Selling Products Grid */}
                {report.top_products && report.top_products.length > 0 && (
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm mt-lg">
                    <div className="flex items-center gap-xs mb-lg text-[#004322]">
                      <span className="material-symbols-outlined text-[24px]">trending_up</span>
                      <h3 className="text-headline-md font-headline-lg font-bold">Top 10 Selling Products & Marketplace Listings</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {report.top_products.slice(0, 10).map((prod, idx) => (
                        <div key={idx} className="p-md bg-surface-container-low rounded-xl border border-outline-variant hover:border-[#004322] transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-sm mb-xs">
                              <span className={`px-sm py-0.5 text-[10px] font-bold rounded-full ${
                                prod.platform === 'Amazon.in' ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20' : 'bg-[#2874F0]/10 text-[#2874F0] border border-[#2874F0]/20'
                              }`}>
                                {prod.platform}
                              </span>
                              <span className="text-headline-md font-bold text-primary">₹{prod.price.toLocaleString()}</span>
                            </div>
                            <h4 className="font-semibold text-body-md text-on-surface line-clamp-2 mb-sm" title={prod.title}>
                              {idx + 1}. {prod.title}
                            </h4>
                          </div>
                          <div className="flex justify-between items-center mt-sm pt-sm border-t border-outline-variant/30">
                            <div className="flex items-center gap-xs text-body-sm text-amber-600 font-medium">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              {prod.rating} <span className="text-on-surface-variant font-normal">({prod.reviews_count} reviews)</span>
                            </div>
                            <a
                              href={prod.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-sm py-1 bg-[#004322] hover:bg-[#0b522d] text-white text-caption font-bold rounded-lg flex items-center gap-xs transition-all"
                            >
                              View Listing <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: DEMAND */}
            {activeTab === 'Demand' && (
              <div className="space-y-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">Search Trend Direction</p>
                    <p className="text-headline-md font-bold text-primary">STABLE</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">Estimated Listing Units</p>
                    <p className="text-headline-md font-data-value text-primary">{report.market_performance.review_volume * 3}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">Category Average Rating</p>
                    <p className="text-headline-md font-data-value text-primary">⭐ {report.market_performance.avg_rating}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">Aggregate Review Volumes</p>
                    <p className="text-headline-md font-data-value text-primary">{report.market_performance.review_volume.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                  {/* Google Trends Line Chart */}
                  <div className="lg:col-span-2 bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                    <h3 className="text-headline-md font-headline-md text-on-surface mb-lg">Google Trends 12-Month Search Interest (India)</h3>
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatTrendsData()}
                          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fill: '#404941', fontFamily: 'Instrument Sans' }} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="Interest"
                            stroke="#1A5C36"
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Seasonality card */}
                  <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] p-lg rounded-xl border border-amber-300 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-800 mb-md">
                        <span className="material-symbols-outlined">calendar_today</span>
                      </div>
                      <h4 className="text-headline-md font-headline-md text-amber-900 mb-xs">Seasonality: {report.seasonality}</h4>
                      <p className="text-body-md text-amber-950 leading-relaxed">
                        {report.seasonality_advice}
                      </p>
                    </div>
                    <span className="text-caption font-data-label text-amber-800 uppercase tracking-widest mt-lg block">Inventory Scheduling Guidance</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: COMPETITION */}
            {activeTab === 'Competition' && (
              <div className="space-y-lg">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                  {/* Left Column: Metrics & Brands */}
                  <div className="lg:col-span-2 bg-white p-lg rounded-xl border border-outline-variant shadow-sm space-y-lg">
                    <h3 className="text-headline-md font-headline-md text-on-surface">Category Top Brands Market Volume Share</h3>
                    
                    <div className="space-y-md">
                      {report.brands.map((brandObj, idx) => (
                        <div key={idx} className="space-y-xs">
                          <div className="flex justify-between text-label-sm font-data-label text-on-surface-variant">
                            <span>{brandObj.brand}</span>
                            <span className="text-primary font-bold">{brandObj.share_pct}% share</span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-6 overflow-hidden relative">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-1000"
                              style={{ width: `${brandObj.share_pct}%` }}
                            ></div>
                            <span className="absolute right-3 top-0.5 text-[11px] font-data-value text-on-surface font-semibold">
                              ASP: ₹{brandObj.avg_price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Platform price metrics */}
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm space-y-md">
                    <h3 className="text-headline-md font-headline-md text-on-surface border-b pb-sm border-outline-variant/30">Platform Benchmarks</h3>
                    <div className="divide-y divide-outline-variant/30">
                      {report.platforms.map((plat, idx) => (
                        <div key={idx} className="py-sm flex justify-between items-center text-body-md">
                          <div>
                            <p className="font-bold text-primary">{plat.platform}</p>
                            <p className="text-caption text-outline font-data-label">{plat.price_range}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-data-value font-semibold">₹{plat.avg_price.toLocaleString()}</p>
                            <p className="text-caption text-outline-variant font-data-label">Avg Price</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: LEGAL & REGULATORY */}
            {activeTab === 'Legal' && (
              <div className="space-y-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">BIS Certification</p>
                    <p className={`text-headline-md font-bold ${report.legal.bis_status === 'YES' ? 'text-error' : 'text-primary'}`}>{report.legal.bis_status}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">Import Policy status</p>
                    <p className="text-headline-md font-bold text-primary truncate" title={report.legal.import_status}>{report.legal.import_status}</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">IGST / GST Tariff</p>
                    <p className="text-headline-md font-data-value text-primary">{report.legal.gst_pct}%</p>
                  </div>
                  <div className="bg-white p-sm rounded-lg border border-outline-variant shadow-sm text-center">
                    <p className="text-caption font-data-label text-on-surface-variant mb-xs">Customs Tariff Rate</p>
                    <p className="text-headline-md font-data-value text-primary">{report.legal.customs_duty_pct}%</p>
                  </div>
                </div>

                {/* Regulatory Checklist */}
                <section className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                  <h3 className="text-headline-md font-headline-md text-on-surface mb-lg">Indian Customs Clearance Checklist</h3>
                  <div className="grid md:grid-cols-2 gap-md">
                    {report.legal.checklist.map((item, idx) => (
                      <div key={idx} className="p-md bg-surface-container-low rounded-lg border border-outline-variant flex gap-sm items-start">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          {item.status === 'mandatory' ? (
                            <span className="material-symbols-outlined text-error text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                          ) : item.status === 'conditional' ? (
                            <span className="material-symbols-outlined text-amber-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                          ) : (
                            <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-body-md text-primary leading-tight flex items-center gap-xs">
                            {item.title}
                            <span className={`text-[10px] font-data-label font-bold px-1.5 py-0.5 rounded-full uppercase border ${
                              item.status === 'mandatory' ? 'text-error border-error bg-error/5' : item.status === 'conditional' ? 'text-amber-700 border-amber-600 bg-amber-600/5' : 'text-primary border-primary bg-primary/5'
                            }`}>
                              {item.status}
                            </span>
                          </h4>
                          <p className="text-caption text-on-surface-variant mt-xs leading-snug">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legal Disclaimer */}
                  <div className="mt-lg p-md bg-surface-container-low rounded-lg border border-outline-variant/50 text-[11px] text-outline italic leading-tight">
                    *Disclaimer: Regulatory data is compiled from CBIC, BIS, CDSCO, and DGFT portals for reference only. Always confirm trade policies and HSN classifications with a certified customs clearing broker before placing import orders.
                  </div>
                </section>
              </div>
            )}

            {/* TAB CONTENT 6: AI VERDICT */}
            {activeTab === 'AI Verdict' && (
              <div className="space-y-lg">
                {/* Large Verdict banner */}
                <section>
                  <div className="relative overflow-hidden rounded-xl p-lg bg-gradient-to-br from-primary-container to-primary text-on-primary-container text-center flex flex-col items-center justify-center gap-md">
                    <div className="relative w-[100px] h-[100px] flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-on-primary-container/20" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" stroke-width="8"></circle>
                        <circle
                          className="text-on-primary-container transition-all duration-1000 ease-out score-ring"
                          cx="50"
                          cy="50"
                          fill="transparent"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray="264"
                          strokeDashoffset={264 - (264 * report.iq_score) / 100}
                        ></circle>
                      </svg>
                      <div className="absolute">
                        <span className="block text-[28px] font-headline-lg text-white font-extrabold leading-none">{report.iq_score}</span>
                        <span className="text-[8px] font-data-label text-white/70 uppercase">Score</span>
                      </div>
                    </div>
                    <div className="w-full">
                      <h2 className="text-[28px] font-headline-lg text-white font-extrabold leading-none mb-xs">{report.verdict} VERDICT</h2>
                      <p className="text-body-lg font-body-lg text-white/95 max-w-[576px] mx-auto leading-relaxed">
                        {report.rationale}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2x2 SWOT Grid */}
                <section className="grid md:grid-cols-2 gap-lg">
                  {/* Strengths */}
                  <div className="p-lg bg-green-50 rounded-xl border border-green-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-green-900 mb-md flex items-center gap-xs">
                        💪 Strengths
                      </h4>
                      <ul className="space-y-sm text-body-md text-green-950">
                        {report.swot.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-xs">
                            <span className="text-green-700">→</span>
                            <span className="leading-snug">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-lg bg-red-50 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-red-900 mb-md flex items-center gap-xs">
                        ⚠️ Weaknesses
                      </h4>
                      <ul className="space-y-sm text-body-md text-red-950">
                        {report.swot.weaknesses.map((wk, idx) => (
                          <li key={idx} className="flex items-start gap-xs">
                            <span className="text-red-700">→</span>
                            <span className="leading-snug">{wk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="p-lg bg-blue-50 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-blue-900 mb-md flex items-center gap-xs">
                        🚀 Opportunities
                      </h4>
                      <ul className="space-y-sm text-body-md text-blue-950">
                        {report.swot.opportunities.map((opp, idx) => (
                          <li key={idx} className="flex items-start gap-xs">
                            <span className="text-blue-700">→</span>
                            <span className="leading-snug">{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Threats */}
                  <div className="p-lg bg-amber-50 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-amber-900 mb-md flex items-center gap-xs">
                        ⚡ Threats
                      </h4>
                      <ul className="space-y-sm text-body-md text-amber-950">
                        {report.swot.threats.map((thr, idx) => (
                          <li key={idx} className="flex items-start gap-xs">
                            <span className="text-amber-700">→</span>
                            <span className="leading-snug">{thr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Suggested Strategy advice */}
                <section className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                  <h3 className="text-headline-md font-headline-md text-primary mb-md">Market Entry Strategy & Sourcing Advice</h3>
                  <div className="p-md bg-surface-container-low rounded-lg border-l-4 border-primary text-body-md text-on-surface leading-relaxed">
                    {report.strategy_advice}
                  </div>
                </section>
              </div>
            )}

          </div>

          {/* FLOATING ACTION BUTTON */}
          <button
            onClick={exportPDF}
            className="fixed bottom-lg right-lg w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-white/10"
            title="Download PDF report"
          >
            <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
            <span className="absolute right-16 bg-inverse-surface text-inverse-on-surface px-sm py-xs rounded opacity-0 group-hover:opacity-100 transition-opacity text-caption font-bold whitespace-nowrap shadow-md pointer-events-none">
              Download PDF Report
            </span>
          </button>

          {/* Footer */}
          <footer className="w-full py-lg px-margin flex flex-col md:flex-row justify-between items-center gap-sm bg-surface-container-highest border-t border-outline-variant text-center max-w-7xl mx-auto left-0 right-0 mt-auto">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-caption font-caption text-on-surface-variant">© 2026 ProductIQ Market Intelligence. All rights reserved.</p>
              <p className="text-caption font-caption text-on-surface-variant">Contact Developer: <a href="mailto:kartikb.work@gmail.com" className="hover:underline text-primary font-semibold">kartikb.work@gmail.com</a></p>
            </div>
            <div className="flex gap-md">
              <a className="text-caption font-caption text-on-surface-variant hover:underline hover:text-primary transition-all" href="#">Terms of Service</a>
              <a className="text-caption font-caption text-on-surface-variant hover:underline hover:text-primary transition-all" href="#">Privacy Policy</a>
              <a className="text-caption font-caption text-on-surface-variant hover:underline hover:text-primary transition-all" href="#">Contact Support</a>
            </div>
          </footer>
        </div>
      )}

    </div>
  );
}
