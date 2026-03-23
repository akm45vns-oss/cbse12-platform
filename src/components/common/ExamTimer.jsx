import { useState, useEffect } from "react";

export function ExamTimer({ initialSeconds, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const timeString =
    hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isLow = timeLeft > 0 && timeLeft <= 300;
  const isExpired = timeLeft <= 0;

  return (
    <div
      className="no-print"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: isExpired ? "#fee2e2" : isLow ? "#fefce8" : "#f0fdf4",
        border: `1px solid ${isExpired ? "#ef4444" : isLow ? "#facc15" : "#86efac"}`,
        color: isExpired ? "#b91c1c" : isLow ? "#a16207" : "#15803d",
        padding: "6px 14px",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 14,
        boxShadow: isLow ? "0 0 12px rgba(250, 204, 21, 0.3)" : "none",
        transition: "all 0.3s"
      }}
    >
      <span>⏱️</span> {isExpired ? "TIME UP!" : timeString}
    </div>
  );
}
