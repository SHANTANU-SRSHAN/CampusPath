# CampusPath

CampusPath is an interactive web application that models a college campus as a weighted graph and computes shortest walking routes between any two locations using the **Floyd-Warshall all-pairs shortest path algorithm**.

It was built as an academic project for an **Analysis of Algorithms (AOA)** course, combining a production-style React frontend with an interactive algorithm visualizer so that the dynamic program can be stepped through, inspected, and verified rather than treated as a black box.

## Features

- **Interactive campus map** - explore buildings, departments, labs, hostels, sports facilities, and gates laid out on a single weighted graph.
- **Route planner** - pick any start and destination; the path and its total walking distance are reconstructed from the precomputed all-pairs matrix in constant lookup time.
- **Algorithm lab** - step forward and backward through every Floyd-Warshall comparison, watching the distance and next-hop matrices update, with negative-cycle detection.
- **Complexity analysis** - visual breakdown of the `O(V^3)` time and `O(V^2)` space characteristics of the algorithm.
- **Distance matrix view** - inspect the full all-pairs distance table.
- **Shared graph model** - the map, route planner, and algorithm lab all read the same weighted adjacency data; there is no separate mock dataset.
- **Responsive UI** - built with React, TypeScript, and Vite, styled with modern CSS.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build tool:** Vite 8
- **Routing:** React Router 7
- **Icons:** lucide-react
- **Linting:** Oxlint
- **Algorithm:** Floyd-Warshall (all-pairs shortest paths)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm (bundled with Node.js)


### Development

```bash
npm run dev
```

The dev server starts on `http://localhost:5173` by default.

### Production build

```bash
npm run build
npm run preview
```

### Linting

```bash
npm run lint
```

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint over the source tree |

## Project Structure

```text
CampusPath/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and icons
│   ├── components/         # Reusable UI components
│   ├── context/            # React context (route state)
│   ├── data/               # Campus graph (nodes + edges)
│   ├── lib/                # Floyd-Warshall implementation & helpers
│   ├── pages/              # Route-level pages
│   ├── App.tsx             # Route definitions
│   ├── main.tsx            # Application entry point
│   └── styles.css          # Global styles
├── index.html              # HTML entry point
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## Algorithm Notes

CampusPath implements the classic Floyd-Warshall algorithm:

```
for k in 0..n-1:
  for i in 0..n-1:
    for j in 0..n-1:
      if dist[i][k] + dist[k][j] < dist[i][j]:
        dist[i][j] = dist[i][k] + dist[k][j]
        next[i][j] = next[i][k]
```

- **Time complexity:** `O(V^3)`
- **Space complexity:** `O(V^2)`
- Supports directed and undirected weighted edges.
- Detects negative cycles.
- Reconstructs paths via the `next` (successor) matrix.

Distances are realistic **sample** values used for academic demonstration; they are not surveyed campus measurements.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "feat: describe your change"`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

## License

This project is released for educational use. See the repository for details.

---

Built with care for the AOA (Analysis of Algorithms) lab.
