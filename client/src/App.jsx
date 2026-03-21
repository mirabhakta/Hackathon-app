import { useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Dashboard from "./components/Dashboard.jsx";
import OnboardingFlow from "./components/OnboardingFlow.jsx";
import BreakMode from "./components/BreakMode.jsx";
import MildToast from "./components/MildToast.jsx";
import { ThemeContext } from "./context/ThemeContext.jsx";
import { STORAGE_KEYS } from "./lib/constants.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { average, getBreakMinutes, getSetupAvailability, normalizeHistory } from "./lib/wellbeing.js";

function createSession() {
  return {
    startedAt: Date.now(),
    elapsedSeconds: 0,
    taskInput: "",
    activeTask: null,
    completedTasks: [],
    actions: 0,
    moodScore: 3
  };
}

function getAdaptiveBurnRate(session, baseline) {
  if (!baseline || !baseline.avgTaskSeconds || !baseline.avgSessionSeconds) {
    return 0;
  }
  const currentAvgTask = average(session.completedTasks.map((task) => task.durationSeconds)) || baseline.avgTaskSeconds;
  const paceRatio = baseline.avgTaskSeconds / Math.max(currentAvgTask, 1);
  const durationRatio = session.elapsedSeconds / Math.max(baseline.avgSessionSeconds, 1);

  let score = 0;
  if (paceRatio < 0.7) {
    score = Math.max(score, 0.45 + (0.7 - paceRatio) * 0.6);
  }
  if (durationRatio > 1.4) {
    score = Math.max(score, 0.45 + (durationRatio - 1.4) * 0.35);
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

export default function App() {
  const { theme, setTheme, mode, toggleMode, colors } = useContext(ThemeContext);
  const [profile, setProfile] = useLocalStorage(STORAGE_KEYS.profile, null);
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.history, []);
  const [sessions, setSessions] = useLocalStorage(STORAGE_KEYS.sessions, []);
  const [fatigueOptIn, setFatigueOptIn] = useLocalStorage(STORAGE_KEYS.fatigueOptIn, false);
  const [breakLogs, setBreakLogs] = useLocalStorage(STORAGE_KEYS.breakLogs, []);
  const [session, setSession] = useState(createSession);
  const [apiBurnRate, setApiBurnRate] = useState(0.18);
  const [burnRate, setBurnRate] = useState(0.18);
  const [breakOpen, setBreakOpen] = useState(false);
  const [banner, setBanner] = useState("");
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [escalateOnNext, setEscalateOnNext] = useState(false);
  const [fatigueStatus, setFatigueStatus] = useState({ fatigueDetected: false, connected: false });
  const [breakCredit, setBreakCredit] = useState(0);
  const [breakContext, setBreakContext] = useState({ noSnooze: false, reason: "manual", beforeBurnRate: 0 });
  const [notificationState, setNotificationState] = useState(null);
  const [lastApiUpdatedAt, setLastApiUpdatedAt] = useState(0);
  const apiRefreshRef = useRef(0);
  const activeToastIdRef = useRef(null);
  const escalateOnNextRef = useRef(false);

  const baseline = useMemo(() => {
    if (sessions.length < 3) {
      return null;
    }
    const seed = sessions.slice(0, 3);
    return {
      avgTaskSeconds: average(seed.map((item) => item.avgTaskSeconds || 0)),
      avgSessionSeconds: average(seed.map((item) => item.durationSeconds || 0))
    };
  }, [sessions]);

  const adaptiveBurnRate = useMemo(() => getAdaptiveBurnRate(session, baseline), [session, baseline]);
  const effectiveBurnRate = Math.max(apiBurnRate, adaptiveBurnRate, fatigueStatus.fatigueDetected ? 0.6 : 0);
  const breakMinutes = useMemo(
    () => getBreakMinutes(effectiveBurnRate, fatigueStatus.fatigueDetected),
    [effectiveBurnRate, fatigueStatus.fatigueDetected]
  );

  function dismissToast() {
    if (activeToastIdRef.current) {
      toast.dismiss(activeToastIdRef.current);
      activeToastIdRef.current = null;
    }
  }

  function clearAllNotifications() {
    dismissToast();
    setBanner("");
    setNotificationState(null);
  }

  function triggerFullBreakMode({ noSnooze, reason }) {
    dismissToast();
    setBanner(noSnooze ? "Wellby is stepping in - your burn rate is high. Let's take a proper break." : "You've snoozed twice - Wellby thinks it's really time now. Let's recharge!");
    setNotificationState("high");
    setBreakContext({ noSnooze, reason, beforeBurnRate: effectiveBurnRate });
    setBreakOpen(true);
  }

  function handleSnooze() {
    const newCount = snoozeCount + 1;
    setSnoozeCount(newCount);
    dismissToast();
    if (newCount >= 2) {
      setEscalateOnNext(true);
      escalateOnNextRef.current = true;
      setBanner("One more check-in and Wellby will ask for a real break.");
    }
  }

  function showMildToast() {
    if (activeToastIdRef.current) {
      return;
    }
    dismissToast();
    setNotificationState("mild");
    const toastId = toast.custom(
      <MildToast
        burnRate={effectiveBurnRate}
        snoozeCount={snoozeCount}
        onDismiss={() => {
          dismissToast();
          setNotificationState(null);
        }}
        onSnooze={handleSnooze}
        onTakeBreak={() => {
          dismissToast();
          triggerFullBreakMode({ noSnooze: false, reason: "mild-escalation" });
        }}
      />,
      { duration: Infinity }
    );
    activeToastIdRef.current = toastId;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setSession((current) => ({
        ...current,
        elapsedSeconds: Math.floor((Date.now() - current.startedAt) / 1000)
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const averageTaskSeconds =
      average(session.completedTasks.map((task) => task.durationSeconds)) || baseline?.avgTaskSeconds || 2400;
    const burnoutPayload = {
      mental_fatigue_score: Number(
        Math.min(
          10,
          Math.max(
            0,
            (6 - session.moodScore) * 1.4 +
              Math.min(4, session.elapsedSeconds / 3600) +
              Math.max(0, (averageTaskSeconds - (baseline?.avgTaskSeconds || averageTaskSeconds)) / 600)
          )
        ).toFixed(2)
      ),
      hours_worked: Number((session.elapsedSeconds / 3600).toFixed(2)),
      wfh_setup_available: getSetupAvailability(profile.setup),
      designation: profile.seniority,
      resource_allocation: Number(
        Math.min(10, Math.max(1, 4 + session.completedTasks.length + session.actions / 12)).toFixed(2)
      )
    };

    const requestId = Date.now();
    apiRefreshRef.current = requestId;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch("/api/burnout/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(burnoutPayload),
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => {
        if (apiRefreshRef.current !== requestId) {
          return;
        }
        const adjusted = Math.max(0, Number((Number(data.burn_rate ?? 0) - breakCredit).toFixed(2)));
        setApiBurnRate(adjusted);
        setBurnRate(Math.max(adjusted, adaptiveBurnRate));
        if (breakCredit > 0) {
          setBreakCredit(0);
        }
        setLastApiUpdatedAt(Date.now());
        setHistory((current) =>
          normalizeHistory([
            ...current.filter((entry) => entry.sessionId !== session.startedAt),
            { sessionId: session.startedAt, burnRate: Math.max(adjusted, adaptiveBurnRate), timestamp: new Date().toISOString() }
          ])
        );
      })
      .catch(() => {
        return;
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [
    profile,
    session.elapsedSeconds,
    session.completedTasks,
    session.actions,
    session.moodScore,
    baseline,
    breakCredit,
    setHistory,
    session.startedAt,
    adaptiveBurnRate
  ]);

  useEffect(() => {
    setBurnRate(Math.max(apiBurnRate, adaptiveBurnRate, fatigueStatus.fatigueDetected ? 0.6 : 0));
  }, [apiBurnRate, adaptiveBurnRate, fatigueStatus.fatigueDetected]);

  useEffect(() => {
    if (!fatigueOptIn || !profile) {
      return;
    }

    const poll = () => {
      fetch("/api/fatigue/status")
        .then((response) => response.json())
        .then((data) => setFatigueStatus(data))
        .catch(() => setFatigueStatus({ fatigueDetected: false, connected: false }));
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [fatigueOptIn, profile]);

  useEffect(() => {
    if (!profile || breakOpen) {
      return;
    }

    if (effectiveBurnRate < 0.3) {
      clearAllNotifications();
      return;
    }

    if (effectiveBurnRate >= 0.6 || fatigueStatus.fatigueDetected) {
      triggerFullBreakMode({ noSnooze: true, reason: "high" });
      return;
    }

    if (escalateOnNextRef.current && lastApiUpdatedAt > 0) {
      triggerFullBreakMode({ noSnooze: false, reason: "mild-escalation" });
      return;
    }

    if (notificationState !== "mild") {
      showMildToast();
    }
  }, [effectiveBurnRate, fatigueStatus.fatigueDetected, profile, breakOpen, notificationState, lastApiUpdatedAt]);

  function completeCurrentSession() {
    const taskDurations = session.completedTasks.map((task) => task.durationSeconds);
    const summary = {
      id: session.startedAt,
      durationSeconds: session.elapsedSeconds,
      avgTaskSeconds: taskDurations.length ? average(taskDurations) : session.elapsedSeconds || 0,
      completedTasks: session.completedTasks.length,
      breakTakenAt: new Date().toISOString()
    };
    setSessions((current) => [...current, summary]);
    setBreakLogs((current) => [...current, { timestamp: summary.breakTakenAt, durationMinutes: breakMinutes }]);
    setBreakCredit(0.1);
    setApiBurnRate((current) => Math.max(0, Number((current - 0.1).toFixed(2))));
    setBurnRate((current) => Math.max(0, Number((current - 0.1).toFixed(2))));
    setSnoozeCount(0);
    setEscalateOnNext(false);
    escalateOnNextRef.current = false;
    clearAllNotifications();
    setSession(createSession());
  }

  function handleTaskStart() {
    if (!session.taskInput.trim()) {
      return;
    }
    setSession((current) => ({
      ...current,
      actions: current.actions + 1,
      activeTask: {
        id: Date.now(),
        name: current.taskInput.trim(),
        startedAt: Date.now()
      },
      taskInput: ""
    }));
  }

  function handleTaskComplete() {
    setSession((current) => {
      if (!current.activeTask) {
        return current;
      }
      return {
        ...current,
        actions: current.actions + 1,
        activeTask: null,
        completedTasks: [
          ...current.completedTasks,
          {
            ...current.activeTask,
            completedAt: Date.now(),
            durationSeconds: Math.max(30, Math.floor((Date.now() - current.activeTask.startedAt) / 1000))
          }
        ]
      };
    });
  }

  if (!profile) {
    return <OnboardingFlow onComplete={setProfile} />;
  }

  return (
    <>
      <Dashboard
        profile={profile}
        session={session}
        burnRate={effectiveBurnRate}
        history={history}
        statusText={
          effectiveBurnRate < 0.3
            ? "Your pace looks sustainable right now."
            : effectiveBurnRate < 0.6
              ? "Things are starting to stack up. A shorter pause could help."
              : "Your system is asking for a real pause before work gets heavier."
        }
        breakMinutes={breakMinutes}
        fatigueOptIn={fatigueOptIn}
        onTaskInputChange={(value) => setSession((current) => ({ ...current, taskInput: value }))}
        onTaskStart={handleTaskStart}
        onTaskComplete={handleTaskComplete}
        onMoodSelect={(score) => setSession((current) => ({ ...current, moodScore: score }))}
        mode={mode}
        onToggleMode={toggleMode}
        activeTheme={theme}
        onSetTheme={setTheme}
        onToggleFatigue={() => setFatigueOptIn((current) => !current)}
        onStartBreak={() => triggerFullBreakMode({ noSnooze: false, reason: "manual" })}
        banner={banner}
        notificationState={notificationState}
      />
      {breakOpen ? (
        <BreakMode
          initialGame={profile.favoriteGame}
          noSnooze={breakContext.noSnooze}
          reason={breakContext.reason}
          beforeBurnRate={breakContext.beforeBurnRate}
          afterBurnRate={Math.max(0, Number((effectiveBurnRate - 0.1).toFixed(2)))}
          onClose={() => {
            setBreakOpen(false);
            completeCurrentSession();
          }}
        />
      ) : null}
      <footer
        className="fixed bottom-0 left-0 right-0 px-4 py-3 text-center text-xs font-semibold"
        style={{ background: colors.sidebarBg, color: colors.wordmark }}
      >
        Wellby is a wellness companion, not a substitute for professional mental health care.
      </footer>
    </>
  );
}
