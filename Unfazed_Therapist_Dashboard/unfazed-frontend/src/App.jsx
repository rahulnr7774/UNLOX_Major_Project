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
import ClientNotes from './pages/client/Notes'
import Payment from './pages/client/Payment'
import TherapistProfile from './pages/therapist/TherapistProfile'
import TherapistWaitlist from './pages/therapist/Waitlist'
import ClientWaitlist from './pages/client/Waitlist'
import PendingApproval from './pages/client/PendingApproval'
import Notifications from './pages/client/Notifications'
import TherapistLayout from './components/common/TherapistLayout'
import ClientLayout from './components/common/ClientLayout'
import { isClientProfileComplete, isTherapistProfileComplete } from './utils/profileCompletion'

function ProtectedRoute({ children, role }) {
	const { isAuthenticated, user } = useAuth()
	if (!isAuthenticated) return <Navigate to="/login" replace />
	if (role && user?.role !== role) {
		return <Navigate to={user?.role === 'client' ? '/client/pending' : '/dashboard'} replace />
	}
	if (user?.role === 'client' && user?.approval_status === 'pending') {
		return window.location.pathname === '/client/pending' ? children : <Navigate to="/client/pending" replace />
	}
	if (user?.role === 'therapist' && !isTherapistProfileComplete(user) && window.location.pathname !== '/profile') {
		return <Navigate to="/profile" replace />
	}
	if (user?.role === 'client' && !isClientProfileComplete(user) && window.location.pathname !== '/client/profile') {
		return <Navigate to="/client/profile" replace />
	}
	if (user?.role === 'therapist') return <TherapistLayout>{children}</TherapistLayout>
	if (user?.role === 'client') return <ClientLayout>{children}</ClientLayout>
	return children
}

function PublicRoute({ children }) {
	const { isAuthenticated, user } = useAuth()
	const destination = user?.role === 'client' ? (user?.approval_status === 'pending' ? '/client/pending' : '/client-portal') : '/dashboard'
	return isAuthenticated ? <Navigate to={destination} replace /> : children
}

function EntryRoute() {
	const { user } = useAuth()
	const token = localStorage.getItem('unfazed_token')
	const destination = user?.role === 'client' ? (user?.approval_status === 'pending' ? '/client/pending' : '/client-portal') : '/dashboard'
	return token ? <Navigate to={destination} replace /> : <LandingPage />
}

export default function App() {
	return <BrowserRouter><Routes>
		<Route path="/" element={<EntryRoute />} />
		<Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
		<Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
		<Route path="/dashboard" element={<ProtectedRoute role="therapist"><Dashboard /></ProtectedRoute>} />
		<Route path="/profile" element={<ProtectedRoute role="therapist"><TherapistProfile /></ProtectedRoute>} />
		<Route path="/waitlist" element={<ProtectedRoute role="therapist"><TherapistWaitlist /></ProtectedRoute>} />
		<Route path="/client-portal" element={<ProtectedRoute role="client"><ClientPortal /></ProtectedRoute>} />
		<Route path="/client/pending" element={<ProtectedRoute role="client"><PendingApproval /></ProtectedRoute>} />
		<Route path="/client/profile" element={<ProtectedRoute role="client"><ClientProfile /></ProtectedRoute>} />
		<Route path="/client/chat" element={<ProtectedRoute role="client"><ChatPage /></ProtectedRoute>} />
		<Route path="/client/notes" element={<ProtectedRoute role="client"><ClientNotes /></ProtectedRoute>} />
		<Route path="/client/book" element={<ProtectedRoute role="client"><BookingPage /></ProtectedRoute>} />
		<Route path="/client/payments" element={<ProtectedRoute role="client"><Payment /></ProtectedRoute>} />
		<Route path="/client/waitlist" element={<ProtectedRoute role="client"><ClientWaitlist /></ProtectedRoute>} />
		<Route path="/client/notifications" element={<ProtectedRoute role="client"><Notifications /></ProtectedRoute>} />
		<Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
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
