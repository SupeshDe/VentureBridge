const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Drop undefined/null/empty params — URLSearchParams would serialize
// undefined as the literal string "undefined", making the backend
// search for "undefined" and return zero results on every unfiltered load.
function qs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  return new URLSearchParams(clean).toString()
}

class ApiService {
  constructor() {
    this._pending = new Map()
  }
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const method = (options.method || 'GET').toUpperCase()
    const isGet = method === 'GET'
    // Dedupe concurrent identical GETs (prevents 3× 404 spam in dashboards)
    const dedupeKey = isGet ? `${method}:${endpoint}` : null
    if (isGet && this._pending.has(dedupeKey)) {
      return this._pending.get(dedupeKey)
    }

    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body)
    }

    const doFetch = async () => {
      try {
        const response = await fetch(url, config)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          const err = new Error(data.message || `HTTP error! status: ${response.status}`)
          err.status = response.status
          err.endpoint = endpoint
          err.details = data.details || data.errors || null
          // 404s are normal control flow (e.g. "no startup profile yet") — don't spam console
          // 401 on /auth/me is expected for guests — silent
          const silent404 = endpoint.includes('/me/profile')
          const silent401 = endpoint === '/auth/me' || endpoint === '/auth/session'
          if (response.status >= 500 && !silent404 && !silent401) {
            console.error(`API request failed: ${endpoint}`, err)
          }
          throw err
        }

        return data
      } catch (error) {
        // Network errors / unexpected — log those, but skip expected 4xx
        const isSilent =
          error.endpoint?.includes('/me/profile') ||
          error.endpoint === '/auth/me' ||
          error.endpoint === '/auth/session'
        if ((!error.status || error.status >= 500) && !isSilent) {
          console.error(`API request failed: ${endpoint}`, error)
        }
        throw error
      }
    }

    if (isGet) {
      const p = doFetch().finally(() => this._pending.delete(dedupeKey))
      this._pending.set(dedupeKey, p)
      return p
    }
    return doFetch()
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    })
  }

  async verifyEmail(email, code) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: { email, code },
    })
  }

  async resendVerificationCode(email) {
    return this.request('/auth/resend-verification-code', {
      method: 'POST',
      body: { email },
    })
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    })
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Startup methods
  async createStartup(startupData) {
    return this.request('/startups', {
      method: 'POST',
      body: startupData,
    })
  }

  async getMyStartup() {
    return this.request('/startups/me/profile')
  }

  async updateStartup(startupData) {
    return this.request('/startups/me/profile', {
      method: 'PUT',
      body: startupData,
    })
  }

  async getStartups(params = {}) {
    const query = qs(params)
    return this.request(`/startups?${query}`)
  }

  async getStartup(id) {
    return this.request(`/startups/${id}`)
  }

  // Investor methods
  async createInvestorProfile(profileData) {
    return this.request('/investors', {
      method: 'POST',
      body: profileData,
    })
  }

  async getMyInvestorProfile() {
    return this.request('/investors/me/profile')
  }

  async updateInvestorProfile(profileData) {
    return this.request('/investors/me/profile', {
      method: 'PUT',
      body: profileData,
    })
  }

  async getInvestors(params = {}) {
    const query = qs(params)
    return this.request(`/investors?${query}`)
  }

  async getInvestor(id) {
    return this.request(`/investors/${id}`)
  }

  // Matching methods
  async getRecommendedInvestors(params = {}) {
    const query = qs(params)
    return this.request(`/matching/investors?${query}`)
  }

  async getRecommendedStartups(params = {}) {
    const query = qs(params)
    return this.request(`/matching/startups?${query}`)
  }

  async getMatchScore(startupId, investorId) {
    return this.request(`/matching/startup/${startupId}/investor/${investorId}`)
  }

  // Request methods
  async sendRequest(requestData) {
    return this.request('/requests', {
      method: 'POST',
      body: requestData,
    })
  }

  async getSentRequests(params = {}) {
    const query = qs(params)
    return this.request(`/requests/sent?${query}`)
  }

  async getReceivedRequests(params = {}) {
    const query = qs(params)
    return this.request(`/requests/received?${query}`)
  }

  async acceptRequest(requestId) {
    return this.request(`/requests/${requestId}/accept`, {
      method: 'PUT',
    })
  }

  async rejectRequest(requestId) {
    return this.request(`/requests/${requestId}/reject`, {
      method: 'PUT',
    })
  }

  async cancelRequest(requestId) {
    return this.request(`/requests/${requestId}/cancel`, {
      method: 'PUT',
    })
  }

  async getPendingRequestCount() {
    return this.request('/requests/pending/count')
  }

  // Connection methods
  async getConnections(params = {}) {
    const query = qs(params)
    return this.request(`/connections?${query}`)
  }

  async getConnection(id) {
    return this.request(`/connections/${id}`)
  }

  // Chat methods
  async getConversations() {
    return this.request('/chat/conversations')
  }

  async getConversation(id, params = {}) {
    const query = qs(params)
    return this.request(`/chat/conversations/${id}?${query}`)
  }

  async sendMessage(messageData) {
    return this.request('/chat/messages', {
      method: 'POST',
      body: messageData,
    })
  }

  async markMessagesAsRead(conversationId) {
    return this.request(`/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
    })
  }

  // Favourites methods
  async addFavourite(startupId) {
    return this.request('/favourites', {
      method: 'POST',
      body: { startupId },
    })
  }

  async getFavourites(params = {}) {
    const query = qs(params)
    return this.request(`/favourites?${query}`)
  }

  async removeFavourite(startupId) {
    return this.request(`/favourites/${startupId}`, {
      method: 'DELETE',
    })
  }

  async isFavourite(startupId) {
    return this.request(`/favourites/${startupId}/check`)
  }

  async addInvestorFavourite(investorProfileId) {
    return this.request('/favourites', {
      method: 'POST',
      body: { investorProfileId },
    })
  }

  async removeInvestorFavourite(investorProfileId) {
    return this.request(`/favourites/investors/${investorProfileId}`, {
      method: 'DELETE',
    })
  }

  async isInvestorFavourite(investorProfileId) {
    return this.request(`/favourites/investors/${investorProfileId}/check`)
  }

  // Notification methods
  async getNotifications(params = {}) {
    const query = qs(params)
    return this.request(`/notifications?${query}`)
  }

  async getUnreadCount() {
    return this.request('/notifications/unread/count')
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    })
  }

  // Document vault methods (multipart upload uses fetch directly)
  async getMyDocuments(params = {}) {
    const query = qs(params)
    return this.request(`/documents/me?${query}`)
  }

  async uploadDocument(formData) {
    const res = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data.message || `HTTP error! status: ${res.status}`)
      err.status = res.status
      throw err
    }
    return data
  }

  async getStartupDocuments(startupId) {
    return this.request(`/documents/startup/${startupId}`)
  }

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, { method: 'DELETE' })
  }

  documentFileUrl(id) {
    return `/api/documents/${id}/file`
  }

  // Industry methods
  async getIndustries() {
    return this.request('/industries')
  }

  // Interest methods
  async expressInterest(startupId, message) {
    return this.request('/interests', { method: 'POST', body: { startupId, message } })
  }

  async getMyInterests() {
    return this.request('/interests/me')
  }

  async getReceivedInterests() {
    return this.request('/interests/received')
  }

  async withdrawInterest(id) {
    return this.request(`/interests/${id}`, { method: 'DELETE' })
  }

  // AI analysis
  async getStartupAnalysis(startupId) {
    return this.request(`/ai/startups/${startupId}/analysis`)
  }

  async askAi(messages) {
    return this.request('/ai/chat', { method: 'POST', body: { messages } })
  }

  // Connection data-room methods
  async getConnectionDocuments(connectionId) {
    return this.request(`/documents/connection/${connectionId}`)
  }

  // Meeting methods
  async proposeMeeting(data) {
    return this.request('/meetings', { method: 'POST', body: data })
  }

  async getConnectionMeetings(connectionId) {
    return this.request(`/meetings/connection/${connectionId}`)
  }

  async respondMeeting(id, data) {
    return this.request(`/meetings/${id}`, { method: 'PUT', body: data })
  }

  // Review methods
  async submitReview(data) {
    return this.request('/reviews', { method: 'POST', body: data })
  }

  async getUserReviews(userId) {
    return this.request(`/reviews/user/${userId}`)
  }

  async deleteReview(id) {
    return this.request(`/reviews/${id}`, { method: 'DELETE' })
  }

  // Admin methods
  async getPlatformStats() {
    return this.request('/admin/stats')
  }

  async getUsers(params = {}) {
    const query = qs(params)
    return this.request(`/admin/users?${query}`)
  }

  async getUserDetails(userId) {
    return this.request(`/admin/users/${userId}`)
  }

  async updateUserStatus(userId, statusData) {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: statusData,
    })
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async getAllStartupsAdmin(params = {}) {
    const query = qs(params)
    return this.request(`/admin/startups?${query}`)
  }

  async updateStartupVerification(startupId, verificationData) {
    return this.request(`/admin/startups/${startupId}/verification`, {
      method: 'PUT',
      body: verificationData,
    })
  }

  async getAllInvestorsAdmin(params = {}) {
    const query = qs(params)
    return this.request(`/admin/investors?${query}`)
  }

  async getIndustriesAdmin() {
    return this.request('/admin/industries')
  }

  async createIndustryAdmin(data) {
    return this.request('/admin/industries', { method: 'POST', body: data })
  }

  async updateIndustryAdmin(id, data) {
    return this.request(`/admin/industries/${id}`, { method: 'PUT', body: data })
  }

  async deleteIndustryAdmin(id) {
    return this.request(`/admin/industries/${id}`, { method: 'DELETE' })
  }

  async getDocumentsAdmin(params = {}) {
    const query = qs(params)
    return this.request(`/admin/documents?${query}`)
  }

  async deleteDocumentAdmin(id) {
    return this.request(`/admin/documents/${id}`, { method: 'DELETE' })
  }

  // Report methods
  async createReport(data) {
    return this.request('/reports', { method: 'POST', body: data })
  }

  async getReportsAdmin(params = {}) {
    const query = qs(params)
    return this.request(`/admin/reports?${query}`)
  }

  async updateReportStatus(id, data) {
    return this.request(`/admin/reports/${id}`, { method: 'PUT', body: data })
  }

  async updateInvestorVerification(investorId, verificationData) {
    return this.request(`/admin/investors/${investorId}/verification`, {
      method: 'PUT',
      body: verificationData,
    })
  }
}

export default new ApiService()
