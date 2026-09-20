# LabVault — University Viva & Technical Interview Guide

This guide is structured to help you understand, explain, and defend every single design and architectural decision in **LabVault** during your college project presentation and viva evaluation.

---

## 📚 PART 1: Core Concepts Explained in Simple Language

### 1. What is LabVault and why was it created?
**LabVault** is an institutional laboratory asset and equipment tracking web application. It automates the lifecycle of high-value laboratory hardware (such as oscilloscopes, multimeters, microcontrollers, and soldering stations).
- **The Problem:** In most colleges, lab equipment is logged manually in register notebooks. This leads to lost items, unreturned equipment, lack of accountability, and zero visibility into damaged items or real-time availability.
- **The Solution:** LabVault digitalizes the entire workflow: browsing, requesting, staff approval, physical handover, automated overdue detection, and physical return inspections.

---

### 2. How does Authentication and Session Management work?
- **Password Security (Hashing with bcryptjs):** We NEVER store passwords in plain text. When a user registers, `bcryptjs` generates a cryptographic "salt" (random characters) and hashes the password. Even if an attacker gains database access, they cannot read the passwords.
- **Sessions with express-session:** HTTP is a stateless protocol (it forgets who you are after every request). When a user logs in:
  1. The server validates their credentials.
  2. The server creates a session object in server memory containing user details (`id`, `name`, `email`, `role`).
  3. The server sends back a cookie named `connect.sid` containing a signed, encrypted Session ID.
  4. With every subsequent request, the browser automatically transmits this cookie, allowing the server to recognize the logged-in user.
- **Logout:** When the user clicks "Sign Out", `req.session.destroy()` wipes the session from the server and invalidates the session cookie.

---

### 3. What is Role-Based Access Control (RBAC)?
RBAC ensures users only access resources authorized for their role:
- **Requester (Student/Staff):** Can only view the equipment catalog, submit issue requests, and see their own requisitions.
- **Lab In-charge:** Can approve/reject requests, record physical issues (handover), inspect returns, and monitor overdue equipment.
- **Admin:** Can create/edit/delete assets, manage system users, oversee maintenance, and view the global audit trail.
- **How it is enforced:** We created custom Express middleware functions (`isLoggedIn`, `isAdmin`, `isLabIncharge`, `isRequester`) that intercept incoming HTTP requests before reaching the controller. If an unauthorized user tries to access a protected URL (e.g., a student visiting `/admin/assets`), the middleware intercepts the request and redirects them to their own dashboard with an access denied flash message.

---

### 4. How is MongoDB connected and what is Mongoose?
- **MongoDB** is a NoSQL, document-oriented database. It stores data as flexible BSON (Binary JSON) documents.
- **Mongoose** is an Object Data Modeling (ODM) library for Node.js. It acts as a translator between JavaScript code and MongoDB. Mongoose provides:
  - **Schemas:** Defines the structure, data types, defaults, and validation rules for collections.
  - **Models:** JavaScript constructors compiled from schemas that provide methods to interact with the database (`find()`, `findById()`, `save()`, `deleteOne()`).
- **Connection:** We connect in `config/db.js` using `mongoose.connect(process.env.MONGODB_URI)`.

---

### 5. What are the Database Models in LabVault?
1. **`User` (`models/User.js`):** Stores user profiles (`name`, `email`, `password`, `role`, `department`, `createdAt`).
2. **`Asset` (`models/Asset.js`):** Stores equipment inventory (`assetTag`, `name`, `category`, `location`, `condition`, `totalQuantity`, `availableQuantity`, `issuedQuantity`, `damagedQuantity`, `lostQuantity`, `description`, `image`).
3. **`Request` (`models/Request.js`):** Tracks requisition transactions (`requester`, `asset`, `quantity`, `purpose`, `expectedReturnDate`, `status`, `approvedBy`, `issuedBy`, `returnedAt`, `returnCondition`).
4. **`Maintenance` (`models/Maintenance.js`):** Tracks servicing and repairs (`asset`, `serviceDate`, `description`, `cost`, `nextServiceDue`, `status`, `performedBy`).

---

### 6. How is Equipment Quantity Calculated? (The Golden Invariant)
The system maintains the mathematical inventory invariant at all times:
$$\text{availableQuantity} = \text{totalQuantity} - \text{issuedQuantity} - \text{damagedQuantity} - \text{lostQuantity}$$
- **When Issued:** `availableQuantity -= qty`, `issuedQuantity += qty`.
- **When Returned OK:** `issuedQuantity -= qty`, `availableQuantity += qty`.
- **When Returned DAMAGED:** `issuedQuantity -= qty`, `damagedQuantity += qty`. The unit does NOT go back into available stock. An automated maintenance ticket is created.
- **When Returned LOST:** `issuedQuantity -= qty`, `lostQuantity += qty`, `totalQuantity -= qty`. The unit does NOT go back into available stock.
- **Negative Stock Prevention:** Handled on both client-side and server-side. A requester can never request more units than `availableQuantity`, and an issue transaction will abort if available stock is insufficient.

