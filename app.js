const MAX_CAPACITY = 10;

/**
 * Parse a CSV string into an array of delivery objects.
 * Expected columns: ID, Area, Priority, Package Weight (kg)
 * Returns { deliveries: [], errors: [] }
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const deliveries = [];
  const errors = [];

  if (lines.length <= 1) {
    return { deliveries, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 4) {
      errors.push(`Row ${i + 1}: not enough columns — "${line}"`);
      continue;
    }

    const id = cols[0];
    const area = cols[1];
    const priority = parseInt(cols[2], 10);
    const weight = parseFloat(cols[3]);

    if (!id) {
      errors.push(`Row ${i + 1}: missing ID`);
      continue;
    }
    if (!area) {
      errors.push(`Row ${i + 1}: missing Area`);
      continue;
    }
    if (isNaN(priority)) {
      errors.push(`Row ${i + 1}: invalid Priority "${cols[2]}"`);
      continue;
    }
    if (isNaN(weight) || weight <= 0) {
      errors.push(`Row ${i + 1}: invalid Weight "${cols[3]}"`);
      continue;
    }

    deliveries.push({ id, area, priority, weight });
  }

  return { deliveries, errors };
}

/**
 * Plan trips from a list of deliveries.
 * Returns { trips: [], warnings: [] }
 *
 * Algorithm:
 * 1. Separate overweight packages (> MAX_CAPACITY) into warnings.
 * 2. Sort remaining by Priority (asc) then Area (alphabetical).
 * 3. Greedy first-fit bin-packing grouped by area:
 *    - For each delivery, try to fit it into an existing trip
 *      that serves the same area and has remaining capacity.
 *    - If none fits, open a new trip.
 */
function planTrips(deliveries) {
  const warnings = [];
  const valid = [];

  // Separate overweight
  for (const d of deliveries) {
    if (d.weight > MAX_CAPACITY) {
      warnings.push(
        `ID ${d.id} (${d.area}): ${d.weight} kg exceeds vehicle capacity of ${MAX_CAPACITY} kg — cannot deliver`
      );
    } else {
      valid.push(d);
    }
  }

  // Sort by priority asc, then area alphabetical
  valid.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.area.localeCompare(b.area);
  });

  // Bin-pack
  const trips = []; // each trip: { area: string|null, deliveries: [], totalWeight: number }

  for (const d of valid) {
    let placed = false;

    // Try to fit into an existing trip with the same area
    for (const trip of trips) {
      if (trip.area === d.area && trip.totalWeight + d.weight <= MAX_CAPACITY) {
        trip.deliveries.push(d);
        trip.totalWeight += d.weight;
        placed = true;
        break;
      }
    }

    if (!placed) {
      trips.push({
        area: d.area,
        deliveries: [d],
        totalWeight: d.weight,
      });
    }
  }

  return { trips, warnings };
}

/**
 * Render trips and warnings to the DOM.
 */
function renderResults(trips, warnings, parseErrors) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  // Parse errors
  if (parseErrors.length > 0) {
    const section = document.createElement("div");
    section.className = "warnings";
    section.innerHTML = `<h2>⚠ Parse Errors</h2><ul>${parseErrors
      .map((e) => `<li>${escapeHTML(e)}</li>`)
      .join("")}</ul>`;
    resultsDiv.appendChild(section);
  }

  // Overweight warnings
  if (warnings.length > 0) {
    const section = document.createElement("div");
    section.className = "warnings";
    section.innerHTML = `<h2>⚠ Overweight Packages</h2><ul>${warnings
      .map((w) => `<li>${escapeHTML(w)}</li>`)
      .join("")}</ul>`;
    resultsDiv.appendChild(section);
  }

  // No trips
  if (trips.length === 0) {
    const msg = document.createElement("div");
    msg.className = "info-msg";
    msg.textContent = "No deliveries to schedule.";
    resultsDiv.appendChild(msg);
    return;
  }

  // Trip cards
  const heading = document.createElement("h2");
  heading.textContent = `Planned Trips (${trips.length})`;
  heading.style.marginBottom = "0.75rem";
  resultsDiv.appendChild(heading);

  const container = document.createElement("div");
  container.className = "trips-container";

  trips.forEach((trip, idx) => {
    const card = document.createElement("div");
    card.className = "trip-card";

    const minPriority = Math.min(...trip.deliveries.map((d) => d.priority));

    card.innerHTML = `
      <div class="trip-header">
        <h3>Trip ${idx + 1} — ${escapeHTML(trip.area)}</h3>
        <span class="trip-meta">${trip.totalWeight.toFixed(1)} / ${MAX_CAPACITY} kg &nbsp;|&nbsp; Priority: ${minPriority}</span>
      </div>
      <table class="trip-table">
        <thead>
          <tr><th>ID</th><th>Area</th><th>Priority</th><th>Weight (kg)</th></tr>
        </thead>
        <tbody>
          ${trip.deliveries
            .map(
              (d) =>
                `<tr><td>${escapeHTML(d.id)}</td><td>${escapeHTML(d.area)}</td><td>${d.priority}</td><td>${d.weight}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    container.appendChild(card);
  });

  resultsDiv.appendChild(container);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Wire up event listener
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csv-file");
  const processBtn = document.getElementById("process-btn");

  processBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { deliveries, errors } = parseCSV(text);
      const { trips, warnings } = planTrips(deliveries);
      renderResults(trips, warnings, errors);
    };
    reader.readAsText(file);
  });
});
