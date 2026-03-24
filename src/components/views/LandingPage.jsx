export function LandingPage({ onSignUp, theme }) {
  return (
    <div style={{ minHeight: "100vh", background: theme?.isDarkMode ? "#0f172a" : "#f0f9fc", color: theme?.isDarkMode ? "#e2e8f0" : "#1e293b" }}>
      {/* Navigation */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        borderBottom: `1px solid ${theme?.isDarkMode ? "#334155" : "#dbeafe"}`,
        background: theme?.isDarkMode ? "#1e293b" : "white",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "20px", fontWeight: 800, color: "#0891b2" }}>
          🎓 AkmEdu
        </div>
        <button onClick={onSignUp} style={{
          background: "linear-gradient(135deg, #0891b2, #0284c7)",
          color: "white",
          border: "none",
          padding: "10px 24px",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
        }}>
          Sign In / Join Free
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: "80px 32px", textAlign: "center", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 900, marginBottom: 16, letterSpacing: "-0.02em" }}>
          Master CBSE Class 12<br />with Smart Study Tools
        </h1>
        <p style={{ fontSize: "clamp(16px, 3vw, 20px)", color: theme?.isDarkMode ? "#cbd5e1" : "#64748b", marginBottom: 32, maxWidth: "600px", margin: "0 auto 32px" }}>
          AI-powered notes, unlimited quizzes, sample papers & progress tracking. Everything you need to ace your board exams.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onSignUp} style={{
            background: "linear-gradient(135deg, #0891b2, #0284c7)",
            color: "white",
            border: "none",
            padding: "16px 40px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            transition: "transform 0.2s",
          }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Start Free Today →
          </button>
          <button style={{
            background: theme?.isDarkMode ? "#334155" : "#dbeafe",
            color: theme?.isDarkMode ? "#06b6d4" : "#0369a1",
            border: "none",
            padding: "16px 40px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            transition: "transform 0.2s",
          }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Watch Demo
          </button>
        </div>

        {/* Hero Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 24, marginTop: 60 }}>
          {[
            { stat: "12", label: "Subjects" },
            { stat: "500+", label: "Chapters" },
            { stat: "100% AI", label: "Original Content" },
            { stat: "79% Faster", label: "Load Time" },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0891b2", marginBottom: 8 }}>{stat}</div>
              <div style={{ fontSize: 14, color: theme?.isDarkMode ? "#cbd5e1" : "#64748b" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 32px", background: theme?.isDarkMode ? "#1e293b" : "white", marginTop: 40 }}>
        <h2 style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 900, textAlign: "center", marginBottom: 60, letterSpacing: "-0.02em" }}>
          Everything You Need to Excel
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, maxWidth: "1200px", margin: "0 auto" }}>
          {[
            { emoji: "📚", title: "AI Study Notes", desc: "Comprehensive, original notes for every chapter covering all concepts, formulas, and real-world applications." },
            { emoji: "🧠", title: "Smart Quizzes", desc: "50 AI-generated questions per chapter with detailed explanations. Track your progress and identify weak areas." },
            { emoji: "📄", title: "Sample Papers", desc: "Full-length practice papers with marking schemes and model answers. Prepare exactly like real exams." },
            { emoji: "📊", title: "Progress Tracking", desc: "Visual dashboards showing your study time, completion rate, and performance across all subjects." },
            { emoji: "🌙", title: "Dark Mode", desc: "Easy on the eyes during late-night study sessions. Eye-care design for long study hours." },
            { emoji: "💬", title: "Community Q&A", desc: "Ask doubts, share notes, and learn from other students. Growing community of motivated learners." },
          ].map(({ emoji, title, desc }) => (
            <div key={title} style={{
              padding: 24,
              borderRadius: 16,
              background: theme?.isDarkMode ? "#0f172a" : "#f8fafc",
              border: `1px solid ${theme?.isDarkMode ? "#334155" : "#e2e8f0"}`,
              transition: "all 0.3s",
            }} onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = `0 12px 24px ${theme?.isDarkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`;
            }} onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: theme?.isDarkMode ? "#cbd5e1" : "#64748b", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: "80px 32px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 900, textAlign: "center", marginBottom: 60 }}>
          100% Free. No Hidden Charges.
        </h2>
        <div style={{
          padding: 40,
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(8, 145, 178, 0.1), rgba(2, 132, 199, 0.1))",
          border: "2px solid #0891b2",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#0891b2", marginBottom: 8 }}>₹0</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Forever Free Access</p>
          <p style={{ fontSize: 14, color: theme?.isDarkMode ? "#cbd5e1" : "#64748b", marginBottom: 24 }}>
            All features, all content, completely free. No premium tiers, no paywalls, no surprises.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, margin: "24px 0" }}>
            {["✅ Unlimited Notes", "✅ Unlimited Quizzes", "✅ Sample Papers", "✅ Progress Tracking", "✅ Q&A Forum", "✅ Dark Mode"].map(feature => (
              <div key={feature} style={{ fontSize: 14, fontWeight: 600 }}>{feature}</div>
            ))}
          </div>
          <button onClick={onSignUp} style={{
            background: "linear-gradient(135deg, #0891b2, #0284c7)",
            color: "white",
            border: "none",
            padding: "16px 40px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            marginTop: 24,
          }}>
            Join Our Community Free
          </button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ padding: "80px 32px", background: theme?.isDarkMode ? "#1e293b" : "white", marginTop: 40 }}>
        <h2 style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 900, textAlign: "center", marginBottom: 60 }}>
          What Students Say
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, maxWidth: "1200px", margin: "0 auto" }}>
          {[
            { name: "Priya S.", class: "Class 12, Delhi", text: "The notes are so well-organized! I understood concepts way better than from my textbook.", rating: 5 },
            { name: "Arjun M.", class: "Class 12, Mumbai", text: "The quizzes helped me identify my weak areas. Improved my score by 25% in just 2 weeks!", rating: 5 },
            { name: "Anaya K.", class: "Class 12, Bangalore", text: "Dark mode is perfect for late-night studying. The platform is so intuitive and easy to use.", rating: 5 },
            { name: "Rohan P.", class: "Class 12, Pune", text: "Sample papers are exactly like board exams. Great for last-minute preparation. Highly recommend!", rating: 5 },
          ].map(({ name, class: userClass, text, rating }) => (
            <div key={name} style={{
              padding: 24,
              borderRadius: 16,
              background: theme?.isDarkMode ? "#0f172a" : "#f8fafc",
              border: `1px solid ${theme?.isDarkMode ? "#334155" : "#e2e8f0"}`,
            }}>
              <div style={{ display: "flex", marginBottom: 12, gap: 4 }}>
                {[...Array(rating)].map((_, i) => <span key={i} style={{ fontSize: 16 }}>⭐</span>)}
              </div>
              <p style={{ fontSize: 14, color: theme?.isDarkMode ? "#cbd5e1" : "#64748b", marginBottom: 16, fontStyle: "italic" }}>"{text}"</p>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 12, color: theme?.isDarkMode ? "#94a3b8" : "#94a3b8" }}>{userClass}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "80px 32px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 900, marginBottom: 24 }}>
          Ready to Ace Your Boards?
        </h2>
        <p style={{ fontSize: 18, color: theme?.isDarkMode ? "#cbd5e1" : "#64748b", marginBottom: 32 }}>
          Join thousands of CBSE Class 12 students who are already using AkmEdu to prepare better, faster.
        </p>
        <button onClick={onSignUp} style={{
          background: "linear-gradient(135deg, #0891b2, #0284c7)",
          color: "white",
          border: "none",
          padding: "18px 48px",
          borderRadius: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 18,
          transition: "transform 0.2s",
        }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          Get Started Free →
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 60,
        background: theme?.isDarkMode ? "#0f172a" : "#064e78",
        color: "white",
        padding: "40px 32px",
        textAlign: "center",
        fontSize: 14,
        borderTop: `1px solid ${theme?.isDarkMode ? "#334155" : "#9d174d"}`,
      }}>
        <p style={{ marginBottom: 12 }}>Built with ❤️ for CBSE Class 12 Students</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 12, marginBottom: 12 }}>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>Privacy</a>
          <span>•</span>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>Terms</a>
          <span>•</span>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>Contact</a>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 12 }}>© 2026 AkmEdu. All rights reserved.</p>
      </footer>
    </div>
  );
}
