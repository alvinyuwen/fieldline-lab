# Fieldline Lab

Fieldline Lab is a free, no-account physics and mathematics learning site for Grade 12 through university. It runs as a static client-side app. There is no backend, account system, or server-side progress tracking.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install and run

```sh
npm install
npm run dev
```

## Build and verify

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

The production output is static and written to `dist/`.

## Simulation coverage

- **Mechanics:** torque on a lever, projectile motion, spring-mass SHM, circular motion, 1D/2D collisions, rotational dynamics, and moment of inertia.
- **Electromagnetism:** point-charge field and potential, Faraday-Lenz induction, on-axis coil field, Gauss flux, RC charging.
- **Math and waves:** Fourier series, gradient and level surfaces, divergence and curl, standing waves, and Doppler shift.
- **Upper-year models:** Lagrangian pendulum, Hamiltonian oscillator, Lorenz attractor, double pendulum, vacuum electromagnetic wave, infinite quantum well, and rectangular-barrier tunneling.
- **Reference simulation:** a charged particle in a uniform magnetic field with circular and helical modes.
- **Guided electromagnetism labs:** electric fields and charges, magnetic field around a wire, solenoids, a cyclotron, a DC motor, and Faraday-Lenz induction. Each has a dedicated 3D workspace, Explore/Learn/Challenge modes, live measurements, playback, and stated assumptions.

Every model provides parameter bounds, SI-aware equations and readouts, presets, a prediction prompt, a challenge, and explicit assumptions. Conservative oscillator and pendulum models report numerical energy drift. Model parameters are encoded in shareable simulation URLs; visited/completed progress and rendering quality are stored locally in the browser.

## Phase verification checklist

- [x] Shared simulation definition, registry, parameter controls, equation rendering, linked uPlot graph, and React Three Fiber scene.
- [x] Fixed 1/240 s RK4 integration for the charged-particle reference model, plus analytic cyclotron validation.
- [x] Mechanics models, analytic projectile/collision checks, and conservative-energy drift tests.
- [x] Electric and magnetic fields, induction, Gauss flux, and RC transient models.
- [x] Searchable catalog with topic/level filters, shareable URLs, and local visited/completed progress.
- [x] Fourier, vector-calculus, wave, and Doppler models.
- [x] Lagrangian/Hamiltonian, chaotic, Maxwell-wave, and quantum models.
- [x] Six guided electromagnetism experiments with distinct catalog previews and lazy-loaded 3D workspaces.
- [x] Dark-only responsive interface, keyboard-accessible controls, reduced-motion/transparency behavior, rendering quality setting, and static deployment instructions.

## Deploying to Vercel

The repository includes `vercel.json` with the Vite framework, `npm run build`, and `dist` output settings. Import the GitHub repository into Vercel to create preview deployments for branches and production deployments from the configured production branch. No environment variables or backend services are required. Simulation selection and parameter state use query parameters on the root document, so no server-side route rewrites are needed.

Run `npm run preview` to verify the production build locally before deploying.

## Known limitations

- These are idealized teaching models, not laboratory-grade solvers. Each simulation lists its assumptions; several visualizations scale vectors and positions for legibility.
- Collisions use a central normal and user-set restitution. The 2D mode preserves tangential velocity but does not model finite-sized deformable bodies.
- The Lorenz and double-pendulum models demonstrate deterministic chaos; their long-term pointwise trajectories are sensitive to numerical precision and initial conditions.
- The quantum well and barrier are one-dimensional textbook models. Tunneling transmission uses the stationary rectangular-barrier formula; its plotted interior amplitude is a relative profile, not a normalized wavepacket-scattering solution.
- The guided electromagnetism labs are idealized teaching models. In particular, the induction lab uses a point-dipole approximation for a finite bar magnet; close-range flux is not a precision model. The motor omits losses and back EMF, and the cyclotron is non-relativistic.
- The WebGL renderer is code-split from the catalog, but its production chunk remains large (about 921 kB minified in the current build).
- Local progress stays in this browser and is not synchronized between devices.
- WebGL support is required for 3D scenes. Rendering quality can be lowered on constrained devices.

## Chart choice

The app uses uPlot instead of Chart.js because its smaller rendering surface keeps linked time-series plots responsive with less overhead.