---

### 7. How does Dynamic Overdue Detection work?
Instead of relying on fragile background cron jobs that might fail if a server restarts, LabVault uses **real-time date comparison**:
- Whenever an issued request is fetched or rendered, we compare:
  `new Date(request.expectedReturnDate) < new Date()`
- If true and `status === 'Issued'`, the item is automatically categorized as **OVERDUE**.
- A Mongoose virtual property `request.isOverdue` and dynamic template checks instantly illuminate the red warning badge across all dashboards without modifying the database.

---

### 8. How does EJS (Embedded JavaScript) work?
- **EJS** is a server-side templating engine.
- When a user visits a page, the Express server executes JavaScript logic inside `<% %>` tags, injects database records (`<%= user.name %>`, `<%= asset.availableQuantity %>`), and combines modular partials (`head.ejs`, `sidebar.ejs`, `header.ejs`, `footer.ejs`).
- The server compiles this into a pure HTML document and sends it to the browser. The browser does not need any heavy frontend framework.

---

## 🎯 PART 2: 25 Common College Viva Questions & Answers

### Q1: What architecture does this project follow?
**Answer:** It follows the **MVC (Model-View-Controller)** architectural pattern:
- **Model:** Mongoose schemas (`User.js`, `Asset.js`, `Request.js`, `Maintenance.js`) defining data and business logic.
- **View:** EJS templates in the `views/` directory rendering HTML to the client.
- **Controller:** Express controller functions in `controllers/` handling application logic, database queries, and response rendering.

---

### Q2: Why did you use EJS instead of React or Angular?
**Answer:** EJS utilizes Server-Side Rendering (SSR). It simplifies the architecture by eliminating API boilerplate, state management libraries (Redux/Zustand), and build tooling. The server sends ready-to-render HTML to the browser, which is fast, lightweight, search-engine friendly, and perfectly suited for an academic management system.

---

### Q3: How do you prevent a student from requesting 10 multimeters when only 3 are available?
**Answer:** We implement **dual-layer validation**:
1. **Client-side:** The HTML `<input>` has `max="<%= asset.availableQuantity %>"` and client JavaScript verifies that the entered value does not exceed available stock before form submission.
2. **Server-side:** In `requesterController.postRequestEquipment`, the server queries the database for the asset, checks `if (requestedQty > asset.availableQuantity)`, rejects the transaction, and sends an error alert via flash messages. Server validation cannot be bypassed.

---

### Q4: What happens if a piece of equipment is returned damaged?
**Answer:** When the Lab In-charge records a return with condition marked as **Damaged**:
1. `issuedQuantity` is decremented.
2. `damagedQuantity` is incremented.
3. `availableQuantity` is **NOT** increased, keeping the broken unit out of circulation.
4. The asset condition is set to 'Damaged'.
5. An automated record is generated in the `Maintenance` collection for institutional tracking.

---

### Q5: What happens if a piece of equipment is reported lost?
**Answer:** When condition is marked as **Lost**:
1. `issuedQuantity` is decremented.
2. `lostQuantity` is incremented.
3. `totalQuantity` is reduced by the lost amount.
4. `availableQuantity` is **NOT** increased.
5. The request status is finalized as 'Returned' with condition 'Lost'.

---

### Q6: How do you handle password security?
**Answer:** We use the `bcryptjs` library. In `User.js`, a Mongoose pre-save hook intercepts any new or modified password, generates a salt with cost factor 10, and hashes the password before saving to MongoDB. When logging in, `bcrypt.compare()` verifies the entered password against the cryptographic hash.

---

### Q7: What is the purpose of `express-session`?
**Answer:** HTTP is a stateless protocol. `express-session` creates a session store on the server and attaches a unique session identifier in a secure HTTP-only cookie to the client's browser. On subsequent requests, the server uses this cookie to retrieve the user's active session and authentication state.

---

### Q8: What is middleware in Express?
**Answer:** Middleware functions are functions that have access to the request object (`req`), response object (`res`), and the `next` function in the application’s request-response cycle. They execute code, modify request/response objects, end the request cycle, or call `next()` to pass control to the next handler. Examples in LabVault include authentication checks (`isLoggedIn`), session initialization, and request body parsing.

---

### Q9: What is the difference between `status: Approved` and `status: Issued`?
**Answer:** 
- **Approved:** The Lab In-charge has officially permitted the request, but physical hardware has not left the lab yet. Stock is not yet deducted.
- **Issued:** The student has physically arrived at the laboratory and collected the hardware. At this precise moment, `availableQuantity` is deducted and `issuedQuantity` is increased.

---

