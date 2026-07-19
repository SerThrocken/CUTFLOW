# SETUP & DEVELOPMENT GUIDE

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- FFmpeg 4.4+
- MongoDB 5.0+
- Docker & Docker Compose (recommended)

### Step 1: Clone & Install

```bash
git clone https://github.com/serthrocken/cutflow.git
cd cutflow

# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys and configuration:

```env
# Messaging Platforms
DISCORD_TOKEN=your_discord_bot_token
TELEGRAM_TOKEN=your_telegram_bot_token
SLACK_BOT_TOKEN=your_slack_bot_token

# LLM Providers (add at least one)
OPENROUTER_API_KEY=your_openrouter_key
MISTRAL_API_KEY=your_mistral_key
GROQ_API_KEY=your_groq_key

# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/tlg3d?authSource=admin

# Storage
CLOUDFLARE_R2_ACCESS_KEY=your_r2_access_key
CLOUDFLARE_R2_SECRET_KEY=your_r2_secret_key
CLOUDFLARE_R2_BUCKET_NAME=tlg3d-videos
```

### Step 3: Start Services

**Option A: Docker (Recommended)**

```bash
docker-compose up -d
```

Services will be available at:
- API: http://localhost:3000
- Video Engine: http://localhost:5000
- MongoDB: localhost:27017

**Option B: Local Development**

```bash
# Terminal 1: Start API
cd packages/api
npm run dev

# Terminal 2: Start Video Engine
cd packages/video-engine
python -m app

# Terminal 3: Start Messaging Service
cd packages/messaging
python -m main

# Terminal 4: Start MongoDB (if not using Docker)
mongod
```

---

## Project Structure

```
cutflow/
├── packages/
│   ├── core/                    # Shared types, theme, UI components
│   │   └── src/
│   │       ├── types.ts         # TypeScript interfaces
│   │       ├── theme.ts         # Theme system & presets
│   │       ├── ThemeCustomizer.tsx
│   │       ├── ui-components.tsx
│   │       └── globals.css      # Global Tailwind styles
│   ├── api/                     # Node.js REST API (Express)
│   │   └── src/index.ts         # API server, routes, DB models
│   ├── video-engine/            # Python video processing (Flask)
│   │   └── src/app.py           # FFmpeg integration, effects
│   ├── messaging/               # Multi-platform messaging
│   │   ├── src/discord_handler.ts
│   │   ├── src/telegram_handler.ts
│   │   └── src/main.py
│   ├── llm-router/              # LLM provider abstraction
│   │   └── src/index.ts
│   └── agents/                  # Agentic automation skills
├── data/
│   └── users/                   # Per-user folders: {platform}_{user_id}
│       ├── discord_546994016559038474/
│       ├── discord_1334004960093802601/
│       └── telegram_987654321/
├── docs/
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.video
├── Dockerfile.messaging
├── .env.example
├── tailwind.config.js
└── package.json
```

---

## Theme System

### Using Presets

Three default themes:

1. **TLG3D Dark** (default) - Professional dark with muted green/gold
2. **TLG3D Light** - Light mode with green accents
3. **TLG3D Vibrant** - Dark with punchy neon green/gold for emphasis

### Customizing Themes

In React/Next.js components:

```tsx
import { ThemeCustomizer, DEFAULT_TLG3D_THEME } from '@tlg3d/core/theme';
import { Button, Card } from '@tlg3d/core/ui-components';

export default function Dashboard() {
  const [theme, setTheme] = useState(DEFAULT_TLG3D_THEME);

  return (
    <div>
      <ThemeCustomizer onThemeChange={setTheme} />
      <Card>
        <h1>Welcome to TLG3D</h1>
        <Button variant="primary">Get Started</Button>
      </Card>
    </div>
  );
}
```

### Color Reference

**Default TLG3D Dark Theme:**
- Primary (Green): `#4FD97D`
- Accent (Gold): `#D4A574`
- Background: `#0F0F0F`
- Surface: `#1A1A1A`
- Text: `#E0E0E0`
- Border: `#2A2A2A`

---

## API Reference

### User Management

**Register User**
```
POST /api/users/register
{
  "userId": "discord_123456",
  "platform": "discord",
  "username": "username"
}
```

**Get User**
```
GET /api/users/:userId
```

### Projects

