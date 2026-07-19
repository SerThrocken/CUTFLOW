# Project Management & Queue System — CutFlow

## Overview

TLG3D implements a **hierarchical project management system** with **per-user organization** and a **smart queuing system** that handles up to **3 concurrent projects** per user.

---

## Folder Structure Hierarchy

### Complete Directory Organization

```
data/
└── users/
    ├── serthrocken_discord_546994016559038474/
    │   ├── profile.json                          # User metadata
    │   ├── projects/
    │   │   ├── Summer_Campaign_2024_project_1234567890/
    │   │   │   ├── project.json                 # Project metadata
    │   │   │   ├── assets/
    │   │   │   │   ├── videos/                  # Raw video files
    │   │   │   │   │   ├── raw_footage.mp4
    │   │   │   │   │   └── interview.mov
    │   │   │   │   ├── audio/                   # Voiceovers, music
    │   │   │   │   │   ├── voiceover.mp3
    │   │   │   │   │   └── background_music.wav
    │   │   │   │   ├── images/                  # Thumbnails, logos
    │   │   │   │   │   └── thumbnail.png
    │   │   │   │   └── scripts/                 # Generated scripts
    │   │   │   │       └── script_1234567890.txt
    │   │   │   ├── processing/                  # Temp processing files
    │   │   │   │   ├── waveform.data
    │   │   │   │   └── scene_detection.json
    │   │   │   ├── output/                      # Final rendered videos
    │   │   │   │   ├── final_1080p.mp4
    │   │   │   │   └── final_4k.mp4
    │   │   │   └── cache/                       # Cached computations
    │   │   │       └── color_grade_cache.bin
    │   │   ├── Product_Demo_project_1234567891/
    │   │   │   ├── project.json
    │   │   │   ├── assets/
    │   │   │   └── ...
    │   │   └── Brand_Story_project_1234567892/
    │   │       ├── project.json
    │   │       └── ...
    │   ├── conversations/                       # Chat history
    │   │   ├── discord_messages.json
    │   │   └── telegram_messages.json
    │   ├── settings/                            # User preferences
    │   │   ├── theme.json
    │   │   ├── defaults.json
    │   │   └── integrations.json
    │   ├── archive/                             # Archived projects
    │   │   └── Old_Project_project_1234567893/
    │   └── queue.json                           # Queue metadata
    │
    ├── megan_telegram_987654321/
    │   ├── profile.json
    │   ├── projects/
    │   │   └── Wedding_Highlight_project_9876543210/
    │   │       ├── project.json
    │   │       └── assets/
    │   └── queue.json
    │
    └── john_slack_U12345ABCD/
        ├── profile.json
        └── projects/
```

### Key Features:

- **User-Based Organization** — Each user has own folder: `{username}_{userId}`
- **Platform Identification** — User ID includes platform: `discord_`, `telegram_`, `slack_`, `sms_`
- **Project Isolation** — Each project in dedicated folder with full assets
- **Asset Organization** — Videos, audio, images, scripts separated
- **Processing Pipeline** — Dedicated folders for processing stages
- **Quick Lookup** — Easy to navigate and manage

---

## Project Metadata

### User Profile (`profile.json`)

```json
{
  "userId": "discord_546994016559038474",
  "platform": "discord",
  "username": "serthrocken",
  "displayName": "Thomas",
  "email": "thomas@cutflow.dev",
  "createdAt": "2024-01-15T10:30:00Z",
  "totalProjects": 5,
  "activeProjects": 2,
  "storageUsed": 524288000
}
```

### Project File (`project.json`)

```json
{
  "projectId": "project_1705315800",
  "userId": "discord_546994016559038474",
  "projectName": "Summer Campaign 2024",
  "description": "Promotional video for Q3 2024",
  "status": "in_progress",
  "duration": 180,
  "resolution": "1080p",
  "fps": 30,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:45:00Z",
  "startedAt": "2024-01-20T08:00:00Z",
  "estimatedCompletion": "2024-01-22T16:00:00Z",
  "priority": "normal",
  "progress": 65,
  "assets": [
    {
      "assetId": "asset_1705315800",
      "type": "video",
      "filename": "raw_footage.mp4",
      "size": 1073741824,
      "uploadedAt": "2024-01-15T10:35:00Z",
      "processed": false
    }
  ]
}
```

---

## Queue Management System

### How It Works

```
User sends message via Discord/Telegram
    ↓
TLG3D detects: "Edit my video"
    ↓
System checks queue capacity (max 3 concurrent)
    ↓
If slots available (0-2 processing):
  → Add to queue with status "processing"
  → Immediately start processing
  → Emit "project-start" event
    ↓
If slots full (3 processing):
  → Add to queue with status "pending"
  → Return position in queue
  → Notify user: "Position #2 in queue, ~10 min wait"
    ↓
Project completes:
  → Mark as "completed"
  → Remove from processing set
  → Start next "pending" project
  → Continue until queue empty
```

### Queue Item Structure

