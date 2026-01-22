// ==================== APPLICATION STATE ====================
let reports = [];
let currentPage = 'dashboard';
let pieChart = null;
let barChart = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Civic Issue Reporter initialized');
  setupEventListeners();
  initCharts();
  loadReports();
  navigateTo('dashboard');
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Navigation buttons
  document.getElementById('nav-report').addEventListener('click', () => navigateTo('report'));
  document.getElementById('nav-dashboard').addEventListener('click', () => navigateTo('dashboard'));
  
  // File upload
  const fileUploadArea = document.getElementById('file-upload-area');
  const photoInput = document.getElementById('photo-input');
  
  fileUploadArea.addEventListener('click', () => photoInput.click());
  
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('has-file');
  });
  
  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('has-file');
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      photoInput.files = files;
      handleFileSelect({ target: photoInput });
    }
  });
  
  photoInput.addEventListener('change', handleFileSelect);
  
  document.getElementById('remove-photo').addEventListener('click', (e) => {
    e.stopPropagation();
    clearUploadedPhoto();
  });
  
  // Form submission
  document.getElementById('report-form').addEventListener('submit', handleFormSubmit);
  
  // Empty state button
  document.getElementById('empty-report-btn').addEventListener('click', () => navigateTo('report'));
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
  currentPage = page;
  
  // Update navigation buttons
  document.getElementById('nav-report').classList.toggle('active', page === 'report');
  document.getElementById('nav-dashboard').classList.toggle('active', page === 'dashboard');
  
  // Show/hide pages
  document.getElementById('page-report').classList.toggle('hidden', page !== 'report');
  document.getElementById('page-dashboard').classList.toggle('hidden', page !== 'dashboard');
  
  // Reload dashboard data
  if (page === 'dashboard') {
    loadReports();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== FILE HANDLING ====================
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file size
  if (file.size > 5 * 1024 * 1024) {
    showToast('File size must be less than 5MB', 'error');
    clearUploadedPhoto();
    return;
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Only JPG and PNG files are allowed', 'error');
    clearUploadedPhoto();
    return;
  }
  
  // Preview image
  const reader = new FileReader();
  reader.onload = (event) => {
    showUploadPreview(file.name, event.target.result);
  };
  reader.onerror = () => {
    showToast('Failed to read file', 'error');
    clearUploadedPhoto();
  };
  reader.readAsDataURL(file);
}

function showUploadPreview(fileName, imageData) {
  const uploadArea = document.getElementById('file-upload-area');
  const placeholder = document.getElementById('upload-placeholder');
  const preview = document.getElementById('upload-preview');
  const previewImage = document.getElementById('preview-image');
  const fileNameEl = document.getElementById('file-name');
  
  uploadArea.classList.add('has-file');
  placeholder.classList.add('hidden');
  preview.classList.remove('hidden');
  previewImage.src = imageData;
  fileNameEl.textContent = fileName;
}

function clearUploadedPhoto() {
  document.getElementById('photo-input').value = '';
  document.getElementById('file-upload-area').classList.remove('has-file');
  document.getElementById('upload-placeholder').classList.remove('hidden');
  document.getElementById('upload-preview').classList.add('hidden');
}

// ==================== FORM SUBMISSION ====================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const issueType = document.getElementById('issue-type').value.trim();
  const description = document.getElementById('description').value.trim();
  const location = document.getElementById('location').value.trim();
  const photoInput = document.getElementById('photo-input');
  
  // Validation
  if (!issueType) {
    showToast('Please select an issue type', 'error');
    return;
  }
  
  if (!description) {
    showToast('Please provide a description', 'error');
    return;
  }
  
  // Show loading state
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');
  
  submitBtn.disabled = true;
  submitText.textContent = 'Submitting...';
  submitSpinner.classList.remove('hidden');
  
  try {
    const formData = new FormData();
    formData.append('issue_type', issueType);
    formData.append('description', description);
    formData.append('location', location || 'Not specified');
    
    if (photoInput.files[0]) {
      formData.append('photo', photoInput.files[0]);
    }
    
    const response = await fetch('/api/reports', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('Report submitted successfully!', 'success');
      resetForm();
      navigateTo('dashboard');
    } else {
      showToast(result.error || 'Failed to submit report', 'error');
    }
  } catch (error) {
    console.error('Submit error:', error);
    showToast('Network error. Please check your connection.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitText.textContent = 'Submit Report';
    submitSpinner.classList.add('hidden');
  }
}

function resetForm() {
  document.getElementById('report-form').reset();
  clearUploadedPhoto();
}

// ==================== DATA LOADING ====================
async function loadReports() {
  try {
    const response = await fetch('/api/reports');
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    reports = await response.json();
    
    updateMetrics();
    updateCharts();
    renderReportsList();
    
  } catch (error) {
    console.error('Load reports error:', error);
    showToast('Failed to load reports', 'error');
  }
}

