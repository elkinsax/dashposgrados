let appData = null;
let charts = {};

async function loadData() {
  const response = await fetch('data.json');
  appData = await response.json();
  document.getElementById('last-updated').textContent = appData.lastUpdated;
  renderOverview();
  renderProgram('doctorado');
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      renderProgram(button.dataset.program);
    });
  });
}

function renderOverview() {
  const programs = Object.entries(appData.programs);
  const labels = programs.map(([key, program]) => program.name);
  const totals = programs.map(([, program]) => program.summary.total);
  const context = document.getElementById('overviewChart');

  if (charts.overview) {
    charts.overview.destroy();
  }

  charts.overview = new Chart(context, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total de registros',
          data: totals,
          backgroundColor: ['#2563eb', '#0f766e', '#f59e0b'],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  const metrics = document.getElementById('overviewMetrics');
  metrics.innerHTML = programs
    .map(([key, program]) => {
      const summary = program.summary;
      return `
        <div class="metric-card">
          <strong>${program.name}</strong>
          <span>Total: ${summary.total}</span>
          <span>Activos: ${summary.activos}</span>
          <span>Egresados: ${summary.egresados}</span>
        </div>
      `;
    })
    .join('');
}

function renderProgram(programKey) {
  const program = appData.programs[programKey];
  document.getElementById('programTitle').textContent = program.name;
  document.getElementById('programSubtitle').textContent = program.description;

  document.getElementById('programStats').innerHTML = [
    { label: 'Total', value: program.summary.total },
    { label: 'Activos', value: program.summary.activos },
    { label: 'Egresados', value: program.summary.egresados },
    { label: 'Nuevos', value: program.summary.nuevos },
  ]
    .map(
      (item) => `
        <div class="stat-card">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `
    )
    .join('');

  renderStatusChart(program);
  renderTrendChart(program);
  renderCohortChart(program);
  renderCohortSummary(program);
  renderRecordsTable(program);
}

function renderStatusChart(program) {
  const context = document.getElementById('statusChart');
  if (charts.status) charts.status.destroy();

  charts.status = new Chart(context, {
    type: 'doughnut',
    data: {
      labels: program.status.map((item) => item.label),
      datasets: [
        {
          data: program.status.map((item) => item.value),
          backgroundColor: ['#2563eb', '#0f766e', '#f59e0b', '#dc2626'],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
  });
}

function renderTrendChart(program) {
  const context = document.getElementById('trendChart');
  if (charts.trend) charts.trend.destroy();

  charts.trend = new Chart(context, {
    type: 'line',
    data: {
      labels: program.trend.map((item) => item.label),
      datasets: [
        {
          label: 'Registros',
          data: program.trend.map((item) => item.value),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
  });
}

function renderCohortChart(program) {
  const context = document.getElementById('cohortChart');
  if (charts.cohort) charts.cohort.destroy();

  charts.cohort = new Chart(context, {
    type: 'bar',
    data: {
      labels: program.cohorts.map((item) => item.label),
      datasets: [
        {
          label: 'Desempeño promedio',
          data: program.cohorts.map((item) => item.performance),
          backgroundColor: '#2563eb',
          borderRadius: 6,
        },
        {
          label: 'Tasa de finalización',
          data: program.cohorts.map((item) => item.completion),
          backgroundColor: '#0f766e',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
}

function renderCohortSummary(program) {
  const summary = document.getElementById('cohortSummary');
  const bestPerformance = [...program.cohorts].sort((a, b) => b.performance - a.performance)[0];
  const bestCompletion = [...program.cohorts].sort((a, b) => b.completion - a.completion)[0];

  summary.innerHTML = `
    <div class="cohort-card">
      <span>Mejor desempeño</span>
      <strong>${bestPerformance.label}</strong>
      <small>${bestPerformance.performance}%</small>
    </div>
    <div class="cohort-card">
      <span>Mejor finalización</span>
      <strong>${bestCompletion.label}</strong>
      <small>${bestCompletion.completion}%</small>
    </div>
    <div class="cohort-card">
      <span>Promedio general</span>
      <strong>${Math.round(program.cohorts.reduce((acc, item) => acc + item.performance, 0) / program.cohorts.length)}%</strong>
      <small>Desempeño medio</small>
    </div>
  `;
}

function renderRecordsTable(program) {
  const tbody = document.getElementById('recordsTable');
  tbody.innerHTML = program.table
    .map(
      (row) => `
        <tr>
          <td>${row.nombre}</td>
          <td>${row.estado}</td>
          <td>${row.modalidad}</td>
        </tr>
      `
    )
    .join('');
}

loadData();