```typescript
{
  "queueId": "queue_1705315800_a1b2c3d4",
  "projectId": "project_1705315800",
  "userId": "discord_546994016559038474",
  "position": 2,                              // 1, 2, 3 (max concurrent)
  "status": "pending",                        // pending, processing, completed, failed
  "estimatedStartTime": "2024-01-20T14:30:00Z",
  "startedAt": null,
  "completedAt": null,
  "errorMessage": null,
  "retryCount": 0
}
```

### Queue Statistics

```json
{
  "userId": "discord_546994016559038474",
  "total": 5,
  "processing": 2,
  "pending": 3,
  "completed": 0,
  "failed": 0,
  "items": [
    { "queueId": "...", "status": "processing", "position": 1 },
    { "queueId": "...", "status": "processing", "position": 2 },
    { "queueId": "...", "status": "pending", "position": 3 },
    { "queueId": "...", "status": "pending", "position": 4 },
    { "queueId": "...", "status": "pending", "position": 5 }
  ]
}
```

---

## API Endpoints

### Project Management

#### Create Project
```bash
POST /api/projects/create
Content-Type: application/json

{
  "userId": "discord_546994016559038474",
  "username": "serthrocken",
  "projectName": "Summer Campaign 2024",
  "description": "Promotional video"
}

Response:
{
  "success": true,
  "project": { ... },
  "projectPath": "/data/users/serthrocken_discord_546994016559038474/projects/Summer_Campaign_2024_project_1705315800"
}
```

#### List User Projects
```bash
GET /api/projects/:userId?username=serthrocken

Response:
{
  "projects": [
    {
      "projectId": "project_1705315800",
      "projectName": "Summer Campaign",
      "status": "in_progress",
      "progress": 65,
      "queueInfo": { "status": "processing", "position": 1 }
    },
    { ... }
  ],
  "queueStats": {
    "total": 3,
    "processing": 2,
    "pending": 1
  },
  "storageUsed": 524288000,
  "storageUsedGB": "0.49"
}
```

#### Get Project Details
```bash
GET /api/projects/:userId/:projectId?username=serthrocken

Response:
{
  "projectId": "project_1705315800",
  "projectName": "Summer Campaign",
  "assets": [ ... ],
  "progress": 65,
  "status": "in_progress"
}
```

#### Update Project
```bash
PUT /api/projects/:userId/:projectId
Content-Type: application/json

{
  "progress": 75,
  "status": "processing"
}
```

#### Archive/Delete Project
```bash
DELETE /api/projects/:userId/:projectId?username=serthrocken&projectName=Summer_Campaign&action=archive
```

---

### Queue Management

#### Add to Queue
```bash
POST /api/projects/queue/add
Content-Type: application/json

{
  "userId": "discord_546994016559038474",
  "projectId": "project_1705315800",
  "priority": "normal"  // low, normal, high
}

Response:
{
  "success": true,
  "queueItem": {
    "queueId": "queue_1705315800_a1b2c3d4",
    "position": 2,
    "status": "pending"
  },
  "message": "Project added to queue at position 2"
}
```

#### Get Queue Status
```bash
GET /api/projects/queue/:userId

Response:
{
  "total": 5,
  "processing": 2,
  "pending": 3,
  "completed": 0,
  "failed": 0,
  "items": [ ... ]
}
```

#### Cancel Queue Item
```bash
POST /api/projects/queue/:userId/:queueId/cancel

Response:
{
  "success": true,
  "message": "Queue item cancelled"
}
```

#### Prioritize Queue Item
```bash
POST /api/projects/queue/:userId/:queueId/prioritize

Response:
{
  "success": true,
  "message": "Queue item prioritized"
}
```

#### Get Next Project
```bash
GET /api/projects/queue/:userId/next

Response:
{
  "nextProject": { "queueId": "...", "projectId": "..." },
  "message": "Ready to process"
}
```

#### Get Processing Projects
```bash
GET /api/projects/queue/:userId/processing

Response:
{
  "count": 2,
  "maxConcurrent": 3,
  "projects": [
    { "queueId": "...", "status": "processing", "position": 1 },
    { "queueId": "...", "status": "processing", "position": 2 }
  ]
}
```

---

## Usage Examples

### Scenario 1: Single User, Single Project

```
User sends: "!edit my_video.mp4"
    ↓
System creates project "my_video_project_123"
    ↓
Queue: [1 processing]
    ↓
Processing completes
    ↓
Queue: [completed]
```

### Scenario 2: Single User, Multiple Projects

```
User sends: "!edit video1.mp4"  → Added to queue, position 1, status: processing
User sends: "!edit video2.mp4"  → Added to queue, position 2, status: processing
User sends: "!edit video3.mp4"  → Added to queue, position 3, status: processing
User sends: "!edit video4.mp4"  → Added to queue, position 4, status: pending
User sends: "!edit video5.mp4"  → Added to queue, position 5, status: pending

Queue display:
  ⏳ Video 1 (processing) - Position 1/5
  ⏳ Video 2 (processing) - Position 2/5
  ⏳ Video 3 (processing) - Position 3/5
  ⏰ Video 4 (pending) - Position 4/5 - Est. 15 min
  ⏰ Video 5 (pending) - Position 5/5 - Est. 25 min
```

