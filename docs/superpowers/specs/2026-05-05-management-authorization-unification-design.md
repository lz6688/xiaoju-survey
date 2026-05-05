# Management Authorization Unification Design

## Goal

Unify agent assignment and collaborator authorization into one survey-member authorization model based on the collaborator collection, while preserving compatibility with existing `assignedAgentIds` data during a transition period.

## Scope

This design extends the existing management admin/agent split with three follow-up goals:

- Admin agent list should load all agents by default and show login/access audit data.
- Survey list should show which agents are authorized on each survey.
- Agent assignment and collaborator management should merge into one "authorization management" experience.

## Authorization Model

Survey member authorization is normalized around the collaborator record.

### Roles

- `admin`: platform-level administrator with full access.
- `agent`: restricted account type used for delivery and data work by default.
- other existing non-admin users continue to work as collaborator-style users.

### Survey Permissions

The survey permission model is expanded from three coarse permissions to four permissions:

- `SURVEY_EDIT_MANAGE`: edit survey content and metadata.
- `SURVEY_DELIVERY_MANAGE`: publish, pause, and manage delivery channels.
- `SURVEY_RESPONSE_MANAGE`: view survey data and statistics.
- `SURVEY_AUTH_MANAGE`: manage survey authorization members.

For backward compatibility:

- old `SURVEY_CONF_MANAGE` is treated as equivalent to `SURVEY_EDIT_MANAGE + SURVEY_DELIVERY_MANAGE`.
- old `SURVEY_COOPERATION_MANAGE` is treated as equivalent to `SURVEY_AUTH_MANAGE`.

New writes should save only the new permission set.

## Agent Authorization Rules

Agents move into the collaborator collection as first-class survey members.

- When an admin adds an agent to a survey, the default permissions are:
  - `SURVEY_DELIVERY_MANAGE`
  - `SURVEY_RESPONSE_MANAGE`
- Admin can additionally grant:
  - `SURVEY_EDIT_MANAGE`
  - `SURVEY_AUTH_MANAGE`

This lets agents stay restricted by default while allowing controlled exceptions.

## Transition Compatibility

Existing surveys may still contain `assignedAgentIds` without collaborator records.

During the transition period:

- survey guards must continue to honor `assignedAgentIds` for agent access.
- collaborator permission queries should synthesize default agent permissions from `assignedAgentIds` when no collaborator record exists.
- survey list APIs should expose authorized agent names from collaborator records first, with `assignedAgentIds` as fallback.

The frontend will stop using the dedicated assign-agent dialog and instead use unified authorization management.

## Backend Changes

### User audit fields

`User` adds:

- `lastLoginAt`
- `lastLoginIp`
- `lastActiveAt`
- `lastActiveIp`

Login updates both login and active fields. Authenticated requests update the active fields.

### Collaborator records

Collaborator records become the main non-admin survey authorization storage. Helper methods should normalize legacy permissions into the new set before permission checks and API responses.

### Survey guard

Survey access is checked in this order:

1. admin bypass
2. owner bypass
3. workspace member full-survey access for workspace surveys
4. collaborator permission check using normalized permissions
5. legacy fallback for `assignedAgentIds` with synthesized agent default permissions

Handlers then declare exact required permissions:

- edit pages and save/session/history edit routes require `SURVEY_EDIT_MANAGE`
- publish/channel routes require `SURVEY_DELIVERY_MANAGE`
- data/statistics/download routes require `SURVEY_RESPONSE_MANAGE`
- collaborator management routes require `SURVEY_AUTH_MANAGE`

## Frontend Changes

### Naming

- "协作管理" is renamed to "授权管理"
- the list action previously split between "协作" and "分配" becomes one entry point

### Authorization dialog

The unified dialog shows all authorized members with:

- username
- account role tag
- permission selection

When a selected user is an agent, the dialog preselects delivery and data permissions, and the admin may add edit/auth permissions.

### Survey list

The management survey list adds an "已授权代理" column that shows authorized agent usernames.

### Agent management page

The page should:

- load all agents on entry without requiring a search
- reload the full agent list after creating an agent
- show last login time, last login IP, last access time, and last access IP

## Testing

Backend tests should cover:

- permission normalization from legacy to new permissions
- agent default synthesized permissions from `assignedAgentIds`
- collaborator-based access for agent and non-agent users
- login and request activity audit updates
- agent list returns audit fields
- survey list returns authorized agent summaries

Frontend verification remains build/type-check centered, with focused behavioral checks around authorization dialog flow and agent list rendering.
