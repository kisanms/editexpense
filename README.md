# 🏠 Realtor Service Management Application

A role-based service management app designed for real estate teams. This system supports organization-based user grouping, role-based access control, and streamlined order management for admins and partners.

---

## ✨ Features

- 🔐 Firebase Authentication with role-based access (Admin / Partner)
- 🏢 Organization creation and member invitation system
- 👥 Partner joining via secure invitation code
- 📋 Order management system
- 📊 Separate dashboards for Admins and Partners
- 🔄 Real-time database updates using Firestore
- 📅 Rebuild Date: `01/04/2025`

---

## 🚧 Development Progress

### 🔄 Edit Expense

- ✔ Got the idea of implementation
- ⚠ Facing logic build issues
- ⚠ Navigation issue in organization context

### 🛒 Order Handling

- ✅ Add order changes integrated

---

## 🔐 Authentication Flow

### 🔧 Structure

- Firebase Authentication (Auth)
- Firestore Database (Data storage)
- Custom RBAC (Role-Based Access Control)

### 🔁 Registration Flow

```
1. User signs up with email, password, and username

2. Account creation completed
```

### 🔁 Login Flow

```
1. User logs in with credentials
2. Auth system validates credentials
3. Retrieves role and organization info
4. Redirects to appropriate dashboard
```

---

---

## 🔐 Security Highlights

- Password management handled by Firebase
- Invitation key generation for secure partner onboarding
- Role-based access control across the application
- Input validation and secure session management

---

## 📱 Screens Overview

- **Dashboard Screen**
- **Client Screen**
- **Employee Screen**
- **Order Screen**

---

## 🚀 Next Steps

Would you like help starting with:

1. Firebase Configuration Setup
2. UI: Login & Registration Screens
3. Role Selection Modal
4. Organization Creation Logic
