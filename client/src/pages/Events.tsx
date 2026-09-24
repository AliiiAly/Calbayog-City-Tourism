import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Button,
  Modal,
} from "react-bootstrap";
import { useLocation } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  MapPin,
  Star,
  Ticket,
} from "lucide-react";

import { getEvents } from "../services/api";
import {
  subscribeToEvents,
  unsubscribeAll,
} from "../services/supabase";

import { Event } from "../types";

/* =========================================================
   FONTS
========================================================= */

const styles = `
@font-face {
  font-family: "Barabara";
  src: url("/fonts/BARABARA-final.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* =========================================================
   PAGE
========================================================= */

.events-page {
  min-height: 100vh;
  background: #ffffff;
  color: #171a18;
}

/* =========================================================
   HEADER
========================================================= */

.events-header {
  width: 100%;
  background: #ffffff;
  padding: 30px 20px 18px;
}

.events-header-inner {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.events-title {
  margin: 0;
  font-family: "Barabara", sans-serif !important;
  font-size: clamp(1.65rem, 2.8vw, 2.4rem);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0.015em;
  color: #1a7a4a;
}

.events-subtitle {
  max-width: 620px;
  margin: 6px 0 0;
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  font-size: 0.81rem;
  line-height: 1.55;
  font-weight: 500;
  color: #737b76;
}

/* =========================================================
   CONTAINER
========================================================= */

.events-container {
  width: 100%;
  max-width: 1240px;
  padding: 0 20px 60px;
  margin: 0 auto;
}

/* =========================================================
   CATEGORY PILLS
========================================================= */

.events-category-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  margin: 0 0 5px;
  padding: 0 0 14px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.events-category-pills::-webkit-scrollbar {
  display: none;
}

.events-category-pill {
  --pill-color: #1a7a4a;
  --pill-background: #eef8f2;

  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 39px;
  padding: 8px 15px;

  border: 1px solid #e3e7e4;
  border-radius: 999px;

  background: #ffffff;
  color: #68716c;

  font-family: "Nunito", "Segoe UI", sans-serif;
  font-size: 0.74rem;
  font-weight: 800;

  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  white-space: nowrap;
}

.events-category-pill:hover {
  color: var(--pill-color);
  border-color: var(--pill-color);
  background: var(--pill-background);
  transform: translateY(-1px);
}

.events-category-pill-active {
  color: var(--pill-color);
  border-color: var(--pill-color);
  background: var(--pill-background);
  box-shadow: 0 5px 16px rgba(20, 30, 24, 0.07);
}

/* =========================================================
   FILTER AREA
========================================================= */

.events-filter-section {
  margin: 3px 0 25px;
}

.events-filter-label {
  margin-bottom: 8px;
  padding-left: 2px;

  font-family: "Nunito", sans-serif;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #949c97;
}

.events-filter-pills {
  display: flex;
  align-items: center;
  gap: 7px;
  overflow-x: auto;
  padding: 2px 1px 5px;

  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.events-filter-pills::-webkit-scrollbar {
  display: none;
}

.events-filter-pill {
  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  min-height: 35px;
  padding: 7px 12px;

  border: 1px solid #e5e9e6;
  border-radius: 999px;

  background: #ffffff;
  color: #7a837e;

  font-family: "Nunito", sans-serif;
  font-size: 0.69rem;
  font-weight: 800;

  cursor: pointer;

  transition:
    all 0.2s ease;

  white-space: nowrap;
}

.events-filter-pill:hover {
  border-color: var(--filter-color);
  background: var(--filter-background);
  color: var(--filter-color);
}

.events-filter-pill-active {
  border-color: var(--filter-color);
  background: var(--filter-background);
  color: var(--filter-color);
}

/* =========================================================
   CALENDAR
========================================================= */

.events-calendar-wrapper {
  margin: 3px 0 25px;
}

.events-calendar {
  width: 100%;
  padding: 17px;

  border: 1px solid #edf0ed;
  border-radius: 18px;

  background: #ffffff;

  box-shadow:
    0 5px 20px rgba(20, 30, 24, 0.045);
}

.events-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 14px;
}

.events-calendar-month {
  font-family: "Poppins", sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: #252b27;
}

.events-calendar-nav {
  width: 32px;
  height: 32px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: 1px solid #e5e9e6;
  border-radius: 9px;

  background: #ffffff;
  color: #68716c;

  cursor: pointer;

  transition: all 0.2s ease;
}

.events-calendar-nav:hover {
  border-color: #1a7a4a;
  background: #eef8f2;
  color: #1a7a4a;
}

.events-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;

  margin-bottom: 6px;
}

.events-calendar-weekday {
  text-align: center;

  font-family: "Nunito", sans-serif;
  font-size: 0.61rem;
  font-weight: 800;

  color: #949c97;
}

.events-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.events-calendar-day-empty {
  aspect-ratio: 1;
}

.events-calendar-day {
  position: relative;

  aspect-ratio: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: 1px solid transparent;
  border-radius: 9px;

  background: #f8faf9;
  color: #252b27;

  font-family: "Nunito", sans-serif;
  font-size: 0.7rem;
  font-weight: 700;

  cursor: pointer;

  transition: all 0.2s ease;
}

.events-calendar-day:hover {
  border-color: #1a7a4a;
  background: #eef8f2;
}

.events-calendar-day-today {
  background: #eef8f2;
  color: #1a7a4a;
}

.events-calendar-day-selected {
  border-color: #1a7a4a;
  background: #1a7a4a;
  color: #ffffff;
}

.events-calendar-dots {
  position: absolute;
  bottom: 4px;

  display: flex;
  gap: 2px;
}

.events-calendar-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #e5a526;
}

.events-calendar-day-selected .events-calendar-dot {
  background: #ffffff;
}

/* =========================================================
   RESULTS BAR
========================================================= */

.events-results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;
  flex-wrap: wrap;

  margin-bottom: 27px;
  padding: 11px 2px;

  border-top: 1px solid #f0f2f0;
  border-bottom: 1px solid #f0f2f0;
}

.events-results-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.events-results-icon {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: #eef8f2;
  color: #1a7a4a;
}

.events-results-label {
  font-family: "Nunito", sans-serif;
  font-size: 0.64rem;
  color: #8b938e;
  line-height: 1.2;
}

.events-results-count {
  margin-top: 2px;

  font-family: "Poppins", sans-serif;
  font-size: 0.74rem;
  font-weight: 700;

  color: #252b27;
}

.events-results-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.events-results-category {
  font-family: "Nunito", sans-serif;
  font-size: 0.69rem;
  font-weight: 700;
  color: #858d88;
}

.events-clear-button {
  border-radius: 999px !important;
  padding: 5px 11px !important;

  font-family: "Nunito", sans-serif;
  font-size: 0.66rem !important;
  font-weight: 800 !important;
}

/* =========================================================
   EVENT GRID
========================================================= */

.events-grid {
  row-gap: 46px !important;
  margin-left: -12px;
  margin-right: -12px;
}

.event-col {
  padding-left: 12px;
  padding-right: 12px;

  display: flex;
}

/* =========================================================
   EVENT CARD
========================================================= */

.event-card {
  width: 100%;
  height: 100%;

  border: none !important;
  border-radius: 0 !important;

  background: transparent !important;
  box-shadow: none !important;

  overflow: visible;

  cursor: pointer;
}

.event-image-wrap {
  position: relative;

  width: 100%;

  aspect-ratio: 4 / 5;

  overflow: hidden;

  border-radius: 18px;

  background: #f2f7f4;

  box-shadow:
    0 7px 22px rgba(20, 30, 24, 0.06);

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.event-card:hover .event-image-wrap {
  transform: translateY(-3px);

  box-shadow:
    0 13px 30px rgba(20, 30, 24, 0.11);
}

.event-image {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: cover;

  transition:
    transform 0.45s ease;
}

.event-card:hover .event-image {
  transform: scale(1.035);
}

.event-image-placeholder {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 2.5rem;
}

.event-image-overlay {
  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;

  height: 95px;

  background:
    linear-gradient(
      to top,
      rgba(0, 0, 0, 0.45),
      transparent
    );

  pointer-events: none;
}

/* =========================================================
   IMAGE BADGES
========================================================= */

.event-category-badge {
  position: absolute;

  top: 11px;
  left: 11px;

  display: inline-flex;
  align-items: center;
  gap: 5px;

  max-width: 70%;

  padding: 5px 9px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.95);

  font-family: "Nunito", sans-serif;
  font-size: 0.61rem;
  font-weight: 800;

  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1);

  backdrop-filter: blur(6px);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-featured-badge {
  position: absolute;

  top: 11px;
  right: 11px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  padding: 5px 9px;

  border-radius: 999px;

  background: rgba(255, 248, 230, 0.96);
  color: #a86400;

  font-family: "Nunito", sans-serif;
  font-size: 0.61rem;
  font-weight: 800;

  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-view-overlay {
  position: absolute;

  right: 12px;
  bottom: 11px;

  display: inline-flex;
  align-items: center;
  gap: 3px;

  color: #ffffff;

  font-family: "Nunito", sans-serif;
  font-size: 0.62rem;
  font-weight: 800;

  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.35);
}

/* =========================================================
   CARD BODY
========================================================= */

.event-card-body {
  padding: 13px 2px 0 !important;
}

.event-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 8px;
}

.event-name {
  margin: 0 !important;

  color: #171b18 !important;

  font-family:
    "Poppins",
    "Nunito",
    sans-serif !important;

  font-size: 0.91rem !important;
  line-height: 1.3 !important;

  font-weight: 700 !important;

  letter-spacing: -0.012em;
}

.event-date {
  display: flex;
  align-items: flex-start;
  gap: 5px;

  margin-top: 5px;

  color: #747d77;

  font-family: "Nunito", sans-serif;
  font-size: 0.67rem;
  line-height: 1.4;

  font-weight: 600;
}

.event-location {
  display: flex;
  align-items: flex-start;
  gap: 5px;

  margin-top: 5px;

  color: #747d77;

  font-family: "Nunito", sans-serif;
  font-size: 0.67rem;
  line-height: 1.4;

  font-weight: 600;
}

.event-location-text {
  display: -webkit-box;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;
}

.event-description {
  margin: 7px 0 0;

  color: #707973;

  font-family: "Nunito", sans-serif;
  font-size: 0.7rem;
  line-height: 1.5;

  font-weight: 500;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;
}

.event-category-label {
  display: block;

  margin-top: 8px;

  font-family: "Nunito", sans-serif;
  font-size: 0.63rem;

  font-weight: 800;

  letter-spacing: 0.045em;
  text-transform: uppercase;
}

/* =========================================================
   CARD BOTTOM
========================================================= */

.event-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 8px;

  margin-top: 10px;
  padding-top: 10px;

  border-top: 1px solid #f0f2f0;
}

.event-price {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  min-width: 0;

  font-family: "Nunito", sans-serif;
  font-size: 0.62rem;
  font-weight: 800;
}

.event-details-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;

  color: #171b18;

  font-family: "Nunito", sans-serif;
  font-size: 0.62rem;
  font-weight: 800;

  white-space: nowrap;
}

/* =========================================================
   LOADING
========================================================= */

.events-loading {
  min-height: 360px;

  display: flex;
  align-items: center;
  justify-content: center;

  text-align: center;
}

.events-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.events-loading-icon {
  width: 50px;
  height: 50px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 12px;

  border-radius: 15px;

  background: #eef8f2;
  color: #1a7a4a;
}

.events-loading-title {
  font-family: "Poppins", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: #252b27;
}

.events-loading-text {
  margin: 4px 0 0;

  font-family: "Nunito", sans-serif;
  font-size: 0.68rem;

  color: #8b938e;
}

/* =========================================================
   EMPTY
========================================================= */

.events-empty {
  padding: 65px 20px;

  text-align: center;

  border: 1px solid #edf1ee;
  border-radius: 20px;

  background: #fafcfb;
}

.events-empty-icon {
  width: 68px;
  height: 68px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin: 0 auto 14px;

  border-radius: 20px;

  background: #eef8f2;
  color: #1a7a4a;
}

.events-empty-title {
  margin: 0;

  font-family: "Poppins", sans-serif;
  font-size: 1rem;
  font-weight: 700;

  color: #252b27;
}

.events-empty-text {
  max-width: 390px;

  margin: 7px auto 18px;

  font-family: "Nunito", sans-serif;
  font-size: 0.76rem;
  line-height: 1.5;

  color: #7b857f;
}

/* =========================================================
   MODAL
========================================================= */

.events-modal-image {
  width: 100%;

  height: clamp(
    190px,
    35vw,
    320px
  );

  object-fit: cover;

  border-radius: 15px;

  margin-bottom: 18px;
}

.events-modal-title {
  font-family:
    "Poppins",
    "Nunito",
    sans-serif;

  font-size: 1.2rem;
  font-weight: 700;

  color: #171b18;
}

.events-modal-details {
  padding: 14px 16px;

  margin-bottom: 18px;

  border: 1px solid #edf0ed;
  border-radius: 14px;

  background: #f8faf9;
}

.events-modal-detail {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  margin-bottom: 9px;

  font-family: "Nunito", sans-serif;
  font-size: 0.78rem;
  line-height: 1.45;

  color: #5f6863;
}

.events-modal-detail:last-child {
  margin-bottom: 0;
}

.events-modal-section-title {
  margin-bottom: 7px;

  font-family: "Poppins", sans-serif;
  font-size: 0.84rem;
  font-weight: 700;

  color: #252b27;
}

.events-modal-description {
  font-family: "Nunito", sans-serif;
  font-size: 0.83rem;
  line-height: 1.65;

  color: #707973;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 991.98px) {
  .events-header {
    padding: 28px 20px 18px;
  }

  .events-title {
    font-size:
      clamp(
        1.65rem,
        4.5vw,
        2.25rem
      );
  }

  .event-image-wrap {
    aspect-ratio: 4 / 5;
  }

  .events-grid {
    row-gap: 40px !important;
  }
}

@media (max-width: 767.98px) {
  .events-header {
    padding: 25px 17px 16px;
  }

  .events-title {
    font-size: 1.9rem;
  }

  .events-subtitle {
    margin-top: 6px;
    font-size: 0.78rem;
  }

  .events-container {
    padding-top: 0;
    padding-left: 17px;
    padding-right: 17px;
  }

  .events-results-bar {
    align-items: flex-start;
  }

  .events-results-right {
    width: 100%;
    justify-content: space-between;
  }

  .event-image-wrap {
    aspect-ratio: 4 / 5;
    border-radius: 17px;
  }

  .events-grid {
    row-gap: 36px !important;
  }

  .event-bottom-row {
    align-items: flex-start;
  }
}

@media (max-width: 479.98px) {
  .events-title {
    font-size: 1.8rem;
  }

  .events-subtitle {
    font-size: 0.77rem;
  }

  .event-image-wrap {
    aspect-ratio: 4 / 5;
  }

  .event-name {
    font-size: 0.94rem !important;
  }

  .event-description {
    font-size: 0.7rem;
  }

  .events-calendar {
    padding: 13px;
  }

  .events-calendar-grid {
    gap: 4px;
  }

  .events-calendar-day {
    font-size: 0.65rem;
  }
}
`;

