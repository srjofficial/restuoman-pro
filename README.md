# RestuomanPro - Restaurant Management System

A comprehensive full-stack restaurant management application built with Angular 21 and Supabase, designed to streamline restaurant operations with role-based access control and real-time data management.

![Angular](https://img.shields.io/badge/Angular-21.1-DD0031?style=flat&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss)
[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=restuoman-pro)](https://restuoman-pro.vercel.app)

## 🚀 Live Demo
**[View Live Application](https://restuoman-pro.vercel.app)**

## 🚀 Features

### Role-Based Access Control
The application supports three distinct user roles with specific permissions:

#### 🔐 Admin Role
- **Employer Management Dashboard**: View, create, and manage all employers
- **User Creation**: Create new employer accounts with restaurant details
- **Status Management**: Activate/deactivate employer accounts
- **System Overview**: Monitor active employers and system activity
- Full administrative control over the platform

#### 🏢 Employer Role
- **Dashboard Overview**: Real-time statistics and business insights
- **Menu Management**:
  - Create and organize menu categories
  - Add menu items with detailed information (name, description, price, ingredients, quantity, unit)
  - Upload item images with built-in image cropping functionality
  - Manage item availability and pricing
- **Employee Management**:
  - Send email invitations to new employees via EmailJS integration
  - View all employees associated with the restaurant
  - Manage employee access and permissions
- **Table Management**:
  - Create and configure restaurant tables
  - Set table capacity and numbers
  - Assign tables to specific employees
  - Track table status (available, occupied, reserved)
- **Billing System**: View all bills and transactions for the restaurant

#### 👤 Employee Role
- **Assigned Tables**: View and manage assigned tables
- **Order Management**: Create and manage customer orders
- **Bill Creation**: Generate bills with automatic tax calculation (5%)
- **Menu Access**: Browse available menu items for order processing

### 💼 Core Functionality

#### Authentication & Authorization
- Secure user authentication powered by Supabase Auth
- Role-based route guards protecting sensitive areas
- Automatic profile creation on user signup
- Session management and persistent login

#### Menu Management System
- **Categories**: Organize menu items into logical categories with custom ordering
- **Menu Items**: Complete item management with:
  - Name, description, and pricing
  - Ingredient lists for allergen information
  - Quantity and unit measurements (kg, g, ml, pcs)
  - Image uploads with cropping capability
  - Availability toggles
- **Image Handling**: Upload and crop images using ngx-image-cropper

#### Employee Invitation System
- **Email Integration**: Automated invitation emails via EmailJS
- **Token-based Invitations**: Secure invitation links with expiration
- **One-time Use**: Invitations automatically marked as used after signup

#### Table & Order Management
- **Table Configuration**: Flexible table setup with capacity management
- **Employee Assignment**: Assign specific tables to employees
- **Status Tracking**: Real-time table availability monitoring

#### Billing System
- **Automatic Calculations**: Auto-compute subtotals, tax (5%), and grand totals
- **Order Items**: Track individual items per bill with quantities and prices
- **Payment Status**: Monitor bill status (open, paid, cancelled)
- **Historical Records**: Complete billing history with timestamps

#### User Profile Management
- **Profile Information**: Manage username, website, avatar, phone, and address
- **Restaurant Details**: Store restaurant name and contact information
- **Avatar Upload**: Custom profile picture support

## 🛠️ Technology Stack

### Frontend
- **Framework**: Angular 21.1 (Standalone Components)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 3.4 with custom configurations
- **UI Components**: Angular Material 21.1
- **Icons**: ng-icons with Heroicons
- **Animations**: AOS (Animate On Scroll)
- **Forms**: Reactive Forms with validation
- **Image Processing**: ngx-image-cropper 9.1

### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for images

### Additional Services
- **Email Service**: EmailJS for invitation emails
- **State Management**: RxJS 7.8

### Build & Development Tools
- **Build System**: Angular CLI 21.1 with Vite
- **Package Manager**: npm 11.8
- **Testing**: Vitest 4.0
- **CSS Processing**: PostCSS with Autoprefixer

## 📊 Database Schema

The application uses a comprehensive PostgreSQL database with the following tables:

### Core Tables

#### `profiles`
Extends Supabase auth.users with additional profile information
- User role (admin, employer, employee)
- Restaurant association (employer_id for employees)
- Contact information (phone, address)
- Profile details (username, avatar, website)
- Account status (is_active)

#### `menu_categories`
Organizes menu items into categories
- Category name and description
- Display ordering
- Employer association
- Active status

#### `menu_items`
Stores detailed menu item information
- Item details (name, description, price)
- Ingredient information
- Quantity and unit measurements
- Image URLs
- Availability status
- Category association

#### `restaurant_tables`
Manages table configurations
- Table number and capacity
- Employer association
- Employee assignments
- Status tracking (available, occupied, reserved)

#### `bills`
Tracks customer bills and payments
- Table and employee associations
- Amount calculations (total, tax, grand total)
- Payment status and timestamps
- Notes and metadata

#### `bill_items`
Individual line items for each bill
- Menu item reference
- Quantity and pricing
- Automatic subtotal calculation

#### `messages`
Internal messaging system
- Sender and receiver profiles
- Subject and message content
- Read status tracking

#### `employee_invitations`
Manages employee invitation workflow
- Email and employer association
- Unique token generation
- Expiration tracking
- Usage status

### Database Features
- **Row Level Security (RLS)**: Comprehensive policies ensuring data isolation
- **Automatic Triggers**: Profile creation on signup, bill total updates
- **Referential Integrity**: Foreign key constraints maintaining data consistency
- **Soft Deletes**: Status-based deactivation for users

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm 11.8 or higher
- Supabase account
- EmailJS account

### Step 1: Clone the Repository
```bash
git clone https://github.com/srjofficial/restuoman-pro.git
cd restuoman-pro
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Supabase

1. Create a new project in [Supabase](https://supabase.com)
2. Run the database migrations in order:
   ```sql
   -- Execute in Supabase SQL Editor
   -- 1. Run: database/01_initial_schema.sql
   -- 2. Run: database/02_fix_rls_policies.sql
   -- 3. Run: database/02_menu_enhancements.sql
   -- 4. Run: database/03_sample_menu_data.sql (optional - sample data)
   -- 5. Run: database/04_fix_invitation_rls.sql
   ```
3. Enable Storage for image uploads:
   - Go to Storage in Supabase dashboard
   - Create a bucket named `avatars` (public)
   - Create a bucket named `menu-items` (public)

### Step 4: Configure Environment

Update Supabase credentials in `src/app/supabase.service.ts`:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### Step 5: Configure EmailJS

Update EmailJS credentials in `src/app/employer/employees/employees.component.ts`:
```typescript
emailjs.send(
  'YOUR_SERVICE_ID',
  'YOUR_TEMPLATE_ID',
  templateParams,
  'YOUR_PUBLIC_KEY'
);
```

### Step 6: Run Development Server
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

## 🔐 Environment Variables (For Production)

When deploying, configure these environment variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# EmailJS Configuration
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

**Note**: For production, use Angular environment files or a secure configuration management service.

## 🚀 Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Watch mode (rebuild on changes)
npm run watch

# Serve production build locally
ng serve --configuration production
```

## 📱 Application Routes

- `/` - Redirects to home
- `/home` - Landing page (protected by homeGuard)
- `/login` - User authentication
- `/signup` - New user registration
- `/profile` - User profile management
- `/admin` - Admin dashboard (admin role required)
- `/employer` - Employer dashboard (employer role required)
  - `/employer/menu` - Menu management
  - `/employer/employees` - Employee management
  - `/employer/tables` - Table management
- `/404` - Not found page

## 🌐 Deployment on Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub (see Git Commands below)
2. Visit [Vercel](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/restuoman-pro/browser`
6. Add environment variables in Vercel dashboard
7. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment Configuration

After deployment, configure these in Vercel Dashboard → Settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`

**Important**: Update your Supabase project's allowed domains to include your Vercel deployment URL.

## 🔧 Git Commands

```bash
# Initialize repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Restaurant Management System"

# Add remote repository
git remote add origin https://github.com/srjofficial/restuoman-pro.git

# Push to GitHub
git push -u origin master
```

## 🎨 Key Design Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Angular Material components with custom styling
- **Animations**: Smooth scroll animations with AOS
- **Dark Theme Support**: Tailwind dark mode utilities
- **Accessibility**: ARIA labels and semantic HTML
- **Image Optimization**: Built-in cropping for consistent image dimensions

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Role Guards**: Route protection based on user roles
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Input Validation**: Reactive form validation on client and server
- **CSRF Protection**: Built-in Angular security features
- **Prepared Statements**: SQL injection prevention via Supabase client

## 📝 Known Features & Limitations

- **Admin Creation**: First admin must be created manually via SQL (see `database/01_initial_schema.sql` line 327-331)
- **Email Rate Limits**: Supabase has rate limits on auth signups; can be adjusted in dashboard
- **Image Storage**: Requires Supabase Storage buckets to be created manually
- **Time Zone**: Timestamps stored in UTC; display conversion may be needed for specific locales

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Developer

**Saroj Kumar**
- GitHub: [@srjofficial](https://github.com/srjofficial)
- Email: sarojofficialsrj@gmail.com

## 🙏 Acknowledgments

- Angular Team for the excellent framework
- Supabase for the backend infrastructure
- Material Design team for UI components
- EmailJS for email integration
- All open-source contributors

---

**Built with ❤️ using Angular and Supabase**