### Scenario 3: Multiple Users

```
User A (Discord): Projects = [P1, P2, P3]
  Queue: [P1 processing, P2 processing, P3 pending]

User B (Telegram): Projects = [P4, P5]
  Queue: [P4 processing, P5 processing]

User C (Slack): Projects = [P6]
  Queue: [P6 processing]

Total: 6 projects, 6 processing (each user max 3 concurrent)
```

---

## Per-User Project Selection

### Auto-Selection by Messaging Platform

When a user sends a message, the system:

1. **Extracts User ID** from message platform
   - Discord: User ID from `message.author.id`
   - Telegram: User ID from `message.from.id`
   - Slack: User ID from `event.user`
   - SMS: Phone number or Twilio ID

2. **Looks Up User Profile** in database
   - Matches ID to stored profile
   - Retrieves `username` and `userId`

3. **Shows Active Projects** for that user
   - Lists only user's projects
   - Shows queue position if applicable

4. **Auto-Selects Latest Project** (if not specified)
   - Defaults to most recently modified
   - User can override: `!edit project_name`

### Example Flow

```
Discord User sends: "!script"
    ↓
System identifies: userId = "discord_546994016559038474"
    ↓
Lookup user: "serthrocken"
    ↓
Get active projects:
  [Summer Campaign (processing, pos 1),
   Product Demo (pending, pos 3),
   Brand Story (draft)]
    ↓
Auto-select: Summer Campaign (most recent)
    ↓
Generate script for Summer Campaign
    ↓
Response: "✓ Script generated for Summer Campaign"
```

---

## Queue Priority System

### Default Priority: `normal`

Can be overridden when adding to queue:

```bash
# High Priority
POST /api/projects/queue/add
{ "priority": "high", ... }
→ Moved to front of queue

# Normal Priority (default)
→ Added after high-priority items

# Low Priority
→ Added at end of queue
```

### Example Queue Order

```
Queue with mixed priorities:
  1. 🔴 HIGH - Video Urgent (added later but prioritized)
  2. 🟡 NORMAL - Summer Campaign
  3. 🟡 NORMAL - Product Demo
  4. 🟢 LOW - Brand Story
  5. 🟢 LOW - Tutorial
```

---

## Storage Management

### Storage Calculations

```
Storage per project varies:
- Raw video: 100-500MB
- Assets (audio, images): 10-50MB
- Processed output: 50-200MB
- Cache: 5-20MB

User storage limits:
- Free tier: 5 GB
- Pro tier: 50 GB
- Enterprise: Unlimited
```

### Storage Endpoint

```bash
GET /api/storage/usage/:userId

Response:
{
  "userId": "discord_546994016559038474",
  "used": 524288000,
  "usedGB": "0.49",
  "limit": 5368709120,
  "limitGB": "5.00",
  "percentUsed": 9.76,
  "projects": [
    { "projectId": "...", "size": 1048576 },
    { "projectId": "...", "size": 2097152 }
  ]
}
```

---

## Monitoring & Debugging

### View Queue Status

```bash
# Get user's complete queue
curl http://localhost:3000/api/projects/queue/discord_546994016559038474

# Get current processing
curl http://localhost:3000/api/projects/queue/discord_546994016559038474/processing

# Get next pending project
curl http://localhost:3000/api/projects/queue/discord_546994016559038474/next
```

### View Project Structure

```bash
# List user's folder
ls -la data/users/serthrocken_discord_546994016559038474/projects/

# View project details
cat data/users/serthrocken_discord_546994016559038474/projects/Summer_Campaign_2024_project_1705315800/project.json

# Check storage
du -sh data/users/serthrocken_discord_546994016559038474/
```

---

## Events & Hooks

The queue system emits events:

```typescript
queueManager.on('project-start', ({ queueId, projectId, userId }) => {
  console.log(`Project ${projectId} started processing`);
});

queueManager.on('project-complete', ({ queueId, projectId, userId }) => {
  console.log(`Project ${projectId} completed`);
  // Send notification to user
});

queueManager.on('queue-prioritized', ({ queueId, projectId, userId }) => {
  console.log(`Project ${projectId} was prioritized`);
});

queueManager.on('queue-cancelled', ({ queueId, projectId, userId }) => {
  console.log(`Project ${projectId} was cancelled`);
});
```

---

## Best Practices

✅ **DO:**
- Use meaningful project names
- Archive completed projects
- Monitor storage usage
- Prioritize urgent projects

❌ **DON'T:**
- Delete projects without archiving first
- Name projects with special characters
- Let queue fill indefinitely
- Ignore storage warnings

---

## Troubleshooting

**Q: Queue is full, can't start new project**
A: Wait for one to complete or prioritize existing project

**Q: Project stuck in "processing"**
A: Check logs, may need to retry or cancel

**Q: Storage quota exceeded**
A: Archive old projects or upgrade plan

**Q: Can't find my project**
A: Check platform - projects are user/platform specific

---

**Built by The Looking Glass 3D**

Next: Deploy and start managing projects!
