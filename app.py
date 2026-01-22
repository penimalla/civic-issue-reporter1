from flask import Flask, render_template, request, jsonify, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'civic-reporter-secret-key-change-in-production-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///civic_reports.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# Database Model
class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    issue_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200), default='Not specified')
    status = db.Column(db.String(20), default='Active')
    image_filename = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<Report {self.id}: {self.issue_type}>'

    def to_dict(self):
        """Convert report to dictionary for JSON response"""
        return {
            'id': self.id,
            'issue_type': self.issue_type,
            'description': self.description,
            'location': self.location,
            'status': self.status,
            'image_filename': self.image_filename,
            'image_url': url_for('static', filename=f'uploads/{self.image_filename}', _external=True) if self.image_filename else None,
            'created_at': self.created_at.isoformat(),
            'time_ago': self.get_time_ago()
        }
    
    def get_time_ago(self):
        """Calculate human-readable time difference"""
        diff = datetime.utcnow() - self.created_at
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return 'Just now'
        elif seconds < 3600:
            minutes = int(seconds // 60)
            return f'{minutes} min ago'
        elif seconds < 86400:
            hours = int(seconds // 3600)
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif seconds < 604800:
            days = int(seconds // 86400)
            return f'{days} day{"s" if days != 1 else ""} ago'
        else:
            return self.created_at.strftime('%Y-%m-%d')

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Create database tables
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get all reports sorted by most recent"""
    try:
        reports = Report.query.order_by(Report.created_at.desc()).all()
        return jsonify([report.to_dict() for report in reports]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports', methods=['POST'])
def create_report():
    """Create a new report"""
    try:
        # Get form data
        issue_type = request.form.get('issue_type', '').strip()
        description = request.form.get('description', '').strip()
        location = request.form.get('location', 'Not specified').strip()
        
        # Validation
        if not issue_type:
            return jsonify({'error': 'Issue type is required'}), 400
        
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        
        # Handle file upload
        image_filename = None
        if 'photo' in request.files:
            file = request.files['photo']
            if file and file.filename != '':
                if allowed_file(file.filename):
                    # Generate unique filename
                    ext = file.filename.rsplit('.', 1)[1].lower()
                    image_filename = f"{uuid.uuid4().hex}.{ext}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                    file.save(file_path)
                    print(f"✅ Image saved: {image_filename}")
                else:
                    return jsonify({'error': 'Invalid file type. Only JPG and PNG allowed'}), 400
        
        # Create new report
        new_report = Report(
            issue_type=issue_type,
            description=description,
            location=location,
            status='Active',
            image_filename=image_filename
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        print(f"✅ Report created: ID={new_report.id}, Type={issue_type}")
        
        return jsonify({
            'success': True,
            'message': 'Report created successfully',
            'report': new_report.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating report: {str(e)}")
        return jsonify({'error': f'Failed to create report: {str(e)}'}), 500

@app.route('/api/reports/<int:report_id>/status', methods=['PUT'])
def update_status(report_id):
    """Update report status (Active/Resolved)"""
    try:
        report = Report.query.get(report_id)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status', '').strip()
        
        if new_status not in ['Active', 'Resolved']:
            return jsonify({'error': 'Invalid status. Must be "Active" or "Resolved"'}), 400
        
        old_status = report.status
        report.status = new_status
        db.session.commit()
        
        print(f"✅ Report {report_id} status changed: {old_status} → {new_status}")
        
        return jsonify({
            'success': True,
            'message': f'Report marked as {new_status}',
            'report': report.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating status: {str(e)}")
        return jsonify({'error': f'Failed to update status: {str(e)}'}), 500

@app.route('/api/reports/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    """Delete a report"""
    try:
        report = Report.query.get(report_id)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Delete associated image file if exists
        if report.image_filename:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], report.image_filename)
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                    print(f"✅ Deleted image: {report.image_filename}")
                except Exception as e:
                    print(f"⚠️ Could not delete image: {str(e)}")
        
        db.session.delete(report)
        db.session.commit()
        
        print(f"✅ Report {report_id} deleted successfully")
        
        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting report: {str(e)}")
        return jsonify({'error': f'Failed to delete report: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        # Basic counts
        total = Report.query.count()
        active = Report.query.filter_by(status='Active').count()
        resolved = Report.query.filter_by(status='Resolved').count()
        
        # Weekly data (Monday to Sunday)
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        
        weekly_data = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            next_day = day + timedelta(days=1)
            
            count = Report.query.filter(
                Report.created_at >= datetime.combine(day, datetime.min.time()),
                Report.created_at < datetime.combine(next_day, datetime.min.time())
            ).count()
            
            weekly_data.append(count)
        
        return jsonify({
            'total': total,
            'active': active,
            'resolved': resolved,
            'weekly_data': weekly_data
        }), 200
    
    except Exception as e:
        print(f"❌ Error fetching stats: {str(e)}")
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 5MB'}), 413

# Run application
if __name__ == '__main__':
    print("🚀 Starting Civic Issue Reporter...")
    print("📍 Server running at: http://localhost:5000")
    print("📊 Database: SQLite (civic_reports.db)")
    app.run(debug=True, host='0.0.0.0', port=5000)
