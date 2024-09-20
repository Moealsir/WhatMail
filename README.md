Here's the updated `README.md` file with the correct database information:

---

# What'smail

**What'smail** is a web application that allows users to automate and send scheduled emails through WhatsApp. Built with Next.js, the project leverages the Puppeteer library to interact with WhatsApp Web and automate messaging.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Development Report](#development-report)
- [Challenges](#challenges)
- [Future Improvements](#future-improvements)
- [License](#license)

## Features

- **Automated Messaging:** Send scheduled messages through WhatsApp using Puppeteer.
- **User Authentication:** Secure user login and registration.
- **Email Scheduling:** Set specific dates and times for messages to be sent.
- **Dashboard:** Manage scheduled messages and view their status.

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/)
- **Backend:** [Node.js](https://nodejs.org/)
- **Automation:** [Puppeteer](https://pptr.dev/)
- **Database:** [SQL (MySQL)](https://www.mysql.com/)
- **Authentication:** Custom authentication with JWT (JSON Web Tokens)
- **Styling:** CSS Modules, TailwindCSS

## Project Structure

```
.
├── components      # Reusable UI components
├── pages           # Next.js pages and API routes
├── public          # Static assets
├── styles          # Global and component-specific styles
├── utils           # Utility functions
├── database        # SQL database connection and queries
└── README.md       # Project documentation
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/whatsmail.git
   ```

2. Change to the project directory:

   ```bash
   cd whatsmail
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory with the following variables:

   ```bash
   DB_HOST=your-database-host
   DB_USER=your-database-username
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   JWT_SECRET=your-jwt-secret
   ```

5. Initialize the database:

   - Run the SQL script located in the `database` folder to create necessary tables and seed initial data.
   - Alternatively, you can use an ORM like Sequelize to manage migrations and seeding.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Usage

1. Sign up or log in using your email and password.
2. Navigate to the dashboard to create a new scheduled message.
3. Enter the recipient's phone number, message content, and schedule date/time.
4. Save the schedule. The message will be sent automatically at the specified time.

## Development Report

During development, we focused on integrating Puppeteer with Next.js to enable automated message sending through WhatsApp Web. We successfully implemented user authentication, message scheduling, and database management using SQL. Key achievements include:

- **Integration of Puppeteer with SQL Database:** Leveraged Puppeteer to automate WhatsApp messaging, securely storing schedules and user data in the SQL database.
- **Custom Authentication:** Implemented JWT-based authentication for secure user management.

## Challenges

- **Automation Constraints:** Handling dynamic elements and avoiding bot detection on WhatsApp Web required careful management of Puppeteer scripts.
- **Database Integration:** Managing asynchronous database queries and ensuring data integrity for scheduling operations was complex.

## Future Improvements

- **Enhanced User Interface:** Improve the user interface for better usability and accessibility.
- **Advanced Scheduling Features:** Add features like recurring messages and group messaging support.
- **Performance Optimization:** Optimize Puppeteer scripts for better performance and reduced resource consumption.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

You can modify the content based on your specific project details and configurations.
