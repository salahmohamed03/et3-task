const MAX_CAPACITY = 10;

const esc = (s) => {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const deliveries = [];
  const errors = [];

  lines.slice(1).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const [id, area, pStr, wStr] = trimmed.split(",").map((c) => c.trim());
    const row = i + 2;
    const priority = parseInt(pStr, 10);
    const weight = parseFloat(wStr);

    if (!id || !area || isNaN(priority) || isNaN(weight) || weight <= 0) {
      if (pStr === undefined || wStr === undefined) {
        errors.push(`Row ${row}: not enough columns — "${trimmed}"`);
      } else if (!id) {
        errors.push(`Row ${row}: missing ID`);
      } else if (!area) {
        errors.push(`Row ${row}: missing Area`);
      } else if (isNaN(priority)) {
        errors.push(`Row ${row}: invalid Priority "${pStr}"`);
      } else {
        errors.push(`Row ${row}: invalid Weight "${wStr}"`);
      }
      return;
    }
    deliveries.push({ id, area, priority, weight });
  });

  return { deliveries, errors };
}

function planTrips(deliveries) {
  const warnings = [];
  const valid = [];

  for (const d of deliveries) {
    if (d.weight > MAX_CAPACITY) {
      warnings.push(`ID ${d.id} (${d.area}): ${d.weight} kg exceeds vehicle capacity of ${MAX_CAPACITY} kg — cannot deliver`);
    } else {
      valid.push(d);
    }
  }

  valid.sort((a, b) => a.priority - b.priority || a.area.localeCompare(b.area));

  const trips = [];
  for (const d of valid) {
    const trip = trips.find((t) => t.area === d.area && t.totalWeight + d.weight <= MAX_CAPACITY);
    if (trip) {
      trip.deliveries.push(d);
      trip.totalWeight += d.weight;
    } else {
      trips.push({ area: d.area, deliveries: [d], totalWeight: d.weight });
    }
  }

  return { trips, warnings };
}

const PAGE_SIZE = 3;

function renderResults(trips, warnings, parseErrors, page = 1) {
  const container = document.getElementById("results");
  let html = "";

  if (parseErrors.length) {
    html += `<div class="warnings"><h2>⚠ Parse Errors</h2><ul>${parseErrors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>`;
  }
  if (warnings.length) {
    html += `<div class="warnings"><h2>⚠ Overweight Packages</h2><ul>${warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>`;
  }
  if (!trips.length) {
    html += `<div class="info-msg">No deliveries to schedule.</div>`;
  } else {
    const totalPages = Math.ceil(trips.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const pageTrips = trips.slice(start, start + PAGE_SIZE);

    html += `<h2 style="margin-bottom: 0.75rem">Planned Trips (${trips.length})</h2><div class="trips-container">`;
    pageTrips.forEach((trip, i) => {
      const minPriority = Math.min(...trip.deliveries.map((d) => d.priority));
      html += `
        <div class="trip-card">
          <div class="trip-header">
            <h3>Trip ${start + i + 1} — ${esc(trip.area)}</h3>
            <span class="trip-meta">${trip.totalWeight.toFixed(1)} / ${MAX_CAPACITY} kg &nbsp;|&nbsp; Priority: ${minPriority}</span>
          </div>
          <table class="trip-table">
            <thead><tr><th>ID</th><th>Area</th><th>Priority</th><th>Weight (kg)</th></tr></thead>
            <tbody>
              ${trip.deliveries.map((d) => `<tr><td>${esc(d.id)}</td><td>${esc(d.area)}</td><td>${d.priority}</td><td>${d.weight}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    });
    html += `</div>`;

    if (totalPages > 1) {
      html += `
        <div class="pagination">
          <button class="btn" id="prev-page" ${page === 1 ? "disabled" : ""}>◀ Prev</button>
          <span>Page ${page} of ${totalPages}</span>
          <button class="btn" id="next-page" ${page === totalPages ? "disabled" : ""}>Next ▶</button>
        </div>`;
    }
  }

  container.innerHTML = html;

  document.getElementById("prev-page")?.addEventListener("click", () => renderResults(trips, warnings, parseErrors, page - 1));
  document.getElementById("next-page")?.addEventListener("click", () => renderResults(trips, warnings, parseErrors, page + 1));
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csv-file");
  document.getElementById("process-btn").addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please select a CSV file first.");

    const text = await file.text();
    const { deliveries, errors } = parseCSV(text);
    const { trips, warnings } = planTrips(deliveries);
    renderResults(trips, warnings, errors);
  });
});
