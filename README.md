# AI Prompt Master 🎨

An interactive educational platform for learning advanced AI prompting techniques and creating stunning AI-generated artwork.

## ✨ Features

- **Interactive Playground**: Learn 5+ advanced prompting techniques
- **Real-time Testing**: Grade prompts with AI feedback
- **Assignment System**: Submit and showcase AI artwork
- **Anonymous Voting**: Vote for the best submissions
- **Winner Reveal**: Celebrate top creators with confetti 🎉
- **Database Integration**: Persistent storage with PostgreSQL
- **Modern UI**: Instagram-style gallery with glassmorphism design

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-prompt-master)

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Neon](https://neon.tech) PostgreSQL database (free tier available)

### Deployment Steps

1. **Fork this repository** to your GitHub account

2. **Create a Neon Database**:
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

3. **Deploy to Vercel**:
   - Click the deploy button above
   - Connect your GitHub repository
   - Add environment variable:
     - `DATABASE_URL`: Your Neon connection string

4. **Database Setup**:
   - The database tables will be created automatically on first run
   - No manual initialization required

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/ai-prompt-master.git
cd ai-prompt-master

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
├── public/           # Frontend files
│   ├── index.html   # Main application
│   ├── admin.html   # Admin panel
│   ├── script.js    # Main application logic
│   ├── database.js  # Database helper
│   └── styles.css   # Styling
├── server.js        # Express server & API
├── package.json     # Dependencies
└── vercel.json      # Vercel deployment config
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (production/development) | No |

## 📚 Usage

### For Instructors

1. **Access Admin Panel**: Visit `/admin.html`
2. **Create Classes**: Set up class codes for students
3. **Manage Assignments**: Create prompting challenges
4. **Monitor Submissions**: View all student work

### For Students

1. **Learn Techniques**: Explore prompting methods in the playground
2. **Practice**: Test prompts with AI feedback
3. **Submit Work**: Upload your best AI-generated artwork
4. **Vote**: Rate peer submissions anonymously
5. **Celebrate**: See winners revealed with confetti

## 🎯 Prompting Techniques Covered

- **Zero-Shot**: Direct, single-turn prompting
- **Few-Shot**: Learning from examples
- **Chain-of-Thought**: Step-by-step reasoning
- **Role-Play**: Context and persona-based prompting
- **Structured**: Formatted, systematic approaches

## 🏗️ Database Schema

The application automatically creates these tables:

- `classes`: Course management
- `assignments`: Prompting challenges
- `submissions`: Student artwork and analysis
- `votes`: Anonymous peer voting system

## 🔒 Privacy & Security

- Anonymous voting with device fingerprinting
- No personal data exposure in galleries
- Secure IP tracking for vote integrity
- CORS protection and security headers

## 📊 Features in Detail

### Anonymous Voting System
- Prevents duplicate votes using multiple detection methods
- Device fingerprinting for vote integrity
- Real-time vote counting with database persistence

### Modern Gallery Design
- Instagram-style image display with overlays
- Glassmorphism effects and smooth animations
- Privacy-protected artist revelation system
- Mobile-responsive design

### Winner Reveal System
- Confetti celebration with physics simulation
- Database-driven vote counting
- Top 3 podium display with submission details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue for bug reports
- Check existing issues for known problems
- Contribute improvements via pull requests

---

**Built with ❤️ for AI education**

## 🚀 New Database Features

The platform now supports database-driven submissions using PostgreSQL (Neon) for persistent storage and better class management.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or Neon cloud)
- Git

### Local Development Setup

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd "Session 2 - Image Creator"
npm install
```

2. **Database Setup**

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create database
createdb ai_prompt_master

# Set environment variables
cp env.example .env
# Edit .env with your local database URL:
# DATABASE_URL=postgresql://username:password@localhost:5432/ai_prompt_master
```

**Option B: Neon Cloud Database**
```bash
# Get your Neon connection string from https://neon.tech
# Set in .env file:
# NEON_DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Test Database Setup**
- Visit `http://localhost:3000/admin.html`
- Click "Test Database Connection"
- Run the Quick Test to verify everything works

### Vercel Deployment

1. **Deploy to Vercel**
```bash
vercel --prod
```

2. **Set Environment Variables in Vercel**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add: `NEON_DATABASE_URL` with your Neon connection string
- Add: `NODE_ENV=production`

3. **Verify Deployment**
- Visit `https://your-app.vercel.app/admin.html`
- Test database connection

## 📊 Database Schema

### Tables
- **classes**: Course/class management
- **assignments**: Assignment definitions  
- **submissions**: Student submissions with prompt data
- **votes**: Peer voting system

### API Endpoints
- `POST /api/classes` - Create class
- `GET /api/classes/:code` - Get class by code
- `POST /api/assignments` - Create assignment
- `GET /api/classes/:class_id/assignments` - Get assignments
- `POST /api/submissions` - Submit assignment
- `GET /api/assignments/:assignment_id/submissions` - Get submissions
- `POST /api/submissions/:submission_id/vote` - Vote for submission

## 🎯 Features

### For Students
- Interactive prompt engineering learning
- Multiple techniques: Zero-Shot, Few-Shot, Chain-of-Thought, Role-Playing, Structured
- Real-time parameter recommendations
- Database-driven assignment submission
- Peer voting and gallery system

### For Instructors  
- Class and assignment management
- Real-time submission tracking
- Student progress monitoring
- Voting and competition features

## 🔧 Administration

### Create a Class
1. Visit `/admin.html`
2. Fill out class creation form
3. Share the generated class code with students

### Create Assignment
1. Use the class ID from step above
2. Set assignment requirements and due date
3. Students can submit directly to database

### Monitor Submissions
- Database stores all submissions with metadata
- View submissions through API or admin interface
- Export results for grading

## 🧪 Testing

### Local Testing
```bash
# Start server
npm run dev

# Test database
open http://localhost:3000/admin.html

# Test main app
open http://localhost:3000
```

### Production Testing
- Use admin panel to verify database connectivity
- Test submission flow end-to-end
- Verify data persistence across deployments

## 🔒 Environment Variables

Required variables:
```
# Database (choose one)
DATABASE_URL=postgresql://... (for local)
NEON_DATABASE_URL=postgresql://... (for production)

# Environment
NODE_ENV=development|production

# Server
PORT=3000
```

## 🚨 Migration from Manual Submissions

Existing manual submission codes will still work as fallback. The system gracefully handles both database and local submissions.

## 📞 Support

For database issues:
1. Check connection string format
2. Verify network connectivity to Neon
3. Check Vercel environment variables
4. Test with admin panel first

The system includes comprehensive error handling and fallback mechanisms. 