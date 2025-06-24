# Database Testing Guide

## 🚀 Quick Start Testing

### 1. Local Testing Setup

```bash
# Install dependencies
npm install

# Set up environment (choose one)
# Option A: Local PostgreSQL
echo "DATABASE_URL=postgresql://username:password@localhost:5432/ai_prompt_master" > .env

# Option B: Neon Cloud Database  
echo "NEON_DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb" > .env

# Initialize database
npm run init-db

# Start server
npm run dev
```

### 2. Basic Functionality Test

1. **Test Database Connection**
   - Visit: `http://localhost:3000/admin.html`
   - Click "Test Database Connection"
   - Should see: `{"status":"OK","message":"Server is running"}`

2. **Test Class Creation**
   - Fill out class form in admin panel
   - Click "Create Class"
   - Note the generated class code (e.g., `A1B2C3D4`)

3. **Test Assignment Creation**
   - Use the class ID from step 2
   - Create an assignment
   - Note the assignment ID

4. **Test Student Submission**
   - Visit: `http://localhost:3000`
   - Navigate to Assignment tab
   - Generate an image
   - Submit assignment (will ask for name and email)
   - Should see success message with submission code

## 🧪 Comprehensive Testing Checklist

### Database Operations
- [ ] Health check endpoint works
- [ ] Class creation works
- [ ] Assignment creation works  
- [ ] Submission creation works
- [ ] Vote recording works
- [ ] Data retrieval works

### Error Handling
- [ ] Invalid database URL handled gracefully
- [ ] Network connection issues handled
- [ ] Duplicate submissions prevented
- [ ] Invalid data validation works
- [ ] Fallback to local storage works

### Frontend Integration
- [ ] Database helper loads correctly
- [ ] API calls work from frontend
- [ ] Error messages display properly
- [ ] Loading states show correctly
- [ ] Fallback mechanisms work

### Security & Validation
- [ ] SQL injection prevention
- [ ] Input validation works
- [ ] Email format validation
- [ ] Duplicate vote prevention
- [ ] Safe JSON parsing

## 🎯 Test Scenarios

### Scenario 1: Happy Path
1. Admin creates class
2. Admin creates assignment
3. Student submits assignment
4. Other students vote
5. Results are viewable

### Scenario 2: Network Issues
1. Start with working connection
2. Disconnect from internet
3. Try to submit assignment
4. Should fallback to local storage
5. Reconnect and verify fallback worked

### Scenario 3: Database Errors
1. Use invalid database URL
2. Try operations
3. Should see proper error messages
4. Should not break the application

### Scenario 4: Multiple Students
1. Create test class
2. Multiple students submit assignments
3. Students vote for each other
4. Check vote counting accuracy
5. Verify no duplicate votes

## 🔍 Debugging

### Common Issues

**Connection Failed**
```bash
# Check environment variables
echo $DATABASE_URL
echo $NEON_DATABASE_URL

# Test direct connection
psql $DATABASE_URL
```

**Tables Not Created**
```bash
# Re-run initialization
npm run init-db

# Check table existence
psql $DATABASE_URL -c "\dt"
```

**API Errors**
```bash
# Check server logs
npm run dev

# Test API directly
curl http://localhost:3000/api/health
```

### Debug Tools

**Admin Panel Debug**
- Use browser dev tools console
- Check network tab for API calls
- Verify response data

**Database Debug**
```sql
-- Check data
SELECT * FROM classes;
SELECT * FROM assignments;
SELECT * FROM submissions;
SELECT * FROM votes;

-- Check relationships
SELECT c.name, a.title, COUNT(s.id) as submission_count
FROM classes c
LEFT JOIN assignments a ON c.id = a.class_id
LEFT JOIN submissions s ON a.id = s.assignment_id
GROUP BY c.id, a.id;
```

## 🚀 Production Testing

### Vercel Deployment Test

1. **Deploy to Vercel**
```bash
vercel --prod
```

2. **Set Environment Variables**
   - `NEON_DATABASE_URL`: Your Neon connection string
   - `NODE_ENV`: `production`

3. **Test Production**
   - Visit deployed admin panel
   - Run full test suite
   - Verify data persistence

### Performance Testing

**Load Test Simulation**
```javascript
// Run in browser console on admin page
async function loadTest() {
    const promises = [];
    for (let i = 0; i < 10; i++) {
        promises.push(dbHelper.healthCheck());
    }
    const results = await Promise.all(promises);
    console.log('Load test completed:', results.length, 'requests');
}
loadTest();
```

## 📊 Expected Results

### Database Schema Verification
```sql
-- Classes table
\d classes

-- Should have columns: id, name, description, instructor_name, class_code, created_at, updated_at

-- Submissions table  
\d submissions

-- Should have columns: id, assignment_id, student_name, student_email, prompt_data, image_url, submission_code, votes, is_revealed, submitted_at
```

### API Response Formats

**Health Check**
```json
{"status":"OK","message":"Server is running"}
```

**Class Creation**
```json
{
  "id": 1,
  "name": "Test Class",
  "class_code": "A1B2C3D4",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Submission**
```json
{
  "id": 1,
  "submission_code": "SUB123456789",
  "student_name": "John Doe",
  "submitted_at": "2024-01-01T00:00:00.000Z"
}
```

## 🆘 Troubleshooting

### Issue: "Database connection failed"
- Check environment variables
- Verify database URL format
- Test network connectivity
- Check Neon dashboard for database status

### Issue: "Tables not found"
- Run `npm run init-db`
- Check PostgreSQL user permissions
- Verify database exists

### Issue: "Submission failed"
- Check assignment_id exists
- Verify JSON data format
- Check for unique constraint violations

### Issue: "Frontend not loading database.js"
- Check file path in HTML
- Verify server is serving static files
- Check browser console for errors

## ✅ Success Criteria

Your database integration is working correctly if:

1. ✅ Admin panel shows green checkmarks for all tests
2. ✅ Students can submit assignments successfully  
3. ✅ Data persists across server restarts
4. ✅ Voting system works without duplicates
5. ✅ Error handling gracefully degrades to local storage
6. ✅ Production deployment works on Vercel
7. ✅ Performance is responsive under normal load

## 📋 Manual Test Script

```bash
#!/bin/bash
echo "🧪 Running comprehensive database tests..."

# Test 1: Environment
echo "1. Checking environment..."
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')"

# Test 2: Database initialization
echo "2. Initializing database..."
npm run init-db

# Test 3: Server start
echo "3. Starting server..."
npm run dev &
SERVER_PID=$!
sleep 3

# Test 4: Health check
echo "4. Testing health endpoint..."
curl -s http://localhost:3000/api/health

# Cleanup
kill $SERVER_PID
echo "✅ Basic tests completed!"
```

Run this script to verify your setup is working correctly. 