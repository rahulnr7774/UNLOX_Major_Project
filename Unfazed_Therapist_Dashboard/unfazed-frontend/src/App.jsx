import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/therapist/Dashboard'
import Clients from './pages/therapist/Clients'
import Schedule from './pages/therapist/Schedule'
import Notes from './pages/therapist/Notes'
import Analytics from './pages/therapist/Analytics'
import Packages from './pages/therapist/Packages'
import ClientPortal from './pages/client/ClientPortal'
import BookingPage from './pages/client/BookingPage'
import Sessions from './pages/therapist/Sessions'
import ChatPage from './pages/ChatPage'
import PublicProfile from './pages/PublicProfile'
import ClientProfile from './pages/client/ClientProfile'

function ProtectedRoute({ children, role }) {
	const { isAuthenticated, user } = useAuth()
	if (!isAuthenticated) return <Navigate to="/login" replace />
	if (role && user?.role !== role) {
		return <Navigate to={user?.role === 'client' ? '/client-portal' : '/dashboard'} replace />
	}
	return children
}

function PublicRoute({ children }) {
	const { isAuthenticated, user } = useAuth()
	const destination = user?.role === 'client' ? '/client-portal' : '/dashboard'
	return isAuthenticated ? <Navigate to={destination} replace /> : children
}

function EntryRoute() {
	const { user } = useAuth()
	const token = localStorage.getItem('unfazed_token')
	const destination = user?.role === 'client' ? '/client-portal' : '/dashboard'
	return token ? <Navigate to={destination} replace /> : <LandingPage />
}

export default function App() {
	return <BrowserRouter><Routes>
		<Route path="/" element={<EntryRoute />} />
		<Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
		<Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
		<Route path="/dashboard" element={<ProtectedRoute role="therapist"><Dashboard /></ProtectedRoute>} />
		<Route path="/client-portal" element={<ProtectedRoute role="client"><ClientPortal /></ProtectedRoute>} />
		<Route path="/client/profile" element={<ProtectedRoute role="client"><ClientProfile /></ProtectedRoute>} />
		<Route path="/client/book" element={<ProtectedRoute role="client"><BookingPage /></ProtectedRoute>} />
		<Route path="/sessions" element={<ProtectedRoute role="therapist"><Sessions /></ProtectedRoute>} />
		<Route path="/chat/:sessionId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
		<Route path="/clients" element={<ProtectedRoute role="therapist"><Clients /></ProtectedRoute>} />
		<Route path="/schedule" element={<ProtectedRoute role="therapist"><Schedule /></ProtectedRoute>} />
		<Route path="/notes" element={<ProtectedRoute role="therapist"><Notes /></ProtectedRoute>} />
		<Route path="/analytics" element={<ProtectedRoute role="therapist"><Analytics /></ProtectedRoute>} />
		<Route path="/packages" element={<ProtectedRoute role="therapist"><Packages /></ProtectedRoute>} />
		<Route path="/:slug" element={<PublicProfile />} />
		<Route path="*" element={<Navigate to="/" replace />} />
	</Routes></BrowserRouter>
}
