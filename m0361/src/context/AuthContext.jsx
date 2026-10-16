import React, { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
}

// Backend serializes the user as { id, ... } (no _id) — normalize once here
// so every `user._id` comparison across the app works.
const normalizeUser = u => (u ? { ...u, _id: u._id || u.id, id: u.id || u._id } : u)

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async (retried = false) => {
    try {
      const response = await api.getCurrentUser()
      // backend now returns 200 with { authenticated:false, data:null } for guests
      if (response.authenticated === false || !response.data) {
        dispatch({ type: 'LOGOUT' })
        return
      }
      dispatch({ type: 'LOGIN_SUCCESS', payload: normalizeUser(response.data) })
    } catch (error) {
      // Backend may still be booting after a restart — retry once before signing out
      if (!retried && /failed to fetch|networkerror/i.test(error.message || '')) {
        await new Promise(r => setTimeout(r, 2500))
        return checkAuth(true)
      }
      dispatch({ type: 'LOGOUT' })
    }
  }

  const login = async (credentials) => {
    const response = await api.login(credentials)
    dispatch({ type: 'LOGIN_SUCCESS', payload: normalizeUser(response.data) })
    return response
  }

  const register = async (userData) => {
    const response = await api.register(userData)
    // Registration remains unauthenticated until the emailed code is verified.
    if (response.pendingVerification) return response
    dispatch({ type: 'LOGIN_SUCCESS', payload: normalizeUser(response.data) })
    return response
  }

  const verifyEmail = async (email, code) => {
    const response = await api.verifyEmail(email, code)
    dispatch({ type: 'LOGIN_SUCCESS', payload: normalizeUser(response.data) })
    return response
  }

  const logout = async () => {
    try {
      await api.logout()
      dispatch({ type: 'LOGOUT' })
    } catch (error) {
      // Logout anyway
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const value = {
    ...state,
    login,
    register,
    verifyEmail,
    logout,
    updateUser,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}