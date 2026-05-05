# Management Agent Design

## Goal

Split the management experience into a full-permission admin side and a restricted agent side while preserving the existing survey, workspace, collaborator, channel, and response flows.

## Roles

Users gain a system-level `role` field:

- `admin`: full platform administrator.
- `agent`: restricted delivery user.

Existing users without a role are treated as `agent` for compatibility. A built-in admin account is ensured at startup with username `admin` and password `admin`.

## Admin Abilities

Admin users can:

- View all agent accounts.
- Create agent accounts.
- Change their own password.
- View all surveys and response data.
- Create, edit, delete, publish, and pause surveys.
- Assign surveys to one or more agents.
- Use all existing management pages and actions.

## Agent Abilities

Agent users can:

- Login only. The public registration button is removed from the management login page.
- Change their own password.
- View only surveys assigned to them.
- Open assigned survey delivery pages and create/manage their own channels for those surveys.
- View response data for assigned surveys.

Agent users cannot:

- Register themselves.
- Create surveys.
- Edit survey content or metadata.
- Delete, publish, pause, recover, or permanently delete surveys.
- Manage collaborators or assign surveys to other agents.

## Data Model

`User` gets:

- `role`: `admin` or `agent`.

`SurveyMeta` gets:

- `assignedAgentIds`: string array of user ids.

This keeps assignment close to the survey list and survey guard queries. A separate assignment collection is not needed for the current scope.

## Backend Authorization

Authentication still resolves the full user from the JWT. Guards then apply system roles:

- Admin bypasses survey ownership/collaborator checks.
- Agent access is allowed only for handlers marked as agent-readable or agent-deliverable, and only when the survey contains the agent id in `assignedAgentIds`.
- Existing owner, workspace, and collaborator permissions remain intact for non-admin compatibility.

Agent-readable handlers:

- `GET /api/survey/getSurvey`
- `GET /api/survey/dataStatistic/dataTable`
- `GET /api/survey/dataStatistic/aggregationStatis`
- `GET /api/channel/getList`

Agent-deliverable handlers:

- `POST /api/channel/create`
- `POST /api/channel/update`
- `POST /api/channel/status`
- `POST /api/channel/delete`

Survey mutation handlers stay admin/owner/collaborator only.

## API Additions

Auth and user APIs add:

- `POST /api/auth/changePassword`: current user changes password with old password and new password.
- `POST /api/user/createAgent`: admin creates an agent account.
- `GET /api/user/getAgentList`: admin lists agent accounts.

Survey APIs add:

- `POST /api/survey/assignAgents`: admin assigns agent ids to a survey.

Existing login response and user info include `role` so the frontend can choose the proper experience.

## Frontend

The management app keeps one Vite entry and one router, with role-aware pages:

- Admin lands on the existing survey list, now with all surveys and admin-only actions.
- Agent lands on an assigned survey list, with only delivery and data actions.
- Login page removes registration.
- Top navigation exposes password change for both roles.
- Admin gets simple agent account creation/listing and survey assignment controls.

## Testing

Backend tests cover:

- User roles and default role behavior.
- Admin bootstrap.
- Admin-only agent creation/listing.
- Password change validation and hashing.
- Admin all-survey listing.
- Agent assigned-survey listing.
- Agent allowed/denied survey guard behavior.
- Survey assignment persistence.

Frontend verification is build/type-check focused because the project currently has no frontend unit test setup.
