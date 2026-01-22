# 🏛️ Civic Issue Reporter

A full-stack web application for reporting and managing civic issues in your community. Built with Python Flask, SQLite, and modern web technologies.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🌟 Features

### ✅ Report Management
- **Create Reports** - Submit civic issues with photo upload support
- **Issue Categories** - Garbage Dumping, Broken Streetlight, Wrong Parking, Public Spitting
- **Photo Upload** - Support for JPG/PNG images up to 5MB
- **Location Tracking** - Add location information to reports

### 📊 Dashboard Analytics
- **Real-time Metrics** - Total, Active, and Resolved report counts
- **Pie Chart** - Visual breakdown of Active vs Resolved reports
- **Bar Chart** - Weekly report trends (Monday to Sunday)
- **Recent Reports List** - Chronological view of all reports

### 🔄 Status Management
- **Mark as Resolved** - Update report status to resolved
- **Reopen Reports** - Reactivate resolved reports
- **Two-step Deletion** - Confirm before deleting reports
- **Instant Updates** - Real-time dashboard updates

### 🎨 User Experience
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Toast Notifications** - User-friendly feedback messages
- **Smooth Animations** - Professional transitions and effects
- **Modern UI** - Clean, professional interface with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Python 3.8+** - Core programming language
- **Flask 3.0.0** - Web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Database (easily upgradeable to PostgreSQL)

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styles with Tailwind CSS
- **JavaScript (ES6+)** - Client-side logic
- **Chart.js** - Interactive charts

### Libraries
- **Pillow** - Image processing
- **Werkzeug** - WSGI utilities

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Virtual environment (recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/civic-issue-reporter.git
cd civic-issue-reporter

Step 2: Create Virtual Environment
Windows:

python -m venv venv
venv\Scripts\activate

Mac/Linux:

python3 -m venv venv
source venv/bin/activate

Step 3: Install Dependencies
pip install -r requirements.txt

Step 4: Run Application
python app.py

Step 5: Open in Browser
Navigate to: http://localhost:5000

📂 Project Structure
civic-issue-reporter/
│
├── app.py                      # Flask application & API routes
├── requirements.txt            # Python dependencies
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
│
├── templates/
│   └── index.html             # Main HTML template
│
├── static/
│   ├── css/
│   │   └── style.css          # Custom CSS styles
│   ├── js/
│   │   └── main.js            # Frontend JavaScript
│   └── uploads/               # Uploaded images directory
│
└── instance/
    └── civic_reports.db       # SQLite database (auto-created)

🎯 Usage Guide
📝 Reporting an Issue
Click "Report Issue" button in navigation
Select issue type from dropdown
(Optional) Upload a photo of the issue
Add detailed description
(Optional) Enter location
Click "Submit Report"
📊 Viewing Dashboard
Click "Dashboard" button in navigation
View metrics at the top (Total, Active, Resolved)
Analyze charts for visual insights
Scroll down to see all recent reports
✏️ Managing Reports
Mark as Resolved:

Click "✓ Resolve" button on any active report
Reopen Report:

Click "↺ Reopen" button on any resolved report
Delete Report:

Click "🗑️" button once
Button changes to "⚠️ Confirm?"
Click again within 3 seconds to confirm deletion
🔌 API Endpoints
GET /api/reports
Get all reports sorted by most recent

[
  {
    "id": 1,
    "issue_type": "Garbage Dumping",
    "description": "Trash pile on Main Street",
    "location": "123 Main St",
    "status": "Active",
    "image_url": "http://localhost:5000/static/uploads/abc123.jpg",
    "created_at": "2024-01-15T10:30:00",
    "time_ago": "2 hours ago"
  }
]

POST /api/reports
Create new report

curl -X POST http://localhost:5000/api/reports \
  -F "issue_type=Garbage Dumping" \
  -F "description=Trash pile" \
  -F "location=Main Street" \
  -F "photo=@image.jpg"

PUT /api/reports/{id}/status
Update report status

curl -X PUT http://localhost:5000/api/reports/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Resolved"}'

DELETE /api/reports/{id}
Delete report

curl -X DELETE http://localhost:5000/api/reports/1

GET /api/stats
Get dashboard statistics

{
  "total": 25,
  "active": 15,
  "resolved": 10,
  "weekly_data": [3, 5, 2, 4, 6, 3, 2]
}

🚀 Deployment
Option 1: Heroku
# Install Heroku CLI and login
heroku login

# Create app
heroku create civic-issue-reporter

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

Option 2: Railway
Push code to GitHub
Go to https://railway.app
Click "New Project"
Select your repository
Add PostgreSQL database
Deploy automatically
Option 3: DigitalOcean App Platform
Push code to GitHub
Go to DigitalOcean App Platform
Create new app from GitHub
Configure build settings
Deploy
🔄 Upgrading to PostgreSQL
Step 1: Install PostgreSQL Adapter
pip install psycopg2-binary

Step 2: Update app.py
# Replace SQLite URI with PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/civic_reports'

Step 3: Create Database
# Create PostgreSQL database
createdb civic_reports

Step 4: Initialize Tables
python
>>> from app import app, db
>>> with app.app_context():
>>>     db.create_all()

🧪 Testing
Manual Testing Checklist
[ ] Submit report without photo
[ ] Submit report with photo
[ ] View dashboard metrics
[ ] Mark report as resolved
[ ] Reopen resolved report
[ ] Delete report with confirmation
[ ] Test responsive design on mobile
[ ] Test file upload validation (size, type)
API Testing with cURL
# Test GET reports
curl http://localhost:5000/api/reports

# Test POST report
curl -X POST http://localhost:5000/api/reports \
  -F "issue_type=Broken Streetlight" \
  -F "description=Light not working" \
  -F "location=Park Avenue"

🐛 Troubleshooting
Issue: Database not created
Solution: Ensure instance/ folder exists or run:

from app import app, db
with app.app_context():
    db.create_all()

Issue: Images not uploading
Solution: Check static/uploads/ folder permissions:

chmod 755 static/uploads

Issue: Module not found
Solution: Reinstall dependencies:

pip install -r requirements.txt --force-reinstall

📝 License
This project is licensed under the MIT License. See LICENSE file for details.

👨‍💻 Author
Your Name

GitHub: https://github.com/yourusername
Email: your.email@example.com
🙏 Acknowledgments
Flask community for excellent documentation
Chart.js for beautiful charts
Tailwind CSS for styling utilities
Canva for design inspiration
📧 Support
For issues, questions, or contributions:

Open an issue on GitHub
Email: your.email@example.com
Star the repository if you find it helpful!
Made with ❤️ for civic engagement


---

## 📄 FILE 8: `static/uploads/.gitkeep`

This file ensures the uploads directory is tracked by Git
Actual uploaded images will be ignored via .gitignore

---

## ✅ COMPLETE! YOU NOW HAVE EVERYTHING!

### 🎯 Final Setup Steps:

1. **Create the folder structure**
2. **Copy each file** into its correct location
3. **Create empty `static/uploads/` folder**
4. **Run these commands:**

```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py

🌐 Open browser: http://localhost:5000