// ==================== STATUS UPDATE ====================
async function updateStatus(reportId, newStatus) {
  try {
    const response = await fetch(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    showToast(`Report marked as ${newStatus}`, 'success');
    loadReports();
    
  } catch (error) {
    console.error('Update status error:', error);
    showToast('Failed to update status', 'error');
  }
}

// ==================== DELETE REPORT ====================
async function deleteReport(reportId) {
  try {
    const response = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
    
    showToast('Report deleted successfully', 'success');
    loadReports();
    
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Failed to delete report', 'error');
  }
}

function confirmDelete(reportId, button) {
  if (button.dataset.confirm === 'true') {
    deleteReport(reportId);
    button.dataset.confirm = '';
  } else {
    button.dataset.confirm = 'true';
    button.innerHTML = '⚠️ Confirm?';
    button.classList.add('bg-red-100');
    
    setTimeout(() => {
      button.dataset.confirm = '';
      button.innerHTML = '🗑️';
      button.classList.remove('bg-red-100');
    }, 3000);
  }
}

// ==================== METRICS ====================
function updateMetrics() {
  const total = reports.length;
  const active = reports.filter(r => r.status === 'Active').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;
  
  document.getElementById('metric-total').textContent = total;
  document.getElementById('metric-active').textContent = active;
  document.getElementById('metric-resolved').textContent = resolved;
  document.getElementById('report-count-badge').textContent = `${total} report${total !== 1 ? 's' : ''}`;
}

// ==================== CHARTS ====================
function initCharts() {
  const pieCtx = document.getElementById('pie-chart').getContext('2d');
  const barCtx = document.getElementById('bar-chart').getContext('2d');
  
  // Pie Chart
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Resolved'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#f59e0b', '#10b981'],
        borderWidth: 0,
        cutout: '65%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 13
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // Bar Chart
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Reports',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              family: "'Plus Jakarta Sans', sans-serif"
            }
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        x: {
          ticks: {
            font: {
              family: "'Plus Jakarta Sans', sans-serif"
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

async function updateCharts() {
  if (!pieChart || !barChart) return;
  
  const active = reports.filter(r => r.status === 'Active').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;
  
  // Update pie chart
  pieChart.data.datasets[0].data = [active, resolved];
  pieChart.update();
  
  // Show/hide empty state
  const pieEmpty = document.getElementById('pie-empty');
  if (active === 0 && resolved === 0) {
    pieEmpty.classList.remove('hidden');
  } else {
    pieEmpty.classList.add('hidden');
  }
  
  // Update bar chart with weekly data
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    
    barChart.data.datasets[0].data = stats.weekly_data;
    barChart.update();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// ==================== RENDER REPORTS LIST ====================
function renderReportsList() {
  const listContainer = document.getElementById('reports-list');
  const emptyState = document.getElementById('empty-state');
  
  if (reports.length === 0) {
    listContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  const html = reports.map(report => {
    const isActive = report.status === 'Active';
    const issueEmoji = getIssueEmoji(report.issue_type);
    
    return `
      <div class="report-item flex items-start gap-4 p-4 rounded-xl border border-slate-100">
        <div class="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          ${report.image_url 
            ? `<img src="${report.image_url}" alt="${report.issue_type}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'text-2xl\\'>${issueEmoji}</span>';">`
            : `<span class="text-2xl">${issueEmoji}</span>`
          }
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h4 class="font-semibold text-slate-800 truncate">${escapeHtml(report.issue_type)}</h4>
            <span class="status-badge ${isActive ? 'status-active' : 'status-resolved'} flex-shrink-0">
              ${report.status}
            </span>
          </div>
          <p class="text-sm text-slate-500 line-clamp-2 mb-2">${escapeHtml(report.description)}</p>
          <div class="flex items-center gap-3 text-xs text-slate-400">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              ${escapeHtml(report.location)}
            </span>
            <span>•</span>
            <span>${report.time_ago}</span>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          ${isActive 
            ? `<button onclick="updateStatus(${report.id}, 'Resolved')" class="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors" title="Mark as Resolved">
                ✓ Resolve
              </button>`
            : `<button onclick="updateStatus(${report.id}, 'Active')" class="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors" title="Reopen">
                ↺ Reopen
              </button>`
          }
          <button onclick="confirmDelete(${report.id}, this)" class="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  listContainer.innerHTML = html;
}

// ==================== HELPER FUNCTIONS ====================
function getIssueEmoji(issueType) {
  const emojis = {
    'Garbage Dumping': '🗑️',
    'Broken Streetlight': '💡',
    'Wrong Parking': '🚗',
    'Public Spitting': '⚠️'
  };
  return emojis[issueType] || '📋';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  const bgColor = colors[type] || colors.info;
  const icon = icons[type] || icons.info;
  
  toast.className = `toast ${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 min-w-64`;
  toast.innerHTML = `
    <span class="text-lg font-bold">${icon}</span>
    <span class="font-medium">${escapeHtml(message)}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==================== GLOBAL ERROR HANDLER ====================
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
