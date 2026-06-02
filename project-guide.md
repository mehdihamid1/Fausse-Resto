# Café Fausse — Restaurant Web Application Project

---

## Table of Contents

1. [Project Objective](#project-objective)
2. [Easy Way To Understand](#easy-way-to-understand)
3. [Business Requirements](#business-requirements)
4. [Application Architecture](#application-architecture)
5. [Docker-Based Development Setup](#docker-based-development-setup)
6. [Steps To Proceed](#steps-to-proceed)
7. [Demo Checklist](#demo-checklist)
8. [Submission Checklist](#submission-checklist)
9. [Project Rubric](#project-rubric)

---

## Project Objective

The goal of this project is to build a complete restaurant web application for **Café Fausse**. The website should help customers learn about the restaurant, view the menu, browse photos, sign up for a newsletter, and make table reservations online.

Students must demonstrate the ability to turn customer requirements into a working web application using:

- **React and JSX** for the front end
- **CSS, Flexbox, or Grid** for layout and responsive design
- **Flask/Python** for backend logic
- **PostgreSQL** for storing customers, newsletter signups, and reservations

---

## Easy Way To Understand

Think of the project as building a **real restaurant website**.

The customer should be able to:

1. Visit the homepage.
2. Read about the restaurant.
3. View the menu.
4. See gallery photos.
5. Sign up for the newsletter.
6. Make a reservation.
7. Receive confirmation if a table is available.
8. Be told to choose another time if the reservation slot is full.

The teacher/grader wants to see that the website is **not just pretty, but also functional**.

---

## Business Requirements

These are the specific requirements Café Fausse has asked for. Every item below must be present in the final website.

### Content Requirements

| # | Requirement | Where It Belongs |
|---|-------------|-----------------|
| 1 | Contact information: address, phone number, and opening hours | Home page |
| 2 | Menu broken up by food and drink categories | Menu page |
| 3 | About Us page highlighting the owners | About Us page |
| 4 | Photo gallery page | Gallery page |
| 5 | Photos used throughout the site (not just the gallery) | All pages |
| 6 | Awards and positive reviews showcase | About Us page or Home page |
| 7 | Email newsletter signup form with basic input validation | Any page (typically Home or Footer) |
| 8 | Table reservation system accessible via the website | Reservations page |
| 9 | Consistent CSS theme across the entire site using Flexbox or Grid | All pages |
| 10 | Mobile responsive design (verified with Chrome mobile simulator) | All pages |
| 11 | Cross-browser compatibility (tested on multiple browsers) | All pages |

### Reservation System Requirements

The reservation system is the most technically complex requirement. It must:

| # | Requirement |
|---|-------------|
| 1 | Allow the customer to select a specific date and time slot |
| 2 | Allow the customer to input the number of guests |
| 3 | Require the customer's name |
| 4 | Require the customer's email address |
| 5 | Accept an optional phone number |
| 6 | Store the reservation in the PostgreSQL database |
| 7 | Assign a random available table number (1–30) for the chosen time slot |
| 8 | Check that the time slot is not fully booked before confirming |
| 9 | Send a **confirmation message** if a table is available |
| 10 | Send a **"choose another time" message** if all 30 tables are booked |

### Newsletter Signup Requirements

| # | Requirement |
|---|-------------|
| 1 | Use a form with input validation |
| 2 | Store the signup in the backend PostgreSQL database |
| 3 | Link the signup to the customer record via the Customers table |

### Image Requirements

- Images used across the site must be **royalty-free** or **AI-generated**
- A collection of images has been provided for use
- Additional images may be added if they are royalty-free or AI-generated

---

## Application Architecture

The Café Fausse web application will use a simple three-entity architecture:

1. **Browser**
2. **Application Server**
3. **Database Server**

These three entities work together to create a complete full-stack web application.

| Entity | Technology | Docker Service | Main Responsibility |
| --- | --- | --- | --- |
| Browser | React, JSX, CSS | `frontend` container serves the React app to the browser | Displays the website, handles user interaction, and sends form data to the application server |
| Application Server | Flask, Python | `backend` container | Receives requests, validates data, applies reservation logic, and communicates with the database server |
| Database Server | PostgreSQL | `db` container | Stores customer records, newsletter signups, and reservation records |

The browser, application server, and database server should be understood as separate parts of the system. During development, the frontend, backend, and database will be run as separate Docker services using Docker Compose.

The public browser entry point will use the DNS name **`fausse-cafe.com`**. In the Docker setup, this DNS name is handled by an Nginx ingress service, which routes page requests to the React frontend and API requests to the Flask backend.

---

### 1. Browser: React and JSX

The browser is where the customer sees and uses the website.

The browser loads the **React and JSX front end** served by the `frontend` Docker container and will include at least five pages:

- **Home**: introduces Café Fausse, highlights the restaurant, and shows key information.
- **Menu**: displays food and drink items organized by category.
- **Reservations**: allows customers to request a table reservation.
- **About Us**: explains the restaurant story, owners, awards, and reviews.
- **Gallery**: shows restaurant photos and food images.

The React front end will also include reusable components such as:

- Navigation bar
- Footer
- Menu item cards
- Gallery image sections
- Reservation form
- Newsletter signup form

CSS, Flexbox, and/or Grid will be used to make the site attractive, organized, and responsive on different screen sizes.

---

### 2. Application Server: Flask and Python

The application server is where the backend logic runs.

It will run the **Flask/Python back end** inside the `backend` Docker container and will receive form submissions from the React front end in the browser.

The Flask back end will handle:

- Newsletter signup requests
- Reservation requests
- Customer information
- Reservation availability checks
- Database communication
- Success and error responses sent back to React

For example, when a customer submits a reservation form, Flask will check whether a table is available for the selected date and time. If a table is available, Flask will save the reservation and send a confirmation message. If all 30 tables are already booked for that time slot, Flask will tell the customer to choose another time.

#### Reservation Capacity Rule

The project uses a maximum of **30 tables per time slot** because the assignment instructions state that the system should assign a random available table and **assume there are 30 tables total**.

This rule should be enforced in two places:

- **Flask backend logic**: only table numbers `1` through `30` can be assigned.
- **PostgreSQL database schema**: table numbers should be restricted to the valid range of `1` through `30`.

In the implementation, this appears as:

```python
TABLE_COUNT = 30
```

and in the database schema:

```sql
table_number INTEGER NOT NULL CHECK (table_number BETWEEN 1 AND 30)
```

This allows the demo to prove that once all 30 tables are booked for the same date and time, the system correctly asks the customer to choose another time.

---

### 3. Database Server: PostgreSQL

The database server stores the information submitted by customers.

It will run **PostgreSQL** inside the `db` Docker container with at least two main tables:

#### Customers Table

Stores customer information.

Required fields:

- Customer ID
- Customer Name
- Customer Email
- Phone Number
- Newsletter Signup

#### Reservations Table

Stores reservation information.

Required fields:

- Reservation ID
- Customer ID
- Time Slot
- Table Number

The Customers table and Reservations table are connected using the **Customer ID**. This allows each reservation to be linked to the correct customer.

---

### How The System Works

The basic flow of the application is:

1. A customer opens the website in a browser.
2. The browser loads the React front end served by the `frontend` Docker container.
3. The customer fills out a newsletter or reservation form.
4. React sends the form information to the Flask application server running in the `backend` Docker container.
5. Flask validates the information and applies the required logic.
6. Flask sends a database request to PostgreSQL running in the `db` Docker container.
7. PostgreSQL stores or retrieves the required information from the Docker-managed database volume.
8. Flask sends a success or error message back to React.
9. React displays the message to the customer in the browser.

This architecture shows that the project is more than a static website. It is a working full-stack web application with a user interface, backend logic, and persistent database storage.

---

### Three-Entity Deployment View

This view shows the three main entities as separate parts of the system.

```text
  +-----------------------------+        HTTPS / HTTP        +-----------------------------+
  |           BROWSER           | <------------------------> |      APPLICATION SERVER     |
  |                             |                            |                             |
  |  Loads React front end      |                            |  backend Docker container   |
  |  Displays website pages     |                            |  Handles API routes         |
  |  Sends form submissions     |                            |  Validates user input       |
  |  Shows response messages    |                            |  Applies reservation logic  |
  +-----------------------------+                            +--------------+--------------+
                                                                            |
                                                                            | SQL Connection
                                                                            v
                                                             +-----------------------------+
                                                             |       DATABASE SERVER       |
                                                             |                             |
                                                             |  db Docker container        |
                                                             |  Stores Customers table     |
                                                             |  Stores Reservations table  |
                                                             |  Stores newsletter signups  |
                                                             +-----------------------------+
```

In this setup, the **Browser**, **Application Server**, and **Database Server** are treated as three distinct entities. The browser does not talk directly to the database. It sends requests to the application server, and the application server communicates with the database server.

The Docker services are:

- `ingress`: Nginx entry point for `fausse-cafe.com`.
- `frontend`: builds and serves the React application.
- `backend`: runs the Flask API application.
- `db`: runs the PostgreSQL database.

---

### API Call Interactions

The browser communicates with the application server through API calls. These API calls allow the React front end to send data to Flask and receive results back as JSON responses.

| User Action | Browser / React API Call | Flask Controller Action | Database Server Action | Response Back To Browser |
| --- | --- | --- | --- | --- |
| Customer submits newsletter form | `POST /api/newsletter` | Validate name and email | Create or update customer newsletter signup | Signup success or validation error |
| Customer submits reservation form | `POST /api/reservations` | Validate reservation details and check availability | Store customer and reservation if a table is available | Reservation confirmation or choose another time |
| Customer views menu page | `GET /api/menu` | Request menu data | Optional: read menu items from database | Menu categories and items |
| Customer views gallery page | `GET /api/gallery` | Request gallery data | Optional: read image records from database | Gallery image list |
| Developer verifies stored customers | `GET /api/customers` | Optional development/testing route | Read customer records | Customer data for testing only |
| Developer verifies stored reservations | `GET /api/reservations` | Optional development/testing route | Read reservation records | Reservation data for testing only |

```text
  Browser / React                         Application Server / Flask                  Database Server / PostgreSQL
        |                                             |                                             |
        | POST /api/reservations                      |                                             |
        |-------------------------------------------->|                                             |
        |                                             | Validate customer and reservation data      |
        |                                             | Check selected date and time                |
        |                                             |                                             |
        |                                             | Query available tables                      |
        |                                             |-------------------------------------------->|
        |                                             |                                             | Check reservations table
        |                                             |                                             | Return booked tables
        |                                             |<--------------------------------------------|
        |                                             |                                             |
        |                                             | If available, save customer/reservation     |
        |                                             |-------------------------------------------->|
        |                                             |                                             | Insert customer record
        |                                             |                                             | Insert reservation record
        |                                             |<--------------------------------------------|
        |                                             |                                             |
        | JSON confirmation or error message          |                                             |
        |<--------------------------------------------|                                             |
        |                                             |                                             |
        | Show result to customer                     |                                             |
        v                                             v                                             v
```

The most important API call is `POST /api/reservations` because it proves that the project has working frontend forms, backend logic, database storage, and reservation availability checking.

For the recorded demo, the database changes should be shown directly in PostgreSQL, not through an admin page or testing-only API route.

---

### MVC Interaction Drawing

This project follows the idea of **MVC**, which stands for **Model, View, Controller**.

- **View**: What the user sees and interacts with. In this project, the View is the **React website running in the browser**.
- **Controller**: The logic that receives user actions and decides what should happen next. In this project, the Controller is the **Flask back end running on the application server**.
- **Model**: The data layer that stores and retrieves information. In this project, the Model is the **PostgreSQL database running on the database server**.

```text
                       MVC Interaction Flow

  +-------------------------------------------------------------+
  |                           USER                              |
  |          Customer clicks links, fills forms, submits data    |
  +-----------------------------+-------------------------------+
                                |
                                v
  +-------------------------------------------------------------+
  |                VIEW: Browser / React Front End              |
  |                                                             |
  |  Pages: Home, Menu, Reservations, About Us, Gallery          |
  |  Components: Navbar, Footer, Forms, Menu Cards, Gallery      |
  +-----------------------------+-------------------------------+
                                |
                                | HTTP Request
                                | Example: reservation form data
                                v
  +-------------------------------------------------------------+
  |          CONTROLLER: Application Server / Flask Back End     |
  |                                                             |
  |  Receives form data                                         |
  |  Validates input                                            |
  |  Checks reservation availability                            |
  |  Sends success or error response                            |
  +-----------------------------+-------------------------------+
                                |
                                | SQL Query / Database Action
                                v
  +-------------------------------------------------------------+
  |              MODEL: Database Server / PostgreSQL Database    |
  |                                                             |
  |  Customers Table                                            |
  |  Reservations Table                                         |
  |  Newsletter signup information                              |
  +-----------------------------+-------------------------------+
                                |
                                | Data returned to Flask
                                v
  +-------------------------------------------------------------+
  |          CONTROLLER: Application Server / Flask Back End     |
  |          Builds response based on database result            |
  +-----------------------------+-------------------------------+
                                |
                                | JSON Response
                                v
  +-------------------------------------------------------------+
  |                VIEW: Browser / React Front End              |
  |      Shows confirmation message or asks user to retry        |
  +-------------------------------------------------------------+
```

In simple terms, the customer uses the **View**, the **Controller** handles the request, and the **Model** stores or retrieves the data. Then the result travels back through the Controller to the View so the customer can see the final message.

---

## Docker-Based Development Setup

The project will use **Docker Compose** so that all major parts of the application can run together with one command.

Docker will be used for:

- The React frontend
- The Flask backend
- The PostgreSQL database

This avoids needing to install PostgreSQL directly on the local machine and keeps the project easier to run, test, and demonstrate.

### Docker Services

| Service Name | Container Purpose | Typical Port | Notes |
| --- | --- | --- | --- |
| `ingress` | Routes `fausse-cafe.com` traffic to the correct internal service | `80` | Public browser entry point |
| `frontend` | Runs or serves the React application | `3000` or `5173` | The browser opens this service to use the website |
| `backend` | Runs the Flask API application | `5000` | React sends API requests to this service |
| `db` | Runs the PostgreSQL database | `5432` | Flask connects to this service using the Docker network |

### Expected Project Structure

```text
cafe-fausse/
  docker-compose.yml
  frontend/
    Dockerfile
    package.json
    src/
  backend/
    Dockerfile
    requirements.txt
    app/
  database/
    init.sql
  README.md
  ai-tooling.md
```

### Docker Compose Flow

```text
  docker compose up --build
          |
          v
  +-------------------+       +-------------------+       +-------------------+
  | frontend service  | ----> | backend service   | ----> | db service        |
  | React app         | API   | Flask app         | SQL   | PostgreSQL        |
  +-------------------+       +-------------------+       +-------------------+
```

### Environment Variables

The backend should connect to PostgreSQL using environment variables from Docker Compose.

Example values:

```text
POSTGRES_DB=cafe_fausse
POSTGRES_USER=cafe_user
POSTGRES_PASSWORD=cafe_password
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_URL=postgresql://cafe_user:cafe_password@db:5432/cafe_fausse
```

The important detail is that the Flask backend connects to the database host named `db`, because `db` is the PostgreSQL service name inside Docker Compose.

### Ingress DNS Entry

The local DNS entry should be:

```text
127.0.0.1 fausse-cafe.com
```

After this host entry is added, the browser can open:

```text
http://fausse-cafe.com
```

The Nginx ingress service will route:

- `http://fausse-cafe.com/` to the React frontend
- `http://fausse-cafe.com/api/...` to the Flask backend

### Demo Database Access

For the recorded demo, database changes can be shown directly from the PostgreSQL container.

Example command:

```bash
docker compose exec db psql -U cafe_user -d cafe_fausse
```

Then queries such as the following can show the stored records:

```sql
SELECT * FROM customers;
SELECT * FROM reservations;
```

---

## Steps To Proceed

1. Read the SRS carefully and note every requirement.
2. Plan the five required pages:
   - Home
   - Menu
   - Reservations
   - About Us
   - Gallery
3. Build the React front end using reusable components (Navbar, Footer, forms, cards).
4. Style the website with consistent CSS using Flexbox or Grid across all pages.
5. Create the reservation form (name, email, optional phone, date/time, guest count) and the newsletter signup form with basic input validation.
6. Create the Docker project structure:
   - `frontend/` for the React app
   - `backend/` for the Flask app
   - `database/` for PostgreSQL initialization scripts
   - `docker-compose.yml` to run all services together
7. Build the Flask backend:
   - Create the Flask app and project structure
   - Define API routes: `POST /api/newsletter`, `POST /api/reservations`, `GET /api/customers`, `GET /api/reservations`
   - Add reservation availability logic (30 tables max per time slot; assign a random available table)
   - Return JSON success or error responses
8. Set up PostgreSQL in the `db` Docker container and create the required tables:
   - **Customers**: Customer ID, Customer Name, Customer Email, Phone Number, Newsletter Signup
   - **Reservations**: Reservation ID, Customer ID, Time Slot, Table Number
9. Connect the Flask routes to PostgreSQL using a database library (e.g. psycopg2 or SQLAlchemy).
10. Connect the React forms to the Flask API routes and display success/error messages to the user.
11. Run the full application with `docker compose up --build`.
12. Test all pages, navigation links, form submissions, and verify database rows are created correctly.
13. Check the site on multiple browsers and screen sizes (use Chrome's mobile simulator).
14. Record a 5–10 minute demo showing the full website and live database updates.
15. Prepare the GitHub repository with `README.md` and `ai-tooling.md`.
16. Submit the PDF with the demo video link and GitHub repository link.

---

## Demo Checklist

Use this checklist to make sure your 5–10 minute recorded demo covers everything the grader needs to see.

**Identity Verification**
- [ ] Government-issued ID shown clearly to the camera (name and photo visible)
- [ ] Each presenter states their name on camera
- [ ] All group members have their video camera enabled and speak at least once

**Website Pages**
- [ ] Home page shown
- [ ] Menu page shown
- [ ] Reservations page shown
- [ ] About Us page shown
- [ ] Gallery page shown
- [ ] Navigation between pages demonstrated

**Newsletter Signup**
- [ ] Newsletter form filled out and submitted
- [ ] Success message shown in the browser
- [ ] New row visible directly in the PostgreSQL database (not via an admin page)

**Reservation System**
- [ ] Reservation form filled out with name, email, date/time, and guest count
- [ ] Successful reservation confirmed in the browser
- [ ] New rows visible directly in the Customers and Reservations tables in PostgreSQL
- [ ] Fully booked time slot tested — system returns "choose another time" message

**Implementation Discussion**
- [ ] Brief explanation of key design and implementation decisions
- [ ] AI tools used and how they helped are mentioned

---

## Submission Checklist

Use this checklist before submitting to make sure nothing is missed.

**GitHub Repository**
- [ ] Repository is set to **private**
- [ ] `quantic-grader` added as a collaborator via Settings > Collaborators > Add people
- [ ] All frontend source code included
- [ ] All backend source code included
- [ ] `README.md` included — describes the project, its design, and how to run it locally
- [ ] `ai-tooling.md` included — summarizes which AI tools were used and how (what worked, what didn't)
- [ ] *(Optional)* `staging.md` included — link to staging server or note that it runs locally only

**PDF Submission**
- [ ] Link to the recorded demo video included
- [ ] GitHub repository link(s) included
- [ ] For a group: only ONE member submits on behalf of the group
- [ ] For a group: Group Project Agreement final page signed by all members and uploaded

---

## Project Rubric

Scores **2 and above** are considered passing. Students who receive a **1 or 0** will not get credit for the assignment and must revise and resubmit to receive a passing grade.

---

### Score 5 — Addresses ALL of the project requirements, including:

- The minimum five pages of the Web site have been built using React and JSX
- All of the requirements requested in the SRS have been implemented
- The Web site maintains good appearance and evidences excellent UI and UX design
- Appropriate use of Flexbox or Grid approaches has been made to achieve a high quality UX
- Where forms are needed to meet user requirements, these have been correctly implemented and are working
- A back-end Flask app and database correctly integrated with the React front-end and meeting the requirements for the reservation and newsletter signup system
- The demo presentation presents all required elements, including the correct effect of reservations and newsletter signups on the backend database and sophisticated reservations logic
- A document outlines what AI code generation tools have been used and how

---

### Score 4 — Addresses MOST of the project requirements, including:

- At least four pages of the Web site have been built using React and JSX
- Most of the fundamental functions requested in the SRS have been implemented
- The Web site maintains good appearance and evidences good UI and UX design
- Appropriate use of Flexbox or Grid approaches has been made to achieve a high quality UX
- Where forms are needed to meet user requirements, these have been correctly implemented and are working
- A back-end Flask app and database correctly integrated with the React front-end and meeting the requirements for the reservation and newsletter signup system
- The demo presentation presents almost all required elements, including the correct effect of reservations and newsletter signups on the backend database
- A document outlines what AI code generation tools have been used and how

---

### Score 3 — Addresses SOME of the project requirements, including:

- Three or more of the pages of the Web site have been built using React and JSX
- Some of the fundamental functions requested in the SRS have been implemented
- The Web site maintains good appearance and evidences good UI and UX design
- Appropriate use of Flexbox or Grid approaches has been made to achieve a high quality UX
- Where forms are needed to meet user requirements, these have been correctly implemented and are working
- A back-end Flask app and database correctly integrated with the React front-end and meeting most of the requirements for the reservation and newsletter signup system
- The demo presentation presents most required elements, but does not include the correct effect of reservations and newsletter signups on the backend database
- A document outlines what AI code generation tools have been used and how

---

### Score 2 — Addresses FEW of the project requirements, including:

- Two or more of the minimum five pages of the Web site have been built using React and JSX
- Few of the fundamental functions requested in the SRS have been implemented
- The Web site maintains average appearance and evidences limited UI and UX design
- Limited or inconsistent use of Flexbox or Grid approaches — layout quality is below expectations
- Where forms are needed to meet user requirements, these have been correctly implemented and are partially working
- A back-end Flask app and database correctly integrated with the React front-end and meeting few of the requirements for the reservation and newsletter signup system
- The demo presentation presents only a few required elements, and does not include the correct effect of reservations and newsletter signups on the backend database
- A document outlines what AI code generation tools have been used and how

---

### Score 1 — Addresses the project but MOST of the project requirements are missing, including:

- Less than two of the pages of the Web site have been correctly built using React and JSX
- Most of the fundamental functions requested in the SRS have not been implemented
- Poor UI and UX design is evidenced
- Appropriate use of Flexbox or Grid approaches has not been made to achieve a high quality UX
- Where forms are needed to meet user requirements, these have not been correctly implemented
- A back-end Flask app and database correctly integrated with the React front-end has not been achieved
- A very limited or missing demo presentation
- A document outlining what AI code generation tools have been used and how is not included

---

### Score 0

- The student either did not complete the assignment, plagiarized all or part of the assignment, or completely failed to address the project requirements.