### Q10: How does the system prevent deleting an asset that is currently with a student?
**Answer:** In `adminController.postDeleteAsset`, the server checks `if (asset.issuedQuantity > 0)`. If units are currently issued, the deletion is rejected with an error message. The UI also renders a "Locked" badge instead of an active delete button.

---

### Q11: What is `connect-flash` and how is it used?
**Answer:** `connect-flash` is middleware used to store temporary flash messages in the session. Messages are written before a redirect (e.g., `req.flash('success', 'Equipment returned successfully')`) and rendered on the subsequent page, after which they are automatically cleared from the session.

---

### Q12: How are database relationships modeled in Mongoose?
**Answer:** We use **ObjectId References** (Normalization). In `Request.js`, the `requester` field stores a `mongoose.Schema.Types.ObjectId` referencing the `User` collection, and the `asset` field references the `Asset` collection. When fetching requests, we use `.populate('asset')` and `.populate('requester')` to join documents efficiently.

---

### Q13: What is a Mongoose Virtual?
**Answer:** A virtual is a document property that can be read like a regular field but is computed dynamically on-the-fly and is **not** persisted to MongoDB. In `Request.js`, `isOverdue` is a virtual getter that compares `expectedReturnDate` with current time.

---

### Q14: How does the app handle responsive design for mobile devices?
**Answer:** In `public/css/style.css`, CSS media queries (`@media (max-width: 992px)`) hide the fixed sidebar and enable a mobile navigation drawer triggered by a hamburger button. Data tables feature horizontal overflow containers (`.table-responsive`), and dashboard statistic grids collapse from 4 columns to 1 column.

---

### Q15: Why is `.env` added to `.gitignore`?
**Answer:** The `.env` file contains sensitive production secrets like the database connection string and session secret key. Committing `.env` to a public repository like GitHub exposes security credentials. We provide `.env.example` as a template with placeholder values instead.

---

### Q16: How do you prevent SQL/NoSQL injection?
**Answer:** Mongoose schemas strictly sanitize and cast input types. For example, quantity is cast to a strict Number, and ObjectId fields are validated as 24-character hexadecimal strings. We also use explicit object matching in MongoDB queries instead of raw string concatenations.

---

### Q17: What does `method-override` do?
**Answer:** Standard HTML forms only support `GET` and `POST` methods. `method-override` allows HTML forms to submit `PUT` and `DELETE` requests using query strings (e.g., `?_method=DELETE`) or hidden fields, adhering to RESTful conventions.

---

### Q18: What is the function of `seed.js`?
**Answer:** `seed.js` is a provisioning script that connects to MongoDB, clears stale test collections, and seeds three pre-hashed demo accounts (Admin, Lab In-charge, Student), 10 realistic assets, active issues, overdue records, and maintenance logs for immediate demonstration.

---

### Q19: How is the application deployed to production on Render?
**Answer:** Render connects to our GitHub repository. In the service settings:
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `PORT`, `MONGODB_URI` (pointing to MongoDB Atlas), and `SESSION_SECRET`.
Render automatically pulls code, installs dependencies, and serves the application over HTTPS.

---

### Q20: What is the purpose of `app.use(express.urlencoded({ extended: true }))`?
**Answer:** It is a built-in Express middleware that parses incoming HTTP requests with URL-encoded payloads (typically from HTML `<form>` submissions) and populates `req.body` with JavaScript key-value pairs.

---

### Q21: What are unique indexes in Mongoose and where are they used here?
**Answer:** Unique indexes enforce uniqueness at the database level. In `User.js`, `email` has `unique: true` to prevent duplicate user registrations. In `Asset.js`, `assetTag` has `unique: true` to ensure no two physical pieces of hardware share the same barcode/serial tag.

---

### Q22: What happens if MongoDB goes down while the server is running?
**Answer:** In `config/db.js`, connection events log descriptive errors, and Express error-handling middleware catches connection timeouts, displaying a user-friendly error page instead of crashing the Node process.

---

### Q23: Why did you choose the Velvet Black × Velvet Burgundy color scheme?
**Answer:** Most university student projects use default Bootstrap templates with plain white backgrounds and blue buttons. The Velvet Black (`#0B090A`) and Velvet Burgundy (`#4A0E1C`) theme with champagne accents provides a premium, modern SaaS aesthetic comparable to high-end financial and asset tracking platforms.

---

### Q24: How would this system scale if the university had 10 different campus labs?
**Answer:** We could add a `Department` or `CampusLab` model and add a `labId` foreign key to `Asset` and `Request`. The Lab In-charge role would then be scoped so that an in-charge from the "Electronics Lab" only manages equipment located in their designated laboratory.

---

### Q25: If you had 2 more weeks to work on this, what feature would you add first?
**Answer:** Printable QR Code labels for every asset tag. Lab in-charges could use their smartphone camera or a USB barcode scanner to instantly pull up the asset details during physical handover and return.
