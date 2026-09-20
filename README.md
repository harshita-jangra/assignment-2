# LabVault — Lab Equipment & Asset Issue-Return Tracking System

> **Tagline:** *"Intelligent Asset & Equipment Management"*  
> **Visual Identity:** *Velvet Black × Velvet Burgundy Luxury SaaS Design System*  
> **Domain:** Institutional & University Laboratory Asset Management

---

## 📌 1. Project Overview & Problem Statement

In academic and research institutions, thousands of dollars worth of precision lab instruments—such as digital oscilloscopes, multimeters, microcontrollers, and soldering stations—are routinely requisitioned by students and researchers. 

### The Problem
Traditional laboratories manage equipment via manual paper ledgers or disorganized spreadsheets. This leads to:
- **Inventory Leakage & Loss:** High rates of misplaced or unreturned instruments.
- **Stock Discrepancies:** Uncoordinated quantities leading to negative stock or over-booking.
- **Unmonitored Overdues:** No automated mechanism to alert staff when students fail to return items.
- **Unreported Equipment Damage:** Damaged items re-entering circulation without calibration or repair.

### The Solution: LabVault
**LabVault** is a full-stack institutional asset tracking system engineered using **Node.js, Express.js, MongoDB (Mongoose), and EJS**. It enforces strict inventory invariants, automated overdue detection, role-based access control (RBAC), and physical inspection workflows within an ultra-luxurious **Velvet Black × Velvet Burgundy** user interface.

---

## 🎯 2. Main Users & Role-Based Permissions

The application implements strict Role-Based Access Control (RBAC) across three distinct user roles:

| Role | Responsibilities & Capabilities |
| :--- | :--- |
| **Requester**<br>*(Student / Staff)* | • Register & login to personalized workspace.<br>• Browse equipment catalog with live stock indicators.<br>• Inspect technical specifications and available units.<br>• Submit requisition requests (with purpose and return date).<br>• Cannot request more units than currently available.<br>• Track request status and view active loans & overdue notices. |
| **Lab In-charge**<br>*(Lab Supervisor / Staff)* | • Review pending requisitions with one-click **Approve** or **Reject**.<br>• Execute physical handover (**Record Issue**): decreases available stock and increases issued count.<br>• Inspect physical returns and log condition: **OK**, **Damaged**, or **Lost**.<br>• Automated isolation of damaged units from loanable stock.<br>• Real-time overdue hardware monitoring. |
| **Administrator**<br>*(Lab Director / HoD)* | • Executive dashboard with aggregated institutional analytics.<br>• Full Asset CRUD: Create, Edit, and Delete equipment.<br>• Cannot delete assets with active issued units (deletion safety lock).<br>• Master audit trail of all student and staff requisitions.<br>• Equipment maintenance and calibration ledger.<br>• System user directory and role auditing. |

---

## 💻 3. Mandatory Technology Stack

This application is purposefully built using **pure JavaScript and Server-Side Rendering (SSR)** without complex front-end frameworks, ensuring beginner-friendly architecture that is easy to understand and explain during university viva evaluations.

- **Backend Framework:** Node.js & Express.js
- **Database & ODM:** MongoDB & Mongoose
- **View Engine:** EJS (Embedded JavaScript Templates) with modular partials
- **Authentication & Sessions:** `express-session` and `bcryptjs` (salted password hashing)
- **Notifications & Middleware:** `connect-flash`, `method-override`, `dotenv`
- **UI & Styling:** Vanilla CSS3 with custom properties (CSS Grid, Flexbox, glassmorphism, responsive drawer navigation)
- **Zero Frontend Frameworks:** No React, Next.js, Vue, Angular, or TypeScript.

---

## 🎨 4. Velvet Black × Velvet Burgundy Design System

LabVault abandons generic bootstrap admin styles in favor of a luxury visual identity:
- **`--velvet-black` (`#0B090A`):** Deep, velvety dark background.
- **`--deep-black` (`#111011`):** Structural card underlayers.
- **`--velvet-burgundy` (`#4A0E1C`):** Primary brand accent and button base.
- **`--wine` (`#64152A`):** Rich highlight gradients.
- **`--champagne` (`#C8A96B`):** Subtle luxury gold accent for icons, borders, and badges.
- **`--cream` (`#F5F0EA`):** High-contrast, readable typography.
- **`--muted-text` (`#A8A1A3`):** Refined secondary metadata.

---

## 📐 5. System Workflow & Business Logic

### A. The End-to-End Requisition Lifecycle
```
[1. Requester Submits Request]
         │
         ▼
  Status: PENDING
         │
   ┌─────┴────────────────┐
   ▼                      ▼
Status: REJECTED     Status: APPROVED
(Stock untouched)    (Ready for pickup)
                          │
                   [2. Lab In-charge Handover]
                          │
                          ▼
                    Status: ISSUED
                    • availableQuantity -= qty
                    • issuedQuantity += qty
                          │
                   [3. Physical Return]
                          │
   ┌──────────────────────┼──────────────────────┐
   ▼                      ▼                      ▼
Condition: OK       Condition: DAMAGED     Condition: LOST
• issuedQty -= qty   • issuedQty -= qty    • issuedQty -= qty
• availQty += qty    • damagedQty += qty   • lostQty += qty
• Stock restored     • availQty untouched  • totalQty -= qty
                     • Auto-maintenance    • Stock not restored
```

