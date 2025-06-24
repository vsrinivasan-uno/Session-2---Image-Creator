// Database API Helper Functions
class DatabaseHelper {
    constructor() {
        this.baseURL = window.location.origin;
    }

    // Helper method for API calls
    async apiCall(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log(`📡 API Response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`❌ API Error Response:`, errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ API Success Response:`, result);
            return result;
        } catch (error) {
            console.error(`💥 API call failed:`, error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.apiCall('/health');
    }

    // Class management
    async createClass(classData) {
        return this.apiCall('/classes', {
            method: 'POST',
            body: JSON.stringify(classData)
        });
    }

    async getClassByCode(classCode) {
        return this.apiCall(`/classes/${classCode}`);
    }

    // Assignment management
    async createAssignment(assignmentData) {
        return this.apiCall('/assignments', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
    }

    async getAssignments(classId) {
        return this.apiCall(`/classes/${classId}/assignments`);
    }

    // Submission management
    async submitAssignment(submissionData) {
        return this.apiCall('/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
    }

    async getSubmissions(assignmentId) {
        return this.apiCall(`/assignments/${assignmentId}/submissions`);
    }

    // Voting
    async voteForSubmission(submissionId, voterData) {
        console.log(`🔗 DatabaseHelper: Voting for submission ${submissionId}`, voterData);
        console.log(`🎯 API endpoint: ${this.baseURL}/api/submissions/${submissionId}/vote`);
        
        const result = await this.apiCall(`/submissions/${submissionId}/vote`, {
            method: 'POST',
            body: JSON.stringify(voterData)
        });
        
        console.log(`🎉 DatabaseHelper: Vote result:`, result);
        return result;
    }

    async checkVotes(voterId, submissionIds) {
        return this.apiCall('/votes/check', {
            method: 'POST',
            body: JSON.stringify({ voter_id: voterId, submission_ids: submissionIds })
        });
    }

    // Get first available assignment (for default submissions)
    async getDefaultAssignment() {
        try {
            const assignments = await this.apiCall('/assignments/default');
            return assignments.length > 0 ? assignments[0] : null;
        } catch (error) {
            console.log('No default assignment found, using fallback');
            return { id: 1 }; // Fallback to ID 1
        }
    }
}

// Initialize database helper
const dbHelper = new DatabaseHelper(); 