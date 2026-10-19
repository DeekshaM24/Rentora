# 🏠 Rentora — Find a Place That Feels Like Home

**Rentora** is a rental discovery and roommate-matching platform designed to make finding a suitable home easier, smarter, and more convenient. It brings property discovery, rental comparison, roommate matching, and owner connections together in one platform.

> 🚧 **Project Status: In Development**

## 📌 About the Project

Finding a rental home can be challenging due to scattered property listings, unclear rental costs, difficulty contacting property owners, and the challenge of finding compatible roommates.

Rentora aims to simplify this process by providing a centralized platform where users can discover properties, compare rental options, save favorites, connect with property owners, and explore roommate opportunities.

The goal is to create a user-friendly, reliable, and elegant rental platform that makes the home-searching experience more organized and convenient.

## 🎯 Objectives

- Simplify the process of finding rental properties.
- Help users compare properties and rental costs.
- Connect renters directly with property owners.
- Help users discover compatible roommates.
- Provide a convenient way to manage property enquiries and visits.
- Offer optional premium services for property owners.
- Create a responsive and intuitive user experience.

## ✨ Key Features

### 🏡 Property Discovery
- Browse available rental properties.
- Search properties by location and budget.
- Filter by property type, bedrooms, furnishing, and amenities.
- Sort listings by price and newest additions.
- View detailed property information and photographs.

### ⚖️ Property Comparison
- Compare multiple properties side by side.
- Compare rent, security deposits, location, size, and amenities.
- Estimate initial move-in costs.
- Make more informed rental decisions.

### ❤️ Favorites
- Save properties for future reference.
- Manage a personalized favorites list.
- Revisit shortlisted properties conveniently.

### 👥 Roommate Matching
- Create a roommate profile.
- Specify budget, preferred location, and move-in date.
- Explore lifestyle preferences and compatibility.
- Send and manage roommate connection requests.

### 🤝 Property Owner Connections
- Publish and manage rental listings.
- Receive property enquiries.
- Respond to interested renters.
- Schedule and manage property visits.

### 📊 User Dashboards
- Access relevant information from a personalized dashboard.
- Manage saved properties and preferences.
- Track enquiries and scheduled visits.
- Provide separate experiences for renters and property owners.

### 💳 Premium Services
- Free property listing options.
- Featured listing promotions.
- Optional subscription plans.
- Payment history and transaction status.

*Premium services and payment integration are planned features and may not yet be fully functional.*

### 💱 Currency Display
- Support for displaying rental prices in INR and USD.
- Centralized currency conversion logic.
- Consistent currency display across property listings and comparisons.

*Live exchange-rate integration is planned.*

## 🎨 Design Philosophy

Rentora aims to deliver a premium real-estate experience through:

- Elegant and modern interface design.
- Luxury property photography.
- Carefully selected colors and typography.
- Responsive layouts for desktop, tablet, and mobile.
- Smooth transitions and intuitive navigation.
- Clear property information and easy-to-use forms.

## 🛠️ Technology Stack

The intended technology stack includes:

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Frontend interactions |
| Node.js | Backend runtime |
| Express.js | Backend API development |
| MongoDB | Database |
| REST APIs | Communication between frontend and backend |
| Cloud Image Storage | Property and profile images |
| Razorpay | Planned payment integration |
| Git and GitHub | Version control and collaboration |

*The implementation status of each technology depends on the current development stage.*

## 📂 Planned Project Structure

```text
Rentora/
├── index.html
├── assets/
│   ├── images/
│   └── videos/
├── css/
│   ├── foundation.css
│   └── style.css
├── js/
│   ├── app.js
│   ├── data.js
│   ├── auth.js
│   ├── currency.js
│   ├── payment.js
│   └── storage.js
├── pages/
│   ├── listings.html
│   ├── property.html
│   ├── roommates.html
│   ├── compare.html
│   ├── favorites.html
│   ├── profile.html
│   ├── dashboard.html
│   ├── owner-dashboard.html
│   ├── admin-dashboard.html
│   ├── post-property.html
│   ├── login.html
│   ├── register.html
│   ├── pricing.html
│   ├── checkout.html
│   └── payment-history.html
├── server/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
├── .env.example
├── .gitignore
└── README.md
```

*This represents the planned structure. Actual files may differ as development progresses.*

## 🚀 Getting Started

### Prerequisites

Depending on the current implementation, you may need:

- A modern web browser.
- Visual Studio Code or another code editor.
- Git.
- Node.js and npm.
- MongoDB for backend development.

### Installation

**1. Clone the repository**

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

**2. Navigate to the project directory**

```bash
cd Rentora
```

**3. Install dependencies**

If a `package.json` file exists in the project root:

```bash
npm install
```

If the backend has its own `package.json`, navigate to the backend directory and install its dependencies there.

**4. Configure environment variables**

When backend integration is available, create a `.env` file based on `.env.example` and configure the required database and service credentials.

Never commit real secrets or passwords to GitHub.

**5. Run the project**

For a static HTML frontend, use a local development server such as the Live Server extension in Visual Studio Code.

For a configured Node.js backend, use the appropriate start command defined in `package.json`.

*Exact commands depend on the current project structure and configuration.*

## 🔐 Security Considerations

Security is an important part of Rentora's planned development.

- Secure authentication and password hashing.
- Role-based authorization for renters, owners, and administrators.
- Server-side validation of user input.
- Protection of private user information.
- Secure handling of payment credentials.
- Server-side payment verification.
- Safe property image uploads.
- Environment variables for sensitive configuration.

These protections must be implemented and tested before the platform is used with real users or payments.

## 🗺️ Development Roadmap

- [x] Define the project concept and requirements.
- [ ] Build the responsive homepage and design system.
- [ ] Implement property discovery and search filters.
- [ ] Create property details pages.
- [ ] Implement favorites and property comparison.
- [ ] Develop roommate matching.
- [ ] Build login and registration.
- [ ] Create renter and owner dashboards.
- [ ] Implement property posting and management.
- [ ] Add enquiries and visit scheduling.
- [ ] Integrate the database and backend APIs.
- [ ] Implement secure authentication and authorization.
- [ ] Develop the admin dashboard.
- [ ] Integrate currency conversion.
- [ ] Add premium services and payment processing.
- [ ] Complete security and functionality testing.
- [ ] Deploy the application.

*The checklist reflects the intended roadmap. Update it as features are completed and tested.*

## 🌟 Future Enhancements

- Advanced property recommendations.
- Improved roommate compatibility matching.
- Map-based property discovery.
- Saved searches and notifications.
- Verified property-owner profiles.
- Enhanced property analytics.
- Improved accessibility and performance.
- Additional language and currency support.

## 👩‍💻 Project Owner

**Deeksha M**  
Project Owner & Developer

Rentora is being developed as a project focused on improving the rental discovery experience through thoughtful design, practical features, and technology.

## 🤝 Contributions

Suggestions, feedback, and contributions are welcome as the project evolves.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your implementation.
5. Submit a pull request describing your improvements.

## 📄 License

The project's license has not yet been finalized.

A license may be added once the project's distribution and usage terms have been decided.

---

**Rentora — Find a Place That Feels Like Home. 🏠💜**