### B. Automated Dynamic Overdue Detection
Overdue status is calculated dynamically on every request without requiring manual buttons or fragile background cron jobs:
$$\text{isOverdue} = (\text{status} == \text{'Issued'})\ \land\ (\text{expectedReturnDate} < \text{currentDate})$$
Items meeting this condition automatically display a red warning badge with live days-overdue counters across Admin, Lab In-charge, and Requester dashboards.

---

## 📂 6. Clean MVC Project Structure

```text
labvault/
├── config/
│   └── db.js                 # MongoDB connection & connection listeners
├── models/
│   ├── User.js               # User schema, password hashing & match methods
│   ├── Asset.js              # Equipment schema & quantity invariants
│   ├── Request.js            # Requisition schema & isOverdue virtual
│   └── Maintenance.js        # Equipment servicing & repair records
├── middleware/
│   └── auth.js               # isLoggedIn, isAdmin, isLabIncharge, isRequester
├── controllers/
│   ├── authController.js     # Login, register, logout & session management
│   ├── requesterController.js# Catalog browsing, request submission & tracking
│   ├── labController.js      # Approvals, physical issues, returns & overdues
│   └── adminController.js    # Executive stats, asset CRUD, users, maintenance
├── routes/
│   ├── indexRoutes.js        # Root redirect based on role
│   ├── authRoutes.js         # Authentication endpoints
│   ├── requesterRoutes.js    # Requester portal routes
│   ├── labRoutes.js          # Lab In-charge portal routes
│   └── adminRoutes.js        # Admin portal routes
├── views/
│   ├── partials/             # head, header, sidebar, toasts, footer
│   ├── auth/                 # login, register (split-screen luxury UI)
│   ├── requester/            # dashboard, browse, asset-details, my-requests
│   ├── labIncharge/          # dashboard, requests, issued, overdue
│   ├── admin/                # dashboard, assets, asset-form, requests, maintenance, users
│   └── error.ejs             # Custom 404/500 error view
├── public/
│   ├── css/style.css         # Velvet Black × Velvet Burgundy styles
│   ├── js/main.js            # Modals, toasts, responsive drawer & validations
│   └── images/               # Default SVG assets & icons
├── seed.js                   # Automated database seeder (users, assets, requests)
├── test-workflow.js          # End-to-end automated business logic test suite
├── app.js                    # Express app initialization & server entry
├── package.json              # Project dependencies & npm scripts
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions
├── README.md                 # Complete documentation & deployment guide
├── VIVA.md                   # College viva questions and conceptual answers
└── PPT_CONTENT.md            # 10-slide ready presentation content
```

---

## 🔑 7. Demo Credentials

The database seeder pre-configures three accounts for immediate demonstration:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` | Full inventory CRUD, analytics, maintenance, users |
| **Lab In-charge** | `lab@example.com` | `Lab@123` | Request approval, issue handover, condition returns |
| **Requester** | `student@example.com` | `Student@123` | Equipment catalog browsing, requisitioning, tracking |

---

## 🚀 8. Local Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

### Steps to Run Locally
1. **Clone or navigate to the project directory:**
   ```bash
   cd labvault
   ```

2. **Install npm dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `MONGODB_URI` points to your MongoDB instance, e.g., `mongodb://127.0.0.1:27017/labvault`)*.

4. **Seed Demo Data:**
   ```bash
   npm run seed
   ```
   *(Note: If the database is empty, the server will also automatically auto-seed on first boot!)*

5. **Run Automated Verification Tests:**
   ```bash
   npm test
   ```

6. **Start the Application Server:**
   ```bash
   npm start
   ```
   Open your browser and navigate to: **`http://localhost:3000`**

---

## 🌐 9. Step-by-Step Render Deployment Guide

Deploying LabVault to [Render](https://render.com) takes less than 5 minutes:

### Step 1: Push Code to GitHub
Ensure `.env` and `node_modules` are excluded (already configured in `.gitignore`).
```bash
git init
git add .
git commit -m "Initial commit of LabVault"
git branch -M main
git remote add origin https://github.com/your-username/labvault.git
git push -u origin main
```

### Step 2: Set Up MongoDB Atlas (Free Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free Shared M0 cluster.
2. Under **Database Access**, create a user (e.g., `labadmin` with a secure password).
3. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)**.
4. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```text
   mongodb+srv://labadmin:<password>@cluster0.abcde.mongodb.net/labvault?retryWrites=true&w=majority
   ```

### Step 3: Deploy on Render
1. Log in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `labvault`
   - **Region:** Any close to you (e.g., Singapore, Frankfurt, Oregon)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Scroll to **Environment Variables** and add:
   - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
   - `MONGODB_URI`: *Your MongoDB Atlas connection string from Step 2*
   - `SESSION_SECRET`: *Any random string, e.g., `labvault_prod_secret_99812`*
5. Click **Create Web Service**.
6. Render will build and deploy the app. Once active, your app URL will be live at:
   `https://labvault.onrender.com`

---

## 🔮 10. Future Enhancements
- **QR Code & Barcode Scanning:** Generate printable QR tags for each asset to allow instant scanning with mobile cameras during issue and return.
- **Automated Email Reminders:** Trigger automated email notifications to students 24 hours prior to expected return dates via Nodemailer.
- **Departmental Budget Tracking:** Associate equipment procurement costs with specific university research grants.

---

## 📜 11. License & Academic Attribution
Developed as an academic assignment demonstrating clean MVC architecture, role-based authorization, and robust state machine design. Free for educational use.
