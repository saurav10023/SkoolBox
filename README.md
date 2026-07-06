# School Cart

School Cart is a full-stack e-commerce platform designed to simplify the purchase of school essentials such as uniforms, socks, and bags. The platform enables parents to order school products online and receive them through home delivery while providing sellers with inventory, order, and customer management capabilities.

## Features

### Authentication & Security

* JWT-based authentication
* Secure password hashing with bcrypt
* Email verification during user registration
* Password reset via email
* OTP-based authentication support
* Role-based access control (Admin/User)
* Protected admin routes

### Customer Features

* Browse products by category
* Product details page
* Shopping cart management
* Wishlist functionality
* Address management
* Secure checkout process
* Razorpay payment integration
* Cash on Delivery (COD) support
* Order tracking timeline
* Order history management
* Refund request workflow

### Admin Features

* Product CRUD operations
* Inventory management
* Order management and status updates
* User management
* Sales analytics dashboard
* Refund request review and processing
* Product image management

### Payments & Orders

* Razorpay payment gateway integration
* Payment verification and transaction tracking
* COD support
* Order lifecycle management:

  * Pending
  * Processing
  * Shipped
  * Delivered
  * Cancelled
  * Refund Initiated
  * Refunded

### Media & Storage

* Cloudinary-based image upload and storage
* Multi-image product support
* Automatic image cleanup on deletion

### Deployment & Infrastructure

* Frontend deployed on Vercel
* Backend deployed on Render
* MongoDB Atlas database
* Environment-based configuration management
* CORS-secured API communication

## Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Context API
* React Router

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* MongoDB Atlas

### Cloud & Services

* Cloudinary
* Razorpay
* Nodemailer
* Vercel
* Render

## Architecture

Routes → Controllers → Services → MongoDB

## Project Goal

School Cart aims to digitize the purchase of school essentials in the same way school fee payments have moved online, providing convenience for working parents while simplifying operations for sellers and schools.
