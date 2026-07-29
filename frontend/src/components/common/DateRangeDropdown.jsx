import React, { useEffect, useMemo, useRef, useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toInputValue(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputValue(v) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatShort(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildPresets() {
  const today = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - DAY_MS);
  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  return [
    { label: "Today", start: today, end: today },
    { label: "Yesterday", start: yesterday, end: yesterday },
    { label: "Last 7 days", start: new Date(today.getTime() - 6 * DAY_MS), end: today },
    { label: "Last 30 days", start: new Date(today.getTime() - 29 * DAY_MS), end: today },
    { label: "This month", start: startOfMonth(today), end: endOfMonth(today) },
    { label: "Last month", start: startOfMonth(lastMonthDate), end: endOfMonth(lastMonthDate) },
  ];
}

function CalendarMonth({ viewDate, setViewDate, start, end, hover, setHover, onPick }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    return arr;
  }, [year, month]);

  const rangeStart = start && end ? (start < end ? start : end) : start;
  const rangeEnd = start && end ? (start < end ? end : start) : (hover && start ? (hover > start ? hover : start) : null);
  const previewStart = start && !end ? (hover && hover < start ? hover : start) : rangeStart;
  const previewEnd = start && !end ? (hover && hover > start ? hover : start) : rangeEnd;

  const isInRange = (d) => {
    if (!d || !previewStart || !previewEnd) return false;
    return d.getTime() >= previewStart.getTime() && d.getTime() <= previewEnd.getTime();
  };
  const isEndpoint = (d) => {
    if (!d) return false;
    return (start && d.getTime() === startOfDay(start).getTime()) || (end && d.getTime() === startOfDay(end).getTime());
  };

  return (
    <div className="calendar-month">
      <div className="calendar-header">
        <button type="button" className="calendar-nav-btn" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
        <span className="calendar-month-label">{viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button type="button" className="calendar-nav-btn" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="calendar-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <span key={i}>{w}</span>)}
      </div>
      <div className="calendar-grid">
        {cells.map((d, i) => (
          <button
            type="button"
            key={i}
            disabled={!d}
            className={`calendar-day${d && isEndpoint(d) ? " range-endpoint" : ""}${d && isInRange(d) ? " in-range" : ""}`}
            onMouseEnter={() => d && setHover(d)}
            onClick={() => d && onPick(d)}
          >
            {d ? d.getDate() : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DateRangeDropdown({ value, onApply }) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(value?.start || null);
  const [draftEnd, setDraftEnd] = useState(value?.end || null);
  const [hover, setHover] = useState(null);
  const [viewDate, setViewDate] = useState(value?.start || new Date());
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setDraftStart(value?.start || null);
      setDraftEnd(value?.end || null);
      setHover(null);
      setViewDate(value?.start || new Date());
    }
  }, [open]);

  const presets = useMemo(buildPresets, []);

  function pickDay(d) {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(d);
      setDraftEnd(null);
    } else if (d < draftStart) {
      setDraftStart(d);
      setDraftEnd(draftStart);
    } else {
      setDraftEnd(d);
    }
  }

  function pickPreset(p) {
    setDraftStart(p.start);
    setDraftEnd(p.end);
    setViewDate(p.start);
  }

  function handleApply() {
    if (draftStart && draftEnd) {
      const s = draftStart < draftEnd ? draftStart : draftEnd;
      const e = draftStart < draftEnd ? draftEnd : draftStart;
      const matchedPreset = presets.find(p => p.start.getTime() === s.getTime() && p.end.getTime() === e.getTime());
      onApply({ start: s, end: e, label: matchedPreset ? matchedPreset.label : `${formatShort(s)} – ${formatShort(e)}` });
    } else if (draftStart) {
      onApply({ start: draftStart, end: draftStart, label: formatShort(draftStart) });
    }
    setOpen(false);
  }

  function handleClear() {
    setDraftStart(null);
    setDraftEnd(null);
    onApply(null);
    setOpen(false);
  }

  return (
    <div className="date-dropdown" ref={rootRef}>
      <button type="button" className="select-field date-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        <span>{value?.label || "Select date"}</span>
      </button>

      {open && (
        <div className="date-dropdown-panel">
          <div className="date-dropdown-presets">
            {presets.map(p => (
              <button
                type="button"
                key={p.label}
                className={`date-preset-btn${draftStart && draftEnd && draftStart.getTime() === p.start.getTime() && draftEnd.getTime() === p.end.getTime() ? " active" : ""}`}
                onClick={() => pickPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="date-dropdown-main">
            <div className="date-manual-inputs">
              <input
                type="date"
                className="input-field date-manual-input"
                value={toInputValue(draftStart)}
                onChange={e => setDraftStart(fromInputValue(e.target.value))}
              />
              <span className="date-manual-sep">to</span>
              <input
                type="date"
                className="input-field date-manual-input"
                value={toInputValue(draftEnd)}
                onChange={e => setDraftEnd(fromInputValue(e.target.value))}
              />
            </div>

            <div onMouseLeave={() => setHover(null)}>
              <CalendarMonth
                viewDate={viewDate}
                setViewDate={setViewDate}
                start={draftStart}
                end={draftEnd}
                hover={hover}
                setHover={setHover}
                onPick={pickDay}
              />
            </div>

            <div className="date-dropdown-footer">
              <button type="button" className="btn btn-ghost" onClick={handleClear}>Clear</button>
              <button type="button" className="btn btn-primary" onClick={handleApply} disabled={!draftStart}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}