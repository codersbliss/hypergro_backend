# Property Listing Management System

A comprehensive backend system for managing property listings with features like CRUD operations, advanced filtering, user authentication, and property favorites.

## Tech Stack

- TypeScript / Node.js
- MongoDB (for database)
- Redis (for caching)
- Express (for API server)

## Features

- User authentication (register, login)
- Property CRUD operations with owner validation
- Advanced search/filtering on all property attributes
- Redis caching for optimized performance
- User favorites functionality
- Property recommendation system

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Redis (local or remote)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd property-listing-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/property-listing
JWT_SECRET=your_secret_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. Import the property data:
```bash
npm run import-data
```

5. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user details
- `PUT /api/users/update` - Update user details
- `PUT /api/users/update-password` - Update user password

### Properties
- `GET /api/properties` - Get all properties (with pagination)
- `GET /api/properties/:id` - Get a single property
- `POST /api/properties` - Create a new property (requires authentication)
- `PUT /api/properties/:id` - Update a property (requires ownership)
- `DELETE /api/properties/:id` - Delete a property (requires ownership)
- `GET /api/properties/user/me` - Get all properties created by current user

### Favorites
- `GET /api/favorites` - Get all favorites for current user
- `POST /api/favorites` - Add a property to favorites
- `DELETE /api/favorites/:id` - Remove a property from favorites
- `PUT /api/favorites/:id` - Update favorite notes
- `GET /api/favorites/check/:propertyId` - Check if a property is in favorites

### Recommendations
- `POST /api/recommendations` - Create a recommendation
- `GET /api/recommendations/received` - Get recommendations received by current user
- `GET /api/recommendations/sent` - Get recommendations sent by current user
- `PUT /api/recommendations/:id/read` - Mark recommendation as read
- `DELETE /api/recommendations/:id` - Delete recommendation
- `GET /api/recommendations/unread-count` - Get unread recommendations count

### Search
- `GET /api/search` - Advanced search with multiple filters
- `GET /api/search/text` - Text search across multiple fields

## Deployment

- Deployed on render

## License

- This project is licensed under the MIT License.