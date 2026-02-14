# Dashboard Implementation Plan

## 🎯 Objective
Create a "Command Center" UI for Geo-Insight AI using strict Material UI (MUI).

## 🎨 Design System
- **Theme:** Standard Google Material Design (Default MUI).
- **Colors:** Default MUI Blue/Roboto. No custom palettes.
- **Layout:** Standard Dashboard (Sidebar + Topbar + Content Area).
- **Typography:** Roboto (MUI default).

## 🧩 Components
1.  **Sidebar:** Navigation (Dashboard, Campaigns, Voice, Settings).
2.  **Campaign Manager:**
    -   Input fields for Lat/Lng (Map selector later), Radius, Keyword.
    -   "Start Prospecting" button (Triggers `/prospect/start`).
3.  **Lead Table:**
    -   DataGrid (MUI X) to display fetched leads.
    -   Columns: Name, Phone, Status, Buying Signal Score.
4.  **Voice Config:**
    -   List available numbers (from `/telephony/numbers`).
    -   "Buy & Bind" button.
5.  **Authentication (New):**
    -   **Login/Register:** Simple forms using Supabase Auth (Email/Password).
    -   **AuthContext:** Manage session state.
    -   **Protected Layout:** Wrap Dashboard components.

## 🔗 Integration
- Use `axios` or `fetch` to call `http://localhost:8000`.
- React Query (TanStack Query) recommended for state management, but `useEffect` is fine for MVP.
