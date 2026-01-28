# 🔒 CLASSIFIED ARCHIVE DATABASE TEMPLATE

A professional CIA-style classified archive website template. Dark intelligence aesthetic with terminal-style interface and **secure admin authentication system**.

## 🔐 AUTHENTICATION SYSTEM

The site now features a **two-tier access system**:

### 👤 Admin Access
- **Username**: `admin`
- **Password**: `admin123`
- **Permissions**: 
  - ✅ Create/Edit/Delete dossiers
  - ✅ Add documents and images
  - ✅ Access admin panel
  - ✅ Full management capabilities

### 👁️ Guest Access (Read-Only)
- **No credentials needed** - Click "ENTER AS GUEST"
- **Permissions**: 
  - ✅ View all dossiers
  - ✅ Read documents
  - ✅ View images
  - ❌ Cannot create/edit/delete content
  - ❌ Cannot access admin panel

---

## 📋 FEATURES

✅ **CIA/NSA Aesthetic**
- Dark intelligence design (black, dark gray, olive green, muted red)
- Monospaced military typewriter fonts
- Terminal-style login screen with credentials display

✅ **Authentication & Permissions**
- Secure login system with admin account
- Role-based access control (Admin vs Guest)
- Admin panel only visible to administrators
- Edit/Delete buttons only visible to admins

✅ **Core Functionality**
- **Homepage**: Terminal-style login with two options
- **Archive Index**: Empty template, populated by admin
- **Dossier Pages**: Individual classified document viewer
- **Evidence Gallery**: Image archive with viewer
- **Admin Panel**: Create/manage dossiers (admin only)
- **Local Storage**: All data saved in browser

---

## 🚀 QUICK START

### 1. Open the Website

```
file:///C:/Users/prole/Desktop/dossier%20cia%20html/index.html
```

Or use local server:
```bash
python -m http.server 8000
```

### 2. Login Options

**Option A - As Admin:**
- Click **LOGIN**
- Username: `admin`
- Password: `admin123`
- Full access to create/edit content

**Option B - As Guest:**
- Click **ENTER AS GUEST (READ-ONLY)**
- View existing dossiers only
- Cannot modify anything

### 3. Create Content (Admin Only)

Once logged in as admin:
1. Click **+ ADD DOSSIER**
2. Fill in dossier information
3. Add documents and images
4. Publish for guests to view

---

## 📂 FILE STRUCTURE

```
dossier cia html/
├── index.html          # Login page with two access levels
├── archive.html        # Main archive (dynamic, no placeholders)
├── dossier.html        # Individual dossier template
├── gallery.html        # Evidence gallery viewer
├── admin.html          # Admin panel (protected access)
├── styles.css          # CIA aesthetic styling
├── script.js           # Auth + interactions
└── README.md           # This file
```

---

## 👨‍💼 ADMIN WORKFLOW

### Create a Dossier

1. Login as admin with `admin` / `admin123`
2. Click **+ ADD DOSSIER** button
3. Fill in:
   - **Name/Code**: e.g., "DOSSIER DRACO"
   - **Classification**: TOP SECRET, SECRET, CONFIDENTIAL, DECLASSIFIED
   - **Declassified Date**: Access date
   - **Status**: ACTIVE, ARCHIVED, UNDER REVIEW
   - **Description**: Summary

### Add Documents

1. Go to **Admin Panel** → **ADD DOCUMENT** tab
2. Select the dossier
3. Enter document code and content
4. Set date and save

### Add Images

1. Go to **Admin Panel** → **ADD IMAGE** tab
2. Select dossier
3. Upload image file
4. Set category and date

### Edit/Delete Dossiers

- Open a dossier (as admin)
- Click **✎ EDIT DOSSIER** or **🗑️ DELETE DOSSIER**
- Only admins can see these buttons

---

## 👁️ GUEST EXPERIENCE

Guests can:
- View all published dossiers
- Open and read dossier content
- View images in gallery
- Search and filter (read-only)

Guests **cannot**:
- Access admin panel
- Create new dossiers
- Add/edit content
- Delete anything
- See edit/delete buttons

---

## 🎨 CUSTOMIZATION GUIDE

### Change Admin Credentials

Edit `script.js` (lines 17-18):

```javascript
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
```

### Modify Colors

Edit `styles.css` (lines 10-20) color variables

### Change Fonts

Edit `styles.css` (lines 21-22) font families

---

## 💾 DATA STORAGE

All data stored in browser LocalStorage:
- **Dossiers**: `classifiedDossiers`
- **Documents**: `classifiedDocuments`
- **Images**: `classifiedImages`
- **Auth**: `archiveAuth`

### Backup Data

```javascript
// In browser console:
localStorage.getItem('classifiedDossiers')
```

---

## 🔧 BROWSER COMPATIBILITY

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Requires: JavaScript + LocalStorage

---

## 📋 EXAMPLE SETUP

### Create Sample Dossiers (as admin)

1. **DOSSIER DRACO**
   - Classification: TOP SECRET
   - Status: ACTIVE

2. **DOSSIER UFO**
   - Classification: SECRET
   - Status: ARCHIVED

3. **DOSSIER ANOMALY**
   - Classification: TOP SECRET
   - Status: UNDER REVIEW

### Test Access

1. Create dossier as admin
2. Logout
3. Login as guest
4. Verify you can read but not edit

---

## ⚠️ SECURITY NOTES

- **Demo purposes**: Simple credential system
- **Not production**: Use proper auth for real systems
- **Client-side storage**: Data visible in browser console
- **No encryption**: Not for sensitive real data
- Passwords visible in code (intentional for demo)

---

## 🛠️ TECHNICAL DETAILS

### Authentication Flow

1. User enters credentials on `index.html`
2. Checked against `ADMIN_USERNAME` & `ADMIN_PASSWORD`
3. Stored in `localStorage` as `archiveAuth` object
4. Used to determine permissions across site
5. Logout clears `archiveAuth`

### Authorization Checks

- `isAuthenticated()` - User logged in?
- `isAdmin()` - Has admin role?
- `verifyAdminAccess()` - Guard admin pages
- UI elements hidden based on role

### Data Structure

```javascript
// Dossier object
{
    id: "timestamp",
    name: "DOSSIER NAME",
    classification: "TOP SECRET",
    declassified: "2026-01-28",
    status: "ACTIVE",
    description: "Summary",
    createdAt: "ISO timestamp"
}

// Auth object
{
    username: "admin",
    role: "admin",
    loginTime: "ISO timestamp"
}
```

---

## 📞 TROUBLESHOOTING

**Q: Can't login as admin?**
- Clear browser cache
- Verify credentials: `admin` / `admin123`
- Check browser console for errors (F12)

**Q: Guest can't see dossiers?**
- Must have dossiers created by admin first
- Refresh page
- Check LocalStorage isn't cleared

**Q: Lost access to admin panel?**
- Must be logged in as admin
- Correct credentials: see above
- Don't access `/admin.html` directly as guest

**Q: Data disappeared?**
- Check if browser cleared LocalStorage
- Try another browser to verify data exists
- Clear cache but not site data

---

**Version**: 2.0 (Auth System)  
**Created**: January 28, 2026  
**License**: Open for personal use

Enjoy your secure classified archive! 🔐
