## Plan: Micro Frontend UI and DockerHub CI/CD

Add a web client to the existing microservice architecture using a Micro Frontends approach, then extend GitHub Actions so every component is built and published as a Docker image to DockerHub. The frontend work should reuse the existing Angular app where possible, but split it into a shell and feature remotes so the UI can test all backend functionality: PDF conversion, UPN string conversion, health checks, recent conversions, stats, mobile gateway flows, and operational actions.

**Steps**
1. Define the frontend decomposition and runtime contract.
   - Choose Angular-based micro frontends with one shell app and separate remote apps for conversion, observability, and mobile-oriented actions.
   - Map each existing backend endpoint to a UI entry point so no backend capability is left without a client-side test path.
   - Decide which state is shared through shell services versus passed through inputs/outputs.
2. Restructure the current Angular frontend into a shell plus remotes.
   - Reuse the current components in [frontend/src/app/app.ts](/Users/admin/Desktop/Dev/upnqr-epc/frontend/src/app/app.ts) as source material, but move feature-specific UI into independently built remotes.
   - Keep shared models and service abstractions in a common package or shared library area.
   - Add navigation and composition in the shell so each remote can be loaded independently and embedded in the main experience.
3. Expand the UI to cover all backend capabilities.
   - Ensure the frontend can exercise web-gateway endpoints for health, PDF conversion, UPN string conversion, recent conversions, stats, and delete-conversions where appropriate.
   - Add mobile-oriented screens for [gateways/mobile-gateway/app/main.py](/Users/admin/Desktop/Dev/upnqr-epc/gateways/mobile-gateway/app/main.py) endpoints, including mobile health, scan UPN, scan PDF, history, insights, and capabilities.
   - Keep the interaction model simple enough for manual testing in class/demo settings.
4. Add containerization for every deployable component.
   - Create or update Dockerfiles for the Angular shell and each remote frontend if they are published separately.
   - Add a Dockerfile for the web gateway so it is built consistently instead of relying on a pulled base image.
   - Verify the backend service Dockerfiles remain compatible with CI build contexts and runtime ports.
5. Extend GitHub Actions to build, test, and publish images.
   - Keep existing test workflows, then add build-and-push workflows for frontend, gateways, and backend services.
   - Use DockerHub secrets for authentication and publish only from trusted branches or tags.
   - Tag images with commit SHA and a stable tag such as latest for main branch publishes.
6. Update local orchestration and documentation.
   - Align docker-compose with the new image set or build contexts so local startup mirrors CI artifacts.
   - Document how to run the shell, remotes, gateways, and services locally and how to verify the full flow end to end.

**Relevant files**
- [frontend/src/app/app.ts](/Users/admin/Desktop/Dev/upnqr-epc/frontend/src/app/app.ts) — current Angular shell-like entry point and component composition.
- [frontend/src/app/components/**](/Users/admin/Desktop/Dev/upnqr-epc/frontend/src/app/components) — reusable UI pieces for conversion, health, and result display.
- [frontend/src/app/services/qr-converter.service.ts](/Users/admin/Desktop/Dev/upnqr-epc/frontend/src/app/services/qr-converter.service.ts) — API client layer to reuse or split across remotes.
- [frontend/src/app/models/convert-response.model.ts](/Users/admin/Desktop/Dev/upnqr-epc/frontend/src/app/models/convert-response.model.ts) — shared response types.
- [gateways/web-gateway/krakend.json](/Users/admin/Desktop/Dev/upnqr-epc/gateways/web-gateway/krakend.json) — web gateway routes that the UI must exercise.
- [gateways/mobile-gateway/app/main.py](/Users/admin/Desktop/Dev/upnqr-epc/gateways/mobile-gateway/app/main.py) — mobile gateway routes and response shaping.
- [docker-compose.yml](/Users/admin/Desktop/Dev/upnqr-epc/docker-compose.yml) — local orchestration that should match the published images.
- [.github/workflows/unit-tests.yml](/Users/admin/Desktop/Dev/upnqr-epc/.github/workflows/unit-tests.yml) — existing Python test workflow to preserve.
- [.github/workflows/go-unit-tests.yml](/Users/admin/Desktop/Dev/upnqr-epc/.github/workflows/go-unit-tests.yml) — existing Go test workflow to preserve.

**Verification**
1. Run the frontend build and component tests for the shell and each remote.
2. Run backend unit tests for qr-converter-service and upn-records-service.
3. Build all Docker images locally with the same tags or image names intended for DockerHub.
4. Validate docker-compose brings up the full stack and that each UI path can reach the intended backend endpoint.
5. Run the GitHub Actions workflow logic locally or in a dry-run mindset to confirm the publish steps only execute on the intended ref types.

**Decisions**
- Use Angular micro frontends rather than introducing a second frontend framework, because the repo already contains an Angular app and the least risky path is to split and compose what exists.
- Treat DockerHub publishing as part of CI for all deployable components, but keep push gated to main branch or release tags.
- Preserve the current backend API contracts unless a UI gap forces a minimal wrapper or adapter layer.
- Exclude unrelated refactors, such as changing service business logic, unless required to expose an endpoint needed by the UI.

**Further Considerations**
1. Decide whether the frontend remotes should be published as separate runtime images or bundled behind a single shell image. Separate images improve modularity; a single image reduces operational complexity.
2. Decide whether the web gateway should remain KrakenD or be rebuilt as a Dockerfile-managed image with a pinned base image. The second option is more reproducible for CI/CD.
3. Decide whether DockerHub tags should include semantic versions in addition to latest and SHA, if you want release traceability beyond branch-based publishing.