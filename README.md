# Delivery Trip Planner

## How to Run the Program

1. Open the index.html file
2. Upload a CSV file
3. Click Process Deliveries to render results

## Questions & Analysis

### 1. My Solution

As the problem is NP-hard, finding an optimal solution is very difficult; that's why I tried to find a suboptimal solution that produces acceptable results.
To convert the delivery requests into trips, I implemented the following steps:

1. Filter the overweight packages.
2. Sort the requests by priority
3. Loop over the delivery requests to find every matching area and check if the total weight is under 10kg.
4. If there are no matching areas or the total weight is over 10 kg, then create a new trip and so on
The complexity of this solution is O(N²), even though it's large but acceptable to this usecase, it also could be optimized by using hashmap with O(1) lookup to finding matching areas instead of searching it in the entire list.

---

### 2. What was the most difficult part of the assignment?

The most challenging part was deciding whether I was following all the rules at the same time or not.
Because there was an issue regarding the rule that says I should handle the highest priority first, and if I followed this rule strictly, it would not produce the minimum number of trips efficiently. Look at this test case, for example:

```csv
ID, Area, Priority, Package Weight (kg)
1, Nasr City,2,4.5
2, Maadi,1,2.0
3, Nasr City,3,1.2
4, Zamalek,1,7.0
5, Maadi,2,3.5
```

If I strictly followed the priority dispatch, it would result in 4 trips; it would separate the Maadi delivery requests because I can't finish the second one with priority 2 before the Zamalek request.
My solution ignored following this rule strictly and combined the areas if it would not affect the order of higher priority requests.

---

### 3. Are there situations where your algorithm may not produce the best possible grouping? Explain.

Yes, the algorithm makes immediate local decisions without looking ahead. This causes suboptimal groupings in some test cases:
Six packages with weights of [ 5, 4, 4, 3, 2, 2 ]

- Greedy Solution will produce 3 trips:
  - Trip 1: 5 + 4 = 9 kg
  - Trip 2: 4 + 3 + 2 = 9 kg
  - Trip 3: 2 kg
- The optimal solution will produce 2 trips:
  - Trip 1: 5 + 3 + 2 = 10 kg
  - Trip 2: 4 + 4 + 2 = 10 kg

---

### 4. If the input contained 1,000,000 delivery requests, what part of your solution might become slow or memory-intensive?

Processing 1,000,000 rows in the browser will encounter several severe bottlenecks:

- Nested trips.find() loops scale to millions of checks and freeze execution
- Running heavy parsing and sorting on the main thread locks up the UI; it could be fixed by using a Web Worker.
- Calling file.text().split() loads a large amount of data at once, spiking RAM.
- Appending that many rows directly to the DOM crashes the tab; I already fixed it using pagination

---

### 5. What would you improve if you had another day to work on the solution?

1. Using a Hash map to make lookups for matching areas in O(1).
2. Push file parsing and calculations into a background Web Worker so the UI stays responsive and can show a progress bar.

---

### 6. Additional Feature (Results Pagination)

**Why I chose it**:
When dealing with large delivery datasets, displaying all planned trip cards on a single page overloads the screen and creates severe DOM rendering overhead. I added client-side pagination to render trips in manageable pages with Previous and Next navigation controls.
