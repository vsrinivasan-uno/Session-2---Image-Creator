// Database API Helper Functions
class DatabaseHelper {
    constructor() {
        this.baseURL = ''; // Use relative URLs for API calls
    }

    // Helper method for API calls
    async apiCall(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.apiCall('/health');
    }

    // Class management
    async createClass(className, classCode, instructorName) {
        return this.apiCall('/api/classes', {
            method: 'POST',
            body: JSON.stringify({
                class_name: className,
                class_code: classCode,
                instructor_name: instructorName
            })
        });
    }

    async getClass(classCode) {
        return this.apiCall(`/api/classes/${classCode}`);
    }

    // Assignment management
    async createAssignment(classId, assignmentData) {
        return this.apiCall('/api/assignments', {
            method: 'POST',
            body: JSON.stringify({
                class_id: classId,
                ...assignmentData
            })
        });
    }

    async getAssignments(classId) {
        return this.apiCall(`/api/classes/${classId}/assignments`);
    }

    // Submission management
    async submitAssignment(submissionData) {
        return this.apiCall('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
    }

    async getSubmissions(assignmentId) {
        return this.apiCall(`/api/assignments/${assignmentId}/submissions`);
    }

    // Voting
    async voteForSubmission(submissionId, voterData) {
        return this.apiCall(`/api/submissions/${submissionId}/vote`, {
            method: 'POST',
            body: JSON.stringify(voterData)
        });
    }

    async removeVoteForSubmission(submissionId, voterData) {
        return this.apiCall(`/api/submissions/${submissionId}/unlike`, {
            method: 'DELETE',
            body: JSON.stringify(voterData)
        });
    }

    async checkVotingStatus(voterData) {
        return this.apiCall('/api/votes/check', {
            method: 'POST',
            body: JSON.stringify(voterData)
        });
    }

    // Get first available assignment (for default submissions)
    async getDefaultAssignment() {
        return this.apiCall('/api/assignments/default');
    }

    async getDefaultAssignmentWithFallback() {
        try {
            const assignment = await this.getDefaultAssignment();
            return assignment;
        } catch (error) {
            // Return fallback assignment data
            return {
                id: 1,
                title: "AI Artwork Creator",
                description: "Create stunning AI-generated artwork using advanced prompting techniques.",
                requirements: "Submit your best AI-generated image with detailed prompt analysis",
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
        }
    }
}

// Initialize database helper
const dbHelper = new DatabaseHelper(); 