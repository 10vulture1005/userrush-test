import { useState, useEffect, useCallback, useRef } from "react";

const GAME_DURATION = 30; // seconds
const TARGET_SPAWN_RATE = 400; // ms (Faster spawn)
const TARGET_LIFESPAN = 1200; // ms (Faster turnover)

export default function Game() {
  const [gameState, setGameState] = useState("start"); // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("userRushHighScore") || "0", 10);
  });
  const [targets, setTargets] = useState([]);

  const gameLoopRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const timeLeftRef = useRef(GAME_DURATION);

  // Initialize and persist high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("userRushHighScore", score.toString());
    }
  }, [score, highScore]);

  const spawnTarget = useCallback(() => {
    const createTarget = () => {
      const id = Math.random().toString(36).substring(2, 9);
      const x = Math.random() * 80 + 10; // 10% to 90%
      const y = Math.random() * 80 + 10; // 10% to 90%
      const size = Math.random() * 30 + 50; // 50px to 80px (Standardized size for intensity)

      const newTarget = { id, x, y, size, createdAt: Date.now() };
      setTargets((prev) => [...prev, newTarget]);

      // Auto-remove target after lifespan
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      }, TARGET_LIFESPAN);
    };

    // Always spawn one
    createTarget();

    // 30% chance to spawn a second one simultaneously for "Rush" effect
    if (Math.random() < 0.3) {
      setTimeout(createTarget, 100);
    }
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    setTargets([]);
    setGameState("playing");

    // Game timer
    gameLoopRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        endGame();
      }
    }, 1000);

    // Spawn loop
    spawnTimerRef.current = setInterval(spawnTarget, TARGET_SPAWN_RATE);
  };

  const endGame = () => {
    clearInterval(gameLoopRef.current);
    clearInterval(spawnTimerRef.current);
    setGameState("gameover");
  };

  const handleTargetClick = (id) => {
    setScore((prev) => prev + 10);
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(spawnTimerRef.current);
    };
  }, []);

  const containerStyle = {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "white",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    position: "relative",
    userSelect: "none",
  };

  const cardStyle = {
    padding: "48px",
    borderRadius: "32px",
    background: "rgba(30, 41, 59, 0.5)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
    maxWidth: "400px",
    width: "90%",
    zIndex: 10,
  };

  const buttonStyle = {
    marginTop: "24px",
    padding: "16px 32px",
    fontSize: "18px",
    fontWeight: "600",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
  };

  return (
    <div style={containerStyle}>
      {/* HUD */}
      {gameState === "playing" && (
        <div style={{
          position: "absolute",
          top: "40px",
          left: "0",
          right: "0",
          display: "flex",
          justifyContent: "space-around",
          width: "100%",
          padding: "0 20px",
          fontSize: "24px",
          fontWeight: "700",
          pointerEvents: "none",
          zIndex: 5,
        }}>
          <div>SCORE: <span style={{ color: "#60a5fa" }}>{score}</span></div>
          <div style={{ color: timeLeft < 10 ? "#ef4444" : "white" }}>
            TIME: {timeLeft}s
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === "start" && (
        <div style={cardStyle}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚀</div>
          <h1 style={{ fontSize: "40px", margin: "0 0 8px", fontWeight: "800", letterSpacing: "-1px" }}>
            USER RUSH
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
            Catch as many users as you can before the time runs out!
          </p>
          {highScore > 0 && (
            <div style={{ marginBottom: "24px", fontSize: "14px", color: "#60a5fa", fontWeight: "600" }}>
              HIGH SCORE: {highScore}
            </div>
          )}
          <button
            style={buttonStyle}
            onClick={startGame}
            onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
          >
            START MISSION
          </button>
        </div>
      )}

      {/* Game Canvas */}
      {gameState === "playing" && (
        <div style={{ width: "100%", height: "100%", position: "absolute", overflow: "hidden" }}>
          {targets.map((target) => (
            <div
              key={target.id}
              onClick={() => handleTargetClick(target.id)}
              style={{
                position: "absolute",
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size}px`,
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.2)",
                border: "2px solid #3b82f6",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                transition: "transform 0.1s, opacity 0.5s",
                animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
              }}
            >
              <div style={{ fontSize: `${target.size * 0.5}px` }}>👤</div>
            </div>
          ))}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "gameover" && (
        <div style={cardStyle}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏆</div>
          <h1 style={{ fontSize: "32px", margin: "0 0 8px", fontWeight: "800" }}>
            MISSION OVER
          </h1>
          <div style={{ fontSize: "48px", fontWeight: "900", color: "#3b82f6", margin: "16px 0" }}>
            {score}
          </div>
          <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
            Points Gathered
          </p>
          {score >= highScore && score > 0 && (
            <div style={{ marginBottom: "24px", color: "#10b981", fontWeight: "700" }}>
              NEW HIGH SCORE!
            </div>
          )}
          <button
            style={buttonStyle}
            onClick={startGame}
            onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          * {
            box-sizing: border-box;
            user-select: none;
            -webkit-user-drag: none;
          }
          body {
            margin: 0;
            background: #020617;
          }
        `}
      </style>
    </div>
  );
}