**Create Project**
```
POST /api/projects/create
{
  "userId": "discord_123456",
  "title": "My Awesome Video",
  "description": "Epic editing project"
}
```

**List Projects**
```
GET /api/projects/:userId
```

### Script Generation

**Generate Script**
```
POST /api/scripts/generate
{
  "userId": "discord_123456",
  "prompt": "Create a 30-second promotional video script for a tech startup"
}
Response: { "script": "...", "savedPath": "data/users/discord_123456/script_1234567890.txt" }
```

### Audio Generation

**Generate Voiceover**
```
POST /api/audio/voiceover
{
  "userId": "discord_123456",
  "text": "Welcome to TLG3D!"
}
Response: { "audio": "base64_encoded_mp3" }
```

### Video Processing

**Apply Transition**
```
POST /api/video/transition
{
  "user_id": "discord_123456",
  "input_video": "/path/to/video.mp4",
  "transition_type": "fade",
  "duration": 1.5
}
```

**Color Grading**
```
POST /api/video/color-grade
{
  "user_id": "discord_123456",
  "input_video": "/path/to/video.mp4",
  "preset": "cinematic"
}
```

**Detect Scenes**
```
POST /api/video/detect-scenes
{
  "user_id": "discord_123456",
  "input_video": "/path/to/video.mp4"
}
```

---

## Messaging Integration

### Discord
- Prefix: `!`
- Commands: `!edit`, `!script <text>`, `!voiceover <text>`, `!projects`, `!help`
- User data saved to: `data/users/discord_{user_id}/`

### Telegram
- Commands: `/script <text>`, `/voiceover <text>`, `/edit`, `/projects`, `/help`
- User data saved to: `data/users/telegram_{user_id}/`

### Slack
- Slash commands: `/tlg3d-script`, `/tlg3d-voiceover`, `/tlg3d-edit`
- User data saved to: `data/users/slack_{user_id}/`

### SMS/RCS (Twilio)
- Send editing requests via text
- User data saved to: `data/users/twilio_{phone_number}/`

---

## Development Workflow

### Adding a New Skill/Agent

1. Create in `packages/agents/src/skills/`:

```typescript
export const mySkill = async (context: AgentContext) => {
  const { userId, projectId, params, llmRouter } = context;
  
  // Generate content
  const result = await llmRouter.chat(
    'openrouter',
    'meta-llama/llama-2-70b',
    [{ role: 'user', content: params.prompt }]
  );
  
  return { success: true, output: result };
};
```

2. Register in API:

```typescript
app.post('/api/agents/:skillName', async (req, res) => {
  const { skillName } = req.params;
  const skill = importSkill(skillName);
  const result = await skill.execute(req.body);
  res.json(result);
});
```

### Adding a New Messaging Platform

1. Create handler in `packages/messaging/src/`:

```python
# imessage_handler.py
from imessage import iMessageService

class iMessageHandler:
    def __init__(self):
        self.service = iMessageService()
    
    def handle_message(self, user_id, content):
        user_dir = os.path.join(DATA_DIR, f"imessage_{user_id}")
        os.makedirs(user_dir, exist_ok=True)
        # Process message...
```

2. Register in main service orchestrator.

---

## Deployment

### Deploy to AWS EC2

```bash
git clone https://github.com/serthrocken/cutflow.git
cd cutflow

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start services
docker-compose -f docker-compose.yml up -d
```

### Deploy to Railway/Render

```bash
# Add railway.json or render.yaml config
# Push to Git
git push origin main
```

---

## Performance Tips

1. **Cache LLM responses** - Store frequent script templates
2. **Compress video assets** - Use H.264 codec for smaller files
3. **Parallel processing** - Run multiple skill agents concurrently
4. **Database indexing** - Index `userId`, `createdAt` fields
5. **CDN for assets** - Cloudflare R2 for video/audio delivery

---

## Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB is running
mongod

# Or use Docker
docker run -d -p 27017:27017 mongo
```

### API Port Already in Use
```bash
# Change PORT in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

---

## Support & Contributing

- **Issues**: https://github.com/serthrocken/cutflow/issues
- **Discussions**: https://github.com/serthrocken/cutflow/discussions
- **Contributing**: See CONTRIBUTING.md

---

**The Looking Glass 3D LLC © 2024**