/* =========================================================
   CALENDAR
========================================================= */

const Calendar: React.FC<{
  events: Event[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}> = ({
  events,
  selectedDate,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay =
      new Date(year, month, 1).getDay();

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0,
      ).getDate();

    return {
      firstDay,
      daysInMonth,
    };
  };

  const countEventsOnDate = (
    day: number,
  ) => {
    return events.filter((event) => {
      if (!event.startDate) {
        return false;
      }

      const start = new Date(
        event.startDate,
      );

      return (
        !Number.isNaN(start.getTime()) &&
        start.getDate() === day &&
        start.getMonth() ===
          currentMonth.getMonth() &&
        start.getFullYear() ===
          currentMonth.getFullYear()
      );
    }).length;
  };

  const isSelectedDate = (
    day: number,
  ) => {
    if (!selectedDate) {
      return false;
    }

    return (
      selectedDate.toDateString() ===
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      ).toDateString()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();

    return (
      day === today.getDate() &&
      currentMonth.getMonth() ===
        today.getMonth() &&
      currentMonth.getFullYear() ===
        today.getFullYear()
    );
  };

  const {
    firstDay,
    daysInMonth,
  } =
    getDaysInMonth(currentMonth);

  const weekdays = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      ),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      ),
    );
  };

  return (
    <div className="events-calendar">
      <div className="events-calendar-header">
        <button
          type="button"
          className="events-calendar-nav"
          onClick={
            goToPreviousMonth
          }
          aria-label="Previous month"
        >
          <ArrowLeft
            size={14}
            strokeWidth={2.2}
          />
        </button>

        <div className="events-calendar-month">
          {currentMonth.toLocaleDateString(
            "en-US",
            {
              month: "long",
              year: "numeric",
            },
          )}
        </div>

        <button
          type="button"
          className="events-calendar-nav"
          onClick={
            goToNextMonth
          }
          aria-label="Next month"
        >
          <ArrowRight
            size={14}
            strokeWidth={2.2}
          />
        </button>
      </div>

      <div className="events-calendar-weekdays">
        {weekdays.map(
          (day) => (
            <div
              key={day}
              className="events-calendar-weekday"
            >
              {day}
            </div>
          ),
        )}
      </div>

      <div className="events-calendar-grid">
        {Array.from({
          length: firstDay,
        }).map(
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="events-calendar-day-empty"
            />
          ),
        )}

        {Array.from({
          length: daysInMonth,
        }).map(
          (_, index) => {
            const day =
              index + 1;

            const eventCount =
              countEventsOnDate(
                day,
              );

            const selected =
              isSelectedDate(
                day,
              );

            const today =
              isToday(day);

            const dotCount =
              Math.min(
                eventCount,
                3,
              );

            return (
              <button
                key={day}
                type="button"
                className={[
                  "events-calendar-day",
                  today
                    ? "events-calendar-day-today"
                    : "",
                  selected
                    ? "events-calendar-day-selected"
                    : "",
                ]
                  .filter(
                    Boolean,
                  )
                  .join(" ")}
                onClick={() => {
                  const newDate =
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day,
                    );

                  onSelectDate(
                    selectedDate &&
                      selectedDate.toDateString() ===
                        newDate.toDateString()
                      ? null
                      : newDate,
                  );
                }}
              >
                {day}

                {dotCount >
                  0 && (
                  <div className="events-calendar-dots">
                    {Array.from({
                      length:
                        dotCount,
                    }).map(
                      (_, dotIndex) => (
                        <span
                          key={
                            dotIndex
                          }
                          className="events-calendar-dot"
                        />
                      ),
                    )}
                  </div>
                )}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
};

/* =========================================================
   CATEGORIES
========================================================= */

const CATEGORIES = [
  "All",
  "Festival",
  "Cultural",
  "Sports",
  "Religious",
  "Food",
  "Music",
  "Arts",
  "Other",
];

/* =========================================================
   CATEGORY COLORS
========================================================= */

const categoryColors: Record<
  string,
  string
> = {
  Festival: "#e63946",
  Cultural: "#1A7A4A",
  Sports: "#0077B6",
  Religious: "#F4A226",
  Food: "#6d4c41",
  Music: "#7b2d8b",
  Arts: "#e76f51",
  Other: "#6c757d",
};

/* =========================================================
   CATEGORY ICONS
========================================================= */

const categoryIcons: Record<
  string,
  string
> = {
  All: "🌐",
  Festival: "🎉",
  Cultural: "🏛️",
  Sports: "🏃",
  Religious: "⛪",
  Food: "🍴",
  Music: "🎵",
  Arts: "🎨",
  Other: "📍",
};

/* =========================================================
   COMPONENT
========================================================= */

const Events: React.FC = () => {
  const location =
    useLocation();

  const highlightId =
    (location.state as any)
      ?.highlightId;

  const [
    events,
    setEvents,
  ] = useState<Event[]>([]);

  const [
    calendarEvents,
    setCalendarEvents,
  ] = useState<Event[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("All");

  const [
    upcomingOnly,
    setUpcomingOnly,
  ] = useState(false);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<Date | null>(
    null,
  );

  const [
    selected,
    setSelected,
  ] = useState<Event | null>(
    null,
  );

  const didAutoOpen =
    useRef(false);

  /* =========================================================
     FETCH EVENTS
  ========================================================= */

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const params: Record<
        string,
        string
      > = {};

      if (
        activeCategory !==
        "All"
      ) {
        params.category =
          activeCategory;
      }

      if (upcomingOnly) {
        params.upcoming =
          "true";
      }

      const response =
        await getEvents(params);

      const fetched =
        Array.isArray(
          response?.data,
        )
          ? response.data
          : [];

      let filtered =
        fetched;

      if (selectedDate) {
        filtered =
          fetched.filter(
            (event) => {
              if (
                !event.startDate
              ) {
                return false;
              }

              const start =
                new Date(
                  event.startDate,
                );

              return (
                !Number.isNaN(
                  start.getTime(),
                ) &&
                start.getDate() ===
                  selectedDate.getDate() &&
                start.getMonth() ===
                  selectedDate.getMonth() &&
                start.getFullYear() ===
                  selectedDate.getFullYear()
              );
            },
          );
      }

      setEvents(filtered);

      /* AUTO OPEN EVENT */

      if (
        highlightId &&
        !didAutoOpen.current
      ) {
        const match =
          fetched.find(
            (event) =>
              (event._id ||
                event.id) ===
              highlightId,
          );

        if (match) {
          setSelected(match);
          didAutoOpen.current =
            true;
        }
      }
    } catch (error) {
      console.error(
        "Failed to fetch events:",
        error,
      );

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL / FILTER LOAD
  ========================================================= */

  useEffect(() => {
    fetchEvents();
  }, [
    activeCategory,
    upcomingOnly,
    selectedDate,
  ]);

  /* =========================================================
     CALENDAR EVENTS
  ========================================================= */

  useEffect(() => {
    getEvents({})
      .then((response) => {
        setCalendarEvents(
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [],
        );
      })
      .catch(() => {
        setCalendarEvents([]);
      });
  }, []);

  /* =========================================================
     REALTIME
  ========================================================= */

  useEffect(() => {
    subscribeToEvents(() => {
      fetchEvents();

      getEvents({})
        .then((response) => {
          setCalendarEvents(
            Array.isArray(
              response?.data,
            )
              ? response.data
              : [],
          );
        })
        .catch(() => {});
    });

    return () => {
      unsubscribeAll();
    };
  }, [
    activeCategory,
    upcomingOnly,
    selectedDate,
  ]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDate = (
    date: string,
  ) => {
    if (!date) {
      return "Date TBA";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return "Date TBA";
    }

    return parsed.toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
  };

  const formatDateRange = (
    startDate: string,
    endDate: string,
  ) => {
    if (!startDate) {
      return "Date TBA";
    }

    if (
      !endDate ||
      new Date(
        startDate,
      ).toDateString() ===
        new Date(
          endDate,
        ).toDateString()
    ) {
      return formatDate(
        startDate,
      );
    }

    return `${formatDate(
      startDate,
    )} – ${formatDate(
      endDate,
    )}`;
  };

  const getCategoryColor = (
    category: string,
  ) => {
    return (
      categoryColors[
        category
      ] ||
      "#1A7A4A"
    );
  };

  const getCategoryIcon = (
    category: string,
  ) => {
    return (
      categoryIcons[
        category
      ] ||
      "📍"
    );
  };

  const clearFilters = () => {
    setActiveCategory("All");
    setUpcomingOnly(false);
    setSelectedDate(null);
  };

  const selectedColor =
    selected
      ? getCategoryColor(
          selected.category,
        )
      : "#1A7A4A";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <style>
        {styles}
      </style>

      <div className="page-enter events-page">

        {/* ===================================================
            HEADER — MATCHES ATTRACTIONS
        =================================================== */}

        <section className="events-header">
          <div className="events-header-inner">
            <h1 className="events-title">
              EVENTS & FESTIVALS
            </h1>

            <p className="events-subtitle">
              Experience Calbayog's
              vibrant celebrations,
              cultural traditions,
              community gatherings,
              and memorable events.
            </p>
          </div>
        </section>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <Container className="events-container">

          {/* =================================================
              CATEGORY PILLS
          ================================================= */}

          <div className="events-category-pills">
            {CATEGORIES.map(
              (category) => {
                const isActive =
                  activeCategory ===
                  category;

                const color =
                  category ===
                  "All"
                    ? "#1A7A4A"
                    : getCategoryColor(
                        category,
                      );

                return (
                  <button
                    key={
                      category
                    }
                    type="button"
                    className={[
                      "events-category-pill",
                      isActive
                        ? "events-category-pill-active"
                        : "",
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(" ")}
                    style={
                      {
                        "--pill-color":
                          color,
                        "--pill-background": `${color}15`,
                      } as React.CSSProperties
                    }
                    onClick={() => {
                      setActiveCategory(
                        category,
                      );
                      setSelectedDate(
                        null,
                      );
                    }}
                  >
                    <span>
                      {getCategoryIcon(
                        category,
                      )}
                    </span>

                    <span>
                      {category}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {/* =================================================
              EVENT FILTER
          ================================================= */}

          <section className="events-filter-section">

            <div className="events-filter-label">
              EVENT FILTERS
            </div>

            <div className="events-filter-pills">

              <button
                type="button"
                className={[
                  "events-filter-pill",
                  upcomingOnly
                    ? "events-filter-pill-active"
                    : "",
                ].join(" ")}
                style={
                  {
                    "--filter-color":
                      "#D99A1A",
                    "--filter-background":
                      "#FFF7E7",
                  } as React.CSSProperties
                }
                onClick={() => {
                  setUpcomingOnly(
                    (current) =>
                      !current,
                  );

                  if (
                    upcomingOnly
                  ) {
                    setSelectedDate(
                      null,
                    );
                  }
                }}
              >
                <CalendarDays
                  size={14}
                  strokeWidth={
                    2.2
                  }
                />

                Upcoming Events
              </button>

              {selectedDate && (
                <button
                  type="button"
                  className="events-filter-pill events-filter-pill-active"
                  style={
                    {
                      "--filter-color":
                        "#1A7A4A",
                      "--filter-background":
                        "#EEF8F2",
                    } as React.CSSProperties
                  }
                  onClick={() =>
                    setSelectedDate(
                      null,
                    )
                  }
                >
                  <CalendarDays
                    size={14}
                    strokeWidth={
                      2.2
                    }
                  />

                  {selectedDate.toLocaleDateString(
                    "en-PH",
                    {
                      month:
                        "short",
                      day:
                        "numeric",
                      year:
                        "numeric",
                    },
                  )}
                </button>
              )}

              {(activeCategory !==
                "All" ||
                upcomingOnly ||
                selectedDate) && (
                <button
                  type="button"
                  className="events-filter-pill"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {/* =================================================
              CALENDAR
          ================================================= */}

          {upcomingOnly && (
            <div className="events-calendar-wrapper">
              <Calendar
                events={
                  calendarEvents
                }
                selectedDate={
                  selectedDate
                }
                onSelectDate={
                  setSelectedDate
                }
              />
            </div>
          )}

          {/* =================================================
              RESULTS BAR
          ================================================= */}

          {!loading && (
            <div className="events-results-bar">

              <div className="events-results-left">

                <div className="events-results-icon">
                  <CalendarDays
                    size={16}
                    strokeWidth={
                      2.2
                    }
                  />
                </div>

                <div>
                  <div className="events-results-label">
                    SHOWING
                  </div>

                  <div className="events-results-count">
                    {events.length}{" "}
                    event
                    {events.length !==
                    1
                      ? "s"
                      : ""}
                  </div>
                </div>
              </div>

              <div className="events-results-right">

                <span className="events-results-category">
                  {selectedDate
                    ? selectedDate.toLocaleDateString(
                        "en-PH",
                        {
                          month:
                            "short",
                          day:
                            "numeric",
                          year:
                            "numeric",
                        },
                      )
                    : upcomingOnly
                      ? "Upcoming events"
                      : activeCategory ===
                          "All"
                        ? "All events"
                        : activeCategory}
                </span>

                {(activeCategory !==
                  "All" ||
                  upcomingOnly ||
                  selectedDate) && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="events-clear-button"
                    onClick={
                      clearFilters
                    }
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="events-loading">

              <div className="events-loading-inner">

                <div className="events-loading-icon">
                  <Spinner
                    animation="border"
                    size="sm"
                  />
                </div>

                <div className="events-loading-title">
                  Discovering events...
                </div>

                <p className="events-loading-text">
                  Please wait a
                  moment.
                </p>
              </div>
            </div>
          ) : events.length ===
            0 ? (

            /* ===============================================
               EMPTY
            =============================================== */

            <div className="events-empty">

              <div className="events-empty-icon">
                <CalendarDays
                  size={27}
                  strokeWidth={
                    1.8
                  }
                />
              </div>

              <h3 className="events-empty-title">
                {selectedDate
                  ? "No events on this date"
                  : "No events found"}
              </h3>

              <p className="events-empty-text">
                {selectedDate
                  ? "Try selecting another date or explore all upcoming events."
                  : "There are currently no events matching your selected filters."}
              </p>

              <Button
                variant="outline-success"
                onClick={
                  clearFilters
                }
                style={{
                  borderRadius:
                    999,
                  padding:
                    "7px 14px",
                  fontFamily:
                    "Nunito, sans-serif",
                  fontSize:
                    "0.7rem",
                  fontWeight:
                    800,
                }}
              >
                View all events
              </Button>
            </div>

          ) : (

            /* ===============================================
               EVENT GRID
            =============================================== */

            <Row className="events-grid">

              {events.map(
                (
                  event,
                  index,
                ) => {
                  const color =
                    getCategoryColor(
                      event.category,
                    );

                  const eventId =
                    event._id ||
                    `event-${index}`;

                  return (
                    <Col
                      xs={12}
                      sm={6}
                      lg={4}
                      key={eventId}
                      className="event-col"
                    >
                      <Card
                        className="event-card"
                        onClick={() =>
                          setSelected(
                            event,
                          )
                        }
                      >

                        {/* =================================
                            IMAGE
                        ================================= */}

                        <div
                          className="event-image-wrap"
                          style={{
                            background:
                              `${color}12`,
                          }}
                        >

                          {event.image ? (
                            <img
                              src={
                                event.image
                              }
                              alt={
                                event.title
                              }
                              className="event-image"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="event-image-placeholder"
                              style={{
                                background:
                                  `linear-gradient(135deg, ${color}18, #ffffff)`,
                              }}
                            >
                              {getCategoryIcon(
                                event.category,
                              )}
                            </div>
                          )}

                          <div className="event-image-overlay" />

                          {/* CATEGORY */}

                          <span
                            className="event-category-badge"
                            style={{
                              color:
                                color,
                            }}
                          >
                            {getCategoryIcon(
                              event.category,
                            )}

                            {event.category ||
                              "Event"}
                          </span>

                          {/* FEATURED */}

                          {event.featured && (
                            <span className="event-featured-badge">
                              <Star
                                size={11}
                                fill="currentColor"
                                strokeWidth={
                                  2
                                }
                              />

                              Featured
                            </span>
                          )}

                          {/* VIEW */}

                          <span className="event-view-overlay">
                            View details
                            <ArrowUpRight
                              size={12}
                              strokeWidth={
                                2.2
                              }
                            />
                          </span>
                        </div>

                        {/* =================================
                            BODY
                        ================================= */}

                        <Card.Body className="event-card-body">

                          <div className="event-title-row">
                            <h3 className="event-name">
                              {
                                event.title
                              }
                            </h3>
                          </div>

                          {/* DATE */}

                          <div className="event-date">
                            <CalendarDays
                              size={12}
                              strokeWidth={
                                2.1
                              }
                            />

                            <span>
                              {formatDateRange(
                                event.startDate,
                                event.endDate,
                              )}
                            </span>
                          </div>

                          {/* VENUE */}

                          <div className="event-location">
                            <MapPin
                              size={12}
                              strokeWidth={
                                2.1
                              }
                            />

                            <span className="event-location-text">
                              {event.venue ||
                                "Calbayog City"}
                            </span>
                          </div>

                          {/* DESCRIPTION */}

                          <p className="event-description">
                            {event.description ||
                              "Discover this event and experience the vibrant culture and community of Calbayog City."}
                          </p>

                          {/* CATEGORY */}

                          <span
                            className="event-category-label"
                            style={{
                              color:
                                color,
                            }}
                          >
                            {event.category ||
                              "Event"}
                          </span>

                          {/* BOTTOM */}

                          <div className="event-bottom-row">

                            <span
                              className="event-price"
                              style={{
                                color:
                                  event.isFree
                                    ? "#1A7A4A"
                                    : "#D99A1A",
                              }}
                            >
                              {event.isFree ? (
                                <>
                                  <Check
                                    size={
                                      12
                                    }
                                    strokeWidth={
                                      2.5
                                    }
                                  />

                                  Free
                                </>
                              ) : (
                                <>
                                  <Ticket
                                    size={
                                      12
                                    }
                                    strokeWidth={
                                      2.2
                                    }
                                  />

                                  {event.ticketPrice ||
                                    "Ticketed"}
                                </>
                              )}
                            </span>

                            <span
                              className="event-details-link"
                              style={{
                                color:
                                  color,
                              }}
                            >
                              Details
                              <ArrowUpRight
                                size={
                                  12
                                }
                                strokeWidth={
                                  2.2
                                }
                              />
                            </span>

                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                },
              )}
            </Row>
          )}
        </Container>

        {/* ===================================================
            EVENT DETAIL MODAL
        =================================================== */}

        <Modal
          show={!!selected}
          onHide={() =>
            setSelected(null)
          }
          centered
          size="lg"
        >
          {selected && (
            <>
              <Modal.Header
                closeButton
                style={{
                  borderBottom:
                    "1px solid #edf0ed",
                  padding:
                    "15px 20px",
                }}
              >
                <Modal.Title className="events-modal-title">
                  {
                    selected.title
                  }
                </Modal.Title>
              </Modal.Header>

              <Modal.Body
                style={{
                  padding: 20,
                }}
              >

                {/* IMAGE */}

                {selected.image && (
                  <img
                    src={
                      selected.image
                    }
                    alt={
                      selected.title
                    }
                    className="events-modal-image"
                  />
                )}

                {/* BADGES */}

                <div className="d-flex flex-wrap gap-2 mb-3">

                  <Badge
                    style={{
                      background:
                        selectedColor,
                      fontFamily:
                        "Nunito, sans-serif",
                      fontSize:
                        "0.67rem",
                      fontWeight:
                        800,
                      padding:
                        "6px 9px",
                      borderRadius:
                        999,
                    }}
                  >
                    {getCategoryIcon(
                      selected.category,
                    )}{" "}
                    {
                      selected.category
                    }
                  </Badge>

                  <Badge
                    style={{
                      background:
                        selected.isFree
                          ? "#EEF8F2"
                          : "#FFF7E7",
                      color:
                        selected.isFree
                          ? "#1A7A4A"
                          : "#A86400",
                      fontFamily:
                        "Nunito, sans-serif",
                      fontSize:
                        "0.67rem",
                      fontWeight:
                        800,
                      padding:
                        "6px 9px",
                      borderRadius:
                        999,
                    }}
                  >
                    {selected.isFree
                      ? "Free"
                      : `Ticketed · ${
                          selected.ticketPrice ||
                          "See details"
                        }`}
                  </Badge>

                  {selected.featured && (
                    <Badge
                      style={{
                        background:
                          "#FFF7E7",
                        color:
                          "#A86400",
                        fontFamily:
                          "Nunito, sans-serif",
                        fontSize:
                          "0.67rem",
                        fontWeight:
                          800,
                        padding:
                          "6px 9px",
                        borderRadius:
                          999,
                      }}
                    >
                      <Star
                        size={10}
                        fill="currentColor"
                        strokeWidth={
                          2
                        }
                      />{" "}
                      Featured
                    </Badge>
                  )}
                </div>

                {/* DETAILS */}

                <div className="events-modal-details">

                  <div className="events-modal-detail">
                    <CalendarDays
                      size={15}
                      strokeWidth={
                        2
                      }
                      style={{
                        color:
                          selectedColor,
                        marginTop: 1,
                        flex:
                          "0 0 auto",
                      }}
                    />

                    <span>
                      <strong>
                        Date:
                      </strong>{" "}
                      {formatDateRange(
                        selected.startDate,
                        selected.endDate,
                      )}
                    </span>
                  </div>

                  <div className="events-modal-detail">
                    <MapPin
                      size={15}
                      strokeWidth={
                        2
                      }
                      style={{
                        color:
                          selectedColor,
                        marginTop: 1,
                        flex:
                          "0 0 auto",
                      }}
                    />

                    <span>
                      <strong>
                        Venue:
                      </strong>{" "}
                      {selected.venue ||
                        "Calbayog City"}
                    </span>
                  </div>

                  {selected.organizer && (
                    <div className="events-modal-detail">
                      <Star
                        size={15}
                        strokeWidth={
                          2
                        }
                        style={{
                          color:
                            selectedColor,
                          marginTop: 1,
                          flex:
                            "0 0 auto",
                        }}
                      />

                      <span>
                        <strong>
                          Organizer:
                        </strong>{" "}
                        {
                          selected.organizer
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}

                <h6 className="events-modal-section-title">
                  About this event
                </h6>

                <p className="events-modal-description">
                  {selected.description ||
                    "Discover this event and experience the vibrant culture and community of Calbayog City."}
                </p>

                {/* FACEBOOK */}

                {selected.contact
                  ?.facebook && (
                  <a
                    href={
                      selected
                        .contact
                        .facebook
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-success btn-sm"
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: 6,
                      borderRadius:
                        999,
                      fontFamily:
                        "Nunito, sans-serif",
                      fontSize:
                        "0.7rem",
                      fontWeight:
                        800,
                    }}
                  >
                    

                    Facebook Page
                  </a>
                )}
              </Modal.Body>

              <Modal.Footer
                style={{
                  borderTop:
                    "1px solid #edf0ed",
                  padding:
                    "12px 20px",
                }}
              >
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    setSelected(
                      null,
                    )
                  }
                  style={{
                    borderRadius:
                      999,
                    padding:
                      "6px 14px",
                    fontFamily:
                      "Nunito, sans-serif",
                    fontSize:
                      "0.7rem",
                    fontWeight:
                      800,
                  }}
                >
                  Close
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>
      </div>
    </>
  );
};

export default Events;