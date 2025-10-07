Got it! Let me break down your KPI tracking project into a clear explanation so you fully understand it. I’ll go section by section, based on the documentation you provided.

Project Overview

Project Name: Century Fashion City – KPI Tracking Platform
Purpose:

Replace Excel/WhatsApp-based KPI tracking for sales floors.

Allow managers, supervisors, and owner to score, audit, and view performance.

Provide daily and monthly performance insights, leaderboards, and payroll export.

Users / Roles:

Owner: Full access, can change KPI weights, export reports.

Floor-Supervisor: Audit scores, unlock locked days, edit scores.

Floor-Manager: Score employees in their floor. Cannot edit after lock.

Sales-Person: See own scores and leaderboard (read-only).

Accountant: Upload monthly “Old Product Sale” data.

Data Model (Database Structure)

Tables and key fields:

User

Stores all employees (salespersons, managers, supervisors, owner, accountant).

Fields: id, name, mobile, pin_hash, role, floor_id, section, active_flag, created_at.

Floor

Physical floor of the store.

Fields: id, name, sort_order.

KPI

Defines key performance indicators.

Fields: id, name, frequency, weight, max_points.

Score

Daily KPI points scored by a user.

Fields: id, user_id, kpi_id, date, points, scored_by_user_id, locked_at, created_at, updated_at.

OldProductSale

Tracks monthly old product sales uploaded by accountant.

Fields: id, user_id, year_prefix, qty_sold, target_qty, month, uploaded_by, uploaded_at.

Leave

Tracks leave requests.

Fields: id, user_id, date, leave_type (full/half), approved_by, created_at.

Relationships:

User ↔ Floor (user belongs to a floor)

Score ↔ User & KPI (score is linked to user & KPI)

OldProductSale ↔ User

Leave ↔ User

Workflow
Daily Scoring (Manager)

Manager opens “Score Today” screen.

Employees in the manager’s floor are auto-listed.

Daily KPIs are presented as sliders.

Leave data is pre-filled but editable.

Scores are saved; locked_at initially NULL.

Before 23:59, manager can edit. After that, supervisor must unlock.

Monthly Old Product Sale (Accountant)

Accountant uploads CSV of old product sales.

System converts sales to 0–10 score:
score = min(10, 10 * qty_sold / target_qty)

Score stored in Score table with KPI = 7 (monthly).

Leaderboard updated automatically.

Leaderboard & Scoring Logic

Daily Score: Weighted sum of daily KPIs (excluding monthly KPI).

Monthly Score: Weighted sum of all 7 KPIs.

Rank: Dense rank per floor and overall.

Access Control
Screen / Endpoint	Owner	Supervisor	Manager	Sales	Accountant
/score/today	–	–	✓	–	–
/score/edit/:id	✓	✓	✓*	–	–
/leaderboard/daily	✓	✓	✓	R	–
/leaderboard/monthly	✓	✓	✓	R	–
/settings/weights	✓	–	–	–	–
/upload/old-product	✓	–	–	–	✓
/export/payroll	✓	✓	–	–	–

*Only editable by manager if score not locked.

Tech Stack

Front-end: React + Material UI (mobile-first PWA)

Back-end: Node.js + Express.js + PostgreSQL

Authentication: 6-digit PIN per user, JWT-based

Optional Hosting: Supabase or VPS with daily PostgreSQL backup

Exports: CSV for payroll and old-product sales

Project Highlights

Mobile-first design → managers can score on the shop floor.

Audit trail & locks → supervisors can lock/unlock scores.

Leaderboard → daily and monthly performance per floor.

Monthly payroll export → automated weighted score → payout factor.

Minimal DevOps → can host on cheap VPS or Supabase.

CSV Examples

Old Product Upload

user_code,year_prefix,qty_sold,target_qty
SF001,24,120,150
SF002,24,80,100


Payroll Export

month,user_name,floor,section,total_score,weighted_payout_factor
2025-09,Aisha,2,Ethnic,9.23,1.15

Summary

This project is a full KPI tracking system for retail floors, with:

Role-based access control

Daily & monthly scoring

Leaderboards & reporting

PIN-based login

React front-end + Node/Postgres back-end

Audit trails and export functionality

It’s essentially a digital replacement for Excel/WhatsApp-based manual tracking, fully automated, mobile-ready, and audit-compliant for internal operations.

┌───────────┐        ┌───────────┐
│   Floor   │        │   KPI     │
│-----------│        │-----------│
│ id (PK)   │◄───────┤ id (PK)   │
│ name      │        │ name      │
│ sort_order│        │ frequency │
└─────┬─────┘        │ weight    │
      │              │ max_points│
      │              └───────────┘
      │
      │
      │
┌─────▼─────┐
│   User    │
│-----------│
│ id (PK)   │
│ name      │
│ mobile    │
│ pin_hash  │
│ role      │
│ floor_id  │FK───┐
│ section   │     │
│ active_flag│    │
│ created_at│     │
└─────┬─────┘     │
      │           │
      │           │
      │           │
┌─────▼──────────┐
│    Score       │
│----------------│
│ id (PK)        │
│ user_id (FK)───┘
│ kpi_id (FK)────┐
│ date           │
│ points         │
│ scored_by_user_id (FK) ┐
│ locked_at      │       │
│ created_at     │       │
│ updated_at     │       │
└────────────────┘       │
                         │
┌─────────────────┐      │
│ OldProductSale  │      │
│-----------------│      │
│ id (PK)         │      │
│ user_id (FK)────┘
│ year_prefix     │
│ qty_sold        │
│ target_qty      │
│ month           │
│ uploaded_by     │
│ uploaded_at     │
└─────────────────┘
┌─────────────┐
│   Leave     │
│-------------│
│ id (PK)     │
│ user_id (FK)│
│ date        │
│ leave_type  │
│ approved_by │ FK (User.id)
│ created_at  │
└─────────────┘



kpi- add
name,
descti,
show only on of this -slider of 1 to 10 -on off button-starr ratingh showthse the use can select eahc any othe them usig dropdown then only show the the inputs
weight